/* Self-destruct only.
   This exists purely to kill the previous service worker that was
   serving a broken cached page. It caches nothing and then
   unregisters itself. Do not add caching logic here. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (_) {}
    try { await self.clients.claim(); } catch (_) {}
    try { await self.registration.unregister(); } catch (_) {}
    try {
      const cs = await self.clients.matchAll({ type: 'window' });
      cs.forEach(c => c.navigate(c.url));
    } catch (_) {}
  })());
});
