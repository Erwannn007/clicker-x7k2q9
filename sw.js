// Service worker d'Abysses : cache-first, cache versionné.
// Change CACHE_VERSION à chaque mise à jour du jeu pour forcer le rafraîchissement.
const CACHE_VERSION = 'abysses-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

// Supprime TOUS les autres caches de ce site, y compris ceux d'anciennes apps.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Ne lit que dans le cache de la version actuelle.
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.open(CACHE_VERSION).then(cache =>
      cache.match(req, { ignoreSearch: true }).then(hit => {
        if (hit) return hit;
        return fetch(req).then(res => {
          if (res && res.ok && new URL(req.url).origin === self.location.origin) cache.put(req, res.clone());
          return res;
        }).catch(() => req.mode === 'navigate' ? cache.match('./index.html') : undefined);
      })
    )
  );
});
