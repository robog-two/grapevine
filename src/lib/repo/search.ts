import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { people, items, customFields, customFieldValues } from '@/db/schema';
import { decryptField, decryptJSON } from '@/lib/crypto';
import type { AuthedUser } from '@/lib/session';
import type { ItemContent } from './types';
import { plainText } from '@/lib/richtext';

export interface SearchHit {
  personId: string;
  personName: string;
  iconKey: string;
  matchLabel: string;
  snippet: string;
}

/**
 * Search runs inside an authenticated request, decrypting this user's
 * (typically modest-sized, personal-scale) dataset in memory to match
 * against, then discarding the plaintext — nothing decrypted here is
 * persisted. See src/db/schema.ts for the at-rest encryption model.
 */
export async function searchAll(user: AuthedUser, query: string): Promise<SearchHit[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];

  const peopleRows = await db.select().from(people).where(and(eq(people.userId, user.userId), isNull(people.deletedAt)));
  const nameById = new Map<string, { name: string; iconKey: string }>();

  for (const p of peopleRows) {
    const name = decryptField(p.nameEnc, user.dek) ?? '';
    nameById.set(p.id, { name, iconKey: p.iconKey });
    const haystacks: [string, string | null][] = [
      ['Name', name],
      ['Email', decryptField(p.emailEnc, user.dek)],
      ['Phone', decryptField(p.phoneEnc, user.dek)],
      ['How discovered', decryptField(p.discoveredEnc, user.dek)],
    ];
    for (const [label, value] of haystacks) {
      if (value && value.toLowerCase().includes(q)) {
        hits.push({ personId: p.id, personName: name, iconKey: p.iconKey, matchLabel: label, snippet: value });
      }
    }
  }

  const fieldRows = await db
    .select({ fieldId: customFieldValues.fieldId, personId: customFieldValues.personId, valueEnc: customFieldValues.valueEnc, nameEnc: customFields.nameEnc })
    .from(customFieldValues)
    .innerJoin(customFields, eq(customFields.id, customFieldValues.fieldId))
    .innerJoin(people, eq(people.id, customFieldValues.personId))
    .where(eq(people.userId, user.userId));

  for (const f of fieldRows) {
    const value = decryptField(f.valueEnc, user.dek);
    if (value && value.toLowerCase().includes(q)) {
      const fieldName = decryptField(f.nameEnc, user.dek) ?? 'Field';
      const person = nameById.get(f.personId);
      if (person) hits.push({ personId: f.personId, personName: person.name, iconKey: person.iconKey, matchLabel: fieldName, snippet: value });
    }
  }

  const itemRows = await db
    .select()
    .from(items)
    .innerJoin(people, eq(people.id, items.personId))
    .where(and(eq(people.userId, user.userId), isNull(items.deletedAt)));

  for (const row of itemRows) {
    const item = row.items;
    const person = nameById.get(item.personId);
    if (!person) continue;
    const content = decryptJSON<ItemContent>(item.contentEnc, user.dek);
    let text = '';
    let label = '';
    if (content.type === 'note') {
      text = plainText(content.text);
      label = 'Note';
    } else if (content.type === 'eml') {
      text = `${content.subject} ${content.from} ${content.bodyText}`;
      label = '.eml';
    } else if (content.type === 'file') {
      text = content.filename;
      label = 'File';
    } else if (content.type === 'photo') {
      text = content.caption ?? '';
      label = 'Photo';
    } else if (content.type === 'link') {
      text = `${content.title} ${content.url}`;
      label = 'Link';
    }
    if (text && text.toLowerCase().includes(q)) {
      const idx = text.toLowerCase().indexOf(q);
      const snippet = text.slice(Math.max(0, idx - 30), idx + q.length + 30);
      hits.push({ personId: item.personId, personName: person.name, iconKey: person.iconKey, matchLabel: label, snippet });
    }
  }

  return hits;
}
