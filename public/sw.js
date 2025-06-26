const CACHE_NAME = "moviestream-v2";
const urlsToCache = [
  "/",
  "/assets/film1.png",
  "/assets/film2.png",
  "/assets/film3.png",
  "/assets/film4.png",
  "/assets/film5.png",
  "/assets/film6.png",
  "/assets/film7.png",
  "/assets/film8.png",
  "/assets/film9.png",
  "/assets/film10.png",
];

// Détection de l'environnement de développement
const isDev =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1" ||
  self.location.port === "8888" ||
  self.location.port === "8080";

console.log("[SW] Environment:", isDev ? "DEVELOPMENT" : "PRODUCTION");

// Helper function to check if request can be cached
const canCacheRequest = (request) => {
  const url = new URL(request.url);

  // Don't cache chrome-extension, POST, or data URLs
  if (
    url.protocol === "chrome-extension:" ||
    url.protocol === "moz-extension:" ||
    url.protocol === "data:" ||
    request.method !== "GET"
  ) {
    return false;
  }

  return true;
};

self.addEventListener("install", (event) => {
  console.log("[SW] Installing new version...");

  if (isDev) {
    // En développement : pas de cache, juste skip waiting
    console.log("[SW] DEV MODE: Skipping cache installation");
    event.waitUntil(self.skipWaiting());
    return;
  }

  // En production : cache normal
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // console.log("[SW] PROD MODE: Caching assets...");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // console.log("[SW] Skip waiting...");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[SW] Install failed:", error);
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating new version...");

  if (isDev) {
    // En développement : nettoyer tous les caches et claim
    console.log("[SW] DEV MODE: Clearing all caches");
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
        .then(() => {
          return self.clients.claim();
        })
    );
    return;
  }

  // En production : gestion normale des caches
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              // console.log("[SW] PROD MODE: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // console.log("[SW] Claiming clients...");
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle cacheable requests
  if (!canCacheRequest(event.request)) {
    return; // Let the browser handle it normally
  }

  // En développement : pas de cache du tout
  if (isDev) {
    // console.log("[SW] DEV MODE: Bypassing cache for", event.request.url);
    return; // Laisser le navigateur gérer normalement
  }

  // En production : cache normal
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        // console.log("[SW] PROD MODE: Serving from cache:", event.request.url);
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          // Check if we received a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => {
              // Only cache GET requests to same origin
              if (canCacheRequest(event.request)) {
                // console.log("[SW] PROD MODE: Caching:", event.request.url);
                cache.put(event.request, responseToCache);
              }
            })
            .catch((error) => {
              console.log("[SW] Cache put error:", error);
            });

          return response;
        })
        .catch((error) => {
          console.log("[SW] Fetch error:", error);
          // Return cached version if available
          return caches.match(event.request);
        });
    })
  );
});
