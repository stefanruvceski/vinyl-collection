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
import FilterMenu, { type MenuOption } from "./FilterMenu";

const gridClass =
  "grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

const SortIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 4v16M8 20l-3-3M8 4l3 3M16 20V4M16 4l3 3M16 20l-3-3" />
  </svg>
);

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
      <div className="flex flex-wrap items-center gap-2">
        <FilterMenu
          ariaLabel="Filter by genre"
          value={genre}
          onChange={setGenre}
          options={[
            { value: "", label: "All genres" },
            ...genres.map((g): MenuOption => ({ value: g, label: g })),
          ]}
        />
        <FilterMenu
          ariaLabel="Filter by decade"
          value={decade}
          onChange={setDecade}
          options={[
            { value: "", label: "All decades" },
            ...decades.map((d): MenuOption => ({ value: String(d), label: `${d}s` })),
          ]}
        />
        <FilterMenu
          ariaLabel="Sort"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          defaultValue="added"
          leadingIcon={SortIcon}
          options={(Object.keys(SORT_LABELS) as SortKey[]).map((k) => ({
            value: k,
            label: SORT_LABELS[k],
          }))}
        />
        <FilterMenu
          ariaLabel="Group by"
          value={group}
          onChange={(v) => setGroup(v as GroupKey)}
          defaultValue="none"
          options={[
            { value: "none", label: "No grouping" },
            { value: "artist", label: "By artist" },
            { value: "genre", label: "By genre" },
          ]}
        />
      </div>

      <p className="mb-6 mt-3 text-[13px] text-secondary">
        {shown === items.length
          ? `${items.length} records`
          : `${shown} of ${items.length}`}
      </p>

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
