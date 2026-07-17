'use server';

import { revalidatePath } from 'next/cache';
import { requirePageUser } from '@/lib/session';
import { createPersonShareLink, revokeShareLink } from '@/lib/repo/share';
import { getPerson } from '@/lib/repo/people';
import { addPersonToCabinet, removePersonFromCabinet, getCabinet } from '@/lib/repo/cabinets';

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

export async function addPersonToCabinetAction(personId: string, cabinetId: string) {
  const user = await requirePageUser();
  const [person, cabinet] = await Promise.all([getPerson(user, personId), getCabinet(user, cabinetId)]);
  if (!person || !cabinet) return;
  await addPersonToCabinet(personId, cabinetId);
  revalidatePath(`/people/${personId}`);
}

export async function removePersonFromCabinetAction(personId: string, cabinetId: string) {
  const user = await requirePageUser();
  const [person, cabinet] = await Promise.all([getPerson(user, personId), getCabinet(user, cabinetId)]);
  if (!person || !cabinet) return;
  await removePersonFromCabinet(personId, cabinetId);
  revalidatePath(`/people/${personId}`);
}
