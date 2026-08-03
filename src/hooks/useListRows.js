import { useSheet } from '../context/SheetContext.js';
import { isRowEmpty, listRowCount, withRowAdded, withRowRemoved } from '../services/sheetRows.js';

/**
 * Rows of a growable list (see `data/sheetLists.js`). The count is stored as a
 * regular sheet field, so it is saved and exported with everything else.
 */
export function useListRows(list) {
  const { data, apply } = useSheet();
  const rowCount = listRowCount(data, list);

  return {
    rowCount,
    /** The last row cannot be removed — a list always keeps one. */
    removable: rowCount > 1,
    isRowEmpty: (row) => isRowEmpty(data, list, row),
    addRow: () => apply((current) => withRowAdded(current, list)),
    removeRow: (row) => apply((current) => withRowRemoved(current, list, row)),
  };
}
