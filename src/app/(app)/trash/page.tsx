import Link from 'next/link';
import { requirePageUser } from '@/lib/session';
import { listTrash, labelForType } from '@/lib/repo/items';
import { restoreItemAction } from './actions';

export default async function TrashPage() {
  const user = await requirePageUser();
  const trash = await listTrash(user);

  return (
    <div>
      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20, marginBottom: 'var(--space-3)' }}>Trash</div>
      {trash.length === 0 ? (
        <p className="help-text">Nothing in the trash.</p>
      ) : (
        <table className="table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>Item</th>
              <th>From folder</th>
              <th>Deleted on</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {trash.map((t) => (
              <tr key={t.id}>
                <td>
                  {labelForType(t.type)} — &quot;{t.summary}&quot;
                </td>
                <td>
                  <Link href={`/people/${t.personId}`}>{t.personName}</Link>
                </td>
                <td className="cap">{new Date(t.deletedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                <td>
                  <form action={restoreItemAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className="btn btn-ghost" style={{ fontSize: 12 }}>
                      Restore
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
