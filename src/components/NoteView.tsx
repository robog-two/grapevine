import Link from 'next/link';
import { parseNote } from '@/lib/richtext';

export function NoteView({ text }: { text: string }) {
  const tokens = parseNote(text);
  return (
    <span>
      {tokens.map((t, i) => {
        switch (t.kind) {
          case 'text':
            return <span key={i}>{t.text}</span>;
          case 'bold':
            return <strong key={i}>{t.text}</strong>;
          case 'italic':
            return <em key={i}>{t.text}</em>;
          case 'mention':
            return (
              <Link key={i} href={`/people/${t.personId}`} className="mention">
                @{t.label}
              </Link>
            );
          case 'date':
            return (
              <Link key={i} href="/calendar" className="mention" style={{ fontWeight: 400 }}>
                {'\u{1F4C5}'} {t.label}
              </Link>
            );
          case 'link':
            return (
              <a key={i} href={t.url} target="_blank" rel="noreferrer">
                {t.label}
              </a>
            );
        }
      })}
    </span>
  );
}
