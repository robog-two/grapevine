'use server';

import { revalidatePath } from 'next/cache';
import { requirePageUser } from '@/lib/session';
import { createPersonShareLink, revokeShareLink } from '@/lib/repo/share';

export async function createShareLinkAction(personId: string) {
  const user = await requirePageUser();
  const result = await createPersonShareLink(user, personId);
  revalidatePath(`/people/${personId}`);
  return result;
}

export async function revokeShareLinkAction(personId: string, id: string) {
  const user = await requirePageUser();
  await revokeShareLink(user, id);
  revalidatePath(`/people/${personId}`);
}
