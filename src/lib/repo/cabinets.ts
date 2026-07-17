import { and, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { cabinets, people, peopleCabinets } from '@/db/schema';
import { encryptField, decryptField, type Dek } from '@/lib/crypto';
import type { AuthedUser } from '@/lib/session';

export interface CabinetSummary {
  id: string;
  name: string;
  personCount: number;
}

export async function listCabinets(user: AuthedUser): Promise<CabinetSummary[]> {
  const rows = await db
    .select({
      id: cabinets.id,
      nameEnc: cabinets.nameEnc,
      personCount: sql<number>`count(${peopleCabinets.id})::int`,
    })
    .from(cabinets)
    .leftJoin(peopleCabinets, eq(peopleCabinets.cabinetId, cabinets.id))
    .where(eq(cabinets.userId, user.userId))
    .groupBy(cabinets.id)
    .orderBy(cabinets.createdAt);

  return rows.map((r) => ({
    id: r.id,
    name: decryptField(r.nameEnc, user.dek) ?? '',
    personCount: r.personCount,
  }));
}

export async function getCabinet(user: AuthedUser, cabinetId: string) {
  const row = await db.query.cabinets.findFirst({
    where: and(eq(cabinets.id, cabinetId), eq(cabinets.userId, user.userId)),
  });
  if (!row) return null;
  return { id: row.id, name: decryptField(row.nameEnc, user.dek) ?? '' };
}

export async function createCabinet(user: AuthedUser, name: string) {
  const [row] = await db
    .insert(cabinets)
    .values({ userId: user.userId, nameEnc: encryptField(name, user.dek)! })
    .returning({ id: cabinets.id });
  return row.id;
}

export async function deleteCabinet(user: AuthedUser, cabinetId: string) {
  await db.delete(cabinets).where(and(eq(cabinets.id, cabinetId), eq(cabinets.userId, user.userId)));
}

export interface CabinetPersonPosition {
  id: string;
  name: string;
  iconKey: string;
  posX: number;
  posY: number;
}

export async function listPeopleInCabinet(user: AuthedUser, cabinetId: string): Promise<CabinetPersonPosition[]> {
  const rows = await db
    .select({
      id: people.id,
      nameEnc: people.nameEnc,
      iconKey: people.iconKey,
      posX: peopleCabinets.posX,
      posY: peopleCabinets.posY,
    })
    .from(peopleCabinets)
    .innerJoin(people, eq(people.id, peopleCabinets.personId))
    .where(and(eq(peopleCabinets.cabinetId, cabinetId), isNull(people.deletedAt)));

  return rows.map((r) => ({
    id: r.id,
    name: decryptField(r.nameEnc, user.dek) ?? '',
    iconKey: r.iconKey,
    posX: r.posX,
    posY: r.posY,
  }));
}

export async function setPersonPositionInCabinet(personId: string, cabinetId: string, x: number, y: number) {
  await db
    .update(peopleCabinets)
    .set({ posX: x, posY: y })
    .where(and(eq(peopleCabinets.personId, personId), eq(peopleCabinets.cabinetId, cabinetId)));
}

export async function addPersonToCabinet(personId: string, cabinetId: string, x = 0, y = 0) {
  await db
    .insert(peopleCabinets)
    .values({ personId, cabinetId, posX: x, posY: y })
    .onConflictDoNothing();
}

export async function removePersonFromCabinet(personId: string, cabinetId: string) {
  await db
    .delete(peopleCabinets)
    .where(and(eq(peopleCabinets.personId, personId), eq(peopleCabinets.cabinetId, cabinetId)));
}

export interface AvailablePerson {
  id: string;
  name: string;
  iconKey: string;
}

/** People the user owns who are not yet a member of this cabinet — for the "Add existing" picker. */
export async function listPeopleAvailableForCabinet(user: AuthedUser, cabinetId: string): Promise<AvailablePerson[]> {
  const members = await db.select({ id: peopleCabinets.personId }).from(peopleCabinets).where(eq(peopleCabinets.cabinetId, cabinetId));
  const memberIds = members.map((m) => m.id);

  const rows = await db
    .select({ id: people.id, nameEnc: people.nameEnc, iconKey: people.iconKey })
    .from(people)
    .where(and(eq(people.userId, user.userId), isNull(people.deletedAt), memberIds.length ? notInArray(people.id, memberIds) : undefined));

  return rows.map((r) => ({ id: r.id, name: decryptField(r.nameEnc, user.dek) ?? '', iconKey: r.iconKey }));
}

/** Assigns existing people (already owned by the user) to a cabinet, skipping anyone already a member. */
export async function addPeopleToCabinet(user: AuthedUser, cabinetId: string, personIds: string[]): Promise<void> {
  if (personIds.length === 0) return;

  const owned = await db.select({ id: people.id }).from(people).where(and(eq(people.userId, user.userId), inArray(people.id, personIds)));
  const ownedIds = new Set(owned.map((o) => o.id));

  const existing = await listPeopleInCabinet(user, cabinetId);
  let count = existing.length;

  for (const personId of personIds) {
    if (!ownedIds.has(personId)) continue;
    const col = count % 4;
    const row = Math.floor(count / 4);
    await addPersonToCabinet(personId, cabinetId, 24 + col * 150, 24 + row * 130);
    count += 1;
  }
}
