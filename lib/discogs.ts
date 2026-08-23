import { Album, albumKey, Track } from "./types";

const API = "https://api.discogs.com";
const USER_AGENT =
  process.env.MUSICBRAINZ_USER_AGENT?.replace("MusicBrainz", "").trim() ||
  "VinylCollection/0.1 (+https://github.com/stefanruvceski/vinyl-collection)";

function token(): string | undefined {
  return process.env.DISCOGS_TOKEN || undefined;
}

/** Da li je Discogs uopste konfigurisan (ima token)? */
export function discogsEnabled(): boolean {
  return Boolean(token());
}

function headers(): HeadersInit {
  const h: Record<string, string> = { "User-Agent": USER_AGENT };
  const t = token();
  if (t) h["Authorization"] = `Discogs token=${t}`;
  return h;
}

/** Discogs "title" u search rezultatu je oblik "Artist - Album". Razdvoji ga. */
function splitTitle(raw: string): { artist: string; title: string } {
  const idx = raw.indexOf(" - ");
  if (idx === -1) return { artist: "", title: raw.trim() };
  return {
    artist: raw.slice(0, idx).trim(),
    title: raw.slice(idx + 3).trim(),
  };
}

/** CJK / Hangul / Kana ranges — used to spot localized (e.g. Asian) pressings. */
const NON_LATIN =
  /[぀-ヿ㐀-䶿一-鿿가-힯＀-￯]/;

/** Stable-partition so localized (non-Latin) titles come last, keeping order. */
function preferLatin(items: DiscogsSearchItem[]): DiscogsSearchItem[] {
  const latin: DiscogsSearchItem[] = [];
  const other: DiscogsSearchItem[] = [];
  for (const r of items) {
    (NON_LATIN.test(r.title || "") ? other : latin).push(r);
  }
  return [...latin, ...other];
}

/**
 * Discogs joins an original title with its local translation using " = " on
 * localized releases (e.g. "Dawn FM = 黎明电台"). Keep the original side.
 */
function cleanTitle(s: string): string {
  return s.split(" = ")[0].trim() || s.trim();
}

/**
 * Clean a Discogs artist string: drop the "= <translation>" half, the ANV "*"
 * suffix and the "(2)" disambiguation number, and collapse duplicates
 * ("The Weeknd, The Weeknd" → "The Weeknd").
 */
function cleanArtist(s: string): string {
  const parts = s
    .split(", ")
    .map((a) =>
      a
        .split(" = ")[0]
        .replace(/\s*\(\d+\)$/, "")
        .replace(/\*+$/, "")
        .trim()
    )
    .filter(Boolean);
  return Array.from(new Set(parts)).join(", ");
}

interface DiscogsSearchItem {
  id: number;
  /** Id of the "master" (the album) this pressing belongs to; 0/undefined if none. */
  master_id?: number;
  title: string;
  year?: string;
  format?: string[];
  label?: string[];
  catno?: string;
  thumb?: string;
  cover_image?: string;
  genre?: string[];
  country?: string;
  uri?: string;
}

function mapSearchItem(item: DiscogsSearchItem): Album {
  const { artist, title } = splitTitle(item.title || "");
  // Identify by the master (album) when the pressing has one — "m<masterId>" —
  // so the identity and detail page are canonical; otherwise use the release id.
  const rawId =
    item.master_id && item.master_id > 0
      ? `m${item.master_id}`
      : String(item.id);
  return {
    id: albumKey("discogs", rawId),
    source: "discogs",
    sourceId: rawId,
    title: cleanTitle(title),
    artist: cleanArtist(artist),
    year: item.year ? Number(item.year) || undefined : undefined,
    format: item.format?.join(", "),
    label: item.label?.[0],
    catalogNumber: item.catno,
    thumb: item.thumb || undefined,
    coverImage: item.cover_image || item.thumb || undefined,
    genres: item.genre,
    country: item.country,
    sourceUrl: item.uri ? `https://www.discogs.com${item.uri}` : undefined,
  };
}

/** One Discogs vinyl search (caller sets `type` in params). Over-fetches. */
async function runDiscogsSearch(
  params: Record<string, string>,
  count: number,
  signal?: AbortSignal
): Promise<DiscogsSearchItem[]> {
  const url = new URL(`${API}/database/search`);
  url.searchParams.set("format", "Vinyl");
  url.searchParams.set("per_page", String(count));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { headers: headers(), signal });
  if (!res.ok) throw new Error(`discogs-search-${res.status}`);
  const data = (await res.json()) as { results?: DiscogsSearchItem[] };
  return data.results ?? [];
}

export async function searchDiscogs(
  query: string,
  perPage = 12,
  signal?: AbortSignal
): Promise<Album[]> {
  if (!discogsEnabled()) throw new Error("discogs-not-configured");
  // Search vinyl RELEASES (reliable recall), then collapse all pressings of an
  // album to one row via master_id. Identity/detail stay canonical (the master).
  const count = Math.min(100, Math.max(perPage * 5, perPage));

  // Search the query as an ARTIST and as a general term (title + everything) in
  // parallel, so typing "Weeknd" returns the artist's own albums alongside any
  // album whose name matches.
  const [byArtist, byQuery] = await Promise.allSettled([
    runDiscogsSearch({ type: "release", artist: query }, count, signal),
    runDiscogsSearch({ type: "release", q: query }, count, signal),
  ]);

  if (byArtist.status === "rejected" && byQuery.status === "rejected") {
    throw byArtist.reason; // both failed → let the orchestrator fall back
  }
  const artistItems = byArtist.status === "fulfilled" ? byArtist.value : [];
  const queryItems = byQuery.status === "fulfilled" ? byQuery.value : [];

  // Prefer original (Latin) pressings as representatives, collapse by master,
  // then rank by how well each album matches the query (exact > starts-with >
  // contains). Ties keep Discogs' order (stable sort).
  const merged = preferLatin([...artistItems, ...queryItems]);
  const albums = dedupeByMaster(merged, merged.length).map(mapSearchItem);
  const q = query.trim().toLowerCase();
  albums.sort((a, b) => relevanceScore(b, q) - relevanceScore(a, q));
  return albums.slice(0, perPage);
}

/** Coarse relevance of an album to the query, matched on title and artist. */
function relevanceScore(album: Album, q: string): number {
  const strip = (s: string) => s.replace(/^the\s+/, "");
  const qs = strip(q);
  const field = (v: string) => {
    const f = v.toLowerCase();
    const fs = strip(f);
    if (!f || !q) return 0;
    if (f === q || fs === qs) return 100;
    if (f.startsWith(q) || fs.startsWith(qs)) return 80;
    if (f.includes(q)) return 55;
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length > 1 && tokens.every((t) => f.includes(t))) return 40;
    return 0;
  };
  const title = field(album.title);
  const artist = field(album.artist);
  // Best matching field wins; a small bonus when both match.
  return Math.max(title, artist) + (title > 0 && artist > 0 ? 5 : 0);
}

/** All of an artist's vinyl albums (one canonical master row per album). */
export async function searchDiscogsByArtist(
  artist: string,
  perPage = 40,
  signal?: AbortSignal
): Promise<Album[]> {
  if (!discogsEnabled()) throw new Error("discogs-not-configured");
  const count = Math.min(100, Math.max(perPage * 3, perPage));
  const items = await runDiscogsSearch({ type: "release", artist }, count, signal);
  return dedupeByMaster(preferLatin(items), perPage).map(mapSearchItem);
}

/**
 * Collapse to one row per album: skip repeated release ids (the two searches
 * can overlap) and keep one pressing per master (master_id 0/undefined = a
 * standalone release, kept as-is), preserving order. Stops at `limit` albums.
 */
function dedupeByMaster(
  items: DiscogsSearchItem[],
  limit: number
): DiscogsSearchItem[] {
  const seenMaster = new Set<number>();
  const seenId = new Set<number>();
  const picked: DiscogsSearchItem[] = [];
  for (const r of items) {
    if (!r.id || !r.title || seenId.has(r.id)) continue;
    seenId.add(r.id);
    const master = r.master_id ?? 0;
    if (master > 0) {
      if (seenMaster.has(master)) continue;
      seenMaster.add(master);
    }
    picked.push(r);
    if (picked.length >= limit) break;
  }
  return picked;
}

interface DiscogsRelease {
  id: number;
  title: string;
  artists?: { name: string }[];
  year?: number;
  formats?: { name: string; descriptions?: string[] }[];
  labels?: { name: string; catno?: string }[];
  images?: { uri: string; uri150?: string }[];
  genres?: string[];
  styles?: string[];
  country?: string;
  tracklist?: { position: string; title: string; duration?: string }[];
  uri?: string;
}

function mapRelease(r: DiscogsRelease): Album {
  const artist = cleanArtist(r.artists?.map((a) => a.name).join(", ") || "");
  const fmt = r.formats
    ?.map((f) => [f.name, ...(f.descriptions ?? [])].join(", "))
    .join(" / ");
  const tracklist: Track[] | undefined = r.tracklist?.map((t) => ({
    position: t.position,
    title: t.title,
    duration: t.duration || undefined,
  }));
  const cover = r.images?.[0]?.uri;
  return {
    id: albumKey("discogs", r.id),
    source: "discogs",
    sourceId: String(r.id),
    title: cleanTitle(r.title),
    artist,
    year: r.year || undefined,
    format: fmt,
    label: r.labels?.[0]?.name,
    catalogNumber: r.labels?.[0]?.catno,
    thumb: r.images?.[0]?.uri150 || cover,
    coverImage: cover,
    genres: [...(r.genres ?? []), ...(r.styles ?? [])],
    country: r.country,
    tracklist,
    sourceUrl: r.uri
      ? r.uri.startsWith("http")
        ? r.uri
        : `https://www.discogs.com${r.uri}`
      : `https://www.discogs.com/release/${r.id}`,
  };
}

export async function getDiscogsRelease(
  id: string,
  signal?: AbortSignal
): Promise<Album | null> {
  const res = await fetch(`${API}/releases/${encodeURIComponent(id)}`, {
    headers: headers(),
    signal,
    next: { revalidate: 60 * 60 * 24 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`discogs-release-${res.status}`);
  const data = (await res.json()) as DiscogsRelease;
  return mapRelease(data);
}

interface DiscogsMaster {
  id: number;
  title: string;
  artists?: { name: string }[];
  year?: number;
  genres?: string[];
  styles?: string[];
  images?: { uri: string; uri150?: string }[];
  tracklist?: { position: string; title: string; duration?: string }[];
  main_release?: number;
  uri?: string;
}

function mapMaster(m: DiscogsMaster): Album {
  const cover = m.images?.[0]?.uri;
  return {
    id: albumKey("discogs", m.id),
    source: "discogs",
    sourceId: String(m.id),
    title: cleanTitle(m.title),
    artist: cleanArtist(m.artists?.map((a) => a.name).join(", ") || ""),
    year: m.year || undefined,
    thumb: m.images?.[0]?.uri150 || cover,
    coverImage: cover,
    genres: [...(m.genres ?? []), ...(m.styles ?? [])],
    tracklist: m.tracklist?.map((t) => ({
      position: t.position,
      title: t.title,
      duration: t.duration || undefined,
    })),
    sourceUrl: m.uri
      ? m.uri.startsWith("http")
        ? m.uri
        : `https://www.discogs.com${m.uri}`
      : `https://www.discogs.com/master/${m.id}`,
  };
}

/**
 * Album detail from a Discogs MASTER (canonical title/year/art), enriched with
 * the master's representative pressing (`main_release`) for the pressing-level
 * fields a collector wants: format, label, catalog number, country.
 */
export async function getDiscogsMaster(
  id: string,
  signal?: AbortSignal
): Promise<Album | null> {
  const res = await fetch(`${API}/masters/${encodeURIComponent(id)}`, {
    headers: headers(),
    signal,
    next: { revalidate: 60 * 60 * 24 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`discogs-master-${res.status}`);
  const master = (await res.json()) as DiscogsMaster;
  const album = mapMaster(master);

  if (master.main_release) {
    const rel = await getDiscogsRelease(String(master.main_release), signal).catch(
      () => null
    );
    if (rel) {
      album.format ??= rel.format;
      album.label ??= rel.label;
      album.catalogNumber ??= rel.catalogNumber;
      album.country ??= rel.country;
      if (!album.tracklist?.length) album.tracklist = rel.tracklist;
      album.coverImage ??= rel.coverImage;
      album.thumb ??= rel.thumb;
    }
  }
  return album;
}
