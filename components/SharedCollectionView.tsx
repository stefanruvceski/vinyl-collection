"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCollection } from "@/lib/useCollection";
import { decodeShare, type SharedCollection } from "@/lib/share";
import SharedAlbumCard from "./SharedAlbumCard";

const gridClass =
  "grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

function readHash(): SharedCollection | null {
  if (typeof window === "undefined") return null;
  const code = new URLSearchParams(window.location.hash.slice(1)).get("c");
  return code ? decodeShare(code) : null;
}

export default function SharedCollectionView() {
  const { items, ready } = useCollection();
  const [shared, setShared] = useState<SharedCollection | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => setShared(readHash());
    sync();
    setLoaded(true);
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const ownedCount = useMemo(() => {
    if (!shared || !ready) return 0;
    const mine = new Set(items.map((i) => i.id));
    return shared.albums.reduce((n, a) => n + (mine.has(a.id) ? 1 : 0), 0);
  }, [shared, items, ready]);

  if (!loaded) {
    return <p className="py-16 text-center text-[15px] text-secondary">Loading…</p>;
  }

  if (!shared || shared.albums.length === 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Shared collection</h1>
        <p className="mt-3 text-[15px] text-secondary">
          This share link is empty or invalid. Ask for a fresh link, or start
          your own collection.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-full bg-accent px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Go to Vinyl Nation
        </Link>
      </div>
    );
  }

  const count = shared.albums.length;

  return (
    <div>
      <p className="text-[13px] font-medium uppercase tracking-wide text-secondary">
        Shared collection
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
        {shared.name || "A vinyl collection"}
      </h1>
      <p className="mt-2 text-[14px] text-secondary">
        {count} record{count === 1 ? "" : "s"}
        {ready && ownedCount > 0
          ? ` · you already have ${ownedCount} of these`
          : ""}
      </p>

      <div className={`mt-8 ${gridClass}`}>
        {shared.albums.map((album) => (
          <SharedAlbumCard key={album.id} album={album} />
        ))}
      </div>

      <p className="mt-12 text-center text-[13px] text-secondary">
        This is a snapshot someone shared with you.{" "}
        <Link href="/" className="underline hover:text-accent">
          Build your own collection
        </Link>
        .
      </p>
    </div>
  );
}
