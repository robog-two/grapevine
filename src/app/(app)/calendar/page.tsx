import { requirePageUser } from '@/lib/session';
import { listUpcomingReminders } from '@/lib/repo/reminders';
import { listAllPeople } from '@/lib/repo/people';
import { getCaldavAccount } from '@/lib/repo/caldav';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CalendarPageClient } from '@/components/CalendarPageClient';

export default async function CalendarPage() {
  const user = await requirePageUser();
  // "Today" depends on the viewer's local timezone, which a server component can't know —
  // look back a day further than UTC-now so no timezone can drop a reminder that's still
  // "today" locally. The client re-filters/groups everything by local date below.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [reminders, people, userRow, caldavAccount] = await Promise.all([
    listUpcomingReminders(user, since),
    listAllPeople(user),
    db.query.users.findFirst({ where: eq(users.id, user.userId), columns: { icalToken: true } }),
    getCaldavAccount(user),
  ]);

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const icalUrl = `${appUrl}/api/ical/${userRow?.icalToken}`;

  return (
    <CalendarPageClient
      reminders={reminders.map((r) => ({ id: r.itemId, personId: r.personId, personName: r.personName, remindAt: r.remindAt, note: r.note }))}
      people={people.map((p) => ({ id: p.id, name: p.name }))}
      icalUrl={icalUrl}
      caldavConnected={caldavAccount !== null}
    />
  );
}
