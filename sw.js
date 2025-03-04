// Configuração do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('finplanner-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/backend/script.js',
        '/backend/style.css',
        '/manifest.json',
        '/icons/icon-192x192.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Receber mensagens do Firebase
self.addEventListener('push', (event) => {
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192x192.png'
    })
  );
});