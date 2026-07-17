'use client';

import { useState } from 'react';
import { iconSrc } from '@/lib/icons';

export interface AvailablePersonOption {
  id: string;
  name: string;
  iconKey: string;
}

export function AddExistingPeopleDialog({
  cabinetId,
  available,
  onAdd,
}: {
  cabinetId: string;
  available: AvailablePersonOption[];
  onAdd: (cabinetId: string, personIds: string[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAdd() {
    setBusy(true);
    await onAdd(cabinetId, Array.from(selected));
    setBusy(false);
    setSelected(new Set());
    setOpen(false);
  }

  return (
    <>
      <button type="button" className="btn btn-secondary" style={{ fontSize: 12 }} onClick={() => setOpen(true)}>
        + Add existing
      </button>
      {open ? (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Add existing people</div>
            {available.length === 0 ? (
              <p className="help-text">Everyone is already in this cabinet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflowY: 'auto' }}>
                {available.map((p) => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                    <div className="avatar" style={{ width: 24, height: 24 }}>
                      <img src={iconSrc(p.iconKey)} alt="" />
                    </div>
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={busy || selected.size === 0} onClick={handleAdd}>
                {busy ? 'Adding…' : `Add ${selected.size || ''}`.trim()}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
