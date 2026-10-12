// Service Worker for Viking Expenses Tracker PWA
const CACHE_NAME = 'viking-expenses-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force active state immediately without waiting for old worker to exit
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Purge any older cache versions immediately
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Take control of all open client tabs immediately
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests, API calls and Next.js internal /_next/ bundles
  if (
    !event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/_next/')
  ) {
    return;
  }

  // Network-First Strategy: Always fetch latest version from server first.
  // Fallback to cache only when user is completely offline.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Network failed (offline mode) - retrieve from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
