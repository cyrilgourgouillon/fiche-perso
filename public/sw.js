/*
 * Offline support for the character sheet.
 *
 * The sheet itself lives in localStorage, so all the service worker has to do is
 * keep the app shell reachable with no network:
 *  - navigations: network first, falling back to the cached page when offline;
 *  - hashed build files (`assets/`, fonts included): cache first, a hashed file never changes;
 *  - other same-origin files (manifest, icons): network first, so an update is picked up.
 *
 * Each successful page load syncs the cache with the build's asset manifest: every
 * file is precached (lazy chunks included) and files of older deploys are dropped,
 * so the cache does not grow with every deploy. Bump CACHE to retire everything.
 */
const CACHE = 'fiche-perso-v3';
const SHELL = [new URL('./', self.location).pathname];
const ASSETS_PATH = new URL('./assets/', self.location).pathname;
const MANIFEST_URL = new URL('./asset-manifest.json', self.location).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => syncBuildFiles().catch(() => {}))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const cacheCopy = async (request, response) => {
  if (response && response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
};

/** Every file of the current build, from the manifest Vite writes (see vite.config.ts). */
const buildFiles = async () => {
  const response = await fetch(MANIFEST_URL, { cache: 'no-cache' });
  if (!response.ok) throw new Error('asset manifest unavailable');
  const files = new Set();
  Object.values(await response.json()).forEach((chunk) => {
    [chunk.file, ...(chunk.css || []), ...(chunk.assets || [])]
      // every browser with service workers reads woff2: the .woff fallbacks are never fetched
      .filter((file) => file && !file.endsWith('.woff'))
      .forEach((file) => files.add(new URL(`./${file}`, self.location).href));
  });
  return files;
};

/**
 * Caches what the current build needs — lazily loaded chunks too, so they work offline
 * before first use — and drops the files of older builds.
 */
const syncBuildFiles = async () => {
  const files = await buildFiles();
  const cache = await caches.open(CACHE);
  const cached = await cache.keys();
  const cachedUrls = new Set(cached.map((request) => request.url));
  await Promise.all(cached
    .filter((request) => new URL(request.url).pathname.startsWith(ASSETS_PATH) && !files.has(request.url))
    .map((request) => cache.delete(request)));
  await Promise.all([...files]
    .filter((url) => !cachedUrls.has(url))
    .map((url) => cache.add(url).catch(() => {})));
};

/** Fresh page when online, cached page when not. */
const handleNavigation = async (request) => {
  try {
    const response = await cacheCopy(request, await fetch(request));
    if (response.ok) syncBuildFiles().catch(() => {});
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true });
    return cached || caches.match(SHELL[0]);
  }
};

const handleHashedAsset = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  return cacheCopy(request, await fetch(request));
};

const handleOtherFile = async (request) => {
  try {
    return await cacheCopy(request, await fetch(request));
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
  } else if (url.pathname.startsWith(ASSETS_PATH)) {
    event.respondWith(handleHashedAsset(request));
  } else {
    event.respondWith(handleOtherFile(request));
  }
});
