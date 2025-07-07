// Service Worker pour MovieStream : gestion du cache versionné

// Version auto-générée lors du build - NE PAS MODIFIER MANUELLEMENT
const CACHE_VERSION = "__VERSION_PLACEHOLDER__"; // Sera remplacé automatiquement
const CACHE_NAME = `moviestream-cache-${CACHE_VERSION}`;
const ASSETS = [];

// Install: pré-cache les assets critiques
self.addEventListener("install", (event) => {
  console.log(`🔄 SW Install - Version: ${CACHE_VERSION}`);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Activate: supprime TOUS les anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          // Supprime TOUS les caches moviestream, pas seulement les anciens
          keys
            .filter((key) => key.startsWith("moviestream-cache-"))
            .filter((key) => key !== CACHE_NAME)
            .map((key) => {
              console.log(`🗑️ Suppression cache: ${key}`);
              return caches.delete(key);
            })
        )
      )
      .then(() => {
        console.log(`✅ Cache actuel: ${CACHE_NAME}`);
        return self.clients.claim();
      })
  );
});

// Network first STRICT pour les images
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

  // NETWORK FIRST STRICT pour TOUTES les images d'assets
  if (request.method === "GET" && request.url.includes("/assets/")) {
    event.respondWith(
      fetch(request, {
        // Force le bypass du cache HTTP
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })
        .then((response) => {
          console.log(`📥 Image chargée depuis réseau: ${request.url}`);
          // Cache seulement si succès
          if (response.ok) {
            const respClone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, respClone));
          }
          return response;
        })
        .catch((error) => {
          console.log(`❌ Échec réseau pour: ${request.url}, tentative cache`);
          // Fallback sur cache uniquement en cas d'échec réseau
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log(`💾 Image trouvée en cache: ${request.url}`);
              return cached;
            }
            throw error;
          });
        })
    );
    return;
  }

  // Network first pour le reste
  if (request.method === "GET" && !request.url.endsWith("/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const respClone = response.clone();
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

// Message handler amélioré
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    // Répondre pour éviter les erreurs de message channel
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
  }

  // Nouveau: clear cache à la demande
  if (event.data && event.data.type === "CLEAR_CACHE") {
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key.startsWith("moviestream-cache-"))
            .map((key) => caches.delete(key))
        );
      })
      .then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({
            success: true,
            message: "Cache cleared",
          });
        }
      });
  }
});
