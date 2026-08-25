-- Vinyl Nation — Supabase schema.
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
-- Mirrors docs/DATABASE.md. Safe to re-run: guarded with "if not exists" where possible.

-- ---------- Enums ----------
do $$ begin
  create type album_source as enum ('discogs', 'musicbrainz');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vinyl_condition as enum (
    'Mint (M)', 'Near Mint (NM)', 'Very Good Plus (VG+)', 'Very Good (VG)',
    'Good Plus (G+)', 'Good (G)', 'Fair (F)', 'Poor (P)'
  );
exception when duplicate_object then null; end $$;

-- ---------- Tables ----------
create table if not exists profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text unique,
  created_at timestamptz not null default now()
);

create table if not exists albums (
  id             text primary key,             -- "<source>:<sourceId>"
  source         album_source not null,
  source_id      text not null,
  title          text not null,
  artist         text not null,
  year           int,
  format         text,
  label          text,
  catalog_number text,
  country        text,
  thumb          text,
  cover_image    text,
  genres         text[] not null default '{}',
  tracklist      jsonb,
  source_url     text,
  cached_at      timestamptz not null default now()
);
create index if not exists albums_genres_idx on albums using gin (genres);
create index if not exists albums_year_idx   on albums (year);
create index if not exists albums_artist_idx on albums (artist);

create table if not exists collection_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles (id) on delete cascade,
  album_id      text not null references albums (id),
  added_at      timestamptz not null default now(),
  acquired_date date,
  price_paid    numeric(12,2),
  currency      text,
  condition     vinyl_condition,
  store         text,
  store_lat     double precision,
  store_lng     double precision,
  notes         text,
  unique (user_id, album_id)
);
create index if not exists collection_items_user_idx     on collection_items (user_id);
create index if not exists collection_items_acquired_idx on collection_items (user_id, acquired_date);

-- ---------- Auto-create a profile row for each new auth user ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Row Level Security ----------
alter table profiles         enable row level security;
alter table albums           enable row level security;
alter table collection_items enable row level security;

drop policy if exists "profiles are self" on profiles;
create policy "profiles are self" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- albums: shared read cache; any authenticated user may read and upsert.
drop policy if exists "albums readable" on albums;
create policy "albums readable" on albums
  for select using (auth.role() = 'authenticated');

drop policy if exists "albums insertable" on albums;
create policy "albums insertable" on albums
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "albums updatable" on albums;
create policy "albums updatable" on albums
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- collection_items: strictly private to the owner.
drop policy if exists "own collection" on collection_items;
create policy "own collection" on collection_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
