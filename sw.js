// VERSION: 2026-06-06-001
// Change the version string above every time you push an update
// The service worker detects the change and forces a refresh automatically
const CACHE = 'recomp-2026-06-06-001';
const FILES = [
  '/RecompWorkout/',
  '/RecompWorkout/index.html',
  '/RecompWorkout/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // Delete ALL old caches when a new version is detected
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // Tell all open pages to reload so they get the fresh version
        self.clients.matchAll({type: 'window'}).then(clients => {
          clients.forEach(client => client.navigate(client.url));
        });
      })
  );
});

self.addEventListener('fetch', e => {
  // Network first for the HTML page — always get the latest version
  // Cache first for everything else
  const isHTML = e.request.destination === 'document' ||
                 e.request.url.includes('index.html') ||
                 e.request.url.endsWith('/RecompWorkout/') ||
                 e.request.url.endsWith('/RecompWorkout');

  if (isHTML) {
    // Network first: always try to get fresh HTML, fall back to cache
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache first for assets
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (!res || res.status !== 200) return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  }
});
