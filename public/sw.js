/* Línea Mágica · service worker mínimo.
 * Solo sirve una página "sin conexión" cuando falla la red al navegar. NO guarda nada más:
 * ni salas, ni mensajes, ni enlaces secretos (nada de /r, /paje, /familia o /api pasa por la caché). */
const CACHE = 'lm-offline-v1';
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE, '/icons/icon-192.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('lm-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode !== 'navigate') return; // imágenes, API, tiempo real…: siempre directo a la red
  event.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
});
