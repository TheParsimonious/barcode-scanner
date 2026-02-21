const CACHE_NAME = "barcode-scanner-v20";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
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
  if (event.request.method !== "GET") return;

  const req = event.request;
  const reqUrl = new URL(req.url);

  // Do not rewrite third-party requests; let browser/network handle those directly.
  if (reqUrl.origin !== self.location.origin) {
    event.respondWith(fetch(req));
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req).then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned));
        return response;
      });

      if (cached) return cached;

      return networkFetch.catch(() => {
        if (req.mode === "navigate") {
          return caches.match("./index.html");
        }
        throw new Error("Request failed and not cached");
      });
    })
  );
});













