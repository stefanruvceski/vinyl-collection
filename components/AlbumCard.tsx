"use client";

import Link from "next/link";
import { Album } from "@/lib/types";
import { useCollection } from "@/lib/useCollection";
import CollectionButton from "./CollectionButton";
import CoverImage from "./CoverImage";

export default function AlbumCard({ album }: { album: Album }) {
  const { has } = useCollection();
  const owned = has(album.id);
  const href = `/album/${album.source}/${encodeURIComponent(album.sourceId)}`;

  return (
    <article className="relative flex gap-4 rounded-lg border border-wax-border bg-wax-card p-3">
      {owned && (
        <span className="absolute right-3 top-3 rounded-full bg-wax-gold/15 px-2 py-0.5 text-xs font-medium text-wax-gold">
          ✅ U kolekciji
        </span>
      )}

      <Link href={href} className="shrink-0">
        <CoverImage
          src={album.thumb}
          alt={`${album.artist} – ${album.title}`}
          className="h-20 w-20 rounded-md"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={href} className="block">
          <h3 className="truncate font-semibold leading-tight hover:text-wax-gold">
            {album.title}
          </h3>
          <p className="truncate text-sm text-neutral-400">{album.artist}</p>
        </Link>

        <p className="mt-1 truncate text-xs text-neutral-500">
          {[album.year, album.format, album.label, album.catalogNumber]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="mt-2">
          <CollectionButton album={album} />
        </div>
      </div>
    </article>
  );
}
