import crypto from 'node:crypto';

/**
 * Share links need to be viewable by an anonymous visitor with no session
 * and no password — but the underlying record is encrypted with the owner's
 * DEK. Rather than ever exposing the DEK, a share snapshot is re-encrypted
 * at share-creation time (while the owner IS logged in and the DEK is
 * available) with a fresh key derived from the token itself. Anyone with the
 * link can derive the same key from the token to view the snapshot; anyone
 * with only a database dump (no token) cannot.
 */
export function keyFromShareToken(token: string): Buffer {
  return crypto.createHash('sha256').update(`share:${token}`).digest();
}
