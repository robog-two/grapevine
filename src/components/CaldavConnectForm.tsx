'use client';

import { useState } from 'react';
import Link from 'next/link';

export function CaldavConnectForm({
  initialAccount,
  onConnect,
  onDisconnect,
}: {
  initialAccount: { serverUrl: string; account: string } | null;
  onConnect: (serverUrl: string, account: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onDisconnect: () => Promise<void>;
}) {
  const [account, setAccount] = useState(initialAccount);
  const [serverUrl, setServerUrl] = useState(initialAccount?.serverUrl ?? '');
  const [accountInput, setAccountInput] = useState(initialAccount?.account ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    const result = await onConnect(serverUrl, accountInput, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAccount({ serverUrl: serverUrl.trim(), account: accountInput.trim() });
    setPassword('');
  }

  async function handleDisconnect() {
    setBusy(true);
    await onDisconnect();
    setBusy(false);
    setAccount(null);
  }

  return (
    <div style={{ maxWidth: 460 }}>
      <Link href="/settings/fields" style={{ fontSize: 12, color: 'var(--color-neutral-600)', display: 'block', marginBottom: 10 }}>
        ← back to Settings
      </Link>
      <h1 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Connect CalDAV calendar</h1>

      {account ? (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <div className="item-row">
            <span className="cap">Server</span>
            <span>{account.serverUrl}</span>
          </div>
          <div className="item-row">
            <span className="cap">Account</span>
            <span>{account.account}</span>
          </div>
          <button type="button" className="btn btn-secondary" style={{ marginTop: 'var(--space-3)' }} disabled={busy} onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Server URL</label>
            <input className="input" placeholder="https://caldav.example.com/dav/" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Account</label>
            <input className="input" placeholder="you@example.com" value={accountInput} onChange={(e) => setAccountInput(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 'var(--space-3)' }}>
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ marginBottom: 6 }}
            disabled={busy || !serverUrl || !accountInput || !password}
            onClick={handleSave}
          >
            {busy ? 'Connecting…' : 'Save'}
          </button>
        </div>
      )}

      {error ? (
        <div className="dialog-backdrop" onClick={() => setError(null)}>
          <div className="dialog" style={{ width: 'min(340px, 100%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Couldn&apos;t connect</div>
            <div className="dialog-body">{error}</div>
            <div className="dialog-actions">
              <button type="button" className="btn btn-primary" onClick={() => setError(null)}>
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
