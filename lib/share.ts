import LZString from "lz-string";
import { Album, AlbumSource, CollectionItem, albumKey } from "./types";

/**
 * Read-only collection sharing WITHOUT a backend.
 *
 * A collection is packed into a compact, URL-safe string that lives in the
 * link's hash fragment (`/shared#c=…`). The hash never reaches the server, so
 * length is bound only by the browser (megabytes) — but we still keep it small:
 * only the *public* album fields travel. Private purchase data (price, store,
 * coordinates, notes, exact acquisition date) is intentionally NEVER shared.
 * Condition is included because it is relevant when trading records.
 */

// Album fields a shared card needs to render + link to the public album page.
export interface SharedAlbum {
  id: string;
  source: AlbumSource;
  sourceId: string;
  title: string;
  artist: string;
  year?: number;
  thumb?: string;
  condition?: string;
}

export interface SharedCollection {
  /** Optional label the owner gave the collection. */
  name?: string;
  albums: SharedAlbum[];
}

// Sources are stored as an index to shave bytes; order must stay stable.
const SOURCES: AlbumSource[] = ["discogs", "musicbrainz"];

// One album as a positional tuple (shortest pre-compression form):
// [sourceIdx, sourceId, title, artist, year(0=none), thumb(""), condition("")]
type Row = [number, string, string, string, number, string, string];

interface Payload {
  v: 1;
  n?: string;
  r: Row[];
}

export function encodeShare(items: CollectionItem[], name?: string): string {
  const rows: Row[] = items.map((it) => [
    Math.max(0, SOURCES.indexOf(it.source)),
    it.sourceId,
    it.title ?? "",
    it.artist ?? "",
    it.year ?? 0,
    it.thumb ?? "",
    it.condition ?? "",
  ]);
  const payload: Payload = { v: 1, r: rows };
  const trimmed = name?.trim();
  if (trimmed) payload.n = trimmed;
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeShare(code: string): SharedCollection | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(code);
    if (!json) return null;
    const payload = JSON.parse(json) as Partial<Payload>;
    if (!payload || !Array.isArray(payload.r)) return null;

    const albums: SharedAlbum[] = payload.r.map((row) => {
      const source = SOURCES[row[0]] ?? "discogs";
      const sourceId = String(row[1] ?? "");
      const album: SharedAlbum = {
        id: albumKey(source, sourceId),
        source,
        sourceId,
        title: (row[2] as string) || "Untitled",
        artist: (row[3] as string) || "Unknown artist",
      };
      if (row[4]) album.year = Number(row[4]) || undefined;
      if (row[5]) album.thumb = row[5] as string;
      if (row[6]) album.condition = row[6] as string;
      return album;
    });

    return { name: payload.n, albums };
  } catch {
    return null;
  }
}

/** A SharedAlbum is structurally a valid (minimal) Album for cards/links. */
export function toAlbum(a: SharedAlbum): Album {
  return {
    id: a.id,
    source: a.source,
    sourceId: a.sourceId,
    title: a.title,
    artist: a.artist,
    year: a.year,
    thumb: a.thumb,
  };
}
