import Link from 'next/link';
import { requirePageUser } from '@/lib/session';
import { listCabinets } from '@/lib/repo/cabinets';
import { createCabinetAction, deleteCabinetAction } from './actions';

export default async function CabinetsPage() {
  const user = await requirePageUser();
  const cabinetList = await listCabinets(user);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 24 }}>Cabinets</h1>
        <form action={createCabinetAction} style={{ display: 'flex', gap: 8 }}>
          <input name="name" className="input" placeholder="New cabinet name" style={{ width: 200 }} required />
          <button type="submit" className="btn btn-primary">
            + New Cabinet
          </button>
        </form>
      </div>

      <span className="help-text" style={{ display: 'block', marginBottom: 'var(--space-3)' }}>
        Many-to-many — a person can sit in several cabinets at once.
      </span>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
        <Link href="/people" className="folder-link">
          <div className="folder-card" style={{ height: 120 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 16 }}>All People</div>
            <div className="cap">everyone</div>
          </div>
        </Link>
        {cabinetList.map((c) => (
          <div key={c.id} style={{ position: 'relative' }}>
            <Link href={`/cabinets/${c.id}`} className="folder-link">
              <div className="folder-card" style={{ height: 120 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 16 }}>{c.name}</div>
                <div className="cap">{c.personCount} people</div>
              </div>
            </Link>
            <form action={deleteCabinetAction} style={{ position: 'absolute', top: 6, right: 6 }}>
              <input type="hidden" name="id" value={c.id} />
              <button type="submit" className="btn btn-ghost" style={{ fontSize: 11 }} aria-label={`Delete ${c.name}`}>
                ✕
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
