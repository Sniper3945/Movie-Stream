// Service Worker pour MovieStream : gestion du cache versionné

const CACHE_VERSION = "v2025-07-07-2"; // Incrémenter à chaque déploiement avec nouvelles images
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

  // Ignore les requêtes non http(s)
  if (!request.url.startsWith("http")) {
    return;
  }

  // Toujours network first pour les navigations (HTML)
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Cache-busting pour les nouvelles images d'assets
  if (request.method === "GET" && request.url.includes("/assets/film")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Si l'image est trouvée, la cacher
          if (response.ok) {
            const respClone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, respClone));
          }
          return response;
        })
        .catch(() => {
          // Fallback sur le cache si network fail
          return caches.match(request);
        })
    );
    return;
  }

  // Network first pour tout sauf la page d'accueil "/"
  if (request.method === "GET" && !request.url.endsWith("/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const respClone = response.clone();
          // Ne cache que les requêtes http(s)
          if (request.url.startsWith("http")) {
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, respClone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});

// Permet le skipWaiting via message - FIX des erreurs asynchrones
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    // Répondre pour éviter les erreurs de message channel
    event.ports[0]?.postMessage({ success: true });
  }
});
