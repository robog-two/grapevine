import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { createItem, NotFoundError } from '@/lib/repo/items';
import type { ItemContent, ItemType } from '@/lib/repo/types';

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json().catch(() => null);
  const personId = body?.personId as string | undefined;
  const type = body?.type as ItemType | undefined;
  const content = body?.content as ItemContent | undefined;
  const blobUrl = body?.blobUrl as string | undefined;
  if (!personId || !type || !content) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  try {
    const item = await createItem(user, personId, type, content, { blobUrl, sortIndex: Date.now() });
    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    throw err;
  }
}
