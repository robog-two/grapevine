'use server';

import { revalidatePath } from 'next/cache';
import { requirePageUser } from '@/lib/session';
import { saveCaldavAccount, deleteCaldavAccount } from '@/lib/repo/caldav';
import { testCaldavConnection } from '@/lib/caldavClient';

export async function connectCaldavAction(
  serverUrl: string,
  account: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requirePageUser();
  const creds = { serverUrl: serverUrl.trim(), account: account.trim(), password };
  if (!creds.serverUrl || !creds.account || !creds.password) {
    return { ok: false, error: 'Fill in every field.' };
  }

  const result = await testCaldavConnection(creds);
  if (!result.ok) return result;

  await saveCaldavAccount(user, creds);
  revalidatePath('/settings/caldav');
  revalidatePath('/settings/fields');
  revalidatePath('/calendar');
  return { ok: true };
}

export async function disconnectCaldavAction(): Promise<void> {
  const user = await requirePageUser();
  await deleteCaldavAccount(user);
  revalidatePath('/settings/caldav');
  revalidatePath('/settings/fields');
  revalidatePath('/calendar');
}
