import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { createItem } from '@/lib/repo/items';
import type { ItemContent, ItemType } from '@/lib/repo/types';

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json().catch(() => null);
  const personId = body?.personId as string | undefined;
  const type = body?.type as ItemType | undefined;
  const content = body?.content as ItemContent | undefined;
  if (!personId || !type || !content) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const item = await createItem(user, personId, type, content, { sortIndex: Date.now() });
  return NextResponse.json({ item });
}
