import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { createReminder } from '@/lib/repo/reminders';
import { getPerson } from '@/lib/repo/people';
import { syncReminderToCaldav } from '@/lib/caldavSync';

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json().catch(() => null);
  if (!body?.personId || !body?.remindAt || Number.isNaN(Date.parse(body.remindAt))) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const item = await createReminder(user, body.personId, body.remindAt, body.note);

  const person = await getPerson(user, body.personId);
  if (person) {
    await syncReminderToCaldav(user, {
      icalUid: item.icalUid,
      remindAt: body.remindAt,
      personName: person.name,
      note: body.note ?? null,
    });
  }

  return NextResponse.json({ item });
}
