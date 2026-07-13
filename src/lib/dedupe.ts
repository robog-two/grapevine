/** Fuzzy duplicate detection for import + periodic checks: name/email/phone match. */

function normalize(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

function digitsOnly(s: string | null | undefined): string {
  return (s ?? '').replace(/\D/g, '');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export interface DedupeCandidate {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export function findDuplicate<T extends DedupeCandidate>(incoming: { name: string; email?: string; phone?: string }, existing: T[]): { match: T; reason: string } | null {
  const iEmail = normalize(incoming.email);
  const iPhone = digitsOnly(incoming.phone);
  const iName = normalize(incoming.name);

  for (const candidate of existing) {
    if (iEmail && normalize(candidate.email) === iEmail) return { match: candidate, reason: 'email' };
    if (iPhone.length >= 7 && digitsOnly(candidate.phone) === iPhone) return { match: candidate, reason: 'phone' };
  }
  for (const candidate of existing) {
    const cName = normalize(candidate.name);
    if (!cName || !iName) continue;
    if (cName === iName) return { match: candidate, reason: 'name' };
    if (Math.max(cName.length, iName.length) > 4 && levenshtein(cName, iName) <= 2) return { match: candidate, reason: 'name (fuzzy)' };
  }
  return null;
}
