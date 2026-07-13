import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { reorderItem } from '@/lib/repo/items';

export async function POST(req: NextRequest) {
  await requireSession();
  const body = await req.json().catch(() => null);
  const ids = body?.ids as string[] | undefined;
  if (!Array.isArray(ids)) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  await Promise.all(ids.map((id, index) => reorderItem(id, index * 1000)));
  return NextResponse.json({ ok: true });
}
