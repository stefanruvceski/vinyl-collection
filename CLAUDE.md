# Project conventions

## Language

- **Always write GitHub content in English** — pull request titles and bodies,
  issue titles and bodies, code review comments, and all other GitHub posts.
- **The site UI is in English** — all user-facing text (pages, components,
  metadata, docs like README) is written in English.
- (Chat replies may be in the language the user is using.)

## Project

- Next.js (App Router) + TypeScript + Tailwind. Vinyl collection MVP:
  album search (Discogs primary, MusicBrainz fallback) with owned-tracking
  in `localStorage`. No auth/DB yet.

## Database schema (future Supabase)

- `docs/DATABASE.md` holds the planned Supabase/Postgres schema so we can adopt
  it in one go later. **Keep it in sync:** whenever a change adds or alters
  stored data (a new `CollectionItem` field, new album metadata, or a feature
  with its own data), update `docs/DATABASE.md` in the same change and add a
  dated changelog line.
