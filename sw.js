self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));

    try {
      await self.registration.unregister();
    } catch (_) {}

    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    for (const client of windows) {
      try {
        client.postMessage({ type: "MK97_CACHE_CLEARED", build: "26.0" });
      } catch (_) {}
    }
  })());
});
