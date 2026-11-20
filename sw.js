// Offline cache. Bump VERSION when the app files change.
const VERSION = 'gym-tracker-v5';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'firebase-config.js', 'sync.js', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const SDK = 'https://www.gstatic.com/firebasejs/';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Firebase SDK files are versioned and never change: cache first, so sign-in works offline.
  if (req.url.startsWith(SDK)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    })));
    return;
  }
  if (new URL(req.url).origin !== location.origin) return;
  // App files: network first (so updates arrive), cache when offline.
  e.respondWith(
    fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
