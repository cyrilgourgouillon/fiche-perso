import { useSheet } from '../context/SheetContext';
import { range } from '../utils/range';

export function useListFolding(list, rowCount) {
  const { data, apply } = useSheet();
  const foldField = (row) => list.field(row, 'replie');
  const foldedCount = range(rowCount).filter((row) => data[foldField(row)] === 'true').length;
  const setAllFolded = (folded) => apply((current) => ({
    ...current,
    ...Object.fromEntries(range(rowCount).map((row) => [foldField(row), String(folded)])),
  }));

  return {
    foldedCount,
    foldAll: () => setAllFolded(true),
    unfoldAll: () => setAllFolded(false),
  };
}
