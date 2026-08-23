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
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 " +
        (owned
          ? "bg-wax-gold/15 text-wax-gold hover:bg-wax-gold/25"
          : "bg-wax-gold text-black hover:bg-wax-gold/90") +
        (className ? " " + className : "")
      }
    >
      {owned ? "✅ Owned — remove" : "➕ Add to collection"}
    </button>
  );
}
