"use client";

import Link from "next/link";
import { Album } from "@/lib/types";
import { useCollection } from "@/lib/useCollection";
import CoverImage from "./CoverImage";

export default function AlbumCard({ album }: { album: Album }) {
  const { has, toggle, ready } = useCollection();
  const owned = has(album.id);
  const href = `/album/${album.source}/${encodeURIComponent(album.sourceId)}`;

  return (
    <article className="group">
      <div className="relative">
        <Link
          href={href}
          aria-label={`${album.artist} – ${album.title}`}
          className="block overflow-hidden rounded-xl shadow-cover transition-shadow duration-300 group-hover:shadow-cover-hover"
        >
          <div className="aspect-square bg-elevated">
            <CoverImage
              src={album.thumb}
              alt={`${album.artist} – ${album.title}`}
              className="h-full w-full"
            />
          </div>
        </Link>

        <button
          type="button"
          onClick={() => toggle(album)}
          disabled={!ready}
          aria-pressed={owned}
          aria-label={owned ? "Remove from collection" : "Add to collection"}
          title={owned ? "In collection — remove" : "Add to collection"}
          className={
            "absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full text-lg shadow-md backdrop-blur-md transition disabled:opacity-50 " +
            (owned
              ? "bg-accent text-white hover:bg-accent-hover"
              : "bg-black/55 text-white opacity-0 hover:bg-black/70 focus-visible:opacity-100 group-hover:opacity-100")
          }
        >
          {owned ? (
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
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </button>
      </div>

      <div className="mt-2.5 px-0.5">
        <Link href={href} className="block">
          <h3 className="truncate text-[14px] font-medium leading-tight hover:text-accent">
            {album.title}
          </h3>
        </Link>
        <p className="mt-0.5 truncate text-[13px] text-secondary">
          {album.artist}
          {album.year ? ` · ${album.year}` : ""}
        </p>
      </div>
    </article>
  );
}
