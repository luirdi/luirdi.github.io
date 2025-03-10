// Service Worker for FinPlanner PWA
const CACHE_NAME = 'finplanner-v2'; // Incrementei a versão do cache
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
  '/icons/lixo_96-96.png'
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
  // Take control of all clients as soon as the service worker activates
  event.waitUntil(clients.claim());
  
  const cacheWhitelist = [CACHE_NAME];
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

// Fetch event - implement network-first strategy for HTML and JS files
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Network-first strategy for HTML and JS files to ensure fresh content
  if (requestUrl.pathname.endsWith('.html') || 
      requestUrl.pathname.endsWith('.js') || 
      requestUrl.pathname === '/' || 
      requestUrl.pathname === '') {
    
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
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first strategy for other resources
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          return fetch(event.request).then(
            response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
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