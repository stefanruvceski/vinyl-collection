"use client";

import Link from "next/link";
import { useCollection } from "@/lib/useCollection";
import AlbumCard from "./AlbumCard";

export default function CollectionList() {
  const { items, ready } = useCollection();

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

  return (
    <div>
      <p className="mb-6 text-[14px] text-secondary">
        {items.length} {items.length === 1 ? "record" : "records"}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {items.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </div>
    </div>
  );
}
