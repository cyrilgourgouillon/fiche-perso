/** One die of the tray. The silhouette comes from CSS, the colours from the theme. */
export default function DieButton({ sides, shape, onClick }) {
  return (
    <button
      type="button"
      className={`die die-${shape}`}
      onClick={onClick}
      title={`Lancer un d${sides}`}
      aria-label={`Lancer un d${sides}`}
    >
      <span className="die-label">d{sides}</span>
    </button>
  );
}
