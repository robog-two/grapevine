'use server';

import { revalidatePath } from 'next/cache';
import { requirePageUser } from '@/lib/session';
import { createCabinet, deleteCabinet, listPeopleInCabinet, addPeopleToCabinet, getCabinet } from '@/lib/repo/cabinets';
import { createPerson } from '@/lib/repo/people';

export async function createCabinetAction(formData: FormData) {
  const user = await requirePageUser();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  await createCabinet(user, name);
  revalidatePath('/cabinets');
}

export async function deleteCabinetAction(formData: FormData) {
  const user = await requirePageUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deleteCabinet(user, id);
  revalidatePath('/cabinets');
}

export async function createPersonAction(formData: FormData) {
  const user = await requirePageUser();
  const name = String(formData.get('name') ?? '').trim();
  const cabinetId = String(formData.get('cabinetId') ?? '');
  if (!name || !cabinetId) return;
  const existing = await listPeopleInCabinet(user, cabinetId);
  const count = existing.length;
  const col = count % 4;
  const row = Math.floor(count / 4);
  const position = { x: 24 + col * 150, y: 24 + row * 130 };
  await createPerson(user, { name, cabinetIds: [cabinetId], position });
  revalidatePath(`/cabinets/${cabinetId}`);
}

export async function addExistingPeopleAction(cabinetId: string, personIds: string[]) {
  const user = await requirePageUser();
  const cabinet = await getCabinet(user, cabinetId);
  if (!cabinet || personIds.length === 0) return;
  await addPeopleToCabinet(user, cabinetId, personIds);
  revalidatePath(`/cabinets/${cabinetId}`);
}
