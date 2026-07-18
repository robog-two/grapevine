'use client';

import { useRef, useState } from 'react';
import type { TimeOfDay } from '@/lib/reminderTime';

export interface MentionCandidate {
  id: string;
  name: string;
}

export function NoteEditor({
  initialText = '',
  people,
  onSave,
  onCancel,
  onCreateReminder,
}: {
  initialText?: string;
  people: MentionCandidate[];
  onSave: (text: string) => void;
  onCancel: () => void;
  onCreateReminder?: (date: string, timeOfDay: TimeOfDay, note: string) => void;
}) {
  const [text, setText] = useState(initialText);
  const [menu, setMenu] = useState<null | { kind: 'mention'; query: string } | { kind: 'slash' }>(null);
  const [dateForm, setDateForm] = useState<null | { forReminder: boolean }>(null);
  const [dateVal, setDateVal] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [reminderNote, setReminderNote] = useState('');
  const [linkForm, setLinkForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setText(value);
    const cursor = e.target.selectionStart;
    const before = value.slice(0, cursor);
    const mentionMatch = before.match(/@([a-zA-Z ]*)$/);
    const slashMatch = before.match(/\/(\w*)$/);
    if (mentionMatch) setMenu({ kind: 'mention', query: mentionMatch[1].toLowerCase() });
    else if (slashMatch) setMenu({ kind: 'slash' });
    else setMenu(null);
  }

  function replaceTrigger(insert: string) {
    const ta = taRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    const before = text.slice(0, cursor);
    const triggerMatch = before.match(/[@/][a-zA-Z ]*$/);
    const start = triggerMatch ? cursor - triggerMatch[0].length : cursor;
    const next = text.slice(0, start) + insert + text.slice(cursor);
    setText(next);
    setMenu(null);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + insert.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function wrapSelection(marker: string) {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const selected = text.slice(s, e) || 'text';
    const next = text.slice(0, s) + marker + selected + marker + text.slice(e);
    setText(next);
    requestAnimationFrame(() => ta.focus());
  }

  const filteredPeople = people.filter((p) => menu?.kind === 'mention' && p.name.toLowerCase().includes(menu.query));

  return (
    <div className="item" style={{ width: 460, maxWidth: '100%', position: 'relative' }}>
      <div className="item-label" style={{ position: 'static', display: 'block', marginBottom: 10 }}>
        Note
      </div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 'var(--space-3)', fontSize: 15 }}>
        <button type="button" style={{ fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => wrapSelection('**')}>
          B
        </button>
        <button type="button" style={{ fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => wrapSelection('*')}>
          i
        </button>
        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setLinkForm(true)}>
          🔗
        </button>
        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => replaceTrigger('@')}>
          @
        </button>
        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setDateForm({ forReminder: false })}>
          📅
        </button>
      </div>

      <textarea
        ref={taRef}
        className="input"
        style={{ fontSize: 14, lineHeight: 1.7, minHeight: 90, border: 'none', padding: 0 }}
        value={text}
        onChange={handleChange}
        placeholder='Type "@" to mention someone, "/" for a date, reminder, or link…'
        autoFocus
      />

      {menu?.kind === 'mention' && filteredPeople.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '2px 0 var(--space-3) 0' }}>
          {filteredPeople.slice(0, 5).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => replaceTrigger(`[[${p.name}|person:${p.id}]] `)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13 }}
            >
              {p.name}
            </button>
          ))}
        </div>
      ) : null}

      {menu?.kind === 'slash' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, margin: '2px 0 var(--space-3) 0' }}>
          <button type="button" onClick={() => { setMenu(null); setDateForm({ forReminder: false }); }} className="rail-btn">
            📅 Date
          </button>
          <button type="button" onClick={() => { setMenu(null); setDateForm({ forReminder: true }); }} className="rail-btn">
            ⏰ Reminder
          </button>
          <button type="button" onClick={() => { setMenu(null); setLinkForm(true); }} className="rail-btn">
            🔗 Link
          </button>
          <button type="button" onClick={() => { setMenu(null); replaceTrigger('@'); }} className="rail-btn">
            @ Mention
          </button>
        </div>
      ) : null}

      {dateForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--space-3)' }}>
          <input type="date" className="input" value={dateVal} onChange={(e) => setDateVal(e.target.value)} />
          {dateForm.forReminder ? (
            <>
              <div className="seg" style={{ fontSize: 12 }}>
                {(['morning', 'afternoon', 'evening'] as const).map((t) => (
                  <button key={t} type="button" className="seg-opt" data-active={timeOfDay === t} onClick={() => setTimeOfDay(t)}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <textarea className="input" rows={2} placeholder="Optional note" value={reminderNote} onChange={(e) => setReminderNote(e.target.value)} />
            </>
          ) : null}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setDateForm(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!dateVal}
              onClick={() => {
                const label = new Date(dateVal + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                replaceTrigger(`[[${label}|date:${dateVal}]] `);
                if (dateForm.forReminder) onCreateReminder?.(dateVal, timeOfDay, reminderNote);
                setDateForm(null);
                setDateVal('');
                setReminderNote('');
              }}
            >
              Insert
            </button>
          </div>
        </div>
      ) : null}

      {linkForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--space-3)' }}>
          <input className="input" placeholder="Link text" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
          <input className="input" placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setLinkForm(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!linkUrl}
              onClick={() => {
                replaceTrigger(`[[${linkLabel || linkUrl}|link:${linkUrl}]] `);
                setLinkForm(false);
                setLinkLabel('');
                setLinkUrl('');
              }}
            >
              Insert
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onSave(text)}>
          Save
        </button>
      </div>
    </div>
  );
}
