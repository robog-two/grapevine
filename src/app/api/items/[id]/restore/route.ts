import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { restoreItem } from '@/lib/repo/items';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  await restoreItem(user, id);
  return NextResponse.json({ ok: true });
}
