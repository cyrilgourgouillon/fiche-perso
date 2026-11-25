interface ListFoldControlsProps {
  foldedCount: number;
  rowCount: number;
  foldAll: () => void;
  unfoldAll: () => void;
  isOrdering?: boolean;
  orderingDisabled?: boolean;
  onStartOrdering?: () => void;
  onSaveOrdering?: () => void;
  onCancelOrdering?: () => void;
}

export default function ListFoldControls({
  foldedCount,
  rowCount,
  foldAll,
  unfoldAll,
  isOrdering = false,
  orderingDisabled = false,
  onStartOrdering,
  onSaveOrdering,
  onCancelOrdering,
}: ListFoldControlsProps) {
  return (
    <div
      className="list-fold-controls"
      role="group"
      aria-label={isOrdering ? 'Enregistrer ou annuler la modification de l’ordre' : 'Actions sur la liste'}
    >
      {isOrdering ? (
        <>
          <button type="button" className="sheet-button list-order-save" onClick={onSaveOrdering}>
            Enregistrer
          </button>
          <button type="button" className="sheet-button list-order-cancel" onClick={onCancelOrdering}>
            Annuler
          </button>
        </>
      ) : (
        <>
          <button type="button" className="sheet-button" disabled={foldedCount === rowCount} onClick={foldAll}>
            Tout replier
          </button>
          <button type="button" className="sheet-button" disabled={foldedCount === 0} onClick={unfoldAll}>
            Tout d&eacute;plier
          </button>
          <button
            type="button"
            className="sheet-button"
            disabled={orderingDisabled}
            onClick={onStartOrdering}
            title={orderingDisabled ? 'Retirez les filtres pour modifier l’ordre des sorts' : undefined}
          >
            Modifier l&apos;ordre
          </button>
        </>
      )}
    </div>
  );
}
