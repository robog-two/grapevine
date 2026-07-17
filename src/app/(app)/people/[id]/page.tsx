import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePageUser } from '@/lib/session';
import { getPerson, listAllPeople } from '@/lib/repo/people';
import { listItems } from '@/lib/repo/items';
import { listCustomFields, getCustomFieldValues } from '@/lib/repo/customFields';
import { listShareLinksForPerson } from '@/lib/repo/share';
import { listCabinets } from '@/lib/repo/cabinets';
import { iconSrc } from '@/lib/icons';
import { PersonCanvas } from '@/components/PersonCanvas';
import { ShareDialog } from '@/components/ShareDialog';
import { CabinetPicker } from '@/components/CabinetPicker';
import { createShareLinkAction, revokeShareLinkAction, addPersonToCabinetAction, removePersonFromCabinetAction } from './actions';

export default async function PersonFolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  const person = await getPerson(user, id);
  if (!person) notFound();

  const [items, fieldDefs, fieldValues, shareLinks, allPeople, allCabinets] = await Promise.all([
    listItems(user, id),
    listCustomFields(user),
    getCustomFieldValues(user, id),
    listShareLinksForPerson(user, id),
    listAllPeople(user),
    listCabinets(user),
  ]);

  const primaryCabinet = person.cabinets[0];

  return (
    <div style={{ position: 'relative' }}>
      <div className="breadcrumbs">
        <Link href="/cabinets">Cabinets</Link>
        &nbsp;›&nbsp;
        {primaryCabinet ? (
          <>
            <Link href={`/cabinets/${primaryCabinet.id}`}>{primaryCabinet.name}</Link>
            &nbsp;›&nbsp;
          </>
        ) : null}
        {person.name}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {person.cabinets.map((c) => (
          <Link key={c.id} href={`/cabinets/${c.id}`} className="tag tag-outline">
            {c.name}
          </Link>
        ))}
        <CabinetPicker
          personId={id}
          allCabinets={allCabinets.map((c) => ({ id: c.id, name: c.name }))}
          memberCabinetIds={person.cabinets.map((c) => c.id)}
          onAdd={addPersonToCabinetAction}
          onRemove={removePersonFromCabinetAction}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div className="avatar avatar-lg">
          <img src={iconSrc(person.iconKey)} alt="" />
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22 }}>{person.name}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <ShareDialog
            personId={id}
            personName={person.name}
            initialLinks={shareLinks}
            onCreate={createShareLinkAction}
            onRevoke={revokeShareLinkAction}
          />
          <Link href={`/people/${id}/history`} className="btn btn-secondary">
            History
          </Link>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-2)' }}>
        <PersonCanvas
          personId={id}
          initialItems={items.map((i) => ({
            id: i.id,
            type: i.type,
            content: i.content,
            blobUrl: i.blobUrl,
            createdAt: i.createdAt.toISOString(),
            updatedAt: i.updatedAt.toISOString(),
          }))}
          email={person.email}
          phone={person.phone}
          discovered={person.discovered}
          fieldDefs={fieldDefs}
          fieldValues={fieldValues}
          people={allPeople.filter((p) => p.id !== id).map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>
    </div>
  );
}
