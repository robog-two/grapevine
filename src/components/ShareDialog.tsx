'use client';

import { useState } from 'react';

export interface ShareLinkInfo {
  id: string;
  token: string;
  revoked: boolean;
}

export function ShareDialog({
  personId,
  personName,
  initialLinks,
  onCreate,
  onRevoke,
}: {
  personId: string;
  personName: string;
  initialLinks: ShareLinkInfo[];
  onCreate: (personId: string) => Promise<{ id: string; token: string }>;
  onRevoke: (personId: string, id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState(initialLinks);
  const [busy, setBusy] = useState(false);
  const active = links.find((l) => !l.revoked);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
        Share
      </button>
      {open ? (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Share {personName}</div>
            <div className="dialog-body">Read-only snapshot — no login required, no live editing.</div>
            {active ? (
              <>
                <div className="input" style={{ color: 'var(--color-neutral-600)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {appUrl}/share/{active.token}
                </div>
                <div className="dialog-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      await onRevoke(personId, active.id);
                      setLinks((prev) => prev.map((l) => (l.id === active.id ? { ...l, revoked: true } : l)));
                      setBusy(false);
                    }}
                  >
                    Revoke
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigator.clipboard.writeText(`${appUrl}/share/${active.token}`)}
                  >
                    Copy link
                  </button>
                </div>
              </>
            ) : (
              <div className="dialog-actions" style={{ justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const result = await onCreate(personId);
                    setLinks((prev) => [...prev, { id: result.id, token: result.token, revoked: false }]);
                    setBusy(false);
                  }}
                >
                  Create share link
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
