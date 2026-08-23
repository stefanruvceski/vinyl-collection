import CoverImage from "./CoverImage";

/**
 * Album sleeve with a vinyl record peeking out from behind it. The record is a
 * "picture disc": the same cover art is pressed onto it, clipped to a circle so
 * everything outside the disc is cut away — with a groove overlay and a center hole.
 * - `grid`: subtle static peek + a small slide on hover (works on touch too).
 * - `detail`: the record is pulled out further as a showcase.
 */
export default function VinylArtwork({
  src,
  alt,
  variant = "grid",
}: {
  src?: string;
  alt: string;
  variant?: "grid" | "detail";
}) {
  const detail = variant === "detail";

  return (
    <div className="relative aspect-square">
      {/* Picture-disc record, centered behind the cover then slid to the right. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={
            "vinyl-disc relative aspect-square h-[92%] overflow-hidden rounded-full transition-transform duration-500 ease-out " +
            (detail
              ? "translate-x-[32%]"
              : "translate-x-[12%] group-hover:translate-x-[20%]")
          }
        >
          {/* Album art pressed onto the record (square art cropped to the circle). */}
          <CoverImage src={src} alt="" className="h-full w-full" />
          {/* Groove/sheen/vignette overlay so it still reads as vinyl. */}
          <span className="vinyl-grooves absolute inset-0 rounded-full" />
          {/* Center spindle hole. */}
          <span className="absolute left-1/2 top-1/2 aspect-square h-[6%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/80 ring-1 ring-white/25" />
        </div>
      </div>

      {/* Cover sleeve on top. */}
      <div className="relative z-10 h-full w-full overflow-hidden rounded-xl bg-elevated shadow-cover">
        <CoverImage src={src} alt={alt} className="h-full w-full" />
      </div>
    </div>
  );
}
