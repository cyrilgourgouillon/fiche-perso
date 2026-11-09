import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { DEFAULT_THEME } from '../data/themes';
import {
  STORAGE_KEY, parseStoredSheet, readStoredSheet, writeStoredSheet,
} from '../services/sheetStorage';
import type { NotifyStatus } from './useStatusMessage';

const FAILED_MESSAGE = '⚠ Sauvegarde impossible';
const OTHER_TAB_MESSAGE = '↻ Fiche mise à jour depuis un autre onglet';
/** Typing bursts are written once: serialising the whole sheet per keystroke is wasted work. */
const SAVE_DELAY_MS = 250;

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
  latest.current = data;

  const update = useCallback(
    (name: string, value: unknown) => setData((current) => ({ ...current, [name]: value })),
    [],
  );
  const setTheme = useCallback((value: string) => update('theme', value), [update]);

  /** Rewrites the sheet through a pure transform — row shuffling, rests, … */
  const apply = useCallback(
    (transform: (current: SheetData) => SheetData) => setData((current) => transform(current)),
    [],
  );

  /** Swaps the whole sheet (import): the caller announces its own outcome instead. */
  const replace = useCallback((next: SheetData) => {
    silent.current = true;
    setData(next);
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
      stored.current = next;
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
    data, update, apply, theme, setTheme, replace,
  };
}
