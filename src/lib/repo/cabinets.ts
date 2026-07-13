import { and, eq, isNull, sql } from 'drizzle-orm';
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
