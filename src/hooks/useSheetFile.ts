import { useCallback, useRef } from 'react';
import { downloadSheet, readFileAsText } from '../services/sheetFiles';
import { parseSheet } from '../services/sheetSerializer';
import type { NotifyStatus } from './useStatusMessage';

interface UseSheetFileOptions {
  data: Record<string, any>;
  onImport: (sheet: Record<string, any>) => void;
  notify: NotifyStatus;
  /** Asks before the current sheet is replaced; `window.confirm` by default. */
  confirmReplace?: (message: string) => boolean;
}

// eslint-disable-next-line no-alert -- the native dialog is enough for this rare, blocking choice
const askBrowser = (message: string) => window.confirm(message);

/** Wires the hidden file input to sheet import, and the toolbar button to sheet export. */
export function useSheetFile({
  data, onImport, notify, confirmReplace = askBrowser,
}: UseSheetFileOptions) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const importFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      let sheet;
      try {
        sheet = parseSheet(await readFileAsText(file));
      } catch {
        notify('Fichier JSON invalide', 'error');
        return;
      }
      const name = String(sheet.nom_personnage || file.name);
      if (!confirmReplace(`Remplacer la fiche actuelle par « ${name} » ?\n\nLa fiche actuelle sera perdue si vous ne l’avez pas sauvegardée.`)) {
        notify('Chargement annulé', 'info');
        return;
      }
      onImport(sheet);
      notify('✓ Fichier chargé', 'success');
    },
    [onImport, notify, confirmReplace],
  );

  const exportFile = useCallback(() => notify(`✓ ${downloadSheet(data)} téléchargé`, 'success'), [data, notify]);

  return {
    inputRef, openPicker, importFile, exportFile,
  };
}
