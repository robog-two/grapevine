'use client';

import { useState } from 'react';

export interface TimelineEntryView {
  id: string;
  changeType: string;
  label: string;
  snapshot: unknown;
  createdAt: string;
}

export function TimelineScrubber({ personId, entries }: { personId: string; entries: TimelineEntryView[] }) {
  const [index, setIndex] = useState(entries.length - 1);
  const entry = entries[index];
  const snapshot = entry?.snapshot as { type?: string; content?: unknown } | undefined;
  const canRestore = snapshot?.type && snapshot?.content;

  function download() {
    if (!entry) return;
    const blob = new Blob([JSON.stringify(entry.snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.label.replace(/\s+/g, '-')}-${entry.createdAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyIntoLiveFolder() {
    if (!snapshot?.type || !snapshot?.content) return;
    await fetch('/api/timeline-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId, type: snapshot.type, content: snapshot.content }),
    });
    alert('Copied into the live folder as a new item.');
  }

  if (entries.length === 0) {
    return <p className="help-text">No history yet.</p>;
  }

  return (
    <div>
      <div style={{ position: 'relative', height: 6, background: 'var(--color-divider)', borderRadius: 3, margin: '20px 10px' }}>
        {entries.map((e, i) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setIndex(i)}
            title={`${e.label} — ${new Date(e.createdAt).toLocaleString()}`}
            style={{
              position: 'absolute',
              left: `${entries.length === 1 ? 50 : (i / (entries.length - 1)) * 100}%`,
              top: -5,
              width: 16,
              height: 16,
              borderRadius: '50%',
              transform: 'translateX(-50%)',
              background: i === index ? 'var(--color-text)' : 'var(--color-neutral-400)',
              border: 'none',
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      <div className="item" style={{ minHeight: 100 }}>
        <div className="item-label" style={{ position: 'static', display: 'block', marginBottom: 8 }}>
          {new Date(entry.createdAt).toLocaleString()}
        </div>
        <div style={{ fontSize: 14, marginBottom: 8 }}>{entry.label}</div>
        <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', color: 'var(--color-neutral-700)', margin: 0 }}>{JSON.stringify(entry.snapshot, null, 2)}</pre>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'var(--space-2)' }}>
        <button type="button" className="btn btn-secondary" onClick={download}>
          Download this version
        </button>
        <button type="button" className="btn btn-primary" disabled={!canRestore} onClick={copyIntoLiveFolder}>
          Copy into live folder
        </button>
      </div>
    </div>
  );
}
