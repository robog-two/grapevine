import { and, eq, isNull, isNotNull, desc, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { people, peopleCabinets, cabinets, customFields, customFieldValues } from '@/db/schema';
import { encryptField, decryptField } from '@/lib/crypto';
import type { AuthedUser } from '@/lib/session';
import { pickIcon } from '@/lib/icons';
import { logTimelineEvent } from './timeline';

export interface PersonListItem {
  id: string;
  name: string;
  iconKey: string;
  cabinetNames: string[];
  updatedAt: Date;
}

export async function listAllPeople(user: AuthedUser): Promise<PersonListItem[]> {
  const rows = await db
    .select({
      id: people.id,
      nameEnc: people.nameEnc,
      iconKey: people.iconKey,
      updatedAt: people.updatedAt,
      cabinetNameEnc: cabinets.nameEnc,
    })
    .from(people)
    .leftJoin(peopleCabinets, eq(peopleCabinets.personId, people.id))
    .leftJoin(cabinets, eq(cabinets.id, peopleCabinets.cabinetId))
    .where(and(eq(people.userId, user.userId), isNull(people.deletedAt)))
    .orderBy(people.createdAt);

  const byId = new Map<string, PersonListItem>();
  for (const r of rows) {
    let entry = byId.get(r.id);
    if (!entry) {
      entry = {
        id: r.id,
        name: decryptField(r.nameEnc, user.dek) ?? '',
        iconKey: r.iconKey,
        cabinetNames: [],
        updatedAt: r.updatedAt,
      };
      byId.set(r.id, entry);
    }
    if (r.cabinetNameEnc) entry.cabinetNames.push(decryptField(r.cabinetNameEnc, user.dek) ?? '');
  }
  return Array.from(byId.values());
}

export async function listRecentPeople(user: AuthedUser, limit = 4): Promise<PersonListItem[]> {
  const rows = await db
    .select({ id: people.id, nameEnc: people.nameEnc, iconKey: people.iconKey, updatedAt: people.updatedAt })
    .from(people)
    .where(and(eq(people.userId, user.userId), isNull(people.deletedAt)))
    .orderBy(desc(people.updatedAt))
    .limit(limit);
  return rows.map((r) => ({ id: r.id, name: decryptField(r.nameEnc, user.dek) ?? '', iconKey: r.iconKey, cabinetNames: [], updatedAt: r.updatedAt }));
}

export interface PersonDetail {
  id: string;
  name: string;
  iconKey: string;
  email: string | null;
  phone: string | null;
  discovered: string | null;
  createdAt: Date;
  updatedAt: Date;
  cabinets: { id: string; name: string }[];
}

export async function getPerson(user: AuthedUser, personId: string): Promise<PersonDetail | null> {
  const row = await db.query.people.findFirst({ where: and(eq(people.id, personId), eq(people.userId, user.userId)) });
  if (!row) return null;

  const cabinetRows = await db
    .select({ id: cabinets.id, nameEnc: cabinets.nameEnc })
    .from(peopleCabinets)
    .innerJoin(cabinets, eq(cabinets.id, peopleCabinets.cabinetId))
    .where(eq(peopleCabinets.personId, personId));

  return {
    id: row.id,
    name: decryptField(row.nameEnc, user.dek) ?? '',
    iconKey: row.iconKey,
    email: decryptField(row.emailEnc, user.dek),
    phone: decryptField(row.phoneEnc, user.dek),
    discovered: decryptField(row.discoveredEnc, user.dek),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    cabinets: cabinetRows.map((c) => ({ id: c.id, name: decryptField(c.nameEnc, user.dek) ?? '' })),
  };
}

export async function createPerson(
  user: AuthedUser,
  input: {
    name: string;
    cabinetIds?: string[];
    iconKey?: string;
    email?: string;
    phone?: string;
    discovered?: string;
    position?: { x: number; y: number };
  },
) {
  const iconKey = input.iconKey ?? pickIcon(Date.now() ^ Math.floor(Math.random() * 1e6));
  const [row] = await db
    .insert(people)
    .values({
      userId: user.userId,
      nameEnc: encryptField(input.name, user.dek)!,
      iconKey,
      emailEnc: encryptField(input.email ?? null, user.dek),
      phoneEnc: encryptField(input.phone ?? null, user.dek),
      discoveredEnc: encryptField(input.discovered ?? null, user.dek),
    })
    .returning({ id: people.id });

  for (const cabinetId of input.cabinetIds ?? []) {
    await db
      .insert(peopleCabinets)
      .values({ personId: row.id, cabinetId, posX: input.position?.x ?? 0, posY: input.position?.y ?? 0 })
      .onConflictDoNothing();
  }

  await logTimelineEvent(user, row.id, null, 'created', `${input.name} was added`, { name: input.name });

  return row.id;
}

export async function updateContactFields(
  user: AuthedUser,
  personId: string,
  fields: { name?: string; email?: string | null; phone?: string | null; discovered?: string | null },
) {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (fields.name !== undefined) patch.nameEnc = encryptField(fields.name, user.dek);
  if (fields.email !== undefined) patch.emailEnc = encryptField(fields.email, user.dek);
  if (fields.phone !== undefined) patch.phoneEnc = encryptField(fields.phone, user.dek);
  if (fields.discovered !== undefined) patch.discoveredEnc = encryptField(fields.discovered, user.dek);

  await db.update(people).set(patch).where(and(eq(people.id, personId), eq(people.userId, user.userId)));
  await logTimelineEvent(user, personId, null, 'updated', 'Contact details updated', fields);
}

export async function softDeletePerson(user: AuthedUser, personId: string) {
  await db.update(people).set({ deletedAt: new Date() }).where(and(eq(people.id, personId), eq(people.userId, user.userId)));
}

export async function restorePerson(user: AuthedUser, personId: string) {
  await db.update(people).set({ deletedAt: null }).where(and(eq(people.id, personId), eq(people.userId, user.userId)));
}

export async function listDeletedPeople(user: AuthedUser) {
  const rows = await db
    .select()
    .from(people)
    .where(and(eq(people.userId, user.userId), isNotNull(people.deletedAt)));
  return rows.map((r) => ({ id: r.id, name: decryptField(r.nameEnc, user.dek) ?? '', deletedAt: r.deletedAt! }));
}

export async function permanentlyDeletePerson(user: AuthedUser, personId: string) {
  await db.delete(people).where(and(eq(people.id, personId), eq(people.userId, user.userId)));
}

/** Custom field values for a set of people, decrypted, keyed by personId then fieldId. */
export async function getCustomFieldValuesForUser(user: AuthedUser) {
  const rows = await db
    .select({
      personId: customFieldValues.personId,
      fieldId: customFieldValues.fieldId,
      valueEnc: customFieldValues.valueEnc,
    })
    .from(customFieldValues)
    .innerJoin(people, eq(people.id, customFieldValues.personId))
    .where(eq(people.userId, user.userId));

  const map = new Map<string, Map<string, string | null>>();
  for (const r of rows) {
    if (!map.has(r.personId)) map.set(r.personId, new Map());
    map.get(r.personId)!.set(r.fieldId, decryptField(r.valueEnc, user.dek));
  }
  return map;
}

export async function mergePeople(user: AuthedUser, keepId: string, mergeId: string) {
  // Reassign cabinets (skip duplicates), items, custom field values, mentions, then delete the merged person.
  const { items, mentions } = await import('@/db/schema');

  const existingCabinets = await db
    .select({ cabinetId: peopleCabinets.cabinetId })
    .from(peopleCabinets)
    .where(eq(peopleCabinets.personId, keepId));
  const existingCabinetIds = new Set(existingCabinets.map((c) => c.cabinetId));

  const mergeCabinets = await db
    .select({ cabinetId: peopleCabinets.cabinetId })
    .from(peopleCabinets)
    .where(eq(peopleCabinets.personId, mergeId));
  for (const c of mergeCabinets) {
    if (!existingCabinetIds.has(c.cabinetId)) {
      await db.insert(peopleCabinets).values({ personId: keepId, cabinetId: c.cabinetId }).onConflictDoNothing();
    }
  }

  await db.update(items).set({ personId: keepId }).where(eq(items.personId, mergeId));
  await db.update(mentions).set({ targetPersonId: keepId }).where(eq(mentions.targetPersonId, mergeId));
  await db.update(mentions).set({ sourcePersonId: keepId }).where(eq(mentions.sourcePersonId, mergeId));

  const existingValues = await db
    .select({ fieldId: customFieldValues.fieldId })
    .from(customFieldValues)
    .where(eq(customFieldValues.personId, keepId));
  const existingFieldIds = new Set(existingValues.map((v) => v.fieldId));
  const mergeValues = await db.select().from(customFieldValues).where(eq(customFieldValues.personId, mergeId));
  for (const v of mergeValues) {
    if (!existingFieldIds.has(v.fieldId)) {
      await db.insert(customFieldValues).values({ personId: keepId, fieldId: v.fieldId, valueEnc: v.valueEnc });
    }
  }

  await logTimelineEvent(user, keepId, null, 'merged', 'Merged a duplicate record into this one', { mergedFrom: mergeId });
  await db.delete(people).where(eq(people.id, mergeId));
}
