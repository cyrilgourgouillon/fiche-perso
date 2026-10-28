/** Row counts and row shuffling for the sheet's growable lists. */

const MIN_ROWS = 1;

export const rowCountField = (list) => `${list.key}_lignes`;

/**
 * A stored count wins outright — it is how many rows the player wants, whether
 * that is more or fewer than the list's default size. Sheets saved before a
 * list could grow have no count and fall back to that default.
 */
export const listRowCount = (data, list) => {
  const stored = Number(data[rowCountField(list)]);
  return Number.isFinite(stored) && stored > 0 ? stored : list.defaultRows;
};

/** A row counts as empty when every field is blank (an unticked box included). */
export const isRowEmpty = (data, list, row) =>
  list.rowFields(row).every((key) => !data[key] || data[key] === 'false');

export const withRowAdded = (data, list) => ({
  ...data,
  [rowCountField(list)]: String(listRowCount(data, list) + 1),
});

/** Rows below `row` slide up one place, and the list loses its last row. */
export const withRowRemoved = (data, list, row) => {
  const rowCount = listRowCount(data, list);
  const next = { ...data };

  for (let target = row; target < rowCount - 1; target += 1) {
    const sourceFields = list.rowFields(target + 1);
    list.rowFields(target).forEach((key, index) => {
      const source = sourceFields[index];
      if (source in data) next[key] = data[source];
      else delete next[key];
    });
  }
  list.rowFields(rowCount - 1).forEach((key) => delete next[key]);

  next[rowCountField(list)] = String(Math.max(MIN_ROWS, rowCount - 1));
  return next;
};
