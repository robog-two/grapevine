'use server';

import { revalidatePath } from 'next/cache';
import { requirePageUser } from '@/lib/session';
import { restoreItem, NotFoundError } from '@/lib/repo/items';

export async function restoreItemAction(formData: FormData) {
  const user = await requirePageUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  try {
    await restoreItem(user, id);
  } catch (err) {
    if (!(err instanceof NotFoundError)) throw err;
  }
  revalidatePath('/trash');
}
