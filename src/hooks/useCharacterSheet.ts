import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { DEFAULT_THEME } from '../data/themes';
import {
  STORAGE_KEY, parseStoredSheet, readStoredSheet, writeStoredSheet,
} from '../services/sheetStorage';
import {
  getSheetActionMergeKey,
  getSheetChanges,
  recordSheetAction,
  rollbackSheetHistory,
  type SheetHistoryEntry,
} from '../services/sheetHistory';
import type { NotifyStatus } from './useStatusMessage';

const FAILED_MESSAGE = '⚠ Sauvegarde impossible';
const OTHER_TAB_MESSAGE = '↻ Fiche mise à jour depuis un autre onglet';
/** Typing bursts are written once: serialising the whole sheet per keystroke is wasted work. */
const SAVE_DELAY_MS = 250;
const HISTORY_DEBOUNCE_MS = 1000;

export type SheetData = Record<string, any>;

interface UseCharacterSheetOptions {
  notify?: NotifyStatus;
}

/**
 * Owns the sheet field map: restores it from local storage, persists every change,
 * follows edits made in another tab, and keeps the document theme in sync.
 * Reports failed writes through `notify`.
 */
export function useCharacterSheet({ notify }: UseCharacterSheetOptions = {}) {
  const [data, setData] = useState<SheetData>(readStoredSheet);
  const theme = data.theme || DEFAULT_THEME;
  /** The sheet local storage already holds — nothing to write while `data` is this one. */
  const stored = useRef<SheetData>(data);
  /** Set by `replace`: an import announces its own outcome. */
  const silent = useRef(false);
  const latest = useRef(data);
  const historyRef = useRef<SheetHistoryEntry<SheetData>[]>([]);
  const [history, setHistory] = useState(historyRef.current);
  const nextActionId = useRef(0);
  const typingTimers = useRef(new Map<string, number>());

  const commit = useCallback((
    next: SheetData,
    label: string,
    mergeKey: string | null,
    textAreaField?: string,
  ) => {
    const previous = latest.current;
    const changed = Object.keys(previous).length !== Object.keys(next).length
      || Object.keys(previous).some((key) => !Object.is(previous[key], next[key]));
    if (!changed) return false;

    const timestamp = Date.now();
    const entry: SheetHistoryEntry<SheetData> = {
      id: `${timestamp}-${nextActionId.current += 1}`,
      label,
      timestamp,
      mergeKey,
      before: previous,
      changes: getSheetChanges(previous, next, new Set(textAreaField ? [textAreaField] : [])),
    };
    const merge = Boolean(mergeKey && typingTimers.current.has(mergeKey));
    latest.current = next;
    historyRef.current = recordSheetAction(historyRef.current, entry, merge);
    setHistory(historyRef.current);
    setData(next);
    if (mergeKey) {
      const currentTimer = typingTimers.current.get(mergeKey);
      if (currentTimer) window.clearTimeout(currentTimer);
      typingTimers.current.set(mergeKey, window.setTimeout(() => {
        typingTimers.current.delete(mergeKey);
      }, HISTORY_DEBOUNCE_MS));
    }
    return true;
  }, []);

  const update = useCallback(
    (name: string, value: unknown, options?: { textArea?: boolean }) => {
      commit(
        { ...latest.current, [name]: value },
        `Modification : ${name.replaceAll('_', ' ')}`,
        name,
        options?.textArea ? name : undefined,
      );
    },
    [commit],
  );
  const setTheme = useCallback((value: string) => update('theme', value), [update]);

  /** Rewrites the sheet through a pure transform — row shuffling, rests, … */
  const apply = useCallback(
    (transform: (current: SheetData) => SheetData, actionKey?: string) => {
      const previous = latest.current;
      const next = transform(previous);
      const changes = getSheetChanges(previous, next);
      const mergeKey = getSheetActionMergeKey(changes, actionKey);
      commit(
        next,
        changes.length > 1 ? `Action sur ${changes.length} champs` : 'Modification de la fiche',
        mergeKey,
      );
    },
    [commit],
  );

  /** Swaps the whole sheet (import): the caller announces its own outcome instead. */
  const replace = useCallback((next: SheetData) => {
    silent.current = true;
    if (!commit(next, 'Remplacement de la fiche', null)) silent.current = false;
  }, [commit]);

  const rollback = useCallback((id: string) => {
    typingTimers.current.forEach((timer) => window.clearTimeout(timer));
    typingTimers.current.clear();
    const result = rollbackSheetHistory(historyRef.current, id);
    if (!result.data) return;
    silent.current = false;
    latest.current = result.data;
    historyRef.current = result.history;
    setHistory(result.history);
    setData(result.data);
  }, []);

  useEffect(() => () => {
    typingTimers.current.forEach((timer) => window.clearTimeout(timer));
    typingTimers.current.clear();
  }, []);

  const flush = useCallback(() => {
    const { current } = latest;
    if (stored.current === current) return;
    const saved = writeStoredSheet(current);
    stored.current = current;
    if (!saved && !silent.current) notify?.(FAILED_MESSAGE, 'error');
    silent.current = false;
  }, [notify]);

  useEffect(() => {
    if (stored.current === data) return undefined;
    const timer = window.setTimeout(flush, SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [data, flush]);

  // a closing or hidden tab must not lose the last keystrokes still waiting for the timer
  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flushWhenHidden);
      flush();
    };
  }, [flush]);

  // another tab saved: take its sheet rather than overwrite it with ours on the next keystroke
  useEffect(() => {
    const followOtherTab = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || event.key !== STORAGE_KEY || event.newValue === null) return;
      const next = parseStoredSheet(event.newValue);
      typingTimers.current.forEach((timer) => window.clearTimeout(timer));
      typingTimers.current.clear();
      stored.current = next;
      latest.current = next;
      historyRef.current = [];
      setHistory([]);
      setData(next);
      notify?.(OTHER_TAB_MESSAGE, 'info');
    };
    window.addEventListener('storage', followOtherTab);
    return () => window.removeEventListener('storage', followOtherTab);
  }, [notify]);

  useEffect(() => {
    document.body.dataset.theme = theme;
    const themeColor = getComputedStyle(document.body).getPropertyValue('--toolbar-start').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);
  }, [theme]);

  return {
    data, update, apply, theme, setTheme, replace, actionHistory: history, rollback,
  };
}
