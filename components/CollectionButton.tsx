"use client";

import { useCollection } from "@/lib/useCollection";
import { Album } from "@/lib/types";

export default function CollectionButton({
  album,
  className = "",
}: {
  album: Album;
  className?: string;
}) {
  const { has, toggle, ready } = useCollection();
  const owned = has(album.id);

  return (
    <button
      type="button"
      onClick={() => toggle(album)}
      disabled={!ready}
      aria-pressed={owned}
      className={
        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium transition-colors disabled:opacity-50 " +
        (owned
          ? "bg-elevated border border-hair text-secondary hover:text-accent"
          : "bg-accent text-white hover:bg-accent-hover") +
        (className ? " " + className : "")
      }
    >
      {owned ? (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          In your collection
        </>
      ) : (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add to collection
        </>
      )}
    </button>
  );
}
