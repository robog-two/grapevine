import {
  pgTable,
  uuid,
  text,
  timestamp,
  doublePrecision,
  boolean,
  pgEnum,
  date,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Encryption model (see src/lib/crypto.ts):
 * Every column suffixed `Enc` holds a base64 AES-256-GCM blob (iv + tag + ciphertext),
 * encrypted client-request-side with the signed-in user's Data Encryption Key (DEK).
 * The DEK itself never touches disk in plaintext: it is generated once at signup,
 * wrapped with a key derived from the user's password (scrypt), and unwrapped only
 * in-memory for the lifetime of a request (see src/lib/session.ts). Structural
 * columns (ids, foreign keys, enums, positions, dates used for sorting/scheduling)
 * are left in plaintext because they carry no personal content and must be
 * queryable/sortable by Postgres directly.
 */

export const itemTypeEnum = pgEnum('item_type', ['note', 'photo', 'file', 'eml', 'reminder', 'link']);
export const fieldTypeEnum = pgEnum('field_type', ['text', 'date', 'select', 'checkbox', 'link', 'currency']);
export const timeOfDayEnum = pgEnum('time_of_day', ['morning', 'afternoon', 'evening']);
export const changeTypeEnum = pgEnum('change_type', ['created', 'updated', 'deleted', 'restored', 'merged']);
export const shareScopeEnum = pgEnum('share_scope', ['person', 'cabinet']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  encSalt: text('enc_salt').notNull(),
  wrappedDek: text('wrapped_dek').notNull(),
  /**
   * The same DEK, wrapped a second time with a server-held master key
   * (SERVER_MASTER_KEY env var) instead of the password-derived KEK. This
   * lets a small set of background/anonymous features that cannot have a
   * live logged-in session — the one-way iCal feed a calendar app polls on
   * its own schedule — decrypt just enough to build that feed. Every other
   * feature (search, the relationship graph, page rendering) runs inside an
   * authenticated request and uses the password-derived DEK from the
   * session instead. See src/lib/serverKey.ts.
   */
  wrappedDekServer: text('wrapped_dek_server').notNull(),
  icalToken: text('ical_token').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  emailIdx: uniqueIndex('users_email_idx').on(t.email),
  icalTokenIdx: uniqueIndex('users_ical_token_idx').on(t.icalToken),
}));

export const cabinets = pgTable('cabinets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nameEnc: text('name_enc').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: index('cabinets_user_idx').on(t.userId),
}));

export const people = pgTable('people', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nameEnc: text('name_enc').notNull(),
  iconKey: text('icon_key').notNull(),
  emailEnc: text('email_enc'),
  phoneEnc: text('phone_enc'),
  discoveredEnc: text('discovered_enc'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  userIdx: index('people_user_idx').on(t.userId),
}));

export const peopleCabinets = pgTable('people_cabinets', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  cabinetId: uuid('cabinet_id').notNull().references(() => cabinets.id, { onDelete: 'cascade' }),
  posX: doublePrecision('pos_x').notNull().default(0),
  posY: doublePrecision('pos_y').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pairIdx: uniqueIndex('people_cabinets_pair_idx').on(t.personId, t.cabinetId),
  cabinetIdx: index('people_cabinets_cabinet_idx').on(t.cabinetId),
}));

export const customFields = pgTable('custom_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nameEnc: text('name_enc').notNull(),
  type: fieldTypeEnum('type').notNull(),
  optionsEnc: text('options_enc'),
  sortOrder: doublePrecision('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: index('custom_fields_user_idx').on(t.userId),
}));

export const customFieldValues = pgTable('custom_field_values', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id').notNull().references(() => customFields.id, { onDelete: 'cascade' }),
  valueEnc: text('value_enc').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pairIdx: uniqueIndex('custom_field_values_pair_idx').on(t.personId, t.fieldId),
}));

export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  type: itemTypeEnum('type').notNull(),
  posX: doublePrecision('pos_x').notNull().default(0),
  posY: doublePrecision('pos_y').notNull().default(0),
  sortIndex: doublePrecision('sort_index').notNull().default(0),
  contentEnc: text('content_enc').notNull(),
  blobUrl: text('blob_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (t) => ({
  personIdx: index('items_person_idx').on(t.personId),
  deletedIdx: index('items_deleted_idx').on(t.deletedAt),
}));

export const reminders = pgTable('reminders', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  date: date('date', { mode: 'string' }).notNull(),
  timeOfDay: timeOfDayEnum('time_of_day').notNull().default('morning'),
  noteEnc: text('note_enc'),
  icalUid: text('ical_uid').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  itemIdx: uniqueIndex('reminders_item_idx').on(t.itemId),
  dateIdx: index('reminders_date_idx').on(t.date),
}));

export const mentions = pgTable('mentions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourcePersonId: uuid('source_person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  targetPersonId: uuid('target_person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  sourceItemId: uuid('source_item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  contextSnippetEnc: text('context_snippet_enc').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  sourceIdx: index('mentions_source_idx').on(t.sourcePersonId),
  targetIdx: index('mentions_target_idx').on(t.targetPersonId),
}));

export const timelineEvents = pgTable('timeline_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'set null' }),
  changeType: changeTypeEnum('change_type').notNull(),
  labelEnc: text('label_enc').notNull(),
  snapshotEnc: text('snapshot_enc').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  personIdx: index('timeline_person_idx').on(t.personId),
}));

export const shareLinks = pgTable('share_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  scope: shareScopeEnum('scope').notNull(),
  personId: uuid('person_id').references(() => people.id, { onDelete: 'cascade' }),
  cabinetId: uuid('cabinet_id').references(() => cabinets.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  /**
   * A read-only snapshot taken at share-time, encrypted with a key derived
   * from the token itself (see src/lib/shareCrypto.ts) rather than the
   * owner's DEK — so an anonymous visitor holding the unguessable link can
   * view it without ever needing the owner's password or a live session,
   * while the snapshot still isn't stored as plaintext at rest.
   */
  snapshotEnc: text('snapshot_enc').notNull(),
  revoked: boolean('revoked').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  tokenIdx: uniqueIndex('share_links_token_idx').on(t.token),
}));
