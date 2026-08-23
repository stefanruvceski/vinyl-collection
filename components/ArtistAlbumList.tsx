"use client";

import { useMemo, useState } from "react";
import { Album } from "@/lib/types";
import { useCollection } from "@/lib/useCollection";
import {
  applyFilters,
  distinctDecades,
  distinctGenres,
} from "@/lib/collectionFilters";
import AlbumCard from "./AlbumCard";

const selectClass =
  "bg-elevated rounded-full border border-hair px-3.5 py-2 text-[13px] text-secondary outline-none focus:border-accent/50";
const gridClass =
  "grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

export default function ArtistAlbumList({ albums }: { albums: Album[] }) {
  const { has } = useCollection();
  const [genre, setGenre] = useState("");
  const [decade, setDecade] = useState("");

  const genres = useMemo(() => distinctGenres(albums), [albums]);
  const decades = useMemo(() => distinctDecades(albums), [albums]);

  const view = useMemo(() => {
    const filtered = applyFilters(albums, {
      genre: genre || undefined,
      decade: decade ? Number(decade) : undefined,
    });
    // Records you own float to the top (checkmark), then newest first. This
    // only reorders after hydration, since ownership lives in localStorage.
    return [...filtered].sort((a, b) => {
      const owned = (has(b.id) ? 1 : 0) - (has(a.id) ? 1 : 0);
      return owned || (b.year ?? 0) - (a.year ?? 0);
    });
  }, [albums, genre, decade, has]);

  return (
    <div>
      {(genres.length > 1 || decades.length > 1) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {genres.length > 1 && (
            <select
              aria-label="Filter by genre"
              className={selectClass}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="">All genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}
          {decades.length > 1 && (
            <select
              aria-label="Filter by decade"
              className={selectClass}
              value={decade}
              onChange={(e) => setDecade(e.target.value)}
            >
              <option value="">All decades</option>
              {decades.map((d) => (
                <option key={d} value={d}>
                  {d}s
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {view.length === 0 ? (
        <p className="py-12 text-center text-[15px] text-secondary">
          No albums match these filters.
        </p>
      ) : (
        <div className={gridClass}>
          {view.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      )}
    </div>
  );
}
