/** Minimal vCard (2.1/3.0/4.0) reader/writer — covers FN, EMAIL, TEL, NOTE, common Contacts-app exports. */

export interface VCardPerson {
  name: string;
  email?: string;
  phone?: string;
  discovered?: string;
}

export function parseVCard(text: string): VCardPerson[] {
  const cards = text.split(/BEGIN:VCARD/i).slice(1);
  const people: VCardPerson[] = [];
  for (const card of cards) {
    const lines = card.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let name = '';
    let email: string | undefined;
    let phone: string | undefined;
    let note: string | undefined;
    for (const line of lines) {
      const [rawKey, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      const key = rawKey.split(';')[0].toUpperCase();
      if (key === 'FN' && !name) name = value;
      else if (key === 'N' && !name) name = value.split(';').filter(Boolean).reverse().join(' ');
      else if (key === 'EMAIL' && !email) email = value;
      else if (key === 'TEL' && !phone) phone = value;
      else if (key === 'NOTE' && !note) note = value;
    }
    if (name) people.push({ name, email, phone, discovered: note });
  }
  return people;
}

export function buildVCard(people: VCardPerson[]): string {
  return people
    .map((p) =>
      [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${p.name}`,
        p.email ? `EMAIL:${p.email}` : '',
        p.phone ? `TEL:${p.phone}` : '',
        p.discovered ? `NOTE:${p.discovered}` : '',
        'END:VCARD',
      ]
        .filter(Boolean)
        .join('\r\n'),
    )
    .join('\r\n');
}
