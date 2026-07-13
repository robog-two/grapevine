import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { setCustomFieldValue } from '@/lib/repo/customFields';

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json().catch(() => null);
  if (!body?.personId || !body?.fieldId || typeof body.value !== 'string') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  await setCustomFieldValue(user, body.personId, body.fieldId, body.value);
  return NextResponse.json({ ok: true });
}
