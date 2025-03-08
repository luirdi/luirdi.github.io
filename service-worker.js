// Service Worker for FinPlanner PWA
const CACHE_VERSION = 'v3'; // Incrementar esta versão sempre que houver mudanças significativas
const CACHE_NAME = `finplanner-${CACHE_VERSION}`;
// Separate cache for third-party resources
const THIRD_PARTY_CACHE = `third-party-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/frontend/styles.css',
  '/frontend/app.js',
  '/frontend/auth.js',
  '/frontend/logo.ico',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-256x256.png',
  '/icons/icon-512x512.png',
  '/icons/arrow-up.png',
  '/icons/arrow-down.png',
  '/icons/lixo_96-96.png'
];

const thirdPartyUrlsToCache = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
  'https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth-compat.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    Promise.all([
      // Cache local resources
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('Local cache opened');
          return cache.addAll(urlsToCache);
        }),
      // Cache third-party resources separately
      caches.open(THIRD_PARTY_CACHE)
        .then(cache => {
          console.log('Third-party cache opened');
          return cache.addAll(thirdPartyUrlsToCache);
        })
    ])
    .catch(err => console.error('Failed to open cache:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, THIRD_PARTY_CACHE];
  
  // Take control of all clients as soon as it activates
  event.waitUntil(self.clients.claim());
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .catch(err => console.error('Failed to delete old caches:', err))
  );
});

// Fetch event - improved caching strategy
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle third-party resources
  const isThirdParty = !event.request.url.startsWith(self.location.origin);
  const cacheName = isThirdParty ? THIRD_PARTY_CACHE : CACHE_NAME;
  
  // For HTML and JS files, try network first, then fall back to cache
  if (event.request.url.endsWith('.html') || 
      event.request.url.endsWith('.js') || 
      event.request.url === self.location.origin + '/' ||
      url.pathname === '/') {
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(cacheName)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(err => console.error('Failed to cache response:', err));
            
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // For other files, try cache first, then fall back to network
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then(
            response => {
              if (!response || response.status !== 200) {
                return response;
              }

              // Only cache resources from our origin or explicitly listed third-party resources
              if (event.request.url.startsWith(self.location.origin) || 
                  thirdPartyUrlsToCache.includes(event.request.url)) {
                const responseToCache = response.clone();
                caches.open(cacheName)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  })
                  .catch(err => console.error('Failed to cache response:', err));
              }

              return response;
            }
          );
        })
        .catch(err => {
          console.error('Fetch failed:', err);
          // For navigation requests, return the offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        })
    );
  }
});

// Add an update check mechanism
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('Checking for updates...');
    self.registration.update();
  }
});

// Handle service worker updates
self.addEventListener('updatefound', () => {
  console.log('New service worker update found!');
});

// Notify clients when service worker is activated after update
self.addEventListener('activate', event => {
  // Send message to all clients that service worker has been updated
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_UPDATED',
        version: CACHE_VERSION
      });
    });
  });
});