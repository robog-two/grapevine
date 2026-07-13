# Cabinet — a personal CRM

A relationship-management tool for individuals: a filing cabinet, a Rolodex, and a
spreadsheet, expressed as two synced views over one data model. Built from the
wireframes in `project/` and the design conversation in `chats/chat1.md` (kept
here for reference — see "Design source" below).

Every person is one record, viewable as:
- A **manila folder** in a **Cabinet** (freeform, draggable canvas)
- A **row** in **All People** (sortable/filterable spreadsheet, with a
  relationship graph derived from `@mentions`)

## Stack

- **Next.js 14** (App Router, TypeScript) — deployable on Vercel with zero extra config
- **Postgres** via [`postgres`](https://github.com/porsager/postgres) + **Drizzle ORM**
- **Vercel Blob** for photo/file/.eml attachment storage
- **iron-session** for the auth session cookie
- No CSS framework — a small hand-rolled design system in `src/app/globals.css`
  (serif headings, monochrome ink-on-white, hierarchy from spacing/weight
  rather than color, per the final round of the design conversation)

## Security model: encryption at rest

Every piece of personal content (names, notes, contact fields, custom field
values, attachment contents...) is encrypted at rest with **AES-256-GCM**
using a per-user **Data Encryption Key (DEK)**:

- At signup, a random 256-bit DEK is generated once.
- It's wrapped (encrypted) with a **Key Encryption Key (KEK)** derived from
  the user's password via `scrypt` — the password itself is never stored.
- At login, the server re-derives the KEK, unwraps the DEK, and holds the raw
  DEK only inside the signed + encrypted session cookie for that request —
  never on disk. This is what makes decryption "transparent" once logged in
  without a second passcode.
- Because the DEK is available for the duration of an authenticated request,
  the server can decrypt in-memory to build search results, the relationship
  graph, and page content — and re-encrypts (or simply never persists
  plaintext) once the request completes. See `src/db/schema.ts` and
  `src/lib/crypto.ts` for the full explanation.
- One feature has no logged-in user attached to it: the one-way **iCal feed**
  a calendar app polls on its own schedule. For that narrow case only, each
  user's DEK is *also* wrapped with a server-held master key
  (`SERVER_MASTER_KEY`), so the feed route can decrypt just enough to build
  event titles. Every other feature uses the session-derived DEK. See
  `src/lib/serverKey.ts`.
- Share links generate a **snapshot** at share-time (while the owner is
  logged in and the DEK is available), re-encrypted with a key derived from
  the link's own token — so an anonymous visitor can view it without ever
  needing the owner's password. See `src/lib/shareCrypto.ts`.

This is standard server-managed "encryption at rest" (protects data at the
storage layer; the application itself can still process it), not a
zero-knowledge/E2EE system — see the code comments in `src/db/schema.ts` for
the exact trade-off.

## Local development

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, SESSION_SECRET, SERVER_MASTER_KEY

npm run db:generate    # generate SQL migrations from src/db/schema.ts
npm run db:migrate     # apply them to DATABASE_URL

npm run db:seed        # optional: creates demo@example.com / demo-password-123
                        # with sample cabinets, people, notes, and a reminder

npm run dev            # http://localhost:3000
```

Generate secrets with `openssl rand -base64 32`.

You need a real Postgres instance for `DATABASE_URL` (Vercel Postgres, Neon,
Supabase, or a local `postgres` Docker container all work — any Postgres 14+).

For file uploads (photos/files/.eml) locally, set `BLOB_READ_WRITE_TOKEN` to
a token from a Vercel Blob store (Vercel dashboard → Storage → Blob → Create
→ copy the read/write token; `vercel env pull` also works if the project is
linked).

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel (Next.js is auto-detected;
   `vercel.json` just extends the default function timeout for import/export).
2. Add a Postgres database from the Vercel Storage tab (or bring your own via
   `DATABASE_URL`) and a Blob store, then set the environment variables from
   `.env.example` in the Vercel project settings.
3. Run migrations against the production database once
   (`DATABASE_URL=... npm run db:migrate`, or wire it into your deploy step).
4. Deploy. `APP_URL` should be set to your production domain (used to build
   absolute share links and the iCal feed URL).

## Feature map

| Wireframe screen(s) | Route(s) |
| --- | --- |
| 0a Home dashboard | `/` |
| 1a Cabinets index | `/cabinets` |
| 2a/2b Cabinet View canvas | `/cabinets/[id]` |
| 3a Person Folder canvas | `/people/[id]` |
| 4a Contact Card | `/people/[id]/contact` (also inline on the Person Folder) |
| 5a/5b All People spreadsheet | `/people` |
| 6a Relationship graph | `/graph` |
| 7a Reminders + Calendar | `/calendar` (feed at `/api/ical/[token]`) |
| 8a Timeline / History | `/people/[id]/history` |
| 9a Trash | `/trash` |
| 10a Custom fields | `/settings/fields` |
| 11a Global search | `/search` |
| 12a/12b Import + duplicate merge | `/import` |
| 13a Sharing | Share button on `/people/[id]`; public view at `/share/[token]` |
| 14a/14b Responsive mobile | CSS breakpoints in `globals.css` (bottom nav, single-column strip) |
| 15a/15b Rich text editor | `src/components/NoteEditor.tsx` / `NoteView.tsx` |

## Design source

`project/` and `chats/` are the original Claude Design handoff bundle (HTML/CSS
wireframes + the design conversation that shaped them) — kept for reference,
not part of the running app. `public/icons/*.svg` are the stock Noun Project
icons from that bundle (attribution embedded in each file), used to let
people visually differentiate folders per the product spec.
