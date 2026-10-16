// ERTEC · Service Worker v3
// - data/ (config + bibliografías): red primero → tus ediciones a los JSON se ven al instante; sin internet usa la copia guardada
// - resto: caché primero + actualización en segundo plano
const CACHE = 'ertec-inst-v3';
const SHELL = ['./', 'login.html', 'index.html', 'exam.html', 'results.html', 'history.html', 'itt.html',
  'biblioteca.html', 'biblioteca_itt.html', 'css/style.css', 'js/storage.js', 'js/timer.js', 'js/sound.js', 'js/fx.js',
  'manifest.json', 'data/config.json'];

self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) { // fuentes de Google, etc.
    e.respondWith(caches.match(req).then(h => h || fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => h))); return;
  }
  if (url.pathname.includes('/data/')) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req))); return;
  }
  e.respondWith(caches.match(req).then(h => {
    const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => h);
    return h || net;
  }));
});
