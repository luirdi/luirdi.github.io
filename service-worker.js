// Service Worker for FinPlanner PWA
const CACHE_VERSION = 'v2'; // Incrementar esta versão sempre que houver mudanças significativas
const CACHE_NAME = `finplanner-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/frontend/styles.css',
  '/frontend/app.js',
  '/frontend/auth.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/arrow-up.png',
  '/icons/arrow-down.png',
  '/icons/lixo_96-96.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Failed to open cache:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
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

// Fetch event - network first for HTML and JS files, cache first for other resources
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
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
          
          caches.open(CACHE_NAME)
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
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                })
                .catch(err => console.error('Failed to cache response:', err));

              return response;
            }
          );
        })
        .catch(err => console.error('Fetch failed:', err))
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