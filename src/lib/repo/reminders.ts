import { and, eq, gte, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { reminders, reminderFeed } from '@/db/schema';
import { decryptField, decryptJSON, type Dek } from '@/lib/crypto';
import type { AuthedUser } from '@/lib/session';
import { createItem } from './items';
import type { ItemContent } from './types';
import { randomToken } from '@/lib/crypto';

export interface ReminderRecord {
  itemId: string;
  personId: string;
  personName: string;
  /** UTC instant, ISO 8601 — see reminders.remindAt in src/db/schema.ts. */
  remindAt: string;
  note: string | null;
  icalUid: string;
}

/**
 * A reminder is an item (type 'reminder', carrying the note text in its
 * content blob — the same blob the person canvas renders) plus a 1:1 schedule
 * row keyed by the item id. The note is stored exactly once, so editing it
 * from the person canvas is immediately what the calendar and iCal feed see.
 */
export async function createReminder(
  user: AuthedUser,
  personId: string,
  remindAt: string,
  note?: string,
) {
  const item = await createItem(user, personId, 'reminder', { type: 'reminder', note });
  await db.insert(reminders).values({
    itemId: item.id,
    remindAt: new Date(remindAt),
  });
  return { ...item, icalUid: icalUidForItem(item.id) };
}

/** Derived, not stored — mirrors the ical_uid expression in the reminder_feed view. */
export function icalUidForItem(itemId: string): string {
  return `${itemId}@grapevine.app`;
}

function toRecord(
  r: { itemId: string; personId: string; remindAt: Date; contentEnc: string; personNameEnc: string; icalUid: string },
  dek: Dek,
): ReminderRecord {
  const content = decryptJSON<ItemContent>(r.contentEnc, dek);
  return {
    itemId: r.itemId,
    personId: r.personId,
    personName: decryptField(r.personNameEnc, dek) ?? '',
    remindAt: r.remindAt.toISOString(),
    note: content.type === 'reminder' ? content.note ?? null : null,
    icalUid: r.icalUid,
  };
}

/**
 * `since` is a UTC instant (ISO 8601) — the calendar page passes a slightly-generous cutoff since "today" depends on the viewer's local timezone.
 *
 * Reads the `reminder_feed` view (see src/db/schema.ts): the view already joins the reminder's live item — the single source of truth for
 * whether it still exists — so a reminder deleted from the person folder view can never keep showing up as a "phantom" here.
 */
export async function listUpcomingReminders(user: AuthedUser, since: string): Promise<ReminderRecord[]> {
  const rows = await db
    .select()
    .from(reminderFeed)
    .where(and(eq(reminderFeed.userId, user.userId), gte(reminderFeed.remindAt, new Date(since))))
    .orderBy(asc(reminderFeed.remindAt));

  return rows.map((r) => toRecord(r, user.dek));
}

/** Same as listUpcomingReminders but decrypting with a DEK obtained via the server master key (iCal feed route). */
export async function listAllRemindersForIcal(userId: string, dek: Dek): Promise<ReminderRecord[]> {
  const rows = await db
    .select()
    .from(reminderFeed)
    .where(eq(reminderFeed.userId, userId))
    .orderBy(asc(reminderFeed.remindAt));

  return rows.map((r) => toRecord(r, dek));
}

export { randomToken };
