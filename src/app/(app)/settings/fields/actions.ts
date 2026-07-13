'use server';

import { revalidatePath } from 'next/cache';
import { requirePageUser } from '@/lib/session';
import { createCustomField, deleteCustomField } from '@/lib/repo/customFields';
import type { FieldType } from '@/lib/repo/types';

export async function createCustomFieldAction(formData: FormData) {
  const user = await requirePageUser();
  const name = String(formData.get('name') ?? '').trim();
  const type = String(formData.get('type') ?? 'text') as FieldType;
  const optionsRaw = String(formData.get('options') ?? '');
  const options = optionsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!name) return;
  await createCustomField(user, name, type, options);
  revalidatePath('/settings/fields');
}

export async function deleteCustomFieldAction(formData: FormData) {
  const user = await requirePageUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deleteCustomField(user, id);
  revalidatePath('/settings/fields');
}
