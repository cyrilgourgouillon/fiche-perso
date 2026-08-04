/*
 * Offline support for the character sheet.
 *
 * The sheet itself lives in localStorage, so all the service worker has to do is
 * keep the app shell reachable with no network:
 *  - navigations: network first, falling back to the cached page when offline;
 *  - everything else (hashed assets, icons, Google Fonts): cache first, since a
 *    hashed file never changes and a font is worth keeping.
 *
 * Bump CACHE to retire an old set of files.
 */
const CACHE = 'fiche-perso-v1';
const SHELL = [new URL('./', self.location).pathname];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
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
  if (response && (response.ok || response.type === 'opaque')) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
};

/** Fresh page when online, cached page when not. */
const handleNavigation = async (request) => {
  try {
    return await cacheCopy(request, await fetch(request));
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true });
    return cached || caches.match(SHELL[0]);
  }
};

const handleAsset = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;
  return cacheCopy(request, await fetch(request));
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  event.respondWith(handleAsset(request));
});
