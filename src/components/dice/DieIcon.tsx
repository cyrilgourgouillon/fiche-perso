/** Shared d20 outline for every dice action in the sheet. */
export default function DieIcon({ className = 'die-icon' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16 1.5 28.5 9v14L16 30.5 3.5 23V9L16 1.5Z" />
      <path d="M16 1.5v5.7L3.5 9m12.5-1.8L28.5 9M3.5 9 7.5 22.5m21-13.5-4 13.5M16 7.2 7.5 22.5h17L16 7.2ZM7.5 22.5 16 30.5l8.5-8M7.5 22.5h17" />
    </svg>
  );
}
