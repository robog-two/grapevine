import Link from 'next/link';
import { requirePageUser } from '@/lib/session';
import { listAllPeople, getCustomFieldValuesForUser } from '@/lib/repo/people';
import { listCustomFields } from '@/lib/repo/customFields';
import { PeopleTable, type PeopleTableRow } from '@/components/PeopleTable';
import { createPersonQuickAction } from './actions';

export default async function AllPeoplePage() {
  const user = await requirePageUser();
  const [people, fieldDefs, valuesMap] = await Promise.all([listAllPeople(user), listCustomFields(user), getCustomFieldValuesForUser(user)]);

  const rows: PeopleTableRow[] = people.map((p) => {
    const values: Record<string, string> = {};
    for (const [fieldId, value] of valuesMap.get(p.id) ?? []) {
      if (value !== null) values[fieldId] = value;
    }
    return { id: p.id, name: p.name, iconKey: p.iconKey, cabinetNames: p.cabinetNames, values };
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20 }}>All People</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="seg" style={{ fontSize: 12 }}>
            <span className="seg-opt" data-active="true">
              Table
            </span>
            <Link href="/graph" className="seg-opt">
              Graph
            </Link>
          </div>
          <Link href="/settings/fields" className="btn btn-secondary" style={{ fontSize: 12 }}>
            Edit fields
          </Link>
        </div>
      </div>

      <PeopleTable rows={rows} fieldDefs={fieldDefs} />

      <form action={createPersonQuickAction} style={{ display: 'flex', gap: 8, marginTop: 'var(--space-3)' }}>
        <input name="name" className="input" placeholder="New person's name" style={{ width: 200 }} required />
        <button type="submit" className="btn btn-primary">
          + Add person
        </button>
      </form>
    </div>
  );
}
