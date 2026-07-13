import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { requireSession } from '@/lib/session';
import { listAllPeople, getPerson, getCustomFieldValuesForUser } from '@/lib/repo/people';
import { listCustomFields } from '@/lib/repo/customFields';
import { buildVCard } from '@/lib/vcard';

export async function GET(req: NextRequest) {
  const user = await requireSession();
  const format = req.nextUrl.searchParams.get('format') === 'vcard' ? 'vcard' : 'csv';

  const people = await listAllPeople(user);
  const details = await Promise.all(people.map((p) => getPerson(user, p.id)));

  if (format === 'vcard') {
    const vcard = buildVCard(details.filter(Boolean).map((p) => ({ name: p!.name, email: p!.email ?? undefined, phone: p!.phone ?? undefined, discovered: p!.discovered ?? undefined })));
    return new NextResponse(vcard, {
      headers: { 'Content-Type': 'text/vcard; charset=utf-8', 'Content-Disposition': 'attachment; filename="contacts.vcf"' },
    });
  }

  const fieldDefs = await listCustomFields(user);
  const valuesMap = await getCustomFieldValuesForUser(user);

  const rows = details.filter(Boolean).map((p) => {
    const row: Record<string, string> = {
      Name: p!.name,
      Email: p!.email ?? '',
      Phone: p!.phone ?? '',
      Discovered: p!.discovered ?? '',
    };
    for (const f of fieldDefs) row[f.name] = valuesMap.get(p!.id)?.get(f.id) ?? '';
    return row;
  });

  const csv = Papa.unparse(rows);
  return new NextResponse(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="contacts.csv"' },
  });
}
