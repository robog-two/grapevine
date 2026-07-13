import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { updateContactFields, softDeletePerson } from '@/lib/repo/people';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  await updateContactFields(user, id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireSession();
  const { id } = await params;
  await softDeletePerson(user, id);
  return NextResponse.json({ ok: true });
}
