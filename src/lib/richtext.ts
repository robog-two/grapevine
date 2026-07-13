/**
 * A small, dependency-free rich-text format for notes.
 *
 * Inline tokens:
 *   **bold**
 *   *italic*
 *   [[Label|person:<personId>]]   — an @mention, resolved to a person at insert time
 *   [[Label|date:2026-07-24]]     — an inline date (optionally tied to a reminder)
 *   [[Label|link:https://...]]    — an inline link
 *
 * The editor (src/components/NoteEditor.tsx) inserts these tokens directly
 * when the user picks something from the @ or / menus, so no fuzzy
 * name-matching is needed when parsing — the ids are already resolved.
 */

export type NoteToken =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'italic'; text: string }
  | { kind: 'mention'; label: string; personId: string }
  | { kind: 'date'; label: string; date: string }
  | { kind: 'link'; label: string; url: string };

const TOKEN_RE = /\*\*(.+?)\*\*|\*(.+?)\*|\[\[(.+?)\|(person|date|link):(.+?)\]\]/g;

export function parseNote(source: string): NoteToken[] {
  const tokens: NoteToken[] = [];
  let lastIndex = 0;
  for (const match of source.matchAll(TOKEN_RE)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) tokens.push({ kind: 'text', text: source.slice(lastIndex, idx) });
    const [full, bold, italic, label, type, value] = match;
    if (bold !== undefined) tokens.push({ kind: 'bold', text: bold });
    else if (italic !== undefined) tokens.push({ kind: 'italic', text: italic });
    else if (type === 'person') tokens.push({ kind: 'mention', label, personId: value });
    else if (type === 'date') tokens.push({ kind: 'date', label, date: value });
    else if (type === 'link') tokens.push({ kind: 'link', label, url: value });
    lastIndex = idx + full.length;
  }
  if (lastIndex < source.length) tokens.push({ kind: 'text', text: source.slice(lastIndex) });
  return tokens;
}

/** Extracts every @mention token's target person id, deduped, with a short context snippet. */
export function extractMentions(source: string): { personId: string; label: string; context: string }[] {
  const out: { personId: string; label: string; context: string }[] = [];
  for (const match of source.matchAll(/\[\[(.+?)\|person:(.+?)\]\]/g)) {
    const [, label, personId] = match;
    const idx = match.index ?? 0;
    const start = Math.max(0, idx - 40);
    const end = Math.min(source.length, idx + match[0].length + 40);
    const context = plainText(source.slice(start, end));
    out.push({ personId, label, context });
  }
  return out;
}

/** Strips all markup down to plain readable text, for search indexing and previews. */
export function plainText(source: string): string {
  return parseNote(source)
    .map((t) => {
      switch (t.kind) {
        case 'text':
          return t.text;
        case 'bold':
        case 'italic':
          return t.text;
        case 'mention':
          return `@${t.label}`;
        case 'date':
          return t.label;
        case 'link':
          return t.label;
        default:
          return '';
      }
    })
    .join('');
}
