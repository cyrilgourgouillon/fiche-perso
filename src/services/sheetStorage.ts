import { parseSheet, serializeSheet } from './sheetSerializer';

export const STORAGE_KEY = 'perso_sheet';

/** Parses a stored payload; an empty or unreadable one gives an empty sheet. */
export const parseStoredSheet = (text: string | null) => {
  try {
    return parseSheet(text || '{}');
  } catch {
    return {};
  }
};

/** Returns an empty sheet when nothing is stored or the payload is unreadable. */
export const readStoredSheet = () => {
  try {
    return parseStoredSheet(localStorage.getItem(STORAGE_KEY));
  } catch {
    return {};
  }
};

/** Returns `true` when the sheet reached local storage (it can be full or unavailable). */
export const writeStoredSheet = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, serializeSheet(data));
    return true;
  } catch {
    return false;
  }
};
