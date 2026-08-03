import { useCallback, useRef } from 'react';
import { downloadSheet, readFileAsText } from '../services/sheetFiles.js';
import { parseSheet } from '../services/sheetSerializer.js';

/** Wires the hidden file input to sheet import, and the toolbar button to sheet export. */
export function useSheetFile({ data, onImport, notify }) {
  const inputRef = useRef(null);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const importFile = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try {
        onImport(parseSheet(await readFileAsText(file)));
        notify('✓ Fichier chargé');
      } catch {
        notify('Fichier JSON invalide');
      }
    },
    [onImport, notify],
  );

  const exportFile = useCallback(() => notify(`✓ ${downloadSheet(data)} téléchargé`), [data, notify]);

  return { inputRef, openPicker, importFile, exportFile };
}
