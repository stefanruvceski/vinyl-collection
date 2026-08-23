export type AlbumSource = "discogs" | "musicbrainz";

export interface Track {
  position: string;
  title: string;
  duration?: string;
}

/**
 * Normalizovan album — zajednicki oblik u koji mapiramo i Discogs i MusicBrainz.
 * `id` je uvek u formatu `${source}:${sourceId}` i sluzi kao identitet u kolekciji.
 */
export interface Album {
  /** Stabilan kljuc kolekcije, npr. "discogs:1234567". */
  id: string;
  source: AlbumSource;
  /** Sirovi ID kod izvora (Discogs release id / MusicBrainz MBID). */
  sourceId: string;
  title: string;
  artist: string;
  year?: number;
  /** Npr. "Vinyl, LP, Album". */
  format?: string;
  label?: string;
  catalogNumber?: string;
  /** Mala slika za liste. */
  thumb?: string;
  /** Veca slika za detalj stranicu / OG. */
  coverImage?: string;
  genres?: string[];
  country?: string;
  /** Popunjeno samo na detalj endpointu. */
  tracklist?: Track[];
  /** Link ka izvoru (Discogs/MusicBrainz stranica). */
  sourceUrl?: string;
}

export type SearchMode = "suggest" | "full";

export interface SearchResponse {
  results: Album[];
  /** Koji izvor je stvarno posluzio rezultate. */
  source: AlbumSource;
  query: string;
}

/** Napravi kljuc kolekcije iz izvora i sirovog id-a. */
export function albumKey(source: AlbumSource, sourceId: string | number): string {
  return `${source}:${sourceId}`;
}
