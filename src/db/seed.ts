import 'dotenv/config';
import { signupUser } from '../lib/auth';
import { createCabinet, addPersonToCabinet } from '../lib/repo/cabinets';
import { createPerson } from '../lib/repo/people';
import { createCustomField, setCustomFieldValue } from '../lib/repo/customFields';
import { createItem } from '../lib/repo/items';
import { createReminder } from '../lib/repo/reminders';
import type { AuthedUser } from '../lib/session';

async function main() {
  const email = process.env.SEED_EMAIL ?? 'demo@example.com';
  const password = process.env.SEED_PASSWORD ?? 'demo-password-123';

  const { userId, dek } = await signupUser(email, password);
  const user: AuthedUser = { userId, email, dek };
  console.log(`Created demo user ${email} / ${password}`);

  const startup = await createCabinet(user, 'Startup');
  const college = await createCabinet(user, 'College Professors');

  const fundSize = await createCustomField(user, 'Fund size', 'currency');
  const checkSize = await createCustomField(user, 'Check size', 'select', ['Seed', 'Series A', 'Series B']);

  const jordanId = await createPerson(user, {
    name: 'Jordan Alvarez',
    iconKey: 'noun-cat-8144321.svg',
    cabinetIds: [startup],
    email: 'jordan@northwind.vc',
    phone: '(415) 555-0148',
    discovered: 'Intro from Mina',
    position: { x: 24, y: 24 },
  });
  await setCustomFieldValue(user, jordanId, fundSize, '40000000');
  await setCustomFieldValue(user, jordanId, checkSize, 'Seed');

  const avaId = await createPerson(user, {
    name: 'Ava Kim',
    iconKey: 'noun-star-1607744.svg',
    cabinetIds: [startup],
    position: { x: 174, y: 24 },
  });

  const minaId = await createPerson(user, {
    name: 'Mina Okafor',
    iconKey: 'noun-fish-1585670.svg',
    cabinetIds: [startup],
    position: { x: 324, y: 24 },
  });

  await createPerson(user, {
    name: 'Riley Chen',
    iconKey: 'noun-dog-1567382.svg',
    cabinetIds: [college],
    position: { x: 24, y: 24 },
  });

  await createItem(user, jordanId, 'note', {
    type: 'note',
    text: `Met at the Series A demo day, introduced by [[Ava Kim|person:${avaId}]]. Follow up [[Fri Jul 24|date:2026-07-24]] about the term sheet.`,
  });
  await createItem(user, jordanId, 'link', { type: 'link', url: 'https://notion.so', title: 'Series A term sheet — Notion' });
  await createItem(user, jordanId, 'eml', {
    type: 'eml',
    from: 'mina@brightpath.io',
    subject: 're: Series A terms',
    date: new Date('2026-07-02').toISOString(),
    bodyText: 'Sounds good — sending the redline shortly.',
  });
  await createReminder(user, jordanId, '2026-07-24', 'morning', 'Follow up about the Series A intro');

  await createItem(user, minaId, 'note', { type: 'note', text: `Connected us — see [[Jordan Alvarez|person:${jordanId}]].` });

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
