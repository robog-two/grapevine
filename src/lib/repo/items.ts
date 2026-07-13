import { and, eq, isNull, isNotNull, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { items, people } from '@/db/schema';
import { encryptJSON, decryptJSON } from '@/lib/crypto';
import type { AuthedUser } from '@/lib/session';
import type { ItemContent, ItemType } from './types';
import { logTimelineEvent } from './timeline';
import { syncMentionsForItem, deleteMentionsForItem } from './mentions';

export interface ItemRecord {
  id: string;
  personId: string;
  type: ItemType;
  posX: number;
  posY: number;
  sortIndex: number;
  content: ItemContent;
  blobUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toRecord(row: typeof items.$inferSelect, dek: AuthedUser['dek']): ItemRecord {
  return {
    id: row.id,
    personId: row.personId,
    type: row.type as ItemType,
    posX: row.posX,
    posY: row.posY,
    sortIndex: row.sortIndex,
    content: decryptJSON<ItemContent>(row.contentEnc, dek),
    blobUrl: row.blobUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listItems(user: AuthedUser, personId: string): Promise<ItemRecord[]> {
  const rows = await db
    .select()
    .from(items)
    .where(and(eq(items.personId, personId), isNull(items.deletedAt)))
    .orderBy(asc(items.sortIndex));
  return rows.map((r) => toRecord(r, user.dek));
}

export async function getItem(user: AuthedUser, itemId: string): Promise<ItemRecord | null> {
  const row = await db.query.items.findFirst({ where: eq(items.id, itemId) });
  if (!row) return null;
  return toRecord(row, user.dek);
}

export async function createItem(
  user: AuthedUser,
  personId: string,
  type: ItemType,
  content: ItemContent,
  opts: { posX?: number; posY?: number; sortIndex?: number; blobUrl?: string } = {},
): Promise<ItemRecord> {
  const [row] = await db
    .insert(items)
    .values({
      personId,
      type,
      posX: opts.posX ?? 0,
      posY: opts.posY ?? 0,
      sortIndex: opts.sortIndex ?? Date.now(),
      contentEnc: encryptJSON(content, user.dek),
      blobUrl: opts.blobUrl ?? null,
    })
    .returning();

  if (type === 'note' && content.type === 'note') {
    await syncMentionsForItem(user, personId, row.id, content.text);
  }

  await logTimelineEvent(user, personId, row.id, 'created', `${labelForType(type)} added`, { type, content });

  return toRecord(row, user.dek);
}

export async function updateItemContent(user: AuthedUser, itemId: string, content: ItemContent) {
  const existing = await db.query.items.findFirst({ where: eq(items.id, itemId) });
  if (!existing) return;

  await db.update(items).set({ contentEnc: encryptJSON(content, user.dek), updatedAt: new Date() }).where(eq(items.id, itemId));

  if (existing.type === 'note' && content.type === 'note') {
    await syncMentionsForItem(user, existing.personId, itemId, content.text);
  }

  await logTimelineEvent(user, existing.personId, itemId, 'updated', `${labelForType(existing.type as ItemType)} updated`, { content });
}

export async function updateItemPosition(itemId: string, x: number, y: number) {
  await db.update(items).set({ posX: x, posY: y, updatedAt: new Date() }).where(eq(items.id, itemId));
}

export async function reorderItem(itemId: string, sortIndex: number) {
  await db.update(items).set({ sortIndex, updatedAt: new Date() }).where(eq(items.id, itemId));
}

export async function softDeleteItem(user: AuthedUser, itemId: string) {
  const existing = await db.query.items.findFirst({ where: eq(items.id, itemId) });
  if (!existing) return;
  await db.update(items).set({ deletedAt: new Date() }).where(eq(items.id, itemId));
  await deleteMentionsForItem(itemId);
  await logTimelineEvent(user, existing.personId, itemId, 'deleted', `${labelForType(existing.type as ItemType)} deleted`, {});
}

export async function restoreItem(user: AuthedUser, itemId: string) {
  const existing = await db.query.items.findFirst({ where: eq(items.id, itemId) });
  if (!existing) return;
  await db.update(items).set({ deletedAt: null }).where(eq(items.id, itemId));
  if (existing.type === 'note') {
    const content = decryptJSON<ItemContent>(existing.contentEnc, user.dek);
    if (content.type === 'note') await syncMentionsForItem(user, existing.personId, itemId, content.text);
  }
  await logTimelineEvent(user, existing.personId, itemId, 'restored', `${labelForType(existing.type as ItemType)} restored from trash`, {});
}

export interface TrashEntry {
  id: string;
  personId: string;
  personName: string;
  type: ItemType;
  summary: string;
  deletedAt: Date;
}

export async function listTrash(user: AuthedUser): Promise<TrashEntry[]> {
  const { decryptField } = await import('@/lib/crypto');
  const rows = await db
    .select({
      id: items.id,
      personId: items.personId,
      type: items.type,
      contentEnc: items.contentEnc,
      deletedAt: items.deletedAt,
      personNameEnc: people.nameEnc,
    })
    .from(items)
    .innerJoin(people, eq(people.id, items.personId))
    .where(and(eq(people.userId, user.userId), isNotNull(items.deletedAt)));

  return rows.map((r) => {
    const content = decryptJSON<ItemContent>(r.contentEnc, user.dek);
    return {
      id: r.id,
      personId: r.personId,
      personName: decryptField(r.personNameEnc, user.dek) ?? '',
      type: r.type as ItemType,
      summary: summarize(content),
      deletedAt: r.deletedAt!,
    };
  });
}

export function summarize(content: ItemContent): string {
  switch (content.type) {
    case 'note':
      return content.text.replace(/\*\*|\*/g, '').slice(0, 60);
    case 'photo':
      return content.caption || 'Photo';
    case 'file':
      return content.filename;
    case 'eml':
      return content.subject;
    case 'reminder':
      return content.note || 'Reminder';
    case 'link':
      return content.title || content.url;
    default:
      return '';
  }
}

export function labelForType(type: ItemType): string {
  switch (type) {
    case 'note':
      return 'Note';
    case 'photo':
      return 'Photo';
    case 'file':
      return 'File';
    case 'eml':
      return '.eml';
    case 'reminder':
      return 'Reminder';
    case 'link':
      return 'Link';
  }
}
