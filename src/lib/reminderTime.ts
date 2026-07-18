/**
 * Reminders are persisted as a single UTC instant (see reminders.remindAt in
 * src/db/schema.ts). Everywhere a human enters or reads a reminder's date/time,
 * that instant needs to be translated to/from the browser's local timezone —
 * these helpers do that using the browser's own `Date`, which is always
 * local-timezone-aware. Only call these from client components.
 */

const TIME_OF_DAY_HOUR = { morning: 9, afternoon: 14, evening: 18 } as const;

export type TimeOfDay = keyof typeof TIME_OF_DAY_HOUR;

/** A local calendar date (from an `<input type="date">`) + a coarse time-of-day bucket, as the UTC instant to persist. */
export function localReminderToUtcIso(localDate: string, timeOfDay: TimeOfDay): string {
  const [y, m, d] = localDate.split('-').map(Number);
  const hour = TIME_OF_DAY_HOUR[timeOfDay];
  return new Date(y, m - 1, d, hour, 0, 0, 0).toISOString();
}

/** The browser-local calendar date (YYYY-MM-DD) a stored UTC instant falls on. */
export function utcIsoToLocalDate(remindAt: string): string {
  const d = new Date(remindAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The time-of-day bucket a stored UTC instant falls into, in the browser's local time. */
export function utcIsoToLocalTimeOfDay(remindAt: string): TimeOfDay {
  const hour = new Date(remindAt).getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
