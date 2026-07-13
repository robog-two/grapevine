import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/session';
import { createPerson, listAllPeople, getPerson } from '@/lib/repo/people';
import { findDuplicate } from '@/lib/dedupe';

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json().catch(() => null);
  const incoming = body?.people as { name: string; email?: string; phone?: string; discovered?: string }[] | undefined;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: 'No rows to import' }, { status: 400 });
  }

  const existing = await listAllPeople(user);
  const existingWithContact = await Promise.all(existing.map((p) => getPerson(user, p.id)));
  const existingCandidates = existingWithContact.filter(Boolean).map((p) => ({ id: p!.id, name: p!.name, email: p!.email, phone: p!.phone }));

  const suggestions: { newId: string; newName: string; existingId: string; existingName: string; reason: string }[] = [];
  let createdCount = 0;

  for (const row of incoming) {
    if (!row.name?.trim()) continue;
    const newId = await createPerson(user, { name: row.name.trim(), email: row.email, phone: row.phone, discovered: row.discovered });
    createdCount += 1;
    const dup = findDuplicate(row, existingCandidates);
    if (dup) {
      suggestions.push({ newId, newName: row.name.trim(), existingId: dup.match.id, existingName: dup.match.name, reason: dup.reason });
    }
  }

  return NextResponse.json({ createdCount, suggestions });
}
