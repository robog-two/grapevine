# Database normalization (3NF) and the view layer

Migration `0003_normalize_3nf_views` brings the schema to third normal form and
adds a set of Postgres views so that every UI surface that shows the same fact
reads the same stored row. This document walks the schema through each normal
form and then describes the views.

A note on scope: every `*_enc` column is an AES-256-GCM ciphertext blob that
Postgres cannot look inside. From the relational model's point of view each
blob is a single **atomic** value — splitting one across rows or columns would
add per-blob IV+tag overhead (more space, not less) without making anything
queryable. Normalization below therefore applies to the *structure* the
database can see: keys, foreign keys, plaintext scheduling/ordering columns,
and which table each encrypted fact lives in.

## First normal form — atomic values, and one home per fact

1NF requires atomic column values and no repeating groups. Structurally the
schema was already flat, but one fact was stored **twice**, which is the
practical failure 1NF exists to prevent:

- **A reminder's note text** lived both inside the reminder item's
  `items.content_enc` blob (rendered by the person canvas) *and* in
  `reminders.note_enc` (rendered by the calendar and the iCal feed). Editing
  the item through `PATCH /api/items/[id]` updated only the first copy, so the
  calendar could show a stale note forever.

**Fix:** `reminders.note_enc` is dropped. The note's only home is the item's
content blob; the calendar and iCal feed read it through the `reminder_feed`
view (below), so an edit made on the person canvas is immediately what every
other surface serves.

(`custom_fields.options_enc` holds an encrypted list, but it is one ciphertext
— an atomic value to the DBMS — and its options are never addressed
individually by any query, so it stays.)

## Second normal form — no partial dependencies on a candidate key

2NF concerns tables whose candidate key is composite. Two junction tables had
a natural composite key but hid it behind a surrogate `id` plus a unique
index, which let the same membership be *addressed* two ways:

- **`people_cabinets`** — a membership *is* the `(person_id, cabinet_id)`
  pair; `pos_x`/`pos_y`/`created_at` depend on the whole pair. The pair is now
  the primary key; the surrogate `id` and the duplicate unique index are gone.
- **`custom_field_values`** — one value per `(person_id, field_id)`; same
  change. Writes now upsert against the composite key directly.

- **`reminders`** — strictly 1:1 with its item (`item_id` was unique), so
  `item_id` is now the primary key and the surrogate `id` is gone.

## Third normal form — no transitive dependencies

3NF forbids a non-key column that is determined by another non-key fact
reachable through a key. Every one of these was a second copy of something
another table already knew, and each was a place the app had to remember to
keep in sync (the merge code had a comment admitting it):

| Dropped column | Why it was transitive | Where it comes from now |
| --- | --- | --- |
| `reminders.person_id` | `item_id → items.person_id` | `reminder_feed` view |
| `reminders.ical_uid` | computed as `item_id ‖ '@grapevine.app'` | derived in `reminder_feed` |
| `mentions.source_person_id` | `source_item_id → items.person_id` | `mention_edges` view |
| `timeline_events.user_id` | `person_id → people.user_id` | `timeline_feed` view |
| `share_links.scope` | determined by which of `person_id` / `cabinet_id` is set | `share_link_details` view (a new CHECK enforces exactly one target; the `share_scope` enum type is dropped) |

Concrete payoff: merging two people used to require rewriting
`reminders.person_id` and `mentions.source_person_id` by hand. Now moving the
`items` rows is sufficient — reminders and outgoing mention edges derive their
person through the item, so there is no second copy to chase.

## The views

The UI shows the same data in different shapes: the spreadsheet directory vs.
the person page, the calendar vs. a reminder card on the person canvas, the
cabinet canvas vs. the cabinet list's member counts. Each shape is a view over
the normalized tables, so a write through any surface is visible to all of
them at once. Views are also where the derived facts removed above are
re-materialized (at query time, not on disk).

| View | Definition (informally) | Read by |
| --- | --- | --- |
| `active_items` | live items + owning user | person canvas, search |
| `trashed_items` | soft-deleted items + person name | trash page |
| `reminder_feed` | reminders ⋈ live item ⋈ person, with derived `ical_uid` | calendar page, iCal feed |
| `mention_edges` | mentions ⋈ source item ⋈ person (source person re-derived) | relationship graph |
| `cabinet_members` | memberships ⋈ live people | cabinet canvas, cabinet member counts |
| `people_directory` | live people × their cabinets (left join) | spreadsheet/directory view |
| `timeline_feed` | timeline events + owning user | person timeline |
| `share_link_details` | share links + derived `scope` | public share page |

`reminder_feed` in particular encodes the single definition of "a reminder
that exists": its schedule row joined to its **live** item. Soft-deleting the
reminder from the person folder removes it from the calendar and the iCal
feed in the same instant, because there is nothing else to delete.

Base tables remain the write path (views here are read-only projections), and
mutation helpers that must see soft-deleted rows (restore-from-trash) still
read the base `items` table directly.

## Migration notes

`0003_normalize_3nf_views.sql` is pure DDL — every dropped column was a
duplicate of data that survives elsewhere, so no data backfill is required:

1. Drop the redundant FKs/indexes and the surrogate `id` columns (each drop
   takes its old primary key with it), then install the new primary keys.
2. Drop the transitive columns listed above.
3. Add the `share_links` target CHECK, create the eight views, and drop the
   now-unused `share_scope` enum.

The reminder note is not lost by dropping `reminders.note_enc`: every code
path that ever wrote a reminder (`createReminder`) wrote the same note into
the item's content blob, which is the copy that is kept.
