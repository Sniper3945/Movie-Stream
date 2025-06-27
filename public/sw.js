// Service Worker pour MovieStream : gestion du cache versionné

const CACHE_VERSION = "2025-06-27-3"; // Doit correspondre au meta version (le dernier digit correspond à la version du service worker donc au nombre de modif fait.)
const CACHE_NAME = `moviestream-cache-v${CACHE_VERSION}`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Pré-cache la page d'accueil et le manifest pour forcer le refresh sur nouvelle version
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache
        .addAll([
          "/", // page d'accueil
          "/manifest.webmanifest", // si tu utilises un manifest PWA
          // Ajoute ici d'autres assets critiques si besoin
        ])
        .catch(() => {})
    )
  );
});

self.addEventListener("activate", (event) => {
  // Supprime les anciens caches si la version change
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("moviestream-cache-v") && key !== CACHE_NAME
            )
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Cache-first pour les assets statiques, network-first pour le reste
  const req = event.request;
  if (req.method !== "GET") return;

  // Ignore les requêtes non http(s) (ex: chrome-extension://)
  if (!req.url.startsWith("http")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(req).then((resp) => {
        if (resp) return resp;
        return fetch(req)
          .then((networkResp) => {
            // Cache les fichiers statiques (js, css, images, fonts)
            if (
              req.url.match(
                /\.(js|css|png|jpg|jpeg|gif|svg|webp|woff2?|ttf|eot|ico)$/
              ) ||
              req.url.includes("/assets/")
            ) {
              // Vérifie le protocole avant de mettre en cache
              const urlObj = new URL(req.url);
              if (
                (urlObj.protocol === "http:" || urlObj.protocol === "https:") &&
                networkResp &&
                networkResp.ok &&
                networkResp.type === "basic"
              ) {
                cache.put(req, networkResp.clone()).catch(() => {});
              }
            }
            return networkResp;
          })
          .catch(() => {
            // Optionnel : retourne une réponse de secours ou rien
            return new Response("Network error", { status: 408 });
          });
      })
    )
  );
});
