'use client';

import { useState } from 'react';

export interface CabinetOption {
  id: string;
  name: string;
}

export function CabinetPicker({
  personId,
  allCabinets,
  memberCabinetIds: initialMemberIds,
  onAdd,
  onRemove,
}: {
  personId: string;
  allCabinets: CabinetOption[];
  memberCabinetIds: string[];
  onAdd: (personId: string, cabinetId: string) => Promise<void>;
  onRemove: (personId: string, cabinetId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [memberIds, setMemberIds] = useState(new Set(initialMemberIds));
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(cabinetId: string) {
    setBusyId(cabinetId);
    if (memberIds.has(cabinetId)) {
      await onRemove(personId, cabinetId);
      setMemberIds((prev) => {
        const next = new Set(prev);
        next.delete(cabinetId);
        return next;
      });
    } else {
      await onAdd(personId, cabinetId);
      setMemberIds((prev) => new Set(prev).add(cabinetId));
    }
    setBusyId(null);
  }

  return (
    <>
      <button type="button" className="tag tag-outline" style={{ cursor: 'pointer', border: '1px solid var(--color-text)', background: 'none' }} onClick={() => setOpen(true)}>
        + Add to cabinet
      </button>
      {open ? (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Cabinets</div>
            {allCabinets.length === 0 ? (
              <p className="help-text">No cabinets yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {allCabinets.map((c) => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: busyId ? 'default' : 'pointer' }}>
                    <input type="checkbox" checked={memberIds.has(c.id)} disabled={busyId === c.id} onChange={() => toggle(c.id)} />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="dialog-actions">
              <button type="button" className="btn btn-primary" onClick={() => setOpen(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
