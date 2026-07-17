import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { caldavAccounts } from '@/db/schema';
import { encryptField, decryptField } from '@/lib/crypto';
import type { AuthedUser } from '@/lib/session';
import type { CaldavCredentials } from '@/lib/caldavClient';

export interface CaldavAccountView {
  serverUrl: string;
  account: string;
  updatedAt: Date;
}

/** Connection status for display — never includes the password. */
export async function getCaldavAccount(user: AuthedUser): Promise<CaldavAccountView | null> {
  const row = await db.query.caldavAccounts.findFirst({ where: eq(caldavAccounts.userId, user.userId) });
  if (!row) return null;
  return {
    serverUrl: decryptField(row.serverUrlEnc, user.dek) ?? '',
    account: decryptField(row.accountEnc, user.dek) ?? '',
    updatedAt: row.updatedAt,
  };
}

/** Full credentials, for use by the sync path only. */
export async function getCaldavCredentials(user: AuthedUser): Promise<CaldavCredentials | null> {
  const row = await db.query.caldavAccounts.findFirst({ where: eq(caldavAccounts.userId, user.userId) });
  if (!row) return null;
  return {
    serverUrl: decryptField(row.serverUrlEnc, user.dek) ?? '',
    account: decryptField(row.accountEnc, user.dek) ?? '',
    password: decryptField(row.passwordEnc, user.dek) ?? '',
  };
}

export async function saveCaldavAccount(user: AuthedUser, creds: CaldavCredentials): Promise<void> {
  const values = {
    serverUrlEnc: encryptField(creds.serverUrl, user.dek)!,
    accountEnc: encryptField(creds.account, user.dek)!,
    passwordEnc: encryptField(creds.password, user.dek)!,
    updatedAt: new Date(),
  };
  await db
    .insert(caldavAccounts)
    .values({ userId: user.userId, ...values })
    .onConflictDoUpdate({ target: caldavAccounts.userId, set: values });
}

export async function deleteCaldavAccount(user: AuthedUser): Promise<void> {
  await db.delete(caldavAccounts).where(eq(caldavAccounts.userId, user.userId));
}
