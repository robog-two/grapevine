'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { localReminderToUtcIso, utcIsoToLocalDate, type TimeOfDay } from '@/lib/reminderTime';

export interface ReminderView {
  id: string;
  personId: string;
  personName: string;
  /** UTC instant, ISO 8601. */
  remindAt: string;
  note: string | null;
}

export interface PersonOption {
  id: string;
  name: string;
}

export function CalendarPageClient({
  reminders: initial,
  people,
  icalUrl,
  caldavConnected,
}: {
  reminders: ReminderView[];
  people: PersonOption[];
  icalUrl: string;
  caldavConnected: boolean;
}) {
  const [reminders, setReminders] = useState(initial);
  const [composerDate, setComposerDate] = useState<string | null>(null);
  const [personId, setPersonId] = useState(people[0]?.id ?? '');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [note, setNote] = useState('');
  const [showSubscribe, setShowSubscribe] = useState(false);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate = useMemo(() => {
    const map = new Map<string, ReminderView[]>();
    for (const r of reminders) {
      const localDate = utcIsoToLocalDate(r.remindAt);
      if (!map.has(localDate)) map.set(localDate, []);
      map.get(localDate)!.push(r);
    }
    return map;
  }, [reminders]);

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Reminders are items under the hood (see src/lib/repo/items.ts) — deleting through the same
  // /api/items/:id endpoint the person folder view uses keeps both views looking at one record.
  async function handleDeleteReminder(id: string) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20 }}>
          Calendar — {firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/settings/caldav" className="cap">
            {caldavConnected ? 'CalDAV connected ✓' : 'Connect CalDAV calendar →'}
          </Link>
          <button type="button" className="btn btn-secondary" onClick={() => setShowSubscribe(true)}>
            Subscribe (iCal)
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setComposerDate(dateStr(today.getDate()))}>
            + Reminder
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="cap" style={{ textAlign: 'center' }}>
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const ds = day ? dateStr(day) : null;
          const dayReminders = ds ? byDate.get(ds) ?? [] : [];
          return (
            <div
              key={i}
              onClick={() => day && setComposerDate(ds)}
              style={{ minHeight: 64, padding: 6, cursor: day ? 'pointer' : 'default', border: day ? '1px solid var(--color-divider)' : 'none', borderRadius: 4 }}
            >
              {day ? (
                <>
                  <div className="cap">{day}</div>
                  {dayReminders.map((r) => (
                    <Link key={r.id} href={`/people/${r.personId}`} style={{ display: 'block', fontSize: 11, marginTop: 2 }} onClick={(e) => e.stopPropagation()}>
                      {r.personName}
                    </Link>
                  ))}
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="cap" style={{ marginTop: 'var(--space-4)', marginBottom: 8 }}>
        Upcoming
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {reminders.length === 0 ? <span className="help-text">No reminders yet.</span> : null}
        {reminders.map((r) => (
          <div key={r.id} className="item-row" style={{ border: 'none' }}>
            <span className="cap">
              {new Date(r.remindAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ·{' '}
              {new Date(r.remindAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </span>
            <span>
              <Link href={`/people/${r.personId}`}>{r.personName}</Link>
              {r.note ? ` — ${r.note}` : ''}{' '}
              <button
                type="button"
                onClick={() => handleDeleteReminder(r.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-600)', font: 'inherit', textDecoration: 'underline', padding: 0 }}
              >
                Delete
              </button>
            </span>
          </div>
        ))}
      </div>

      {composerDate ? (
        <div className="dialog-backdrop" onClick={() => setComposerDate(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">New reminder</div>
            <select className="input" value={personId} onChange={(e) => setPersonId(e.target.value)}>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input type="date" className="input" value={composerDate} onChange={(e) => setComposerDate(e.target.value)} />
            <div className="seg">
              {(['morning', 'afternoon', 'evening'] as const).map((t) => (
                <button key={t} type="button" className="seg-opt" data-active={timeOfDay === t} onClick={() => setTimeOfDay(t)}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <textarea className="input" rows={2} placeholder="Optional note — follow up about the Series A intro" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setComposerDate(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!personId}
                onClick={async () => {
                  const remindAt = localReminderToUtcIso(composerDate!, timeOfDay);
                  const res = await fetch('/api/reminders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ personId, remindAt, note }),
                  });
                  const data = await res.json();
                  const person = people.find((p) => p.id === personId);
                  setReminders((prev) => [...prev, { id: data.item.id, personId, personName: person?.name ?? '', remindAt, note }]);
                  setComposerDate(null);
                  setNote('');
                }}
              >
                Save reminder
              </button>
            </div>
            <span className="help-text">syncs one-way to an iCal feed — no in-app push</span>
          </div>
        </div>
      ) : null}

      {showSubscribe ? (
        <div className="dialog-backdrop" onClick={() => setShowSubscribe(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Subscribe to your reminders</div>
            <div className="dialog-body">
              Add this URL as a calendar subscription (Apple Calendar: File → New Calendar Subscription; Google Calendar: Other calendars → From URL).
            </div>
            <div className="input" style={{ overflowWrap: 'anywhere' }}>
              {icalUrl}
            </div>
            <div className="dialog-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigator.clipboard.writeText(icalUrl)}>
                Copy URL
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
