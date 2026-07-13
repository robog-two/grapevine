import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession, type SessionOptions } from 'iron-session';
import { dekFromBase64, type Dek } from './crypto';

export interface SessionData {
  userId?: string;
  email?: string;
  /** Base64 raw DEK, held only inside the encrypted session cookie — never persisted to disk. */
  dek?: string;
}

const DEV_FALLBACK_SECRET = 'dev-only-insecure-secret-change-me-please-32bytes!!';

/**
 * Resolved lazily (at request time) rather than at module load, so that
 * `next build` — which runs with NODE_ENV=production but no live request or
 * env vars configured yet — doesn't fail before the app is even deployed.
 */
function getSessionOptions(): SessionOptions {
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('SESSION_SECRET must be set in production (32+ random bytes, see .env.example).');
  }
  return {
    password: process.env.SESSION_SECRET || DEV_FALLBACK_SECRET,
    cookieName: 'crm_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14, // 14 days
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export interface AuthedUser {
  userId: string;
  email: string;
  dek: Dek;
}

/** Reads the current session and throws if the request is not authenticated. */
export async function requireSession(): Promise<AuthedUser> {
  const session = await getSession();
  if (!session.userId || !session.dek || !session.email) {
    throw new AuthError('Not signed in');
  }
  return { userId: session.userId, email: session.email, dek: dekFromBase64(session.dek) };
}

export async function getAuthedUser(): Promise<AuthedUser | null> {
  const session = await getSession();
  if (!session.userId || !session.dek || !session.email) return null;
  return { userId: session.userId, email: session.email, dek: dekFromBase64(session.dek) };
}

export class AuthError extends Error {}

/** For use in server components/layouts: redirects to /login when signed out. */
export async function requirePageUser(): Promise<AuthedUser> {
  const user = await getAuthedUser();
  if (!user) redirect('/login');
  return user;
}
