// Service Worker PWA Ayiba - Stratégie hybride (Cache-First statique + Network-First dynamique)
const CACHE_NAME = "ayiba-pwa-cache-v1";

const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.png",
  "/logo.png",
  "/logo-email.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Seules les requêtes GET sont éligibles au cache
  if (request.method !== "GET") return;

  // Requêtes API ou Supabase : Network-first (données toujours fraîches)
  if (url.pathname.startsWith("/api") || url.hostname.includes("supabase")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Assets statiques (images, fonts, scripts Next.js static) : Cache-first avec fallback réseau
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Requêtes de navigation (pages) : Network-first avec fallback cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        return response;
      })
      .catch(() => caches.match(request) || caches.match("/"))
  );
});
