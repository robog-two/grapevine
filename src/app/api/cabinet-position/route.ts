import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { setPersonPositionInCabinet } from '@/lib/repo/cabinets';

export async function POST(req: NextRequest) {
  await requireSession();
  const body = await req.json().catch(() => null);
  if (!body?.personId || !body?.cabinetId || typeof body.x !== 'number' || typeof body.y !== 'number') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  await setPersonPositionInCabinet(body.personId, body.cabinetId, body.x, body.y);
  return NextResponse.json({ ok: true });
}
