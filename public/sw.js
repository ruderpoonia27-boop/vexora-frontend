const CACHE_VERSION = 'vexora-pwa-v4';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/brand/vexora-logo.png',
  '/icons/favicon.png',
  '/icons/vexora-icon-192.png',
  '/icons/vexora-icon-512.png',
  '/icons/vexora-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.registration.navigationPreload?.enable?.(),
      caches.keys().then((cacheNames) => Promise.all(
        cacheNames
          .filter((name) => ![APP_SHELL_CACHE, RUNTIME_CACHE, STATIC_CACHE].includes(name))
          .map((name) => caches.delete(name))
      ))
    ]).then(() => self.clients.claim())
  );
});

const shouldHandleRequest = (request) => (
  request.method === 'GET'
  && new URL(request.url).origin === self.location.origin
);

const isApiRequest = (request) => new URL(request.url).pathname.startsWith('/api/');

const updateCache = async (cacheName, request, responsePromise) => {
  try {
    const response = await responsePromise;
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return null;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!shouldHandleRequest(request)) return;
  if (isApiRequest(request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cachedShell = await caches.match('/index.html');
        const networkPromise = event.preloadResponse || fetch(request);
        event.waitUntil(updateCache(APP_SHELL_CACHE, '/index.html', networkPromise));
        return cachedShell
          || await networkPromise.catch(() => null)
          || await caches.match('/offline.html');
      })()
    );
    return;
  }

  const destination = request.destination;
  if (['style', 'script', 'worker', 'font', 'manifest'].includes(destination)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const networkPromise = fetch(request);
        event.waitUntil(updateCache(STATIC_CACHE, request, networkPromise));
        return cached || await networkPromise.catch(() => caches.match('/offline.html'));
      })()
    );
    return;
  }

  if (destination === 'image') {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const networkPromise = fetch(request);
        event.waitUntil(updateCache(RUNTIME_CACHE, request, networkPromise));
        return cached || await networkPromise.catch(() => caches.match('/icons/favicon.png'));
      })()
    );
  }
});
