import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';

export default function SignupPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-4)' }}>
      <div style={{ width: 360, maxWidth: '100%' }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>{'\u{1F5C4}'}</div>
        <h1 style={{ fontSize: 24, marginBottom: 'var(--space-1)' }}>Create your cabinet</h1>
        <p className="help-text" style={{ marginBottom: 'var(--space-4)' }}>
          Everything you store is encrypted at rest with a key derived from your password.
        </p>
        <AuthForm mode="signup" />
        <p style={{ marginTop: 'var(--space-3)', fontSize: 13 }}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
