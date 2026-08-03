import { createContext, useContext } from 'react';

export const SheetContext = createContext(null);

/** Full sheet access: `{ data, update }`. Use for computed values spanning several fields. */
export const useSheet = () => {
  const sheet = useContext(SheetContext);
  if (!sheet) throw new Error('useSheet must be used within a SheetProvider');
  return sheet;
};

/** Controlled text binding for a single sheet field. */
export const useSheetField = (name) => {
  const { data, update } = useSheet();
  return [data[name] || '', (value) => update(name, value)];
};

/** Controlled checkbox binding — flags are persisted as the strings 'true' / 'false'. */
export const useSheetFlag = (name) => {
  const { data, update } = useSheet();
  return [data[name] === 'true', (checked) => update(name, checked ? 'true' : 'false')];
};
