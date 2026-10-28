import { useCallback, useRef } from 'react';
import { downloadSheet, readFileAsText } from '../services/sheetFiles';
import { parseSheet } from '../services/sheetSerializer';

/** Wires the hidden file input to sheet import, and the toolbar button to sheet export. */
export function useSheetFile({ data, onImport, notify }) {
  const inputRef = useRef(null);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const importFile = useCallback(
    async (event) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      try {
        onImport(parseSheet(await readFileAsText(file)));
        notify('✓ Fichier chargé', 'success');
      } catch {
        notify('Fichier JSON invalide', 'error');
      }
    },
    [onImport, notify],
  );

  const exportFile = useCallback(() => notify(`✓ ${downloadSheet(data)} téléchargé`, 'success'), [data, notify]);

  return {
    inputRef, openPicker, importFile, exportFile,
  };
}
