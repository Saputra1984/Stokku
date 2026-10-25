const CACHE = 'stokku-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-stokku-192.png',
  './icon-stokku-512.png'
];

// Install: cache semua asset
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: hapus cache lama
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first untuk asset lokal, skip external (Drive API)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Jangan cache domain lain (Google Drive API, CDN, dll)
  if (url.origin !== location.origin) return;

  // Jangan cache POST/PATCH (Drive upload)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache asset baru yang belum ada
        if (res.ok && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
