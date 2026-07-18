import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { reorderItem, NotFoundError } from '@/lib/repo/items';

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json().catch(() => null);
  const ids = body?.ids as string[] | undefined;
  if (!Array.isArray(ids)) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  try {
    await Promise.all(ids.map((id, index) => reorderItem(user, id, index * 1000)));
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw err;
  }
  return NextResponse.json({ ok: true });
}
