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
  const todayStr = new Date().toISOString().slice(0, 10);
  const [reminders, people, userRow, caldavAccount] = await Promise.all([
    listUpcomingReminders(user, todayStr),
    listAllPeople(user),
    db.query.users.findFirst({ where: eq(users.id, user.userId), columns: { icalToken: true } }),
    getCaldavAccount(user),
  ]);

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
  const icalUrl = `${appUrl}/api/ical/${userRow?.icalToken}`;

  return (
    <CalendarPageClient
      reminders={reminders.map((r) => ({ id: r.itemId, personId: r.personId, personName: r.personName, date: r.date, timeOfDay: r.timeOfDay, note: r.note }))}
      people={people.map((p) => ({ id: p.id, name: p.name }))}
      icalUrl={icalUrl}
      caldavConnected={caldavAccount !== null}
    />
  );
}
