const CACHE_NAME = 'finapps-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// INSTALL
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((names) =>
        Promise.all(
          names.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      )
    ])
  );
});

// FETCH
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Navigation (halaman)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Asset (css, js, img)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
