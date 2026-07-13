import Link from 'next/link';
import { requirePageUser } from '@/lib/session';
import { listRecentPeople } from '@/lib/repo/people';
import { iconSrc } from '@/lib/icons';

export default async function HomePage() {
  const user = await requirePageUser();
  const recent = await listRecentPeople(user, 4);

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 'var(--space-3)' }}>Good {timeOfDayGreeting()}</h1>

      <div className="cap" style={{ marginBottom: 8 }}>
        Jump to
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', maxWidth: 520 }}
      >
        <Link href="/cabinets" className="tile">
          <span style={{ fontSize: 20 }}>{'\u{1F5C4}'}</span>
          <span style={{ fontSize: 12 }}>Cabinets</span>
        </Link>
        <Link href="/people" className="tile">
          <span style={{ fontSize: 20 }}>▦</span>
          <span style={{ fontSize: 12 }}>All People</span>
        </Link>
        <Link href="/calendar" className="tile">
          <span style={{ fontSize: 20 }}>{'\u{1F4C5}'}</span>
          <span style={{ fontSize: 12 }}>Calendar</span>
        </Link>
        <Link href="/search" className="tile">
          <span style={{ fontSize: 20 }}>{'\u{1F50D}'}</span>
          <span style={{ fontSize: 12 }}>Search</span>
        </Link>
      </div>

      <div className="cap" style={{ marginBottom: 8 }}>
        Recently opened people
      </div>
      {recent.length === 0 ? (
        <p className="help-text">Nothing yet — add your first person from a cabinet.</p>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          {recent.map((p) => (
            <Link key={p.id} href={`/people/${p.id}`} className="folder-link">
              <div className="folder-card" style={{ width: 110, height: 96 }}>
                <div className="avatar">
                  <img src={iconSrc(p.iconKey)} alt="" />
                </div>
                <div style={{ fontSize: 12, textAlign: 'center' }}>{p.name}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href="/calendar" className="btn btn-secondary">
          + Reminder
        </Link>
        <Link href="/import" className="btn btn-secondary">
          Import contacts
        </Link>
        <Link href="/cabinets" className="btn btn-primary">
          + New Cabinet
        </Link>
      </div>
    </div>
  );
}

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
