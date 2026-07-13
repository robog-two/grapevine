'use client';

import { useState } from 'react';
import type { FieldType } from '@/lib/repo/types';

const TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Check' },
  { value: 'link', label: 'Link' },
  { value: 'currency', label: '$' },
];

export function NewFieldForm({ action }: { action: (formData: FormData) => void }) {
  const [type, setType] = useState<FieldType>('text');

  return (
    <form action={action}>
      <div className="field">
        <label>New field name</label>
        <input className="input" name="name" placeholder='e.g. "Referral source"' required />
      </div>
      <input type="hidden" name="type" value={type} />
      <div className="seg" style={{ marginTop: 8, fontSize: 12 }}>
        {TYPES.map((t) => (
          <button key={t.value} type="button" className="seg-opt" data-active={type === t.value} onClick={() => setType(t.value)}>
            {t.label}
          </button>
        ))}
      </div>
      {type === 'select' ? (
        <div className="field" style={{ marginTop: 8 }}>
          <label>Options (comma separated)</label>
          <input className="input" name="options" placeholder="Seed, Series A, Series B" />
        </div>
      ) : null}
      <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>
        Add field
      </button>
    </form>
  );
}
