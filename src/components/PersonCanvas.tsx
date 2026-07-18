'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ItemCard, type ItemCardData } from '@/components/items/ItemCard';
import { ContactCard } from '@/components/ContactCard';
import { NoteEditor, type MentionCandidate } from '@/components/NoteEditor';
import type { CustomFieldDef } from '@/lib/repo/customFields';
import { localReminderToUtcIso, type TimeOfDay } from '@/lib/reminderTime';

type AddMode = null | 'link' | 'photo' | 'note' | 'eml' | 'reminder';

export function PersonCanvas({
  personId,
  initialItems,
  email,
  phone,
  discovered,
  fieldDefs,
  fieldValues,
  people,
}: {
  personId: string;
  initialItems: ItemCardData[];
  email: string | null;
  phone: string | null;
  discovered: string | null;
  fieldDefs: CustomFieldDef[];
  fieldValues: Record<string, string>;
  people: MentionCandidate[];
}) {
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [dragOverTrash, setDragOverTrash] = useState(false);
  const dragId = useRef<string | null>(null);

  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState<TimeOfDay>('morning');
  const [reminderNote, setReminderNote] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emlInputRef = useRef<HTMLInputElement>(null);

  async function addItem(type: ItemCardData['type'], content: ItemCardData['content'], blobUrl?: string) {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId, type, content, blobUrl }),
    });
    const data = await res.json();
    const item: ItemCardData = {
      id: data.item.id,
      type: data.item.type,
      content: data.item.content,
      blobUrl: data.item.blobUrl,
      createdAt: data.item.createdAt,
      updatedAt: data.item.updatedAt,
    };
    setItems((prev) => [...prev, item]);
    return item;
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected === id) setSelected(null);
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
  }

  function onDragStart(id: string) {
    dragId.current = id;
  }

  function onDropOn(targetId: string) {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    setItems((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((i) => i.id === from);
      const toIdx = next.findIndex((i) => i.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      fetch('/api/items/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      });
      return next;
    });
  }

  async function onDropOnTrash(e: React.DragEvent) {
    e.preventDefault();
    setDragOverTrash(false);
    const id = dragId.current;
    dragId.current = null;
    if (id) await deleteItem(id);
  }

  const selectedItem = items.find((i) => i.id === selected) ?? null;

  return (
    <div style={{ position: 'relative' }}>
      <div className="folder-layout">
        <div className="rail">
          <div className="rail-cap">Add to folder</div>
          <button className="rail-btn" onClick={() => setAddMode('link')} type="button">
            {'\u{1F517}'} Link + embed
          </button>
          <button className="rail-btn" onClick={() => fileInputRef.current?.click()} type="button">
            {'\u{1F5BC}'} Photo
          </button>
          <button className="rail-btn" onClick={() => setAddMode('note')} type="button">
            {'\u{1F4DD}'} Note
          </button>
          <button className="rail-btn" onClick={() => emlInputRef.current?.click()} type="button">
            {'✉️'} Import .eml
          </button>
          <button className="rail-btn" onClick={() => setAddMode('reminder')} type="button">
            {'\u{1F4C5}'} Reminder
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setBusy(true);
              const form = new FormData();
              form.append('file', file);
              form.append('kind', 'photo');
              const res = await fetch('/api/upload', { method: 'POST', body: form });
              const data = await res.json();
              await addItem('photo', data.content, data.blobUrl);
              setBusy(false);
            }}
          />
          <input
            ref={emlInputRef}
            type="file"
            accept=".eml,message/rfc822"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              setBusy(true);
              const form = new FormData();
              form.append('file', file);
              form.append('kind', 'eml');
              const res = await fetch('/api/upload', { method: 'POST', body: form });
              const data = await res.json();
              await addItem('eml', data.content, data.blobUrl);
              setBusy(false);
            }}
          />
        </div>

        <div className="strip">
          {addMode === 'link' ? (
            <div className="item" style={{ marginBottom: 'var(--space-2)' }}>
              <input className="input" placeholder="Title" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} style={{ marginBottom: 6 }} />
              <input className="input" placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} style={{ marginBottom: 6 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setAddMode(null)} type="button">
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={!linkUrl}
                  onClick={async () => {
                    await addItem('link', { type: 'link', url: linkUrl, title: linkTitle || linkUrl });
                    setAddMode(null);
                    setLinkUrl('');
                    setLinkTitle('');
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          ) : null}

          {addMode === 'note' ? (
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <NoteEditor
                people={people}
                onCancel={() => setAddMode(null)}
                onSave={async (text) => {
                  await addItem('note', { type: 'note', text });
                  setAddMode(null);
                }}
                onCreateReminder={async (date, timeOfDay, note) => {
                  const remindAt = localReminderToUtcIso(date, timeOfDay);
                  await fetch('/api/reminders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ personId, remindAt, note }),
                  });
                }}
              />
            </div>
          ) : null}

          {addMode === 'reminder' ? (
            <div className="item" style={{ marginBottom: 'var(--space-2)' }}>
              <div className="item-label" style={{ position: 'static', display: 'block', marginBottom: 8 }}>
                Reminder
              </div>
              <input type="date" className="input" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} style={{ marginBottom: 6 }} />
              <div className="seg" style={{ fontSize: 12, marginBottom: 6 }}>
                {(['morning', 'afternoon', 'evening'] as const).map((t) => (
                  <button key={t} type="button" className="seg-opt" data-active={reminderTime === t} onClick={() => setReminderTime(t)}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <textarea className="input" rows={2} placeholder="Optional note" value={reminderNote} onChange={(e) => setReminderNote(e.target.value)} style={{ marginBottom: 6 }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-secondary" type="button" onClick={() => setAddMode(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={!reminderDate}
                  onClick={async () => {
                    const remindAt = localReminderToUtcIso(reminderDate, reminderTime);
                    const res = await fetch('/api/reminders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ personId, remindAt, note: reminderNote }),
                    });
                    const data = await res.json();
                    setItems((prev) => [...prev, data.item]);
                    setAddMode(null);
                    setReminderDate('');
                    setReminderNote('');
                  }}
                >
                  Save reminder
                </button>
              </div>
            </div>
          ) : null}

          <div className="item-grid">
            <ContactCard personId={personId} email={email} phone={phone} discovered={discovered} fieldDefs={fieldDefs} values={fieldValues} />
            {items.map((item) => (
              <div key={item.id} draggable onDragStart={() => onDragStart(item.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDropOn(item.id)}>
                <ItemCard item={item} selected={selected === item.id} onSelect={() => setSelected(item.id)} draggableProps={{}} />
              </div>
            ))}
          </div>
        </div>

        <div className="rail">
          <div className="rail-cap">Inspector</div>
          {selectedItem ? (
            <div className="item">
              <div className="item-label">{labelFor(selectedItem.type)}</div>
              <div className="item-row">
                <span className="cap">Added</span>
                <span>{new Date(selectedItem.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="item-row">
                <span className="cap">Updated</span>
                <span>{new Date(selectedItem.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
              <button type="button" className="item-addfield" style={{ color: 'var(--color-neutral-600)' }} onClick={() => deleteItem(selectedItem.id)}>
                Delete item
              </button>
            </div>
          ) : (
            <span className="help-text">Click a card to inspect</span>
          )}
        </div>
      </div>

      <div
        className="trash-fab"
        data-dragover={dragOverTrash}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverTrash(true);
        }}
        onDragLeave={() => setDragOverTrash(false)}
        onDrop={onDropOnTrash}
      >
        <Link href="/trash" title="Click to open Trash · drag an item here to delete it" style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          {'\u{1F5D1}️'}
        </Link>
      </div>
      {busy ? <div className="help-text" style={{ position: 'fixed', bottom: 16, right: 16 }}>Uploading…</div> : null}
    </div>
  );
}

function labelFor(type: string) {
  switch (type) {
    case 'note':
      return 'Note';
    case 'photo':
      return 'Photo';
    case 'eml':
      return '.eml';
    case 'reminder':
      return 'Reminder';
    case 'link':
      return 'Link';
    default:
      return 'File';
  }
}
