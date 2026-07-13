import { and, eq, gte, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { reminders, people } from '@/db/schema';
import { encryptField, decryptField, type Dek } from '@/lib/crypto';
import type { AuthedUser } from '@/lib/session';
import type { TimeOfDay } from './types';
import { createItem, softDeleteItem } from './items';
import { randomToken } from '@/lib/crypto';

export interface ReminderRecord {
  id: string;
  itemId: string;
  personId: string;
  personName: string;
  date: string;
  timeOfDay: TimeOfDay;
  note: string | null;
  icalUid: string;
}

export async function createReminder(
  user: AuthedUser,
  personId: string,
  date: string,
  timeOfDay: TimeOfDay,
  note?: string,
) {
  const item = await createItem(user, personId, 'reminder', { type: 'reminder', note });
  const icalUid = `${item.id}@cabinet.app`;
  await db.insert(reminders).values({
    itemId: item.id,
    personId,
    date,
    timeOfDay,
    noteEnc: encryptField(note ?? null, user.dek),
    icalUid,
  });
  return item;
}

export async function deleteReminder(user: AuthedUser, itemId: string) {
  await softDeleteItem(user, itemId);
}

export async function listUpcomingReminders(user: AuthedUser, fromDate: string): Promise<ReminderRecord[]> {
  const rows = await db
    .select({
      id: reminders.id,
      itemId: reminders.itemId,
      personId: reminders.personId,
      date: reminders.date,
      timeOfDay: reminders.timeOfDay,
      noteEnc: reminders.noteEnc,
      icalUid: reminders.icalUid,
      personNameEnc: people.nameEnc,
    })
    .from(reminders)
    .innerJoin(people, eq(people.id, reminders.personId))
    .where(and(eq(people.userId, user.userId), gte(reminders.date, fromDate)))
    .orderBy(asc(reminders.date));

  return rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    personId: r.personId,
    personName: decryptField(r.personNameEnc, user.dek) ?? '',
    date: r.date,
    timeOfDay: r.timeOfDay as TimeOfDay,
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
      date: reminders.date,
      timeOfDay: reminders.timeOfDay,
      noteEnc: reminders.noteEnc,
      icalUid: reminders.icalUid,
      personNameEnc: people.nameEnc,
    })
    .from(reminders)
    .innerJoin(people, eq(people.id, reminders.personId))
    .where(eq(people.userId, userId))
    .orderBy(asc(reminders.date));

  return rows.map((r) => ({
    id: r.id,
    itemId: r.itemId,
    personId: r.personId,
    personName: decryptField(r.personNameEnc, dek) ?? '',
    date: r.date,
    timeOfDay: r.timeOfDay as TimeOfDay,
    note: decryptField(r.noteEnc, dek),
    icalUid: r.icalUid,
  }));
}

export { randomToken };
