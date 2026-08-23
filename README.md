# Vinyl Collection 💿

Sajt za vođenje evidencije o kolekciji ploča. Pretraži bilo koji album,
označi one koje **imaš**, i kad si u prodavnici brzo proveri da li ti neka
ploča već fali u kolekciji — bez ručnog unosa podataka.

Podaci o albumima se povlače automatski:

- **Discogs** — primarni izvor (vinyl-specifična baza: format, izdavač,
  kataloški broj, godina, cover, lista pesama).
- **MusicBrainz + Cover Art Archive** — fallback (radi bez ključa).

Kolekcija se za sada čuva **lokalno u pregledaču** (`localStorage`) — nema
naloga ni baze. Ovo je MVP za testiranje ideje.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- SEO: server-renderovane `/album/...` stranice, `generateMetadata`,
  JSON-LD (`schema.org/MusicAlbum`), `sitemap.xml`, `robots.txt`

## Pokretanje

```bash
npm install
cp .env.local.example .env.local   # popuni vrednosti (vidi ispod)
npm run dev                         # http://localhost:3000
```

App radi **i bez ikakvog ključa** — u tom slučaju pretraga koristi
MusicBrainz. Za bolje (vinyl-specifične) rezultate dodaj besplatan Discogs
token.

### Discogs token (opciono, preporučeno)

1. Uloguj se na Discogs → **Settings → Developers**
   (<https://www.discogs.com/settings/developers>).
2. Klikni **Generate new token**.
3. Ubaci ga u `.env.local`:

   ```
   DISCOGS_TOKEN=tvoj_token_ovde
   ```

4. Restartuj `npm run dev`.

### Ostale env varijable

| Varijabla | Opis |
| --- | --- |
| `DISCOGS_TOKEN` | Discogs personal token (opciono; bez njega ide MusicBrainz). |
| `MUSICBRAINZ_USER_AGENT` | MusicBrainz zahteva opisni User-Agent sa kontaktom. |
| `NEXT_PUBLIC_SITE_URL` | Bazni URL sajta (za SEO metadata, sitemap, OG tagove). |

## Kako radi

1. Kucaš u pretragu → posle ~325 ms pauze (**debounce**, min. 3 znaka) šalje
   se **jedan** zahtev; prethodni u letu se otkazuje (`AbortController`).
2. Server (Next.js Route Handler) proksira poziv ka Discogs-u (token ostaje
   tajan, nema CORS problema), normalizuje rezultate i po potrebi pada na
   MusicBrainz.
3. Svaki rezultat se poredi sa tvojom kolekcijom i dobija badge
   **✅ U kolekciji** ako ga već imaš.
4. Klik na **➕ Dodaj** čuva ceo album (sa svim podacima sa API-ja) u
   `localStorage`.
5. `/album/[source]/[id]` je javna, server-renderovana stranica (indeksabilna
   za Google), a „imam/nemam" dugme je klijentski sloj preko nje.

## Skripte

| Komanda | Opis |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` | Produkcioni build. |
| `npm run start` | Pokreni produkcioni build. |
| `npm run lint` | ESLint. |

## Struktura

```
app/
  layout.tsx                     # root layout + globalna SEO metadata
  page.tsx                       # početna (pretraga)
  collection/page.tsx            # moja kolekcija (noindex)
  album/[source]/[id]/page.tsx   # SSR detalj albuma + JSON-LD
  api/search/route.ts            # pretraga (mode=suggest|full)
  api/album/[source]/[id]/route.ts
  sitemap.ts, robots.ts
components/                       # SearchBar, AlbumCard, CollectionButton, ...
lib/                             # discogs, musicbrainz, albums (fallback), hooks, tipovi
```

## Sledeći koraci (van MVP-a)

- Auth + baza (npr. Postgres) da kolekcija ne bude vezana za jedan pregledač.
- Javne stranice profila/kolekcije → prava SEO vrednost (indeksabilne
  kolekcije).
- Dedupe pressinga preko Discogs „master" release-a.
```
