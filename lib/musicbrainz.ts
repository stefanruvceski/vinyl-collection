import { Album, albumKey, Track } from "./types";

const API = "https://musicbrainz.org/ws/2";
const CAA = "https://coverartarchive.org/release";

function userAgent(): string {
  return (
    process.env.MUSICBRAINZ_USER_AGENT ||
    "VinylCollection/0.1 ( https://github.com/stefanruvceski/vinyl-collection )"
  );
}

function headers(): HeadersInit {
  return { "User-Agent": userAgent(), Accept: "application/json" };
}

/** Front cover preko Cover Art Archive-a (307 redirect na sliku; 404 ako ne postoji). */
function coverUrl(mbid: string, size: "250" | "500" | "1200"): string {
  return `${CAA}/${mbid}/front-${size}`;
}

interface MbArtistCredit {
  name: string;
  artist?: { name: string };
}
interface MbLabelInfo {
  "catalog-number"?: string;
  label?: { name: string };
}
interface MbMedium {
  format?: string;
  tracks?: { number?: string; position?: number; title: string; length?: number }[];
}
interface MbRelease {
  id: string;
  title: string;
  date?: string;
  country?: string;
  "artist-credit"?: MbArtistCredit[];
  "label-info"?: MbLabelInfo[];
  media?: MbMedium[];
  "release-group"?: {
    id?: string;
    "primary-type"?: string;
    genres?: { name: string }[];
  };
}

function artistOf(r: MbRelease): string {
  return (r["artist-credit"] ?? []).map((c) => c.name).join(", ");
}

function yearOf(r: MbRelease): number | undefined {
  if (!r.date) return undefined;
  const y = Number(r.date.slice(0, 4));
  return Number.isFinite(y) ? y : undefined;
}

function formatOf(r: MbRelease): string | undefined {
  const fmts = (r.media ?? [])
    .map((m) => m.format)
    .filter((f): f is string => Boolean(f));
  return fmts.length ? Array.from(new Set(fmts)).join(", ") : undefined;
}

function mapRelease(r: MbRelease, withTracks = false): Album {
  const tracklist: Track[] | undefined = withTracks
    ? (r.media ?? []).flatMap((m) =>
        (m.tracks ?? []).map((t) => ({
          position: t.number || String(t.position ?? ""),
          title: t.title,
          duration: t.length ? msToDuration(t.length) : undefined,
        }))
      )
    : undefined;

  return {
    id: albumKey("musicbrainz", r.id),
    source: "musicbrainz",
    sourceId: r.id,
    title: r.title,
    artist: artistOf(r),
    year: yearOf(r),
    format: formatOf(r),
    label: r["label-info"]?.[0]?.label?.name,
    catalogNumber: r["label-info"]?.[0]?.["catalog-number"],
    thumb: coverUrl(r.id, "250"),
    coverImage: coverUrl(r.id, "500"),
    genres: r["release-group"]?.genres?.map((g) => g.name),
    country: r.country,
    tracklist: tracklist?.length ? tracklist : undefined,
    sourceUrl: `https://musicbrainz.org/release/${r.id}`,
  };
}

function msToDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export async function searchMusicBrainz(
  query: string,
  limit = 12,
  signal?: AbortSignal
): Promise<Album[]> {
  const url = new URL(`${API}/release`);
  // Suzavamo na vinyl izdanja koliko Lucene dozvoljava.
  url.searchParams.set("query", `${query} AND format:vinyl`);
  url.searchParams.set("fmt", "json");
  // Over-fetch, then collapse to one release per release-group (album).
  url.searchParams.set("limit", String(Math.min(100, Math.max(limit * 5, limit))));

  const res = await fetch(url, { headers: headers(), signal });
  if (!res.ok) throw new Error(`musicbrainz-search-${res.status}`);
  const data = (await res.json()) as { releases?: MbRelease[] };
  return dedupeByReleaseGroup(data.releases ?? [], limit).map((r) =>
    mapRelease(r)
  );
}

/** All of an artist's vinyl albums (deduped to one per release-group). */
export async function searchMusicBrainzByArtist(
  artist: string,
  limit = 40,
  signal?: AbortSignal
): Promise<Album[]> {
  const url = new URL(`${API}/release`);
  url.searchParams.set("query", `artist:"${artist}" AND format:vinyl`);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", String(Math.min(100, Math.max(limit * 3, limit))));

  const res = await fetch(url, { headers: headers(), signal });
  if (!res.ok) throw new Error(`musicbrainz-artist-${res.status}`);
  const data = (await res.json()) as { releases?: MbRelease[] };
  return dedupeByReleaseGroup(data.releases ?? [], limit).map((r) =>
    mapRelease(r)
  );
}

/** One release per release-group (album), preserving relevance order. */
function dedupeByReleaseGroup(items: MbRelease[], limit: number): MbRelease[] {
  const seen = new Set<string>();
  const picked: MbRelease[] = [];
  for (const r of items) {
    const rg = r["release-group"]?.id;
    if (rg) {
      if (seen.has(rg)) continue;
      seen.add(rg);
    }
    picked.push(r);
    if (picked.length >= limit) break;
  }
  return picked;
}

export async function getMusicBrainzRelease(
  id: string,
  signal?: AbortSignal
): Promise<Album | null> {
  const url = new URL(`${API}/release/${encodeURIComponent(id)}`);
  url.searchParams.set("fmt", "json");
  url.searchParams.set(
    "inc",
    "artist-credits+labels+recordings+release-groups+genres"
  );

  const res = await fetch(url, {
    headers: headers(),
    signal,
    next: { revalidate: 60 * 60 * 24 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`musicbrainz-release-${res.status}`);
  const data = (await res.json()) as MbRelease;
  return mapRelease(data, true);
}
