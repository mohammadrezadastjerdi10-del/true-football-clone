const CACHE_NAME = "tf-clone-v1";
const PRECACHE = [
  "/",
  "/index.html",
  "/logo.svg",
  "/manifest.webmanifest",
];

// Install: pre-cache the app shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for same-origin static assets, network-first for API calls
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET, skip Convex API calls (network-only for auth freshness)
  if (e.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  // For same-origin static assets: cache-first
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) {
          // Update cache in background (stale-while-revalidate)
          fetch(e.request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, response));
            }
          }).catch(() => {});
          return cached;
        }
        return fetch(e.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // For cross-origin (fonts, CDNs): network-first with cache fallback
  e.respondWith(
    fetch(e.request).then((response) => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
      }
      return response;
    }).catch(() => caches.match(e.request))
  );
});
