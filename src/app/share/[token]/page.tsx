import { notFound } from 'next/navigation';
import { getPublicShareSnapshot } from '@/lib/repo/share';
import { iconSrc } from '@/lib/icons';

export default async function PublicSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const snapshot = await getPublicShareSnapshot(token);
  if (!snapshot) notFound();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: 'var(--space-6) var(--space-4)' }}>
      <div style={{ width: 460, maxWidth: '100%' }}>
        <div className="cap" style={{ marginBottom: 'var(--space-3)' }}>
          Read-only shared snapshot — no login required
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-4)' }}>
          <div className="avatar avatar-lg">
            <img src={iconSrc(snapshot.iconKey)} alt="" />
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22 }}>{snapshot.name}</div>
        </div>

        <div className="item item-grid-full" style={{ marginBottom: 'var(--space-3)' }}>
          <div className="item-label">Contact</div>
          {snapshot.email ? (
            <div className="item-row">
              <span className="cap">Email</span>
              <span>{snapshot.email}</span>
            </div>
          ) : null}
          {snapshot.phone ? (
            <div className="item-row">
              <span className="cap">Phone</span>
              <span>{snapshot.phone}</span>
            </div>
          ) : null}
          {snapshot.discovered ? (
            <div className="item-row" style={{ borderBottom: 'none' }}>
              <span className="cap">Discovered</span>
              <span>{snapshot.discovered}</span>
            </div>
          ) : null}
          {snapshot.customFields.map((f) => (
            <div key={f.name} className="item-row">
              <span className="cap">{f.name}</span>
              <span>{f.value}</span>
            </div>
          ))}
        </div>

        {snapshot.items.length > 0 ? (
          <>
            <div className="cap" style={{ marginBottom: 8 }}>
              Items
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {snapshot.items.map((i, idx) => (
                <div key={idx} className="item">
                  <div className="item-label">{i.type}</div>
                  <div style={{ fontSize: 13 }}>{i.summary}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <p className="help-text" style={{ marginTop: 'var(--space-4)' }}>
          Shared {new Date(snapshot.sharedAt).toLocaleDateString()} · this is a static snapshot, not a live view.
        </p>
      </div>
    </div>
  );
}
