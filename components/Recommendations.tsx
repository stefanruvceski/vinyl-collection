"use client";

import { useEffect, useMemo, useState } from "react";
import { useCollection } from "@/lib/useCollection";
import { distinctGenres } from "@/lib/collectionFilters";
import { Album } from "@/lib/types";
import AlbumCard from "./AlbumCard";

interface RecSection {
  title: string;
  albums: Album[];
}

const gridClass =
  "grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

export default function Recommendations() {
  const { items, ready, has } = useCollection();
  const [sections, setSections] = useState<RecSection[] | null>(null);
  const [loading, setLoading] = useState(false);

  const seeds = useMemo(() => {
    const artists: string[] = [];
    for (const it of items) {
      if (!artists.includes(it.artist)) artists.push(it.artist);
      if (artists.length >= 2) break;
    }
    return { artists, genres: distinctGenres(items).slice(0, 2) };
  }, [items]);

  useEffect(() => {
    if (!ready) return;
    if (seeds.artists.length === 0 && seeds.genres.length === 0) {
      setSections([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const qs = new URLSearchParams();
    if (seeds.artists.length) qs.set("artists", seeds.artists.join("|"));
    if (seeds.genres.length) qs.set("genres", seeds.genres.join("|"));

    fetch(`/api/recommend?${qs.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => {
        setSections((d.sections as RecSection[]) ?? []);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setSections([]);
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [ready, seeds]);

  if (!ready || items.length === 0) return null;
  if (loading && !sections) {
    return (
      <p className="mt-10 text-center text-[14px] text-secondary">
        Finding recommendations…
      </p>
    );
  }
  if (!sections || sections.length === 0) return null;

  // Drop anything already owned, and don't repeat an album across sections.
  const seen = new Set<string>();
  const cleaned = sections
    .map((s) => ({
      title: s.title,
      albums: s.albums
        .filter((a) => {
          if (has(a.id) || seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        })
        .slice(0, 10),
    }))
    .filter((s) => s.albums.length > 0);

  if (cleaned.length === 0) return null;

  return (
    <div className="mt-12 space-y-10 text-left">
      <p className="text-[13px] font-medium uppercase tracking-wide text-secondary">
        Recommended for you
      </p>
      {cleaned.map((s) => (
        <section key={s.title}>
          <h2 className="mb-4 text-[17px] font-semibold">{s.title}</h2>
          <div className={gridClass}>
            {s.albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
