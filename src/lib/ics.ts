import type { ReminderRecord } from '@/lib/repo/reminders';

const TIME_OF_DAY_HOUR: Record<string, number> = { morning: 9, afternoon: 14, evening: 18 };

function icsDate(dateStr: string, timeOfDay: string): string {
  const hour = TIME_OF_DAY_HOUR[timeOfDay] ?? 9;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, hour, 0, 0));
  return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Builds a one-way (read-only) iCal feed of every reminder, for a calendar app to subscribe to. */
export function buildIcsFeed(reminders: ReminderRecord[]): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cabinet//Personal CRM//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Cabinet reminders'];
  for (const r of reminders) {
    const start = icsDate(r.date, r.timeOfDay);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${r.icalUid}`,
      `DTSTAMP:${start}`,
      `DTSTART:${start}`,
      `SUMMARY:${escapeText(`Follow up with ${r.personName}`)}`,
      r.note ? `DESCRIPTION:${escapeText(r.note)}` : '',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).join('\r\n');
}
