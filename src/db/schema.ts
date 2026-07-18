import {
  pgTable,
  uuid,
  text,
  timestamp,
  doublePrecision,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
  check,
  pgView,
} from 'drizzle-orm/pg-core';
import { sql, eq, isNull, isNotNull } from 'drizzle-orm';

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
 *
 * Normalization model (migration 0003):
 * The schema is kept in third normal form. Each `Enc` blob counts as a single
 * atomic value from the database's point of view — Postgres cannot look inside
 * ciphertext, so splitting one blob across rows/columns would only add per-blob
 * IV+tag overhead without making anything queryable (1NF). Junction tables use
 * their natural composite key as the primary key instead of a surrogate id
 * (2NF). No table stores a fact that is derivable from another table through a
 * key — e.g. a reminder's person is its item's person, a mention's source
 * person is its source item's person, a timeline event's user is its person's
 * user (3NF). Where the UI needs those derived facts (calendar vs. person
 * canvas, spreadsheet vs. cabinet, graph, trash), it reads one of the views at
 * the bottom of this file, so every surface observes the same single stored row.
 */

export const itemTypeEnum = pgEnum('item_type', ['note', 'photo', 'file', 'eml', 'reminder', 'link']);
export const fieldTypeEnum = pgEnum('field_type', ['text', 'date', 'select', 'checkbox', 'link', 'currency']);
export const changeTypeEnum = pgEnum('change_type', ['created', 'updated', 'deleted', 'restored', 'merged']);

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

/**
 * Membership of a person in a cabinet, plus where their card sits on that
 * cabinet's canvas. The (person, cabinet) pair IS the identity of a
 * membership, so it is the primary key — a surrogate id would just restate
 * it (2NF).
 */
export const peopleCabinets = pgTable('people_cabinets', {
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  cabinetId: uuid('cabinet_id').notNull().references(() => cabinets.id, { onDelete: 'cascade' }),
  posX: doublePrecision('pos_x').notNull().default(0),
  posY: doublePrecision('pos_y').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.personId, t.cabinetId] }),
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

/** One value per (person, field) — that pair is the key (2NF). */
export const customFieldValues = pgTable('custom_field_values', {
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id').notNull().references(() => customFields.id, { onDelete: 'cascade' }),
  valueEnc: text('value_enc').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.personId, t.fieldId] }),
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

/**
 * Scheduling extension for items of type 'reminder' — strictly 1:1, so the
 * item id is the primary key. Everything else a reminder shows lives on the
 * item row it extends: the note text is part of `items.contentEnc` (its only
 * home — the calendar and the person canvas read the same blob via
 * `reminder_feed` / `items`), the person comes from `items.personId`, and the
 * iCal UID is derived from the item id in the `reminder_feed` view rather
 * than stored.
 */
export const reminders = pgTable('reminders', {
  itemId: uuid('item_id').primaryKey().references(() => items.id, { onDelete: 'cascade' }),
  /**
   * The instant the reminder is due, always stored as a UTC timestamp
   * (Postgres `timestamptz` normalizes to UTC internally regardless of
   * session timezone). The browser is responsible for converting to/from
   * the user's local time on the way in and out — see
   * src/lib/reminderTime.ts.
   */
  remindAt: timestamp('remind_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  remindAtIdx: index('reminders_remind_at_idx').on(t.remindAt),
}));

/**
 * An @mention edge from a note to a person. The source person is NOT stored:
 * it is the person who owns the source item, and lives only there
 * (items.personId) — the graph reads it through `mention_edges` (3NF).
 */
export const mentions = pgTable('mentions', {
  id: uuid('id').defaultRandom().primaryKey(),
  targetPersonId: uuid('target_person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  sourceItemId: uuid('source_item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  contextSnippetEnc: text('context_snippet_enc').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  sourceItemIdx: index('mentions_source_item_idx').on(t.sourceItemId),
  targetIdx: index('mentions_target_idx').on(t.targetPersonId),
}));

/**
 * The owning user is NOT stored here: an event belongs to a person and the
 * person belongs to a user (3NF) — reads go through `timeline_feed`, which
 * joins the user id back in for scoping.
 */
export const timelineEvents = pgTable('timeline_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  personId: uuid('person_id').notNull().references(() => people.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'set null' }),
  changeType: changeTypeEnum('change_type').notNull(),
  labelEnc: text('label_enc').notNull(),
  snapshotEnc: text('snapshot_enc').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  personIdx: index('timeline_person_idx').on(t.personId),
}));

export const caldavAccounts = pgTable('caldav_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  /**
   * One-way outbound sync target: reminders are PUT to this CalDAV
   * collection as they're created. Never read back from — the app remains
   * the source of truth, this is a mirror.
   */
  serverUrlEnc: text('server_url_enc').notNull(),
  accountEnc: text('account_enc').notNull(),
  passwordEnc: text('password_enc').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userIdx: uniqueIndex('caldav_accounts_user_idx').on(t.userId),
}));

/**
 * A share targets exactly one person or one cabinet (enforced by the CHECK).
 * The old `scope` enum column was derivable from which foreign key is set,
 * so it is not stored (3NF) — `share_link_details` computes it.
 */
export const shareLinks = pgTable('share_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  targetCheck: check('share_links_target_check', sql`(${t.personId} IS NULL) <> (${t.cabinetId} IS NULL)`),
}));

/* ------------------------------------------------------------------ *
 * Views — the read side.
 *
 * Different UI surfaces show the same stored facts in different shapes
 * (spreadsheet vs. person page, calendar vs. person canvas, cabinet canvas
 * vs. directory). Each shape is a view over the normalized tables above, so
 * a write through any surface is immediately visible to every other one —
 * there is no second copy to go stale. Views also re-derive the facts the
 * normalization pass removed from base tables (owning user, source person,
 * scope, iCal UID).
 * ------------------------------------------------------------------ */

/** Live (non-deleted) items with their owning user — person canvas, search. */
export const activeItems = pgView('active_items').as((qb) =>
  qb
    .select({
      id: items.id,
      personId: items.personId,
      userId: people.userId,
      type: items.type,
      posX: items.posX,
      posY: items.posY,
      sortIndex: items.sortIndex,
      contentEnc: items.contentEnc,
      blobUrl: items.blobUrl,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
    })
    .from(items)
    .innerJoin(people, eq(people.id, items.personId))
    .where(isNull(items.deletedAt)),
);

/** Soft-deleted items with the person's name attached — the trash page. */
export const trashedItems = pgView('trashed_items').as((qb) =>
  qb
    .select({
      id: items.id,
      personId: items.personId,
      userId: people.userId,
      type: items.type,
      contentEnc: items.contentEnc,
      personNameEnc: people.nameEnc,
      deletedAt: items.deletedAt,
    })
    .from(items)
    .innerJoin(people, eq(people.id, items.personId))
    .where(isNotNull(items.deletedAt)),
);

/**
 * The one definition of "a reminder that exists": its schedule row joined to
 * its live item (soft-deleting the item from the person canvas removes it
 * here too, so the calendar/iCal feed can never show a phantom) and to its
 * person. The calendar page and the iCal feed both read exactly this. The
 * note text arrives inside content_enc — the same blob the person canvas
 * renders — and the iCal UID is derived from the item id instead of stored.
 */
export const reminderFeed = pgView('reminder_feed').as((qb) =>
  qb
    .select({
      itemId: reminders.itemId,
      personId: items.personId,
      userId: people.userId,
      remindAt: reminders.remindAt,
      contentEnc: items.contentEnc,
      personNameEnc: people.nameEnc,
      icalUid: sql<string>`${reminders.itemId}::text || '@grapevine.app'`.as('ical_uid'),
    })
    .from(reminders)
    .innerJoin(items, eq(items.id, reminders.itemId))
    .innerJoin(people, eq(people.id, items.personId))
    .where(isNull(items.deletedAt)),
);

/**
 * Mention edges with the source person re-derived from the source item and
 * the owning user joined in — the relationship graph reads this directly.
 */
export const mentionEdges = pgView('mention_edges').as((qb) =>
  qb
    .select({
      id: mentions.id,
      sourceItemId: mentions.sourceItemId,
      sourcePersonId: sql<string>`${items.personId}`.as('source_person_id'),
      targetPersonId: mentions.targetPersonId,
      userId: people.userId,
      contextSnippetEnc: mentions.contextSnippetEnc,
    })
    .from(mentions)
    .innerJoin(items, eq(items.id, mentions.sourceItemId))
    .innerJoin(people, eq(people.id, items.personId))
    .where(isNull(items.deletedAt)),
);

/**
 * Cabinet membership joined to live people — the cabinet canvas and the
 * cabinet list's member counts share this, so both always agree on who is
 * "in" a cabinet (soft-deleted people are out everywhere at once).
 */
export const cabinetMembers = pgView('cabinet_members').as((qb) =>
  qb
    .select({
      cabinetId: peopleCabinets.cabinetId,
      personId: peopleCabinets.personId,
      userId: people.userId,
      nameEnc: people.nameEnc,
      iconKey: people.iconKey,
      posX: peopleCabinets.posX,
      posY: peopleCabinets.posY,
    })
    .from(peopleCabinets)
    .innerJoin(people, eq(people.id, peopleCabinets.personId))
    .where(isNull(people.deletedAt)),
);

/**
 * Live people, one row per (person, cabinet) membership with the cabinet's
 * name attached (people without a cabinet still appear, with NULLs) — the
 * spreadsheet/directory view.
 */
export const peopleDirectory = pgView('people_directory').as((qb) =>
  qb
    .select({
      id: people.id,
      userId: people.userId,
      nameEnc: people.nameEnc,
      iconKey: people.iconKey,
      createdAt: people.createdAt,
      updatedAt: people.updatedAt,
      cabinetId: peopleCabinets.cabinetId,
      cabinetNameEnc: sql<string | null>`${cabinets.nameEnc}`.as('cabinet_name_enc'),
    })
    .from(people)
    .leftJoin(peopleCabinets, eq(peopleCabinets.personId, people.id))
    .leftJoin(cabinets, eq(cabinets.id, peopleCabinets.cabinetId))
    .where(isNull(people.deletedAt)),
);

/** Timeline events with the owning user re-derived through the person. */
export const timelineFeed = pgView('timeline_feed').as((qb) =>
  qb
    .select({
      id: timelineEvents.id,
      personId: timelineEvents.personId,
      userId: people.userId,
      itemId: timelineEvents.itemId,
      changeType: timelineEvents.changeType,
      labelEnc: timelineEvents.labelEnc,
      snapshotEnc: timelineEvents.snapshotEnc,
      createdAt: timelineEvents.createdAt,
    })
    .from(timelineEvents)
    .innerJoin(people, eq(people.id, timelineEvents.personId)),
);

/** Share links with their scope derived from which target is set. */
export const shareLinkDetails = pgView('share_link_details').as((qb) =>
  qb
    .select({
      id: shareLinks.id,
      userId: shareLinks.userId,
      scope: sql<string>`case when ${shareLinks.personId} is not null then 'person' else 'cabinet' end`.as('scope'),
      personId: shareLinks.personId,
      cabinetId: shareLinks.cabinetId,
      token: shareLinks.token,
      snapshotEnc: shareLinks.snapshotEnc,
      revoked: shareLinks.revoked,
      createdAt: shareLinks.createdAt,
    })
    .from(shareLinks),
);
