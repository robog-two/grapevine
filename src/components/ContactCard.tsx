'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { CustomFieldDef } from '@/lib/repo/customFields';

interface CoreField {
  key: 'email' | 'phone' | 'discovered';
  label: string;
  value: string | null;
}

export function ContactCard({
  personId,
  email,
  phone,
  discovered,
  fieldDefs,
  values: initialValues,
}: {
  personId: string;
  email: string | null;
  phone: string | null;
  discovered: string | null;
  fieldDefs: CustomFieldDef[];
  values: Record<string, string>;
}) {
  const [core, setCore] = useState<CoreField[]>([
    { key: 'email', label: 'Email', value: email },
    { key: 'phone', label: 'Phone', value: phone },
    { key: 'discovered', label: 'Discovered', value: discovered },
  ]);
  const [values, setValues] = useState(initialValues);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [picking, setPicking] = useState(false);

  async function saveCore(key: CoreField['key'], value: string) {
    setCore((prev) => prev.map((f) => (f.key === key ? { ...f, value } : f)));
    setEditing(null);
    await fetch(`/api/people/${personId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });
  }

  async function saveCustom(fieldId: string, value: string) {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setEditing(null);
    await fetch('/api/custom-field-values', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId, fieldId, value }),
    });
  }

  const attachedFieldIds = new Set(Object.keys(values).filter((id) => values[id] !== undefined));
  const availableFields = fieldDefs.filter((f) => !attachedFieldIds.has(f.id));

  return (
    <div className="item item-grid-full">
      <div className="item-label">Contact</div>
      {core.map((f) => (
        <Row
          key={f.key}
          label={f.label}
          value={f.value ?? ''}
          editing={editing === f.key}
          onEdit={() => {
            setEditing(f.key);
            setDraft(f.value ?? '');
          }}
          onCancel={() => setEditing(null)}
          draft={draft}
          setDraft={setDraft}
          onSave={() => saveCore(f.key, draft)}
        />
      ))}
      {fieldDefs
        .filter((f) => attachedFieldIds.has(f.id))
        .map((f) => (
          <Row
            key={f.id}
            label={f.name}
            value={values[f.id] ?? ''}
            editing={editing === f.id}
            onEdit={() => {
              setEditing(f.id);
              setDraft(values[f.id] ?? '');
            }}
            onCancel={() => setEditing(null)}
            draft={draft}
            setDraft={setDraft}
            onSave={() => saveCustom(f.id, draft)}
          />
        ))}

      {picking ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
          {availableFields.length === 0 ? (
            <span className="help-text">
              No more custom fields. <Link href="/settings/fields">Create one</Link>
            </span>
          ) : (
            availableFields.map((f) => (
              <button
                key={f.id}
                type="button"
                className="rail-btn"
                onClick={() => {
                  setPicking(false);
                  setEditing(f.id);
                  setDraft('');
                }}
              >
                {f.name} <span className="cap">{f.type}</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      <button type="button" className="item-addfield" onClick={() => setPicking((v) => !v)}>
        + Add field
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  editing,
  onEdit,
  onCancel,
  draft,
  setDraft,
  onSave,
}: {
  label: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  draft: string;
  setDraft: (v: string) => void;
  onSave: () => void;
}) {
  if (editing) {
    return (
      <div className="item-row" style={{ gap: 8 }}>
        <span className="cap">{label}</span>
        <span style={{ display: 'flex', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
          <input
            className="input"
            style={{ minHeight: 26, padding: '2px 6px', fontSize: 12, width: 160 }}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave();
              if (e.key === 'Escape') onCancel();
            }}
          />
          <button type="button" className="btn btn-ghost" style={{ fontSize: 11 }} onClick={onSave}>
            Save
          </button>
        </span>
      </div>
    );
  }
  return (
    <div className="item-row" onClick={onEdit} style={{ cursor: 'pointer' }}>
      <span className="cap">{label}</span>
      <span>{value || <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}</span>
    </div>
  );
}
