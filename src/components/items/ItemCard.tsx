'use client';

import { NoteView } from '@/components/NoteView';
import type { ItemContent, ItemType } from '@/lib/repo/types';

export interface ItemCardData {
  id: string;
  type: ItemType;
  content: ItemContent;
  blobUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const TIME_LABEL: Record<string, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };

export function ItemCard({
  item,
  selected,
  onSelect,
  draggableProps,
}: {
  item: ItemCardData;
  selected: boolean;
  onSelect: () => void;
  draggableProps: React.HTMLAttributes<HTMLDivElement>;
}) {
  const content = item.content;

  if (content.type === 'link') {
    return (
      <div
        className="item item-link item-grid-full"
        onClick={onSelect}
        style={{ outline: selected ? '2px solid var(--color-text)' : 'none' }}
        {...draggableProps}
      >
        <div className="drag-handle" style={{ left: 8, top: 8, zIndex: 1 }}>
          {'⠷⠷⠷'}
        </div>
        <a className="item-link-thumb" href={content.url} target="_blank" rel="noreferrer" style={{ display: 'block' }} />
        <div className="item-link-body">
          <div style={{ fontSize: 12, fontWeight: 600 }}>{content.title}</div>
          <div className="cap">{safeHost(content.url)}</div>
        </div>
      </div>
    );
  }

  if (content.type === 'note') {
    return (
      <div
        className="item item-note item-grid-full"
        onClick={onSelect}
        style={{ outline: selected ? '2px solid var(--color-text)' : 'none' }}
        {...draggableProps}
      >
        <div className="drag-handle">{'⠷⠷⠷'}</div>
        <div className="item-label">Note</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
          <NoteView text={content.text} />
        </div>
      </div>
    );
  }

  if (content.type === 'photo') {
    return (
      <div
        className="item item-photo"
        onClick={onSelect}
        style={{ outline: selected ? '2px solid var(--color-text)' : 'none', position: 'relative' }}
        {...draggableProps}
      >
        <div className="drag-handle" style={{ color: 'var(--color-neutral-600)' }}>
          {'⠷⠷⠷'}
        </div>
        {item.blobUrl ? <img src={item.blobUrl} alt={content.caption ?? ''} /> : null}
        {content.caption ? (
          <div className="cap" style={{ position: 'relative', zIndex: 1, background: '#fff', padding: '2px 6px' }}>
            {content.caption}
          </div>
        ) : null}
      </div>
    );
  }

  if (content.type === 'eml') {
    return (
      <div className="item item-eml" onClick={onSelect} style={{ outline: selected ? '2px solid var(--color-text)' : 'none' }} {...draggableProps}>
        <div className="drag-handle">{'⠷⠷⠷'}</div>
        <div className="item-label">.eml</div>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{content.subject}</div>
        <div className="cap" style={{ marginTop: 4 }}>
          from: {content.from} · {new Date(content.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      </div>
    );
  }

  if (content.type === 'reminder') {
    return (
      <div className="item item-reminder" onClick={onSelect} style={{ outline: selected ? '2px solid var(--color-text)' : 'none' }} {...draggableProps}>
        <div className="drag-handle">{'⠷⠷⠷'}</div>
        <div style={{ fontSize: 13 }}>
          {'\u{1F4C5}'} {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
        {content.note ? <div style={{ fontSize: 12, marginTop: 4 }}>{content.note}</div> : null}
      </div>
    );
  }

  // file
  return (
    <div className="item item-file" onClick={onSelect} style={{ outline: selected ? '2px solid var(--color-text)' : 'none' }} {...draggableProps}>
      <div className="drag-handle">{'⠷⠷⠷'}</div>
      <div className="item-label">File</div>
      <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>{content.filename}</div>
      {item.blobUrl ? (
        <a href={item.blobUrl} target="_blank" rel="noreferrer" className="cap" style={{ display: 'block', marginTop: 4 }}>
          Download
        </a>
      ) : null}
    </div>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
