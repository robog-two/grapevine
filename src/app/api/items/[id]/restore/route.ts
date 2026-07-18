import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { restoreItem, NotFoundError } from '@/lib/repo/items';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  try {
    await restoreItem(user, id);
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw err;
  }
  return NextResponse.json({ ok: true });
}
