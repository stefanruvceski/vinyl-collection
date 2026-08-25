# Vinyl Nation 💿

A site for keeping track of your vinyl record collection. Search for any
album, mark the ones you **own**, and when you're in a shop quickly check
whether a record is still missing from your collection — no manual data entry.

Album data is pulled automatically:

- **Discogs** — primary source (vinyl-specific database: format, label,
  catalog number, year, cover, tracklist).
- **MusicBrainz + Cover Art Archive** — fallback (works without a key).

The collection is stored **locally in the browser** (`localStorage`) for now —
no accounts, no database. This is an MVP to validate the idea.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- SEO: server-rendered `/album/...` pages, `generateMetadata`,
  JSON-LD (`schema.org/MusicAlbum`), `sitemap.xml`, `robots.txt`

## Running

```bash
npm install
cp .env.local.example .env.local   # fill in the values (see below)
npm run dev                         # http://localhost:3000
```

The app works **without any key** — in that case search uses MusicBrainz. For
better (vinyl-specific) results, add a free Discogs token.

### Discogs token (optional, recommended)

1. Sign in to Discogs → **Settings → Developers**
   (<https://www.discogs.com/settings/developers>).
2. Click **Generate new token**.
3. Add it to `.env.local`:

   ```
   DISCOGS_TOKEN=your_token_here
   ```

4. Restart `npm run dev`.

### Other env variables

| Variable | Description |
| --- | --- |
| `DISCOGS_TOKEN` | Discogs personal token (optional; without it MusicBrainz is used). |
| `MUSICBRAINZ_USER_AGENT` | MusicBrainz requires a descriptive User-Agent with a contact. |
| `NEXT_PUBLIC_SITE_URL` | Base site URL (for SEO metadata, sitemap, OG tags). |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional; enables sign-in + sync). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public, safe in the browser; RLS protects data). |

### Accounts & sync (optional, Supabase)

Sign-in is **optional** — without Supabase env vars the app runs in guest mode
and the collection stays in `localStorage`, exactly as before. With Supabase
configured, users sign in by **email one-time code** (no password) and their
collection syncs across devices. On first sign-in, any guest `localStorage`
collection is imported into the account once.

Set it up:

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste [`supabase/schema.sql`](supabase/schema.sql) → **Run**
   (creates the tables, Row Level Security, and a trigger that makes a `profiles`
   row for each new user).
3. **Authentication → Providers → Email**: enable it. To receive a **code**
   (not a magic link), edit **Authentication → Email Templates → Magic Link** and
   make sure the body includes the token, e.g. `Your code is {{ .Token }}`.
4. **Authentication → URL Configuration**: set the Site URL to your domain
   (e.g. `https://vinyl.ruvceski.com`) and add `http://localhost:3000` for local dev.
5. **Project Settings → API**: copy the **Project URL** and **anon public** key
   into `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (locally in
   `.env.local`, and in your Vercel project's environment variables), then redeploy.

The data model is documented in [`docs/DATABASE.md`](docs/DATABASE.md).

## How it works

1. As you type in the search box, after a ~325 ms pause (**debounce**, min. 3
   characters) a **single** request is sent; any in-flight request is
   cancelled (`AbortController`).
2. The server (a Next.js Route Handler) proxies the call to Discogs (the token
   stays secret, no CORS issues), normalizes the results, and falls back to
   MusicBrainz when needed.
3. Each result is cross-referenced against your collection and gets an
   **✅ In collection** badge if you already own it.
4. Clicking **➕ Add** saves the full album (with all the data from the API) to
   `localStorage`.
5. `/album/[source]/[id]` is a public, server-rendered page (indexable by
   Google), and the owned/not-owned button is a client-side layer on top of it.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` | Production build. |
| `npm run start` | Run the production build. |
| `npm run lint` | ESLint. |

## Structure

```
app/
  layout.tsx                     # root layout + global SEO metadata
  page.tsx                       # home (search)
  collection/page.tsx            # my collection (noindex)
  album/[source]/[id]/page.tsx   # SSR album detail + JSON-LD
  api/search/route.ts            # search (mode=suggest|full)
  api/album/[source]/[id]/route.ts
  sitemap.ts, robots.ts
components/                       # SearchBar, AlbumCard, CollectionButton, ...
lib/                             # discogs, musicbrainz, albums (fallback), hooks, types
```

## Next steps (beyond the MVP)

- Auth + a database (e.g. Postgres) so the collection isn't tied to a single
  browser.
- Public profile/collection pages → real SEO value (indexable collections).
- Deduplicate pressings via the Discogs "master" release.
```
