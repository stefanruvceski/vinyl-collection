"use client";

import Link from "next/link";
import { useCollection } from "@/lib/useCollection";
import { SharedAlbum } from "@/lib/share";
import VinylArtwork from "./VinylArtwork";

/**
 * Read-only album card for a shared collection. It does not mutate anything;
 * instead it flags the ones the viewer already owns (their own localStorage),
 * which is the useful signal when comparing collections for a trade.
 */
export default function SharedAlbumCard({ album }: { album: SharedAlbum }) {
  const { has } = useCollection();
  const owned = has(album.id);
  const href = `/album/${album.source}/${encodeURIComponent(album.sourceId)}`;

  return (
    <article className="group text-center">
      <div className="relative">
        <Link
          href={href}
          aria-label={`${album.artist} – ${album.title}`}
          className="block"
        >
          <VinylArtwork src={album.thumb} alt={`${album.artist} – ${album.title}`} />
        </Link>

        {owned && (
          <span
            title="You have this one too"
            className="absolute bottom-[7%] right-[7%] z-20 flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white shadow-md"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        )}
      </div>

      <div className="mt-3 px-1">
        <Link href={href} className="block">
          <h3 className="truncate text-[14px] font-medium leading-tight hover:text-accent">
            {album.title}
          </h3>
        </Link>
        <p className="mt-0.5 truncate text-[13px] text-secondary">
          {album.artist}
          {album.year ? ` · ${album.year}` : ""}
        </p>
        {album.condition && (
          <p className="mt-0.5 truncate text-[12px] text-secondary">
            {album.condition}
          </p>
        )}
      </div>
    </article>
  );
}
