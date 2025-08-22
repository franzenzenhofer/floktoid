// Service Worker for FLOKTOID PWA - ONLINE FIRST!
const CACHE_VERSION = 'floktoid-v3-' + Date.now(); // Bust cache on every deploy
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

// Fetch event - ONLINE FIRST, cache as fallback only
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return event.respondWith(fetch(event.request));
  }
  
  event.respondWith(
    // Try network FIRST
    fetch(event.request)
      .then((response) => {
        // If network succeeds, cache it and return
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          
          caches.open(CACHE_VERSION)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed - try cache as FALLBACK only
        console.log('[SW] Network failed, trying cache for:', event.request.url);
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              console.log('[SW] Found in cache:', event.request.url);
              return response;
            }
            
            // If not in cache and it's a navigation request, return index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Otherwise return a proper error
            return new Response('Network error and no cache available', {
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
});

// Clear old caches on startup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});