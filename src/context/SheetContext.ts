import { createContext, useContext } from 'react';
import type { SheetData } from '../hooks/useCharacterSheet';
import type { SheetHistoryEntry } from '../services/sheetHistory';

export interface SheetContextValue {
  data: SheetData;
  update: (field: string, value: unknown, options?: { textArea?: boolean }) => void;
  apply: (transform: (current: SheetData) => SheetData, actionKey?: string) => void;
  actionHistory: SheetHistoryEntry<SheetData>[];
  rollback: (id: string) => void;
}

export const SheetContext = createContext<SheetContextValue | null>(null);

/** Full sheet access: `{ data, update, apply }`. Use for computed values spanning several fields. */
export const useSheet = () => {
  const sheet = useContext(SheetContext);
  if (!sheet) throw new Error('useSheet must be used within a SheetProvider');
  return sheet;
};

/** Controlled text binding for a single sheet field — always a string, whatever was stored. */
export const useSheetField = (
  name: string,
  { textArea = false }: { textArea?: boolean } = {},
): [string, (value: string) => void] => {
  const { data, update } = useSheet();
  const value = data[name];
  return [
    value === undefined || value === null ? '' : String(value),
    (next) => update(name, next, { textArea }),
  ];
};

/** Controlled checkbox binding — flags are persisted as the strings 'true' / 'false'. */
export const useSheetFlag = (name: string): [boolean, (checked: boolean) => void] => {
  const { data, update } = useSheet();
  return [data[name] === 'true', (checked) => update(name, checked ? 'true' : 'false')];
};
