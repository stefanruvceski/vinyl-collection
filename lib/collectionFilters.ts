import { Album, CollectionItem } from "./types";

export function decadeOf(year?: number): number | undefined {
  if (!year || !Number.isFinite(year)) return undefined;
  return Math.floor(year / 10) * 10;
}

/** Distinct genres across the items, most common first. */
export function distinctGenres(items: Album[]): string[] {
  const counts = new Map<string, number>();
  for (const a of items) {
    for (const g of a.genres ?? []) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([g]) => g);
}

/** Distinct decades present, newest first. */
export function distinctDecades(items: Album[]): number[] {
  const set = new Set<number>();
  for (const a of items) {
    const d = decadeOf(a.year);
    if (d) set.add(d);
  }
  return [...set].sort((a, b) => b - a);
}

export interface Filters {
  genre?: string;
  decade?: number;
}

export function applyFilters<T extends Album>(items: T[], f: Filters): T[] {
  return items.filter((a) => {
    if (f.genre && !(a.genres ?? []).includes(f.genre)) return false;
    if (f.decade != null && decadeOf(a.year) !== f.decade) return false;
    return true;
  });
}

export type SortKey = "added" | "year-desc" | "year-asc" | "artist" | "title";

export const SORT_LABELS: Record<SortKey, string> = {
  added: "Recently added",
  "year-desc": "Year (newest)",
  "year-asc": "Year (oldest)",
  artist: "Artist A–Z",
  title: "Title A–Z",
};

export function sortItems<T extends Album>(items: T[], key: SortKey): T[] {
  const copy = [...items];
  const added = (a: T) => (a as CollectionItem).addedAt ?? "";
  switch (key) {
    case "added":
      return copy.sort((a, b) => added(b).localeCompare(added(a)));
    case "year-desc":
      return copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    case "year-asc":
      return copy.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    case "artist":
      return copy.sort(
        (a, b) => a.artist.localeCompare(b.artist) || (b.year ?? 0) - (a.year ?? 0)
      );
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export type GroupKey = "none" | "artist" | "genre";

export function groupItems<T extends Album>(
  items: T[],
  key: GroupKey
): { label: string; items: T[] }[] {
  if (key === "none") return [{ label: "", items }];
  const map = new Map<string, T[]>();
  for (const a of items) {
    const label = key === "artist" ? a.artist : a.genres?.[0] ?? "Unknown";
    const bucket = map.get(label);
    if (bucket) bucket.push(a);
    else map.set(label, [a]);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, items]) => ({ label, items }));
}
