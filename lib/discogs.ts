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
  return {
    id: albumKey("discogs", item.id),
    source: "discogs",
    sourceId: String(item.id),
    title,
    artist,
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

/** One Discogs vinyl-release search with the given params. Over-fetches. */
async function runDiscogsSearch(
  params: Record<string, string>,
  count: number,
  signal?: AbortSignal
): Promise<DiscogsSearchItem[]> {
  const url = new URL(`${API}/database/search`);
  url.searchParams.set("type", "release");
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
  // Discogs returns one row per pressing, so over-fetch and later collapse to
  // one per master (album).
  const count = Math.min(100, Math.max(perPage * 5, perPage));

  // Search the query as an ARTIST and as a general term (title + everything) in
  // parallel, so typing "Weeknd" returns the artist's own albums alongside any
  // album whose name matches — the artist's records are listed first.
  const [byArtist, byQuery] = await Promise.allSettled([
    runDiscogsSearch({ artist: query }, count, signal),
    runDiscogsSearch({ q: query }, count, signal),
  ]);

  if (byArtist.status === "rejected" && byQuery.status === "rejected") {
    throw byArtist.reason; // both failed → let the orchestrator fall back
  }
  const artistItems = byArtist.status === "fulfilled" ? byArtist.value : [];
  const queryItems = byQuery.status === "fulfilled" ? byQuery.value : [];

  return dedupeByMaster([...artistItems, ...queryItems], perPage).map(
    mapSearchItem
  );
}

/** All of an artist's vinyl albums (deduped to one per master). */
export async function searchDiscogsByArtist(
  artist: string,
  perPage = 40,
  signal?: AbortSignal
): Promise<Album[]> {
  if (!discogsEnabled()) throw new Error("discogs-not-configured");
  const count = Math.min(100, Math.max(perPage * 2, perPage));
  const items = await runDiscogsSearch({ artist }, count, signal);
  return dedupeByMaster(items, perPage).map(mapSearchItem);
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
  const artist = r.artists?.map((a) => a.name).join(", ") || "";
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
    title: r.title,
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
