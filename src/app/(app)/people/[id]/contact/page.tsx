import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePageUser } from '@/lib/session';
import { getPerson } from '@/lib/repo/people';
import { listCustomFields, getCustomFieldValues } from '@/lib/repo/customFields';
import { iconSrc } from '@/lib/icons';
import { ContactCard } from '@/components/ContactCard';

export default async function ContactCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser();
  const person = await getPerson(user, id);
  if (!person) notFound();
  const [fieldDefs, values] = await Promise.all([listCustomFields(user), getCustomFieldValues(user, id)]);

  return (
    <div style={{ maxWidth: 420 }}>
      <Link href={`/people/${id}`} style={{ fontSize: 12, color: 'var(--color-neutral-600)', display: 'block', marginBottom: 8 }}>
        ← back to Person Folder
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-3)' }}>
        <div className="avatar">
          <img src={iconSrc(person.iconKey)} alt="" />
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 18 }}>{person.name}</div>
      </div>
      <ContactCard personId={id} email={person.email} phone={person.phone} discovered={person.discovered} fieldDefs={fieldDefs} values={values} />
      <span className="help-text" style={{ marginTop: 10, display: 'block' }}>
        These fields become spreadsheet columns in All People.
      </span>
    </div>
  );
}
