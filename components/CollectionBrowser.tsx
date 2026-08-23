"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCollection } from "@/lib/useCollection";
import {
  applyFilters,
  distinctDecades,
  distinctGenres,
  groupItems,
  sortItems,
  SORT_LABELS,
  type GroupKey,
  type SortKey,
} from "@/lib/collectionFilters";
import AlbumCard from "./AlbumCard";

const selectClass =
  "bg-elevated rounded-full border border-hair px-3.5 py-2 text-[13px] text-secondary outline-none focus:border-accent/50";

const gridClass =
  "grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

export default function CollectionBrowser() {
  const { items, ready } = useCollection();
  const [genre, setGenre] = useState("");
  const [decade, setDecade] = useState("");
  const [sort, setSort] = useState<SortKey>("added");
  const [group, setGroup] = useState<GroupKey>("none");

  const genres = useMemo(() => distinctGenres(items), [items]);
  const decades = useMemo(() => distinctDecades(items), [items]);

  const sections = useMemo(() => {
    const filtered = applyFilters(items, {
      genre: genre || undefined,
      decade: decade ? Number(decade) : undefined,
    });
    return groupItems(sortItems(filtered, sort), group);
  }, [items, genre, decade, sort, group]);

  if (!ready) {
    return <p className="py-16 text-center text-[15px] text-secondary">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-[15px] text-secondary">Your collection is empty.</p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full bg-accent px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Search and add your first record
        </Link>
      </div>
    );
  }

  const shown = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
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

        <select
          aria-label="Sort by"
          className={selectClass}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {SORT_LABELS[k]}
            </option>
          ))}
        </select>

        <select
          aria-label="Group by"
          className={selectClass}
          value={group}
          onChange={(e) => setGroup(e.target.value as GroupKey)}
        >
          <option value="none">No grouping</option>
          <option value="artist">Group by artist</option>
          <option value="genre">Group by genre</option>
        </select>

        <span className="ml-auto text-[13px] text-secondary">
          {shown === items.length ? `${items.length} records` : `${shown} of ${items.length}`}
        </span>
      </div>

      {shown === 0 ? (
        <p className="py-12 text-center text-[15px] text-secondary">
          No records match these filters.
        </p>
      ) : group === "none" ? (
        <div className={gridClass}>
          {sections[0].items.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.label}>
              <h2 className="mb-4 text-[15px] font-semibold text-secondary">
                {section.label}{" "}
                <span className="font-normal">· {section.items.length}</span>
              </h2>
              <div className={gridClass}>
                {section.items.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
