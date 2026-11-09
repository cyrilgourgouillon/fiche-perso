interface ListFoldControlsProps {
  foldedCount: number;
  rowCount: number;
  foldAll: () => void;
  unfoldAll: () => void;
}

export default function ListFoldControls({
  foldedCount, rowCount, foldAll, unfoldAll,
}: ListFoldControlsProps) {
  return (
    <div className="list-fold-controls" role="group" aria-label="Replier ou déplier toutes les entrées">
      <button type="button" className="sheet-button" disabled={foldedCount === rowCount} onClick={foldAll}>
        Tout replier
      </button>
      <button type="button" className="sheet-button" disabled={foldedCount === 0} onClick={unfoldAll}>
        Tout d&eacute;plier
      </button>
    </div>
  );
}
