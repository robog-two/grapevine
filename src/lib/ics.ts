import type { ReminderRecord } from '@/lib/repo/reminders';

/** `remindAt` is already a UTC instant (see reminders.remindAt in src/db/schema.ts) — ICS DTSTART is written in UTC ("Z" form), so every calendar app renders it in its own local timezone. */
function icsDate(remindAt: string): string {
  return new Date(remindAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function icsEventLines(r: Pick<ReminderRecord, 'icalUid' | 'remindAt' | 'personName' | 'note'>): string[] {
  const start = icsDate(r.remindAt);
  return [
    'BEGIN:VEVENT',
    `UID:${r.icalUid}`,
    `DTSTAMP:${start}`,
    `DTSTART:${start}`,
    `SUMMARY:${escapeText(`Follow up with ${r.personName}`)}`,
    r.note ? `DESCRIPTION:${escapeText(r.note)}` : '',
    'END:VEVENT',
  ].filter(Boolean);
}

/** Builds a one-way (read-only) iCal feed of every reminder, for a calendar app to subscribe to. */
export function buildIcsFeed(reminders: ReminderRecord[]): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Grapevine//Personal CRM//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Grapevine reminders'];
  for (const r of reminders) lines.push(...icsEventLines(r));
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/** Builds a single-event VCALENDAR document — the resource body a CalDAV PUT pushes to the server. */
export function buildIcsEvent(reminder: Pick<ReminderRecord, 'icalUid' | 'remindAt' | 'personName' | 'note'>): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Grapevine//Personal CRM//EN', 'CALSCALE:GREGORIAN', ...icsEventLines(reminder), 'END:VCALENDAR'];
  return lines.join('\r\n');
}
