import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyLogin, InvalidCredentialsError, dekSessionValue } from '@/lib/auth';
import { getSession } from '@/lib/session';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const { userId, email, dek } = await verifyLogin(parsed.data.email, parsed.data.password);
    const session = await getSession();
    session.userId = userId;
    session.email = email;
    session.dek = dekSessionValue(dek);
    await session.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Could not sign in' }, { status: 500 });
  }
}
