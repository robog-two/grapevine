import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { createReminder } from '@/lib/repo/reminders';
import type { TimeOfDay } from '@/lib/repo/types';

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json().catch(() => null);
  if (!body?.personId || !body?.date || !body?.timeOfDay) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const item = await createReminder(user, body.personId, body.date, body.timeOfDay as TimeOfDay, body.note);
  return NextResponse.json({ item });
}
