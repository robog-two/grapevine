import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { mergePeople } from '@/lib/repo/people';

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json().catch(() => null);
  if (!body?.keepId || !body?.mergeId) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  await mergePeople(user, body.keepId, body.mergeId);
  return NextResponse.json({ ok: true });
}
