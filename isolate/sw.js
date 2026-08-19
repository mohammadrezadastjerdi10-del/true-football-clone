const CACHE_NAME = "tf-clone-v2";
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

  // For same-origin static assets: cache-first with stale-while-revalidate
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        // Always return cached version immediately if available
        if (cached) {
          // Update cache in background (stale-while-revalidate)
          fetch(e.request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, response));
            }
          }).catch(() => {});
          return cached;
        }
        // If not cached, fetch and cache
        return fetch(e.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => {
          // Offline fallback: return a basic response for navigation requests
          if (e.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
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
    }).catch(() => {
      // If network fails, try cache
      return caches.match(e.request).then((cached) => {
        if (cached) return cached;
        // For font requests, return empty response to prevent blocking
        if (e.request.destination === "font") {
          return new Response("", { status: 200, headers: { "Content-Type": "font/woff2" } });
        }
        return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      });
    })
  );
});

// Background sync preparation for future use
self.addEventListener("sync", (e) => {
  if (e.tag === "sync-saves") {
    // Future: sync local saves to server when online
    e.waitUntil(Promise.resolve());
  }
});
