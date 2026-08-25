# Database schema (planned — Supabase / Postgres)

**Status: implemented, env-gated.** When `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, signed-in users read/write their
collection here (with a one-time import of any guest `localStorage` data);
without those env vars the app runs in guest mode on `localStorage` exactly as
before. The runnable schema lives in [`supabase/schema.sql`](../supabase/schema.sql)
(this doc is the annotated version). Keep both in sync with the code — see
[Maintenance](#maintenance) at the bottom.

The shapes here mirror `lib/types.ts` (`Album`, `CollectionItem`) and the
`localStorage` key `vinyl-collection`.

---

## Overview

| Table | Purpose |
| --- | --- |
| `profiles` | One row per authenticated user (extends Supabase `auth.users`). |
| `albums` | Shared cache of album metadata fetched from Discogs / MusicBrainz. |
| `collection_items` | A user's owned records + purchase history metadata. |

- **Recommendations** and **artist pages** are *queries*, not tables (derived
  from `collection_items` + `albums`).
- **Genre / decade filters** are derived: genre from `albums.genres` (array),
  decade from `albums.year`. No separate tables needed for the MVP.

```
auth.users 1───1 profiles 1───∞ collection_items ∞───1 albums
```

---

## Enums

```sql
create type album_source as enum ('discogs', 'musicbrainz');

-- Discogs (Goldmine) media grading, best → worst.
create type vinyl_condition as enum (
  'Mint (M)',
  'Near Mint (NM)',
  'Very Good Plus (VG+)',
  'Very Good (VG)',
  'Good Plus (G+)',
  'Good (G)',
  'Fair (F)',
  'Poor (P)'
);
```

`currency` is kept as plain `text` (app uses RSD / EUR / USD / GBP) to avoid a
migration every time we add one; add a `check` constraint later if desired.

---

## Tables

### `profiles`
Extends Supabase auth. Created via a trigger on `auth.users` insert.

```sql
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text unique,
  created_at timestamptz not null default now()
);
```

### `albums`
Cache so we don't re-hit Discogs on every view and can filter/sort in SQL.
`id` is the app's stable album key (e.g. `discogs:m2452996` — `m<masterId>`
for a Discogs master, a bare id for a master-less release, `musicbrainz:<mbid>`).

```sql
create table albums (
  id             text primary key,            -- "<source>:<sourceId>"
  source         album_source not null,
  source_id      text not null,               -- Discogs master/release id or MBID
  title          text not null,
  artist         text not null,
  year           int,
  format         text,                         -- e.g. "Vinyl, LP, Album"
  label          text,
  catalog_number text,
  country        text,
  thumb          text,                         -- small cover URL
  cover_image    text,                         -- large cover URL
  genres         text[] not null default '{}',
  tracklist      jsonb,                        -- [{ position, title, duration }]
  source_url     text,
  cached_at      timestamptz not null default now()
);

create index albums_genres_idx on albums using gin (genres);
create index albums_year_idx   on albums (year);
create index albums_artist_idx on albums (artist);
```

### `collection_items`
The heart of the app: what the user owns + purchase history.
Mirrors `CollectionItem` (`addedAt`, `acquiredDate`, `pricePaid`, `currency`,
`condition`, `notes`).

```sql
create table collection_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,
  album_id      text not null references albums (id),
  added_at      timestamptz not null default now(),
  acquired_date date,                          -- purchase date
  price_paid    numeric(12,2),
  currency      text,                          -- RSD / EUR / USD / GBP
  condition     vinyl_condition,
  store         text,                          -- where bought (shop / city)
  store_lat     double precision,              -- geocoded at entry (OSM/Photon)
  store_lng     double precision,              -- → ready for the purchases map
  notes         text,
  unique (user_id, album_id)                   -- own an album once
);

create index collection_items_user_idx     on collection_items (user_id);
create index collection_items_acquired_idx on collection_items (user_id, acquired_date);
```

---

## Row Level Security

```sql
alter table profiles         enable row level security;
alter table albums           enable row level security;
alter table collection_items enable row level security;

-- profiles: a user sees and edits only their own row.
create policy "profiles are self" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- albums: shared read cache; any authenticated user may read and upsert
-- (the app caches an album when a user adds it).
create policy "albums readable" on albums
  for select using (auth.role() = 'authenticated');
create policy "albums upsertable" on albums
  for insert with check (auth.role() = 'authenticated');

-- collection_items: strictly private to the owner.
create policy "own collection" on collection_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

---

## How the app maps onto this

| App feature | Query |
| --- | --- |
| Collection page | `select … from collection_items join albums … where user_id = auth.uid()` |
| Filter by genre | `… where 'Jazz' = any(albums.genres)` |
| Filter by decade | `… where albums.year / 10 * 10 = 1980` |
| Sort: recently added | `order by collection_items.added_at desc` |
| Sort: year / artist / title | `order by albums.year desc` / `albums.artist` / `albums.title` |
| `has(albumId)` badge | `exists(select 1 from collection_items where user_id = auth.uid() and album_id = $1)` |
| History + total spent | `select currency, sum(price_paid) … group by currency` |
| Artist page (owned first) | order by `exists(...owned...)` then `albums.year desc` |
| Recommendations | seed from the user's distinct `albums.artist` / `albums.genres`, then Discogs search (unchanged) |

**localStorage → Supabase migration:** on first sign-in, read the
`vinyl-collection` array, upsert each album into `albums`, then insert into
`collection_items` (carry `addedAt`, `acquiredDate`, `pricePaid`, `currency`,
`condition`, `notes`). Then clear/keep localStorage as an offline cache.

---

## Not needed yet (future normalization)

- `artists` table (currently `albums.artist` is free text) — add if we want
  canonical artist pages / dedupe.
- `genres` + `album_genres` join tables — only if array filtering becomes a
  bottleneck; `text[]` + GIN is fine for now.
- `wishlist` table (same shape as `collection_items` minus purchase fields) if
  we add a "want" list.
- **Map of where records are bought** (OpenStreetMap + Leaflet, no API key):
  `store_lat`/`store_lng` are already captured at entry via the place
  autocomplete (`/api/geocode` → Photon), so the map is just: plot the stored
  coordinates as markers / a heatmap. Rows without coordinates (free-typed) can
  be geocoded on demand later.

---

## Maintenance

Whenever we add or change stored data in the app, update this file in the same
change:
- New field on `CollectionItem` (`lib/types.ts`) → add a column to
  `collection_items` here.
- New album metadata used from the API → add a column to `albums`.
- New feature backed by its own data (wishlist, ratings, tags…) → add a table
  here with columns, RLS, and indexes.

Changelog:
- 2026-08-23 — initial schema: `profiles`, `albums`, `collection_items` with
  purchase-history fields (date, price, currency, condition, notes).
- 2026-08-23 — add `collection_items.store` (where bought); reserved
  `store_lat`/`store_lng` for a future OpenStreetMap purchases map.
- 2026-08-23 — capture `store_lat`/`store_lng` at entry via place autocomplete
  (`/api/geocode` → Photon/OSM); columns now populated, map-ready.
- 2026-08-25 — schema goes live: runnable `supabase/schema.sql` (tables, RLS,
  enums + an `on auth.users` trigger that auto-creates a `profiles` row).
  Email-OTP auth (Supabase) with cross-device sync; `useCollection` reads/writes
  Supabase when signed in and imports guest `localStorage` once on first sign-in.
  Env-gated — no env vars means guest mode, unchanged. `albums` gains an
  authenticated `update` policy so the shared cache can be refreshed on upsert.
