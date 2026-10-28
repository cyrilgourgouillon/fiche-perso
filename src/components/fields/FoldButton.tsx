/** Small caret button for folding one entry away without touching its data. */
export default function FoldButton({ folded, onToggle, label }) {
  return (
    <button
      type="button"
      className="fold-button"
      aria-expanded={!folded}
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      <span className="fold-caret" aria-hidden="true" />
    </button>
  );
}
