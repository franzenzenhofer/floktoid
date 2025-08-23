// Service Worker for FLOKTOID PWA - AGGRESSIVE ONLINE FIRST!
const CACHE_VERSION = 'floktoid-v4-online-first';
let isOnline = true;
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

// Fetch event - AGGRESSIVE ONLINE FIRST with status updates
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return event.respondWith(fetch(event.request));
  }
  
  event.respondWith(
    // ALWAYS try network FIRST with aggressive timeout
    Promise.race([
      fetch(event.request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 3000)
      )
    ])
      .then((response) => {
        // Network succeeded - we're ONLINE!
        if (!isOnline) {
          isOnline = true;
          // Notify all clients we're back online
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({ type: 'NETWORK_STATUS', online: true });
            });
          });
        }
        
        // Aggressively update cache for next time
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseToCache);
            console.log('[SW] Cache aggressively updated:', event.request.url);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed - we're OFFLINE!
        if (isOnline) {
          isOnline = false;
          // Notify all clients we're offline
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({ type: 'NETWORK_STATUS', online: false });
            });
          });
        }
        
        console.log('[SW] OFFLINE - serving from cache:', event.request.url);
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            // Navigation requests get index
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Return offline message
            return new Response('Offline - Resource not cached', {
              status: 503,
              statusText: 'Offline'
            });
          });
      })
  );
});

// Message event - handle updates and status checks
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
  
  // Handle status check
  if (event.data === 'checkStatus') {
    event.ports[0].postMessage({ online: isOnline });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});