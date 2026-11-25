import { useState } from 'react';
import { useSheet } from '../context/SheetContext';
import {
  isRowEmpty, listRowCount, withRowAdded, withRowRemoved, withRowsReordered,
} from '../services/sheetRows';

/**
 * Rows of a growable list (see `data/sheetLists.js`). The count is stored as a
 * regular sheet field, so it is saved and exported with everything else.
 */
export function useListRows(list) {
  const { data, apply } = useSheet();
  const rowCount = listRowCount(data, list);
  const [order, setOrder] = useState(null);

  return {
    rowCount,
    isOrdering: order !== null,
    order: order || Array.from({ length: rowCount }, (_, index) => index),
    /** The last row cannot be removed — a list always keeps one. */
    removable: rowCount > 1,
    isRowEmpty: (row) => isRowEmpty(data, list, row),
    addRow: () => apply((current) => withRowAdded(current, list)),
    removeRow: (row) => apply((current) => withRowRemoved(current, list, row)),
    startOrdering: () => setOrder(Array.from({ length: rowCount }, (_, index) => index)),
    cancelOrdering: () => setOrder(null),
    moveRow: (position, direction) => setOrder((current) => {
      if (!current) return current;
      const target = position + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[position], next[target]] = [next[target], next[position]];
      return next;
    }),
    saveOrdering: () => {
      if (!order) return;
      apply((current) => withRowsReordered(current, list, order));
      setOrder(null);
    },
  };
}
