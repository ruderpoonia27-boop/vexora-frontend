const CACHE_VERSION = 'vexora-pwa-v3';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

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
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((name) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(name))
        .map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

const shouldHandleRequest = (request) => (
  request.method === 'GET'
  && new URL(request.url).origin === self.location.origin
);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!shouldHandleRequest(request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (
          await caches.match(request)
          || await caches.match('/index.html')
          || await caches.match('/offline.html')
        ))
    );
    return;
  }

  const destination = request.destination;
  if (['style', 'script', 'worker', 'font', 'image', 'manifest'].includes(destination)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
