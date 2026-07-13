import { requirePageUser } from '@/lib/session';
import { ImportClient } from '@/components/ImportClient';

export default async function ImportPage() {
  await requirePageUser();
  return (
    <div>
      <ImportClient />
      <div className="hr" style={{ maxWidth: 480 }} />
      <div style={{ maxWidth: 480 }}>
        <div className="cap" style={{ marginBottom: 8 }}>
          Export
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn btn-secondary" href="/api/export?format=csv">
            Export CSV
          </a>
          <a className="btn btn-secondary" href="/api/export?format=vcard">
            Export vCard
          </a>
        </div>
      </div>
    </div>
  );
}
