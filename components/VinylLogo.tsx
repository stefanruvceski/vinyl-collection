/**
 * Brand mark: a small vinyl record — dark grooved disc with an accent-red
 * centre label and spindle hole. Used in the header (and mirrored in
 * `app/icon.svg` for the browser-tab favicon).
 */
export default function VinylLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Vinyl Nation"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="vinyl-disc" cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#3a3a3d" />
          <stop offset="55%" stopColor="#161618" />
          <stop offset="100%" stopColor="#050506" />
        </radialGradient>
      </defs>
      {/* Disc */}
      <circle
        cx="16"
        cy="16"
        r="15.2"
        fill="url(#vinyl-disc)"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.6"
      />
      {/* Grooves */}
      <g stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" fill="none">
        <circle cx="16" cy="16" r="12.4" />
        <circle cx="16" cy="16" r="10.4" />
        <circle cx="16" cy="16" r="8.5" />
      </g>
      {/* Centre label */}
      <circle cx="16" cy="16" r="5.1" fill="#fa2b42" />
      {/* Spindle hole */}
      <circle cx="16" cy="16" r="1.15" fill="#0a0a0b" />
    </svg>
  );
}
