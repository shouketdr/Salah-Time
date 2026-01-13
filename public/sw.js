const CACHE_NAME = 'salah-time-v3';
const assets = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 1. Install Service Worker and Cache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets for offline use');
      return cache.addAll(assets);
    })
  );
});

// 2. Serve from Cache when Offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached file or fetch from network
      return response || fetch(event.request);
    })
  );
});

// 3. Activate and remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});
