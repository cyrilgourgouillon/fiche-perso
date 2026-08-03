import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_THEME } from '../data/themes.js';
import { readStoredSheet, writeStoredSheet } from '../services/sheetStorage.js';

const SAVED_MESSAGE = '✓ Sauvegardé';
const FAILED_MESSAGE = '⚠ Sauvegarde impossible';

/**
 * Owns the sheet field map: restores it from local storage, persists every change,
 * and keeps the document theme in sync. Reports each write through `notify` so the
 * toolbar only claims "sauvegardé" once a save really happened.
 */
export function useCharacterSheet({ notify } = {}) {
  const [data, setData] = useState(readStoredSheet);
  const theme = data.theme || DEFAULT_THEME;
  const written = useRef(null);
  const silent = useRef(false);

  const update = useCallback(
    (name, value) => setData((current) => ({ ...current, [name]: value })),
    [],
  );
  const setTheme = useCallback((value) => update('theme', value), [update]);

  /** Rewrites the sheet through a pure transform — row shuffling, rests, … */
  const apply = useCallback((transform) => setData((current) => transform(current)), []);

  /** Swaps the whole sheet (import): the caller announces its own outcome instead. */
  const replace = useCallback((next) => {
    silent.current = true;
    setData(next);
  }, []);

  useEffect(() => {
    // re-running the effect on the same sheet (StrictMode remount) is not a save
    if (written.current !== data) {
      const saved = writeStoredSheet(data);
      // the very first write only mirrors what was just restored — nothing to report
      if (written.current !== null && !silent.current) notify?.(saved ? SAVED_MESSAGE : FAILED_MESSAGE);
      written.current = data;
    }
    silent.current = false;
  }, [data, notify]);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  return { data, update, apply, theme, setTheme, replace };
}
