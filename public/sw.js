const CACHE_NAME = "moviestream-v2"; // Changé de v1 à v2 pour forcer refresh
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
  "/assets/film11.png",
  "/assets/film12.png",
  "/assets/placeholder.png",
];

// Installation - nettoyer les anciens caches
self.addEventListener("install", (event) => {
  console.log("[SW] Installing new version...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching assets...");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("[SW] Skip waiting...");
        return self.skipWaiting(); // Force activation immédiate
      })
  );
});

// Activation - supprimer les anciens caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating new version...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[SW] Claiming clients...");
        return self.clients.claim(); // Prendre contrôle immédiatement
      })
  );
});

// Fetch - stratégie cache-first pour les assets, network-first pour l'API
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API calls - toujours aller sur le réseau
  if (url.pathname.includes("/.netlify/functions/")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response("[]", {
          headers: { "Content-Type": "application/json" },
        });
      })
    );
    return;
  }

  // Assets - cache first
  if (url.pathname.includes("/assets/")) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // HTML - network first avec fallback cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cloner pour cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
