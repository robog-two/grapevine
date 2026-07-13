import crypto from 'node:crypto';

/**
 * At-rest field encryption.
 *
 * Every user has a random 256-bit Data Encryption Key (DEK) generated once at
 * signup. The DEK is what actually encrypts/decrypts CRM content (names,
 * notes, custom field values, attachment contents, ...) with AES-256-GCM.
 *
 * The DEK is never stored in plaintext. It is "wrapped" (encrypted) with a
 * Key Encryption Key (KEK) derived from the user's password via scrypt, and
 * the wrapped DEK + scrypt salt are what live in the `users` table. On login,
 * the server re-derives the KEK from the submitted password, unwraps the DEK,
 * and holds the raw DEK only in the signed+encrypted session cookie
 * (see src/lib/session.ts) for the duration of the user's session — never on
 * disk. This lets the server decrypt content in-memory per-request (to run
 * search, build the relationship graph, render pages, etc.) while everything
 * at rest in Postgres remains ciphertext.
 */

const GCM_IV_LENGTH = 12;
const GCM_TAG_LENGTH = 16;
const SCRYPT_KEYLEN = 32;

export function randomSaltHex(bytes = 16): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/** Derives a 256-bit key-encryption-key from a password + salt via scrypt. */
export function deriveKek(password: string, saltHex: string): Buffer {
  return crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), SCRYPT_KEYLEN, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
}

export function generateDek(): Buffer {
  return crypto.randomBytes(32);
}

function aesGcmEncrypt(plaintext: Buffer, key: Buffer): string {
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

function aesGcmDecrypt(payloadB64: string, key: Buffer): Buffer {
  const payload = Buffer.from(payloadB64, 'base64');
  const iv = payload.subarray(0, GCM_IV_LENGTH);
  const tag = payload.subarray(GCM_IV_LENGTH, GCM_IV_LENGTH + GCM_TAG_LENGTH);
  const ciphertext = payload.subarray(GCM_IV_LENGTH + GCM_TAG_LENGTH);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** Wraps (encrypts) a raw DEK with a KEK for storage. */
export function wrapDek(dek: Buffer, kek: Buffer): string {
  return aesGcmEncrypt(dek, kek);
}

/** Unwraps (decrypts) a stored DEK using the KEK derived at login. */
export function unwrapDek(wrappedB64: string, kek: Buffer): Buffer {
  return aesGcmDecrypt(wrappedB64, kek);
}

export type Dek = Buffer;

export function dekToBase64(dek: Dek): string {
  return dek.toString('base64');
}

export function dekFromBase64(b64: string): Dek {
  return Buffer.from(b64, 'base64');
}

/** Encrypts a UTF-8 string field with the user's DEK. Returns null for null/undefined input. */
export function encryptField(plaintext: string | null | undefined, dek: Dek): string | null {
  if (plaintext === null || plaintext === undefined) return null;
  return aesGcmEncrypt(Buffer.from(plaintext, 'utf8'), dek);
}

/** Decrypts a field previously produced by encryptField. Returns null for null input. */
export function decryptField(ciphertextB64: string | null | undefined, dek: Dek): string | null {
  if (ciphertextB64 === null || ciphertextB64 === undefined) return null;
  return aesGcmDecrypt(ciphertextB64, dek).toString('utf8');
}

/** Encrypts a JSON-serializable value as a single field. */
export function encryptJSON(value: unknown, dek: Dek): string {
  return aesGcmEncrypt(Buffer.from(JSON.stringify(value), 'utf8'), dek);
}

/** Decrypts a field previously produced by encryptJSON. */
export function decryptJSON<T>(ciphertextB64: string, dek: Dek): T {
  return JSON.parse(aesGcmDecrypt(ciphertextB64, dek).toString('utf8')) as T;
}

/** Non-reversible random token for share links / iCal feed URLs (not encryption, just an opaque id). */
export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString('base64url');
}
