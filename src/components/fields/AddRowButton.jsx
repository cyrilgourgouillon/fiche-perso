/** Appends one empty line to a growable list. */
export default function AddRowButton({ label, onClick }) {
  return (
    <button type="button" className="add-row" onClick={onClick}>
      + {label}
    </button>
  );
}
