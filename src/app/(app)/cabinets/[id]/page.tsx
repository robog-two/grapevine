import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePageUser } from '@/lib/session';
import { getCabinet, listPeopleInCabinet } from '@/lib/repo/cabinets';
import { CabinetCanvas } from '@/components/CabinetCanvas';
import { createPersonAction } from '../actions';

export default async function CabinetViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  const cabinet = await getCabinet(user, id);
  if (!cabinet) notFound();
  const peopleList = await listPeopleInCabinet(user, id);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <Link href="/cabinets" style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>
            Cabinets ›
          </Link>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20 }}>{cabinet.name}</div>
        </div>
        <span className="cap">{peopleList.length} people</span>
      </div>

      <CabinetCanvas cabinetId={id} people={peopleList} />

      <div style={{ marginTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span className="help-text">drag any folder to arrange it · click to open the Person Folder</span>
        <form action={createPersonAction} style={{ display: 'flex', gap: 8 }}>
          <input type="hidden" name="cabinetId" value={id} />
          <input name="name" className="input" placeholder="New person's name" style={{ width: 180 }} required />
          <button type="submit" className="btn btn-primary">
            + Add person
          </button>
        </form>
      </div>
    </div>
  );
}
