const DB_NAME = 'fiche-perso';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'linked_file';
const READ_WRITE: FileSystemPermissionDescriptor = { mode: 'readwrite' };
const PICKER_TYPES = [{ description: 'Fiche JSON', accept: { 'application/json': ['.json'] } }];

export const canLinkFile = typeof window !== 'undefined'
  && typeof window.showOpenFilePicker === 'function'
  && typeof indexedDB !== 'undefined';

const withStore = <T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) => new Promise<T>((resolve, reject) => {
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
export const readStoredHandle = () => withStore<FileSystemFileHandle | undefined>('readonly', (store) => store.get(HANDLE_KEY));
export const forgetHandle = () => withStore('readwrite', (store) => store.delete(HANDLE_KEY));

export const pickSheetFile = async () => {
  const [handle] = await window.showOpenFilePicker({ types: PICKER_TYPES });
  if (!handle) throw new Error('Aucun fichier sélectionné');
  return handle;
};

/** The parts of a file handle each helper needs — tests pass small fakes. */
type PermissionHandle = {
  queryPermission?(descriptor?: FileSystemPermissionDescriptor): Promise<string>;
  requestPermission?(descriptor?: FileSystemPermissionDescriptor): Promise<string>;
};
type ReadableHandle = { getFile(): Promise<{ text(): Promise<string>; lastModified: number }> };
type WritableHandle = {
  createWritable: () => Promise<Record<'write' | 'close' | 'abort', (text?: string) => Promise<unknown>>>;
};

export const hasWritePermission = async (handle: PermissionHandle, ask = false) => {
  const permission = ask ? handle.requestPermission : handle.queryPermission;
  if (typeof permission !== 'function') throw new Error('Vérification des permissions indisponible');
  return (await permission.call(handle, READ_WRITE)) === 'granted';
};

export const readFile = async (handle: ReadableHandle) => {
  const file = await handle.getFile();
  return { text: await file.text(), modifiedAt: file.lastModified };
};

export const writeFile = async (handle: WritableHandle, text: string) => {
  const writable = await handle.createWritable();
  try {
    await writable.write(text);
  } catch (error) {
    await writable.abort();
    throw error;
  }
  await writable.close();
};
