import CoverImage from "./CoverImage";

/**
 * The album as a vinyl record (picture disc): the cover art is pressed onto the
 * disc and clipped to a circle so everything outside is cut away — with a
 * groove/sheen/vignette overlay and a center spindle hole. Fills its square cell;
 * size it via the parent. In a `group` (e.g. AlbumCard) it lifts slightly on hover.
 */
export default function VinylArtwork({
  src,
  alt,
}: {
  src?: string;
  alt: string;
  /** Kept for call-site compatibility; the disc looks the same everywhere. */
  variant?: "grid" | "detail";
}) {
  return (
    <div className="relative aspect-square">
      <div className="vinyl-disc absolute inset-0 overflow-hidden rounded-full transition-transform duration-500 ease-out group-hover:scale-[1.03]">
        {/* Album art pressed onto the record (square art cropped to the circle). */}
        <CoverImage src={src} alt={alt} className="h-full w-full" />
        {/* Groove/sheen/vignette overlay so it still reads as vinyl. */}
        <span className="vinyl-grooves absolute inset-0 rounded-full" />
        {/* Center spindle hole. */}
        <span className="absolute left-1/2 top-1/2 aspect-square h-[6%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/80 ring-1 ring-white/25" />
      </div>
    </div>
  );
}
