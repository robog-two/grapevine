import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { mergePeople } from '@/lib/repo/people';
import { NotFoundError } from '@/lib/repo/items';

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json().catch(() => null);
  if (!body?.keepId || !body?.mergeId) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  try {
    await mergePeople(user, body.keepId, body.mergeId);
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw err;
  }
  return NextResponse.json({ ok: true });
}
