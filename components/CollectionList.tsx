"use client";

import Link from "next/link";
import { useCollection } from "@/lib/useCollection";
import AlbumCard from "./AlbumCard";

export default function CollectionList() {
  const { items, ready } = useCollection();

  if (!ready) {
    return <p className="py-10 text-center text-neutral-500">Učitavam…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-400">Tvoja kolekcija je još prazna.</p>
        <Link
          href="/"
          className="mt-3 inline-block rounded-md bg-wax-gold px-4 py-2 text-sm font-medium text-black hover:bg-wax-gold/90"
        >
          Pretraži i dodaj prvu ploču
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-500">
        {items.length} {items.length === 1 ? "ploča" : "ploča"} u kolekciji
      </p>
      <div className="grid gap-3">
        {items.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
}
