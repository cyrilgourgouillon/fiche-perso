import { useCallback, useEffect, useRef, useState } from 'react';
import { parseSheet, serializeSheet } from '../services/sheetSerializer.js';
import {
  canLinkFile,
  forgetHandle,
  hasWritePermission,
  pickSheetFile,
  readFile,
  readStoredHandle,
  storeHandle,
  writeFile,
} from '../services/linkedFile.js';

const WRITE_DELAY_MS = 300;
const POLL_INTERVAL_MS = 2000;
const LOG_PREFIX = '[fichier lié]';

const log = {
  info: (...args) => console.info(LOG_PREFIX, ...args),
  warn: (...args) => console.warn(LOG_PREFIX, ...args),
  error: (...args) => console.error(LOG_PREFIX, ...args),
};

const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString();

export function useLinkedFile({ data, onLoad, notify }) {
  const [handle, setHandle] = useState(null);
  const [status, setStatus] = useState('none');
  const baselineText = useRef(null);
  const loadedSheet = useRef(null);
  const busy = useRef(false);
  const restored = useRef(false);
  const connectionVersion = useRef(0);

  const load = useCallback(async (target, fileContents, isCurrent = () => true) => {
    const { text, modifiedAt } = fileContents || await readFile(target);
    const sheet = parseSheet(text);
    if (!isCurrent()) return false;
    baselineText.current = text;
    loadedSheet.current = sheet;
    onLoad(sheet);
    log.info(`lu ${target.name}`, {
      champs: Object.keys(sheet).length,
      octets: text.length,
      modifié: formatTime(modifiedAt),
    });
    return true;
  }, [onLoad]);

  const connect = useCallback(async (target) => {
    const version = ++connectionVersion.current;
    try {
      if (!(await load(target, undefined, () => version === connectionVersion.current))) return false;
    } catch (error) {
      log.error(`lecture de ${target.name} impossible`, error);
      notify(`⚠ ${target.name} illisible`);
      return false;
    }
    setHandle(target);
    setStatus('linked');
    notify(`🔗 ${target.name} lié`);
    log.info(`lié à ${target.name} — vérification toutes les ${POLL_INTERVAL_MS / 1000} s et au focus`);
    return true;
  }, [load, notify]);

  const refresh = useCallback(async (target, message, isCurrent = () => true) => {
    const fileContents = await readFile(target);
    if (!isCurrent() || fileContents.text === baselineText.current) return false;
    log.info(`${target.name} modifié ailleurs`, {
      connu: baselineText.current === null ? 'inconnu' : 'chargé',
      disque: formatTime(fileContents.modifiedAt),
    });
    if (!(await load(target, fileContents, isCurrent))) return false;
    notify(message);
    return true;
  }, [load, notify]);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (!canLinkFile) return;

    readStoredHandle()
      .then(async (stored) => {
        if (!stored) {
          log.info('aucun fichier lié');
          return;
        }
        setHandle(stored);
        try {
          if (await hasWritePermission(stored)) {
            log.info(`permission accordée pour ${stored.name}, restauration du lien`);
            if (!(await connect(stored))) setStatus('reconnect');
          } else {
            log.warn(`permission à renouveler pour ${stored.name}`);
            setStatus('reconnect');
          }
        } catch (error) {
          log.error(`restauration du lien vers ${stored.name} impossible`, error);
          setStatus('reconnect');
          notify(`⚠ Reconnexion nécessaire pour ${stored.name}`);
        }
      })
      .catch((error) => {
        log.error('lecture du lien mémorisé impossible', error);
        notify('⚠ Lecture du lien mémorisé impossible');
      });
  }, [connect, notify]);

  useEffect(() => {
    if (status !== 'linked' || data === loadedSheet.current) return undefined;
    const version = connectionVersion.current;
    let timer;
    const writeWhenIdle = async () => {
      if (version !== connectionVersion.current) return;
      if (busy.current) {
        timer = window.setTimeout(writeWhenIdle, 100);
        return;
      }
      busy.current = true;
      try {
        if (await refresh(
          handle,
          `↻ ${handle.name} modifié ailleurs, rechargé`,
          () => version === connectionVersion.current,
        )) {
          log.warn('modification locale abandonnée : le fichier a changé et il gagne');
          return;
        }
        if (version !== connectionVersion.current) return;
        const text = serializeSheet(data);
        await writeFile(handle, text);
        if (version !== connectionVersion.current) return;
        baselineText.current = text;
        loadedSheet.current = data;
        log.info(`écrit ${handle.name}`, { octets: text.length });
      } catch (error) {
        log.error(`écriture de ${handle.name} impossible`, error);
        notify(`⚠ Écriture de ${handle.name} impossible`);
      } finally {
        busy.current = false;
      }
    };
    timer = window.setTimeout(writeWhenIdle, WRITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [data, status, handle, refresh, notify]);

  useEffect(() => {
    if (status !== 'linked') return undefined;
    const checkFile = async () => {
      if (busy.current || document.visibilityState !== 'visible') return;
      const version = connectionVersion.current;
      busy.current = true;
      try {
        await refresh(handle, `↻ ${handle.name} rechargé`, () => version === connectionVersion.current);
      } catch (error) {
        log.error(`lecture de ${handle.name} impossible`, error);
        notify(`⚠ Lecture de ${handle.name} impossible`);
      } finally {
        busy.current = false;
      }
    };
    const interval = window.setInterval(checkFile, POLL_INTERVAL_MS);
    window.addEventListener('focus', checkFile);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', checkFile);
    };
  }, [status, handle, refresh, notify]);

  const link = useCallback(async () => {
    let picked;
    try {
      picked = await pickSheetFile();
    } catch (error) {
      if (error?.name === 'AbortError') {
        log.info('sélection de fichier annulée');
        return;
      }
      log.error('sélection de fichier impossible', error);
      notify('⚠ Sélection du fichier impossible');
      return;
    }

    try {
      if (!(await hasWritePermission(picked, true))) {
        log.warn(`permission d’écriture refusée pour ${picked.name}`);
        notify(`⚠ Accès à ${picked.name} refusé`);
        return;
      }
      await storeHandle(picked);
      if (!(await connect(picked))) {
        await forgetHandle();
      }
    } catch (error) {
      log.error(`liaison de ${picked.name} impossible`, error);
      notify(`⚠ Liaison de ${picked.name} impossible`);
    }
  }, [connect, notify]);

  const reconnect = useCallback(async () => {
    if (!handle) return;
    log.info(`reconnexion à ${handle.name}`);
    try {
      if (!(await hasWritePermission(handle, true))) {
        log.warn(`permission d’écriture refusée pour ${handle.name}`);
        notify(`⚠ Accès à ${handle.name} refusé`);
        return;
      }
      await connect(handle);
    } catch (error) {
      log.error(`reconnexion à ${handle.name} impossible`, error);
      notify(`⚠ Reconnexion à ${handle.name} impossible`);
    }
  }, [handle, connect, notify]);

  const unlink = useCallback(async () => {
    try {
      await forgetHandle();
      connectionVersion.current += 1;
      log.info(`délié de ${handle?.name || 'la fiche'}`);
      setHandle(null);
      setStatus('none');
      baselineText.current = null;
      loadedSheet.current = null;
      notify('Fichier délié');
    } catch (error) {
      log.error('suppression du lien mémorisé impossible', error);
      notify('⚠ Impossible de délier le fichier');
    }
  }, [handle, notify]);

  return { available: canLinkFile, status, fileName: handle?.name, link, reconnect, unlink };
}
