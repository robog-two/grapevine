import type { AuthedUser } from '@/lib/session';
import type { ReminderRecord } from '@/lib/repo/reminders';
import { getCaldavCredentials } from '@/lib/repo/caldav';
import { pushReminderEvent } from '@/lib/caldavClient';

/**
 * Best-effort one-way push of a reminder to the user's connected CalDAV
 * calendar, if any. Never throws — a sync failure shouldn't block saving
 * the reminder itself, since the app (not the external calendar) is the
 * source of truth.
 */
export async function syncReminderToCaldav(user: AuthedUser, reminder: Pick<ReminderRecord, 'icalUid' | 'remindAt' | 'personName' | 'note'>): Promise<void> {
  const creds = await getCaldavCredentials(user);
  if (!creds) return;
  try {
    await pushReminderEvent(creds, reminder);
  } catch (err) {
    console.error('CalDAV sync failed:', err);
  }
}
