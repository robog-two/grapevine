import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-4)' }}>
      <div style={{ width: 360, maxWidth: '100%' }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>{'\u{1F5C4}'}</div>
        <h1 style={{ fontSize: 24, marginBottom: 'var(--space-1)' }}>Sign in</h1>
        <p className="help-text" style={{ marginBottom: 'var(--space-4)' }}>
          Welcome back to your cabinet.
        </p>
        <AuthForm mode="login" />
        <p style={{ marginTop: 'var(--space-3)', fontSize: 13 }}>
          No account yet? <Link href="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
