import { SPELLS } from '../data/sheetLists';

/** Old sheets used spell level 0 to mean cantrip; retain that meaning until changed explicitly. */
export const isCantrip = (data, row) => {
  const flag = data[SPELLS.field(row, 'cantrip')];
  if (flag !== undefined) return flag === 'true';
  return String(data[SPELLS.field(row, 'niveau')] ?? '') === '0';
};
