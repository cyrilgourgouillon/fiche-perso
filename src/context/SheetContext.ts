import { createContext, useContext } from 'react';
import type { SheetData } from '../hooks/useCharacterSheet';

export interface SheetContextValue {
  data: SheetData;
  update: (field: string, value: unknown) => void;
  apply: (transform: (current: SheetData) => SheetData) => void;
}

export const SheetContext = createContext<SheetContextValue | null>(null);

/** Full sheet access: `{ data, update, apply }`. Use for computed values spanning several fields. */
export const useSheet = () => {
  const sheet = useContext(SheetContext);
  if (!sheet) throw new Error('useSheet must be used within a SheetProvider');
  return sheet;
};

/** Controlled text binding for a single sheet field — always a string, whatever was stored. */
export const useSheetField = (name: string): [string, (value: string) => void] => {
  const { data, update } = useSheet();
  const value = data[name];
  return [value === undefined || value === null ? '' : String(value), (next) => update(name, next)];
};

/** Controlled checkbox binding — flags are persisted as the strings 'true' / 'false'. */
export const useSheetFlag = (name: string): [boolean, (checked: boolean) => void] => {
  const { data, update } = useSheet();
  return [data[name] === 'true', (checked) => update(name, checked ? 'true' : 'false')];
};
