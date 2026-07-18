import Link from 'next/link';
import { requirePageUser } from '@/lib/session';
import { listCustomFields } from '@/lib/repo/customFields';
import { getCaldavAccount } from '@/lib/repo/caldav';
import { NewFieldForm } from '@/components/NewFieldForm';
import { createCustomFieldAction, deleteCustomFieldAction } from './actions';

const TYPE_LABEL: Record<string, string> = {
  text: 'Text',
  date: 'Date',
  select: 'Dropdown',
  checkbox: 'Checkbox',
  link: 'Link',
  currency: 'Currency',
};

export default async function CustomFieldsPage() {
  const user = await requirePageUser();
  const [fields, caldavAccount] = await Promise.all([listCustomFields(user), getCaldavAccount(user)]);

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 20, marginBottom: 'var(--space-3)' }}>Custom fields</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--space-3)' }}>
        {fields.length === 0 ? <span className="help-text">No custom fields yet.</span> : null}
        {fields.map((f) => (
          <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-divider)' }}>
            <span>{f.name}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="tag tag-neutral">{TYPE_LABEL[f.type]}</span>
              <form action={deleteCustomFieldAction}>
                <input type="hidden" name="id" value={f.id} />
                <button type="submit" className="btn btn-ghost" style={{ fontSize: 11 }}>
                  Remove
                </button>
              </form>
            </span>
          </div>
        ))}
      </div>
      <NewFieldForm action={createCustomFieldAction} />

      <div className="hr" />

      <div className="cap" style={{ marginBottom: 8 }}>
        Connected accounts
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
        <span>CalDAV calendar</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="cap">{caldavAccount ? `Connected — ${caldavAccount.account}` : 'Not connected'}</span>
          <Link href="/settings/caldav" className="btn btn-secondary" style={{ fontSize: 12 }}>
            {caldavAccount ? 'Manage' : 'Connect'}
          </Link>
        </span>
      </div>
    </div>
  );
}
