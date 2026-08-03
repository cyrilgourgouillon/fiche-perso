/**
 * A d20 silhouette, drawn rather than typed.
 *
 * The character that used to sit here (U+2684) came from whatever system font
 * happened to carry it — Segoe UI Symbol on Windows, something else on iOS — so
 * the affordance looked different on every device and read like a missing glyph
 * at small sizes. This scales cleanly and takes its colour from `currentColor`,
 * which is what makes the roll mode readable at a glance.
 */
export default function DieIcon({ className = 'die-icon' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* the body, tinted so the colour reads at 20px */}
      <path d="M12 1.8 21 7v10L12 22.2 3 17V7Z" fill="currentColor" fillOpacity=".16" />
      {/* the face turned towards you */}
      <path d="M12 5.6 18 15.6H6Z" />
      {/* the three edges running off to the corners */}
      <path d="M12 5.6V1.8M18 15.6l3 1.4M6 15.6l-3 1.4M12 22.2v-6.6" />
    </svg>
  );
}
