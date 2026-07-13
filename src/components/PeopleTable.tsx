'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { iconSrc } from '@/lib/icons';
import type { CustomFieldDef } from '@/lib/repo/customFields';

export interface PeopleTableRow {
  id: string;
  name: string;
  iconKey: string;
  cabinetNames: string[];
  values: Record<string, string>;
}

export function PeopleTable({ rows, fieldDefs }: { rows: PeopleTableRow[]; fieldDefs: CustomFieldDef[] }) {
  const [sortKey, setSortKey] = useState<string>('name');
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = sortKey === 'name' ? a.name : sortKey === 'cabinet' ? a.cabinetNames.join(',') : a.values[sortKey] ?? '';
      const bv = sortKey === 'name' ? b.name : sortKey === 'cabinet' ? b.cabinetNames.join(',') : b.values[sortKey] ?? '';
      const field = fieldDefs.find((f) => f.id === sortKey);
      if (field?.type === 'currency') {
        const an = parseFloat(av.replace(/[^0-9.-]/g, '')) || 0;
        const bn = parseFloat(bv.replace(/[^0-9.-]/g, '')) || 0;
        return (an - bn) * sortDir;
      }
      return av.localeCompare(bv) * sortDir;
    });
    return copy;
  }, [rows, sortKey, sortDir, fieldDefs]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th></th>
          <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
            Name {sortKey === 'name' ? (sortDir === 1 ? '↑' : '↓') : ''}
          </th>
          <th onClick={() => toggleSort('cabinet')} style={{ cursor: 'pointer' }}>
            Cabinet {sortKey === 'cabinet' ? (sortDir === 1 ? '↑' : '↓') : ''}
          </th>
          {fieldDefs.map((f) => (
            <th key={f.id} onClick={() => toggleSort(f.id)} style={{ cursor: 'pointer' }}>
              {f.name} {sortKey === f.id ? (sortDir === 1 ? '↑' : '↓') : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => (
          <tr key={r.id}>
            <td>
              <div className="avatar" style={{ width: 24, height: 24 }}>
                <img src={iconSrc(r.iconKey)} alt="" />
              </div>
            </td>
            <td>
              <Link href={`/people/${r.id}`}>{r.name}</Link>
            </td>
            <td>
              {r.cabinetNames.map((c) => (
                <span key={c} className="tag tag-neutral" style={{ marginRight: 4 }}>
                  {c}
                </span>
              ))}
            </td>
            {fieldDefs.map((f) => (
              <td key={f.id} style={f.type === 'currency' ? { fontVariantNumeric: 'tabular-nums' } : undefined}>
                {r.values[f.id] ?? <span className="cap">—</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
