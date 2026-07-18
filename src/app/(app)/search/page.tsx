import Link from 'next/link';
import { requirePageUser } from '@/lib/session';
import { searchAll } from '@/lib/repo/search';
import { iconSrc } from '@/lib/icons';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requirePageUser();
  const { q } = await searchParams;
  const query = q ?? '';
  const hits = query ? await searchAll(user, query) : [];

  const grouped = new Map<string, { name: string; iconKey: string; hits: typeof hits }>();
  for (const h of hits) {
    if (!grouped.has(h.personId)) grouped.set(h.personId, { name: h.personName, iconKey: h.iconKey, hits: [] });
    grouped.get(h.personId)!.hits.push(h);
  }

  return (
    <div>
      <form style={{ marginBottom: 'var(--space-3)' }}>
        <input className="input" name="q" defaultValue={query} placeholder={'\u{1F50D}  Search names, notes, fields, .eml…'} autoFocus />
      </form>

      {query && grouped.size === 0 ? <p className="help-text">No results for &quot;{query}&quot;.</p> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {Array.from(grouped.entries()).map(([personId, group]) => (
          <div key={personId}>
            <Link href={`/people/${personId}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, textDecoration: 'none', color: 'inherit' }}>
              <div className="avatar" style={{ width: 26, height: 26 }}>
                <img src={iconSrc(group.iconKey)} alt="" />
              </div>
              <b style={{ fontFamily: 'var(--font-heading)' }}>{group.name}</b>
            </Link>
            {group.hits.map((h, i) => (
              <div key={i} className="item-row" style={{ border: 'none' }}>
                <span className="cap">{h.matchLabel}</span>
                <span>{h.snippet}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
