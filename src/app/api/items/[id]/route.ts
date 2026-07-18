import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { updateItemContent, updateItemPosition, reorderItem, softDeleteItem, NotFoundError } from '@/lib/repo/items';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  try {
    if (body.content) await updateItemContent(user, id, body.content);
    if (typeof body.posX === 'number' && typeof body.posY === 'number') await updateItemPosition(user, id, body.posX, body.posY);
    if (typeof body.sortIndex === 'number') await reorderItem(user, id, body.sortIndex);
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw err;
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  try {
    await softDeleteItem(user, id);
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw err;
  }
  return NextResponse.json({ ok: true });
}
