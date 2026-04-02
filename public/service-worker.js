const CACHE_NAME = 'finapp-v2';
const URLS = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png'
];

// INSTALL
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS))
  );
});

// ACTIVATE
self.addEventListener('activate', (e) => {
  self.clients.claim();
});

// FETCH (OFFLINE FIRST)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((res) => {
      return res || fetch(event.request).catch(() => {
        return new Response('Offline Mode', {
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
