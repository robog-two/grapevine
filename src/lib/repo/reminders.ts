import { and, eq, gte, asc, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { reminders, people, items } from '@/db/schema';
import { encryptField, decryptField, type Dek } from '@/lib/crypto';
import type { AuthedUser } from '@/lib/session';
import { createItem } from './items';
import { randomToken } from '@/lib/crypto';

export interface ReminderRecord {
  id: string;
  itemId: string;
  personId: string;
  personName: string;
  /** UTC instant, ISO 8601 — see reminders.remindAt in src/db/schema.ts. */
  remindAt: string;
  note: string | null;
  icalUid: string;
}

export async function createReminder(
  user: AuthedUser,
  personId: string,
  remindAt: string,
  note?: string,
) {
  const item = await createItem(user, personId, 'reminder', { type: 'reminder', note });
  const icalUid = `${item.id}@grapevine.app`;
  await db.insert(reminders).values({
    itemId: item.id,
    personId,
    remindAt: new Date(remindAt),
    noteEnc: encryptField(note ?? null, user.dek),
    icalUid,
  });
  return { ...item, icalUid };
}

/**
 * `since` is a UTC instant (ISO 8601) — the calendar page passes a slightly-generous cutoff since "today" depends on the viewer's local timezone.
 *
 * A reminder's `items` row (see src/db/schema.ts) is the single source of truth for whether it still exists — deleting it from the
 * person folder view soft-deletes that row. This joins in `items` and filters on it so a reminder deleted from one view can never
 * keep showing up as a "phantom" here.
 */
export async function listUpcomingReminders(user: AuthedUser, since: string): Promise<ReminderRecord[]> {
  const rows = await db
    .select({
      id: reminders.id,
      itemId: reminders.itemId,
      personId: reminders.personId,
      remindAt: reminders.remindAt,
      noteEnc: reminders.noteEnc,
      icalUid: reminders.icalUid,
      personNameEnc: people.nameEnc,
    })
    .from(reminders)
    .innerJoin(people, eq(people.id, reminders.personId))
    .innerJoin(items, eq(items.id, reminders.itemId))
    .where(and(eq(people.userId, user.userId), isNull(items.deletedAt), gte(reminders.remindAt, new Date(since))))
    .orderBy(asc(reminders.remindAt));

  return rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    personId: r.personId,
    personName: decryptField(r.personNameEnc, user.dek) ?? '',
    remindAt: r.remindAt.toISOString(),
    note: decryptField(r.noteEnc, user.dek),
    icalUid: r.icalUid,
  }));
}

/** Same as listUpcomingReminders but decrypting with a DEK obtained via the server master key (iCal feed route). */
export async function listAllRemindersForIcal(userId: string, dek: Dek): Promise<ReminderRecord[]> {
  const rows = await db
    .select({
      id: reminders.id,
      itemId: reminders.itemId,
      personId: reminders.personId,
      remindAt: reminders.remindAt,
      noteEnc: reminders.noteEnc,
      icalUid: reminders.icalUid,
      personNameEnc: people.nameEnc,
    })
    .from(reminders)
    .innerJoin(people, eq(people.id, reminders.personId))
    .innerJoin(items, eq(items.id, reminders.itemId))
    .where(and(eq(people.userId, userId), isNull(items.deletedAt)))
    .orderBy(asc(reminders.remindAt));

  return rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    personId: r.personId,
    personName: decryptField(r.personNameEnc, dek) ?? '',
    remindAt: r.remindAt.toISOString(),
    note: decryptField(r.noteEnc, dek),
    icalUid: r.icalUid,
  }));
}

export { randomToken };
