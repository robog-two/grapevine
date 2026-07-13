import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { shareLinks } from '@/db/schema';
import { encryptJSON, decryptJSON, randomToken } from '@/lib/crypto';
import { keyFromShareToken } from '@/lib/shareCrypto';
import type { AuthedUser } from '@/lib/session';
import { getPerson } from './people';
import { getCustomFieldValues, listCustomFields } from './customFields';
import { listItems, summarize } from './items';

export interface ShareSnapshot {
  scope: 'person';
  name: string;
  iconKey: string;
  email: string | null;
  phone: string | null;
  discovered: string | null;
  customFields: { name: string; value: string }[];
  items: { type: string; summary: string; createdAt: string }[];
  sharedAt: string;
}

export async function createPersonShareLink(user: AuthedUser, personId: string): Promise<{ id: string; token: string }> {
  const person = await getPerson(user, personId);
  if (!person) throw new Error('Person not found');

  const [fieldDefs, values, items] = await Promise.all([
    listCustomFields(user),
    getCustomFieldValues(user, personId),
    listItems(user, personId),
  ]);

  const snapshot: ShareSnapshot = {
    scope: 'person',
    name: person.name,
    iconKey: person.iconKey,
    email: person.email,
    phone: person.phone,
    discovered: person.discovered,
    customFields: fieldDefs.filter((f) => values[f.id]).map((f) => ({ name: f.name, value: values[f.id] })),
    items: items
      .filter((i) => i.type !== 'reminder')
      .map((i) => ({ type: i.type, summary: summarize(i.content), createdAt: i.createdAt.toISOString() })),
    sharedAt: new Date().toISOString(),
  };

  const token = randomToken(20);
  const snapshotEnc = encryptJSON(snapshot, keyFromShareToken(token));

  const [row] = await db
    .insert(shareLinks)
    .values({
      userId: user.userId,
      scope: 'person',
      personId,
      token,
      snapshotEnc,
    })
    .returning({ id: shareLinks.id });

  return { id: row.id, token };
}

export async function listShareLinksForPerson(user: AuthedUser, personId: string) {
  return db
    .select({ id: shareLinks.id, token: shareLinks.token, revoked: shareLinks.revoked, createdAt: shareLinks.createdAt })
    .from(shareLinks)
    .where(and(eq(shareLinks.personId, personId), eq(shareLinks.userId, user.userId)));
}

export async function revokeShareLink(user: AuthedUser, id: string) {
  await db.update(shareLinks).set({ revoked: true }).where(and(eq(shareLinks.id, id), eq(shareLinks.userId, user.userId)));
}

export async function getPublicShareSnapshot(token: string): Promise<ShareSnapshot | null> {
  const row = await db.query.shareLinks.findFirst({ where: eq(shareLinks.token, token) });
  if (!row || row.revoked) return null;
  return decryptJSON<ShareSnapshot>(row.snapshotEnc, keyFromShareToken(token));
}
