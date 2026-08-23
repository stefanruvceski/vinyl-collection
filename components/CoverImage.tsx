"use client";

import { useState } from "react";

/**
 * Cover slika sa fallback-om. Discogs/CAA URL-ovi mogu 404-ovati (npr. nema cover-a),
 * pa u tom slucaju prikazemo placeholder umesto polomljene slike.
 */
export default function CoverImage({
  src,
  alt,
  className = "",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={
          "bg-elevated flex items-center justify-center text-3xl text-secondary " +
          className
        }
        aria-hidden="true"
      >
        ♫
      </div>
    );
  }

  return (
    // Namerno <img> a ne next/image: izvori (Discogs CDN / Cover Art Archive)
    // vracaju nepredvidive dimenzije i ponekad 404, pa nam treba onError fallback.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={"object-cover " + className}
    />
  );
}
