// Aqua Finanzas — funciona sin internet y se actualiza sola
const CACHE = 'aqua-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Primero intenta la versión más nueva; sin internet (o si tarda) usa la guardada
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const net = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; });
    const cached = await cache.match(req, { ignoreSearch: true });
    if (!cached) return net.catch(() => cache.match('./index.html'));
    const slow = new Promise(res => setTimeout(() => res(cached), 3000));
    return Promise.race([net.catch(() => cached), slow]);
  })());
});
