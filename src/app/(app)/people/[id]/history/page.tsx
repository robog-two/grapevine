import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePageUser } from '@/lib/session';
import { getPerson } from '@/lib/repo/people';
import { listTimeline } from '@/lib/repo/timeline';
import { iconSrc } from '@/lib/icons';
import { TimelineScrubber } from '@/components/TimelineScrubber';

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  const person = await getPerson(user, id);
  if (!person) notFound();
  const entries = await listTimeline(user, id);
  const chronological = [...entries].reverse();

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-3)' }}>
        <div className="avatar">
          <img src={iconSrc(person.iconKey)} alt="" />
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17 }}>{person.name} — History</div>
      </div>
      <TimelineScrubber
        personId={id}
        entries={chronological.map((e) => ({ id: e.id, changeType: e.changeType, label: e.label, snapshot: e.snapshot, createdAt: e.createdAt.toISOString() }))}
      />
      <Link href={`/people/${id}`} style={{ fontSize: 12, color: 'var(--color-neutral-600)', display: 'block', marginTop: 10 }}>
        ← back to Person Folder
      </Link>
    </div>
  );
}
