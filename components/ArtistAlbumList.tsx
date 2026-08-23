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
import FilterMenu, { type MenuOption } from "./FilterMenu";

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
            <FilterMenu
              ariaLabel="Filter by genre"
              value={genre}
              onChange={setGenre}
              options={[
                { value: "", label: "All genres" },
                ...genres.map((g): MenuOption => ({ value: g, label: g })),
              ]}
            />
          )}
          {decades.length > 1 && (
            <FilterMenu
              ariaLabel="Filter by decade"
              value={decade}
              onChange={setDecade}
              options={[
                { value: "", label: "All decades" },
                ...decades.map((d): MenuOption => ({
                  value: String(d),
                  label: `${d}s`,
                })),
              ]}
            />
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
