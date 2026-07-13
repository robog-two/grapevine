import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { signupUser, EmailInUseError, dekSessionValue } from '@/lib/auth';
import { getSession } from '@/lib/session';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  try {
    const { userId, email, dek } = await signupUser(parsed.data.email, parsed.data.password);
    const session = await getSession();
    session.userId = userId;
    session.email = email;
    session.dek = dekSessionValue(dek);
    await session.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof EmailInUseError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
  }
}
