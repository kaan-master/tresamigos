/* Afbeeldingen mogen uit de cache. De pagina zelf nooit: anders blijft een oude loyalty-link staan. */
const CACHE = "ta-assets-v3";
const ASSET_RE = /^\/assets\/(brand|menu|site)\//;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then((clients) => {
        for (const client of clients) client.postMessage({ type: "tresamigos-reload" });
      })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.headers.get("range")) return;

  const isDocument = request.mode === "navigate" || request.destination === "document";
  if (isDocument) {
    event.respondWith(fetch(request, { cache: "reload" }));
    return;
  }

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin || !ASSET_RE.test(url.pathname)) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) {
        try {
          await cache.put(request, response.clone());
        } catch {
          /* ignore uncacheable responses */
        }
      }
      return response;
    })
  );
});
