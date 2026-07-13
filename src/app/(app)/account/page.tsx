import Link from 'next/link';
import { requirePageUser } from '@/lib/session';
import { LogoutButton } from '@/components/LogoutButton';

export default async function AccountPage() {
  const user = await requirePageUser();
  return (
    <div style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, marginBottom: 'var(--space-3)' }}>Account</h1>
      <div className="item" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="cap" style={{ marginBottom: 4 }}>
          Signed in as
        </div>
        <div style={{ fontSize: 15 }}>{user.email}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'var(--space-4)' }}>
        <Link href="/settings/fields" className="btn btn-secondary btn-block">
          Custom fields
        </Link>
        <Link href="/import" className="btn btn-secondary btn-block">
          Import / export
        </Link>
        <Link href="/trash" className="btn btn-secondary btn-block">
          Trash
        </Link>
      </div>
      <LogoutButton />
    </div>
  );
}
