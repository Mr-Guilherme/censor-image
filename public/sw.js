const CACHE_NAME = "pixelate-v2";
const STATIC_ASSETS = ["/", "/manifest.webmanifest"];

function shouldCache(request, response) {
  if (!response.ok) {
    return false;
  }

  if (request.method !== "GET") {
    return false;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return false;
  }

  if (url.pathname.startsWith("/_next/")) {
    return true;
  }

  if (request.destination === "image" || request.destination === "font") {
    return true;
  }

  return request.mode === "navigate";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const networkResponse = await fetch(event.request);

        if (shouldCache(event.request, networkResponse)) {
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch {
        const cached = await cache.match(event.request);

        if (cached) {
          return cached;
        }

        if (event.request.mode === "navigate") {
          const fallback = await cache.match("/");

          if (fallback) {
            return fallback;
          }
        }

        throw new Error("Network and cache unavailable.");
      }
    })(),
  );
});
