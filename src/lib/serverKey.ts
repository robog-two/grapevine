import crypto from 'node:crypto';

/**
 * Server master key used only to support the one background feature that
 * has no logged-in user attached to the request: the per-user iCal feed
 * that a calendar app polls on its own schedule (see src/app/api/ical).
 * Every other feature decrypts using the DEK carried in the user's session
 * instead (see src/lib/session.ts) — this key is deliberately used as
 * little as possible.
 */
export function getServerMasterKey(): Buffer {
  const raw = process.env.SERVER_MASTER_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SERVER_MASTER_KEY must be set in production (32 random bytes, base64). See .env.example.');
    }
    // Deterministic dev-only fallback so `npm run dev` works without extra setup.
    return crypto.createHash('sha256').update('dev-only-insecure-server-master-key').digest();
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('SERVER_MASTER_KEY must decode to exactly 32 bytes (base64).');
  }
  return key;
}
