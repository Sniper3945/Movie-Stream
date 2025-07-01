// Service Worker pour MovieStream : gestion du cache versionné

const CACHE_VERSION = "v2025-06-30-1"; // Change à chaque déploiement
const CACHE_NAME = `moviestream-cache-${CACHE_VERSION}`;
const ASSETS = [
  // Ajoute ici les assets critiques à pré-cacher si besoin
];

// Install: pré-cache les assets critiques
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate: supprime les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("moviestream-cache-") && key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Network first pour tout sauf /
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Toujours network first pour les navigations (HTML)
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Network first pour tout sauf la page d'accueil "/"
  if (request.method === "GET" && !request.url.endsWith("/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone et met en cache la réponse
          const respClone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, respClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});

// Permet le skipWaiting via message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
