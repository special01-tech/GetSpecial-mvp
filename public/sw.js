/* =============================================================================
 * GetSpecial — Service Worker PWA Natif
 *
 * Fournit :
 * 1. Installabilité complète PWA (critères Google Chrome & Safari)
 * 2. Mode hors-ligne avec page de secours (offline.html)
 * 3. Stratégie de mise en cache hybride (Cache-First statiques, Network-First pages)
 * ============================================================================= */

const CACHE_VERSION = 'v1.0.2';
const STATIC_CACHE_NAME = `getspecial-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `getspecial-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
];

// Installation : Mise en cache des assets fondamentaux
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activation : Nettoyage des anciens caches obsolètes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE_NAME && name !== RUNTIME_CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Interception des requêtes réseau (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET ou vers des schémas non supportés (ex: chrome-extension)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. Requêtes de navigation (pages HTML) : Network-First avec fallback cache puis offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlineFallback = await caches.match('/offline.html');
          return offlineFallback || new Response('Hors-ligne', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // 2. Assets statiques (Fonts, images locales, scripts statiques) : Cache-First
  const isStaticAsset =
    !url.pathname.startsWith('/_next/') &&
    (url.pathname.startsWith('/icons/') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com') ||
      url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/));

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Toutes les autres requêtes (dont APIs) : Network-First direct
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
