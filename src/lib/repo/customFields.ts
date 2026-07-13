import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { customFields, customFieldValues } from '@/db/schema';
import { encryptField, decryptField, encryptJSON, decryptJSON } from '@/lib/crypto';
import type { AuthedUser } from '@/lib/session';
import type { FieldType } from './types';

export interface CustomFieldDef {
  id: string;
  name: string;
  type: FieldType;
  options: string[];
  sortOrder: number;
}

export async function listCustomFields(user: AuthedUser): Promise<CustomFieldDef[]> {
  const rows = await db
    .select()
    .from(customFields)
    .where(eq(customFields.userId, user.userId))
    .orderBy(customFields.sortOrder);
  return rows.map((r) => ({
    id: r.id,
    name: decryptField(r.nameEnc, user.dek) ?? '',
    type: r.type as FieldType,
    options: r.optionsEnc ? decryptJSON<string[]>(r.optionsEnc, user.dek) : [],
    sortOrder: r.sortOrder,
  }));
}

export async function createCustomField(user: AuthedUser, name: string, type: FieldType, options: string[] = []) {
  const [row] = await db
    .insert(customFields)
    .values({
      userId: user.userId,
      nameEnc: encryptField(name, user.dek)!,
      type,
      optionsEnc: options.length ? encryptJSON(options, user.dek) : null,
      sortOrder: Date.now(),
    })
    .returning({ id: customFields.id });
  return row.id;
}

export async function deleteCustomField(user: AuthedUser, fieldId: string) {
  await db.delete(customFields).where(and(eq(customFields.id, fieldId), eq(customFields.userId, user.userId)));
}

export async function setCustomFieldValue(user: AuthedUser, personId: string, fieldId: string, value: string) {
  const existing = await db.query.customFieldValues.findFirst({
    where: and(eq(customFieldValues.personId, personId), eq(customFieldValues.fieldId, fieldId)),
  });
  const valueEnc = encryptField(value, user.dek)!;
  if (existing) {
    await db.update(customFieldValues).set({ valueEnc, updatedAt: new Date() }).where(eq(customFieldValues.id, existing.id));
  } else {
    await db.insert(customFieldValues).values({ personId, fieldId, valueEnc });
  }
}

export async function getCustomFieldValues(user: AuthedUser, personId: string): Promise<Record<string, string>> {
  const rows = await db.select().from(customFieldValues).where(eq(customFieldValues.personId, personId));
  const out: Record<string, string> = {};
  for (const r of rows) out[r.fieldId] = decryptField(r.valueEnc, user.dek) ?? '';
  return out;
}
