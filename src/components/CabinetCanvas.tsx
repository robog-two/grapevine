'use client';

import Link from 'next/link';
import { DraggableItem } from './DraggableItem';
import { iconSrc } from '@/lib/icons';

export interface CabinetCanvasPerson {
  id: string;
  name: string;
  iconKey: string;
  posX: number;
  posY: number;
}

export function CabinetCanvas({ cabinetId, people: initial }: { cabinetId: string; people: CabinetCanvasPerson[] }) {
  const height = Math.max(360, ...initial.map((p) => p.posY + 150));

  async function commit(personId: string, x: number, y: number) {
    await fetch('/api/cabinet-position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId, cabinetId, x, y }),
    });
  }

  return (
    <div className="canvas canvas-free" style={{ height }}>
      {initial.map((p) => (
        <DraggableItem key={p.id} x={p.posX} y={p.posY} onCommit={(x, y) => commit(p.id, x, y)}>
          <Link href={`/people/${p.id}`} className="folder-link" draggable={false}>
            <div className="folder-card" style={{ width: 110 }}>
              <div className="avatar">
                <img src={iconSrc(p.iconKey)} alt="" />
              </div>
              <div style={{ fontSize: 12, textAlign: 'center' }}>{p.name}</div>
            </div>
          </Link>
        </DraggableItem>
      ))}
      {initial.length === 0 ? (
        <div className="empty-state" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No one here yet — add a person below.
        </div>
      ) : null}
    </div>
  );
}
