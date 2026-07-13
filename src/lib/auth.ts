import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import {
  deriveKek,
  generateDek,
  wrapDek,
  unwrapDek,
  randomSaltHex,
  randomToken,
  dekToBase64,
  type Dek,
} from './crypto';
import { getServerMasterKey } from './serverKey';

const BCRYPT_ROUNDS = 12;

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
  }
}

export class EmailInUseError extends Error {
  constructor() {
    super('An account with that email already exists');
  }
}

export async function signupUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });
  if (existing) throw new EmailInUseError();

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const encSalt = randomSaltHex();
  const kek = deriveKek(password, encSalt);
  const dek = generateDek();
  const wrappedDek = wrapDek(dek, kek);
  const wrappedDekServer = wrapDek(dek, getServerMasterKey());
  const icalToken = randomToken(20);

  const [user] = await db
    .insert(users)
    .values({ email: normalizedEmail, passwordHash, encSalt, wrappedDek, wrappedDekServer, icalToken })
    .returning({ id: users.id, email: users.email });

  return { userId: user.id, email: user.email, dek };
}

export async function verifyLogin(email: string, password: string): Promise<{ userId: string; email: string; dek: Dek }> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });
  if (!user) throw new InvalidCredentialsError();

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new InvalidCredentialsError();

  const kek = deriveKek(password, user.encSalt);
  let dek: Dek;
  try {
    dek = unwrapDek(user.wrappedDek, kek);
  } catch {
    // Wrong password would already have failed bcrypt.compare, so this only
    // happens on data corruption — surface it the same way as bad creds.
    throw new InvalidCredentialsError();
  }

  return { userId: user.id, email: user.email, dek };
}

export function dekSessionValue(dek: Dek): string {
  return dekToBase64(dek);
}

/** Unwraps a user's DEK via the server master key, for the iCal feed route (no live session available). */
export async function unwrapDekForUserByIcalToken(icalToken: string): Promise<{ userId: string; dek: Dek } | null> {
  const user = await db.query.users.findFirst({ where: eq(users.icalToken, icalToken) });
  if (!user) return null;
  const dek = unwrapDek(user.wrappedDekServer, getServerMasterKey());
  return { userId: user.id, dek };
}
