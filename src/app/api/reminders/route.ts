import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { createReminder } from '@/lib/repo/reminders';
import { getPerson } from '@/lib/repo/people';
import { syncReminderToCaldav } from '@/lib/caldavSync';
import { NotFoundError } from '@/lib/repo/items';

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json().catch(() => null);
  if (!body?.personId || !body?.remindAt || Number.isNaN(Date.parse(body.remindAt))) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  let item;
  try {
    item = await createReminder(user, body.personId, body.remindAt, body.note);
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw err;
  }

  // createReminder already verified body.personId belongs to this account, so this lookup can't fail.
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
