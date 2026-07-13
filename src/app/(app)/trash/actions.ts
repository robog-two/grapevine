'use server';

import { revalidatePath } from 'next/cache';
import { requirePageUser } from '@/lib/session';
import { restoreItem } from '@/lib/repo/items';

export async function restoreItemAction(formData: FormData) {
  const user = await requirePageUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await restoreItem(user, id);
  revalidatePath('/trash');
}
