import CoverImage from "./CoverImage";

/**
 * Album sleeve with a vinyl record peeking out from behind it (CSS-drawn disc).
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
      {/* Vinyl disc, centered behind the cover then slid to the right. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={
            "vinyl-disc relative aspect-square h-[92%] rounded-full transition-transform duration-500 ease-out " +
            (detail
              ? "translate-x-[32%]"
              : "translate-x-[12%] group-hover:translate-x-[20%]")
          }
        >
          <div className="vinyl-label absolute left-1/2 top-1/2 aspect-square h-[32%] -translate-x-1/2 -translate-y-1/2 rounded-full">
            <span className="absolute left-1/2 top-1/2 aspect-square h-[15%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/70" />
          </div>
        </div>
      </div>

      {/* Cover sleeve on top. */}
      <div className="relative z-10 h-full w-full overflow-hidden rounded-xl bg-elevated shadow-cover">
        <CoverImage src={src} alt={alt} className="h-full w-full" />
      </div>
    </div>
  );
}
