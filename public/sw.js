// Service Worker for FLOKTOID PWA - ONLINE FIRST!
const CACHE_VERSION = 'floktoid-v5-online-first';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/game-screenshot.png',
  '/leaderboard',
  '/leaderboard.html',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force immediate activation
  );
});

// Activate event - clean up ALL old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ALL old caches
          if (cacheName !== CACHE_VERSION) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - ONLINE FIRST, cache as fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return event.respondWith(fetch(event.request));
  }
  
  event.respondWith(
    // Try network first
    fetch(event.request)
      .then((response) => {
        // Network succeeded - update cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed - use cache as fallback
        console.log('[SW] Network failed, trying cache:', event.request.url);
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              // Notify client we're serving from cache
              self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                  client.postMessage({ type: 'SERVING_FROM_CACHE', url: event.request.url });
                });
              });
              return response;
            }
            
            // Navigation requests get index
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Return error
            return new Response('Network error and no cache', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Message event - handle updates
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // Handle cache clear message
  if (event.data === 'clearCache') {
    caches.keys().then((names) => {
      names.forEach(name => caches.delete(name));
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});