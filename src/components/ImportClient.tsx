'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { parseVCard } from '@/lib/vcard';

interface ParsedRow {
  name: string;
  email?: string;
  phone?: string;
  discovered?: string;
}

interface Suggestion {
  newId: string;
  newName: string;
  existingId: string;
  existingName: string;
  reason: string;
}

const FIELD_OPTIONS = [
  { value: '', label: 'Ignore' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Reach-me-at (email)' },
  { value: 'phone', label: 'Phone' },
  { value: 'discovered', label: 'How discovered' },
];

export function ImportClient() {
  const [step, setStep] = useState<'upload' | 'map' | 'done'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [createdCount, setCreatedCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const isVcf = /\.vcf$|\.vcard$/i.test(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result ?? '');
      if (isVcf) {
        const people = parseVCard(text);
        await commit(people);
      } else {
        const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
        const cols = parsed.meta.fields ?? [];
        setHeaders(cols);
        setCsvRows(parsed.data);
        const guess: Record<string, string> = {};
        for (const col of cols) {
          const lower = col.toLowerCase();
          if (lower.includes('name')) guess[col] = 'name';
          else if (lower.includes('email') || lower.includes('mail')) guess[col] = 'email';
          else if (lower.includes('phone') || lower.includes('tel')) guess[col] = 'phone';
          else if (lower.includes('discover') || lower.includes('source') || lower.includes('how')) guess[col] = 'discovered';
        }
        setMapping(guess);
        setStep('map');
      }
    };
    reader.readAsText(file);
  }

  async function commitMapped() {
    const rows: ParsedRow[] = csvRows.map((row) => {
      const out: Record<string, string> = { name: '' };
      for (const col of headers) {
        const field = mapping[col];
        if (!field) continue;
        out[field] = row[col] ?? '';
      }
      return out as unknown as ParsedRow;
    });
    await commit(rows.filter((r) => r.name?.trim()));
  }

  async function commit(people: ParsedRow[]) {
    setBusy(true);
    const res = await fetch('/api/import/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ people }),
    });
    const data = await res.json();
    setCreatedCount(data.createdCount ?? 0);
    setSuggestions(data.suggestions ?? []);
    setBusy(false);
    setStep('done');
  }

  async function mergeSuggestion(s: Suggestion) {
    await fetch('/api/people/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keepId: s.existingId, mergeId: s.newId }),
    });
    setDismissed((prev) => new Set(prev).add(s.newId));
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 18, marginBottom: 10 }}>Import contacts</div>

      {step === 'upload' ? (
        <div>
          <p className="help-text" style={{ marginBottom: 10, display: 'block' }}>
            Upload a CSV or vCard (.vcf) export from your contacts app.
          </p>
          <input type="file" accept=".csv,.vcf,.vcard" onChange={onFile} disabled={busy} />
        </div>
      ) : null}

      {step === 'map' ? (
        <div>
          <div className="cap" style={{ marginBottom: 8 }}>
            Step 2 of 2 — map columns ({csvRows.length} rows)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 'var(--space-3)' }}>
            {headers.map((col) => (
              <div key={col} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13 }}>&quot;{col}&quot;</span>
                <span style={{ color: 'var(--color-text)' }}>→</span>
                <select
                  className="input"
                  style={{ width: 200 }}
                  value={mapping[col] ?? ''}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [col]: e.target.value }))}
                >
                  {FIELD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-block" onClick={commitMapped} disabled={busy} type="button">
            {busy ? 'Importing…' : 'Continue'}
          </button>
        </div>
      ) : null}

      {step === 'done' ? (
        <div>
          <p style={{ marginBottom: 'var(--space-3)' }}>Imported {createdCount} people.</p>
          {suggestions.filter((s) => !dismissed.has(s.newId)).length > 0 ? (
            <>
              <div className="cap" style={{ marginBottom: 8 }}>
                Possible duplicates
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {suggestions
                  .filter((s) => !dismissed.has(s.newId))
                  .map((s) => (
                    <div key={s.newId} className="item">
                      <div style={{ fontSize: 13, marginBottom: 6 }}>
                        <b>{s.newName}</b> looks like <b>{s.existingName}</b> — matched on {s.reason}
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setDismissed((prev) => new Set(prev).add(s.newId))}>
                          Keep both
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => mergeSuggestion(s)}>
                          Merge records
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
