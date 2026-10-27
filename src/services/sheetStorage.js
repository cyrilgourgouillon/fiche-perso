import { parseSheet, serializeSheet } from './sheetSerializer.js';

const STORAGE_KEY = 'perso_sheet';

/** Returns an empty sheet when nothing is stored or the payload is unreadable. */
export const readStoredSheet = () => {
  try {
    return parseSheet(localStorage.getItem(STORAGE_KEY) || '{}');
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
