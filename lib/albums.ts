import {
  discogsEnabled,
  getDiscogsMaster,
  getDiscogsRelease,
  searchDiscogs,
  searchDiscogsByArtist,
} from "./discogs";
import {
  getMusicBrainzRelease,
  searchMusicBrainz,
  searchMusicBrainzByArtist,
} from "./musicbrainz";
import { Album, AlbumSource, SearchMode, SearchResponse } from "./types";

/**
 * Lagani in-memory cache po query-ju (zivi dok traje server proces).
 * Smanjuje broj poziva ka API-jima pri typeahead-u i ponovljenim pretragama.
 */
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; value: SearchResponse }>();

function cacheGet(key: string): SearchResponse | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key: string, value: SearchResponse): void {
  cache.set(key, { at: Date.now(), value });
  // Skromno ogranicenje velicine cache-a.
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
}

/**
 * Pretraga albuma: Discogs primarno, MusicBrainz fallback.
 * - `suggest` (typeahead): manje rezultata, ne zove MusicBrainz pri svakom keystroke-u
 *   (MB ima ~1 req/s limit) osim ako Discogs uopste nije konfigurisan.
 * - `full`: vise rezultata + fallback na MusicBrainz ako Discogs padne/vrati prazno.
 */
export async function searchAlbums(
  rawQuery: string,
  mode: SearchMode = "full"
): Promise<SearchResponse> {
  const query = rawQuery.trim();
  if (query.length < 3) {
    return { results: [], source: "discogs", query };
  }

  const perPage = mode === "suggest" ? 8 : 15;
  const cacheKey = `${mode}:${query.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  let results: Album[] = [];
  let source: AlbumSource = "discogs";

  if (discogsEnabled()) {
    try {
      results = await searchDiscogs(query, perPage);
      source = "discogs";
    } catch {
      // Discogs pao (rate limit/mreza) — u full modu probaj MusicBrainz.
      if (mode === "full") {
        results = await searchMusicBrainzSafe(query, perPage);
        source = "musicbrainz";
      }
    }
    // Discogs radi ali nema rezultata: u full modu probaj MusicBrainz.
    if (results.length === 0 && mode === "full") {
      const mb = await searchMusicBrainzSafe(query, perPage);
      if (mb.length) {
        results = mb;
        source = "musicbrainz";
      }
    }
  } else {
    // Nema Discogs tokena — celokupno se oslanjamo na MusicBrainz.
    results = await searchMusicBrainzSafe(query, perPage);
    source = "musicbrainz";
  }

  const response: SearchResponse = { results, source, query };
  cacheSet(cacheKey, response);
  return response;
}

async function searchMusicBrainzSafe(query: string, limit: number): Promise<Album[]> {
  try {
    return await searchMusicBrainz(query, limit);
  } catch {
    return [];
  }
}

/** Detalji jednog albuma po izvoru i sirovom id-u. */
export async function getAlbum(
  source: string,
  id: string
): Promise<Album | null> {
  if (source === "discogs") {
    if (!discogsEnabled()) return null;
    // "m<id>" identifies a master (album); a bare id is a standalone release.
    return id.startsWith("m")
      ? getDiscogsMaster(id.slice(1))
      : getDiscogsRelease(id);
  }
  if (source === "musicbrainz") {
    return getMusicBrainzRelease(id);
  }
  return null;
}

/** All vinyl albums by an artist: Discogs primary, MusicBrainz fallback. */
export async function getArtistAlbums(name: string): Promise<Album[]> {
  const q = name.trim();
  if (!q) return [];

  if (discogsEnabled()) {
    try {
      const albums = await searchDiscogsByArtist(q);
      if (albums.length) return albums;
    } catch {
      // fall through to MusicBrainz
    }
  }
  try {
    return await searchMusicBrainzByArtist(q);
  } catch {
    return [];
  }
}
