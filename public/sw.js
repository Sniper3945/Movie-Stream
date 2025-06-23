const CACHE_NAME = "moviestream-v1";
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
