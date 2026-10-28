const DB_NAME = 'fiche-perso';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'linked_file';
const READ_WRITE = { mode: 'readwrite' };
const PICKER_TYPES = [{ description: 'Fiche JSON', accept: { 'application/json': ['.json'] } }];

export const canLinkFile = typeof window !== 'undefined'
  && typeof window.showOpenFilePicker === 'function'
  && typeof indexedDB !== 'undefined';

const withStore = (mode, run) =>
  new Promise((resolve, reject) => {
    const opening = indexedDB.open(DB_NAME, 1);
    opening.onupgradeneeded = () => {
      if (!opening.result.objectStoreNames.contains(STORE_NAME)) {
        opening.result.createObjectStore(STORE_NAME);
      }
    };
    opening.onerror = () => reject(opening.error);
    opening.onblocked = () => reject(new Error('IndexedDB est bloquée'));
    opening.onsuccess = () => {
      const db = opening.result;
      let request;
      try {
        const transaction = db.transaction(STORE_NAME, mode);
        request = run(transaction.objectStore(STORE_NAME));
        transaction.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
        transaction.onabort = () => {
          db.close();
          reject(transaction.error || new Error('Transaction IndexedDB annulée'));
        };
      } catch (error) {
        db.close();
        reject(error);
      }
    };
  });

export const storeHandle = (handle) => withStore('readwrite', (store) => store.put(handle, HANDLE_KEY));
export const readStoredHandle = () => withStore('readonly', (store) => store.get(HANDLE_KEY));
export const forgetHandle = () => withStore('readwrite', (store) => store.delete(HANDLE_KEY));

export const pickSheetFile = async () => {
  const [handle] = await window.showOpenFilePicker({ types: PICKER_TYPES });
  if (!handle) throw new Error('Aucun fichier sélectionné');
  return handle;
};

export const hasWritePermission = async (handle, ask = false) => {
  const permission = ask ? handle.requestPermission : handle.queryPermission;
  if (typeof permission !== 'function') throw new Error('Vérification des permissions indisponible');
  return (await permission.call(handle, READ_WRITE)) === 'granted';
};

export const readFile = async (handle) => {
  const file = await handle.getFile();
  return { text: await file.text(), modifiedAt: file.lastModified };
};

export const writeFile = async (handle, text) => {
  const writable = await handle.createWritable();
  try {
    await writable.write(text);
  } catch (error) {
    await writable.abort();
    throw error;
  }
  await writable.close();
};
