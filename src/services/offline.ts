/**
 * Registers the service worker that makes the sheet usable with no network.
 *
 * Only in a production build: in dev it would sit in front of Vite's module
 * graph and serve stale files instead of hot updates.
 */
export const registerServiceWorker = () => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // offline support is a bonus; the sheet works without it
    });
  });
};
