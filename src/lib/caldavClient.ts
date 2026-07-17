import type { ReminderRecord } from '@/lib/repo/reminders';
import { buildIcsEvent } from '@/lib/ics';

/**
 * Talks to an external CalDAV server. Pure HTTP — no DB access, no
 * encryption concerns. Credentials are passed in already-decrypted and are
 * never logged.
 */

const REQUEST_TIMEOUT_MS = 5000;

export interface CaldavCredentials {
  serverUrl: string;
  account: string;
  password: string;
}

function authHeader(account: string, password: string): string {
  return 'Basic ' + Buffer.from(`${account}:${password}`).toString('base64');
}

function collectionUrl(serverUrl: string): string {
  return serverUrl.endsWith('/') ? serverUrl : `${serverUrl}/`;
}

/** Verifies the server is reachable and the credentials are accepted, without writing anything. */
export async function testCaldavConnection(creds: CaldavCredentials): Promise<{ ok: true } | { ok: false; error: string }> {
  let res: Response;
  try {
    res = await fetch(collectionUrl(creds.serverUrl), {
      method: 'PROPFIND',
      headers: {
        Authorization: authHeader(creds.account, creds.password),
        Depth: '0',
        'Content-Type': 'application/xml; charset=utf-8',
      },
      body: '<?xml version="1.0" encoding="utf-8" ?><D:propfind xmlns:D="DAV:"><D:prop><D:resourcetype/></D:prop></D:propfind>',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: "Couldn't reach that server URL." };
  }
  if (res.status === 401 || res.status === 403) return { ok: false, error: 'Check the server URL and credentials, then try again.' };
  if (!res.ok && res.status !== 207) return { ok: false, error: `Server responded with ${res.status}.` };
  return { ok: true };
}

/** Pushes (or overwrites) a single reminder as a CalDAV resource. One-way — never reads back. */
export async function pushReminderEvent(creds: CaldavCredentials, reminder: Pick<ReminderRecord, 'icalUid' | 'date' | 'timeOfDay' | 'personName' | 'note'>): Promise<void> {
  const url = `${collectionUrl(creds.serverUrl)}${encodeURIComponent(reminder.icalUid)}.ics`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: authHeader(creds.account, creds.password),
      'Content-Type': 'text/calendar; charset=utf-8',
    },
    body: buildIcsEvent(reminder),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`CalDAV PUT failed with ${res.status}`);
}
