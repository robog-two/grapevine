'use server';

import { revalidatePath } from 'next/cache';
import { requirePageUser } from '@/lib/session';
import { createPerson } from '@/lib/repo/people';

export async function createPersonQuickAction(formData: FormData) {
  const user = await requirePageUser();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  await createPerson(user, { name });
  revalidatePath('/people');
}
