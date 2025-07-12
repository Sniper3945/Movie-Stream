// Service Worker pour MovieStream : gestion du cache versionné

// Version auto-générée lors du build - NE PAS MODIFIER MANUELLEMENT
const CACHE_VERSION = "__VERSION_PLACEHOLDER__";
const CACHE_NAME = `moviestream-cache-${CACHE_VERSION}`;
const ASSETS = [];

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
            .filter((key) => key.startsWith("moviestream-cache-"))
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Network first pour les images
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!request.url.startsWith("http")) {
    return;
  }

  // Network first pour les navigations
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // CACHE FIRST pour les covers (strategy optimisée pour UX)
  if (
    request.method === "GET" &&
    request.url.includes("/.netlify/functions/get-cover")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Retourner immédiatement le cache, mais vérifier en arrière-plan
          fetch(request, {
            cache: "no-cache",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          })
            .then((response) => {
              if (response.ok) {
                const respClone = response.clone();
                caches
                  .open(CACHE_NAME)
                  .then((cache) => cache.put(request, respClone));
              }
            })
            .catch(() => {}); // Ignore les erreurs en arrière-plan

          return cached;
        }

        // Si pas en cache, fetch et cache
        return fetch(request, {
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }).then((response) => {
          if (response.ok) {
            const respClone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, respClone));
          }
          return response;
        });
      })
    );
    return;
  }

  // NETWORK FIRST pour les images statiques
  if (
    request.method === "GET" &&
    request.url.includes("/assets/") &&
    (request.url.includes(".webp") ||
      request.url.includes(".jpg") ||
      request.url.includes(".png") ||
      request.url.includes(".gif"))
  ) {
    event.respondWith(
      fetch(request, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })
        .then((response) => {
          if (response.ok) {
            const respClone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, respClone));
          }
          return response;
        })
        .catch((error) => {
          return caches.match(request).then((cached) => {
            if (cached) {
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

// Message handler
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
  }

  // Clear cache à la demande
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

  // Nouveau: préchargement d'images
  if (event.data && event.data.type === "PRELOAD_IMAGES") {
    const { urls } = event.data;

    caches.open(CACHE_NAME).then((cache) => {
      urls.forEach((url, index) => {
        setTimeout(() => {
          fetch(url, { cache: "force-cache" })
            .then((response) => {
              if (response.ok) {
                cache.put(url, response.clone());
              }
            })
            .catch(() => {}); // Ignore les erreurs
        }, index * 50); // Délai pour éviter de surcharger
      });
    });
  }
});
