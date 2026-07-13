import { NextRequest, NextResponse } from 'next/server';
import { unwrapDekForUserByIcalToken } from '@/lib/auth';
import { listAllRemindersForIcal } from '@/lib/repo/reminders';
import { buildIcsFeed } from '@/lib/ics';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await unwrapDekForUserByIcalToken(token);
  if (!result) return new NextResponse('Not found', { status: 404 });

  const reminders = await listAllRemindersForIcal(result.userId, result.dek);
  const ics = buildIcsFeed(reminders);

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="cabinet-reminders.ics"',
    },
  });
}
