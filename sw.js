const baseCacheValues = [
  "/index.html",
  "/css/styles.base.css",
  "/css/styles.large.css",
  "/css/styles.medium.css",
  "/css/styles.sub.css",
  "/js/dbhelper.js",
  "/js/main.js",
  "/js/restaurant_info.js",
  "/data/restaurants.json",
  "/"
];

const version = "v0.1";
const uniquePrefix = "restaurantreviews-";
const internalCache = `${uniquePrefix}-static-${version}`;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(internalCache).then(cache => {
      return cache.addAll(baseCacheValues);
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return (
              cacheName.startsWith(uniquePrefix) && cacheName !== internalCache
            );
          })
          .map(cacheName => {
            return caches["delete"](cacheName);
          })
      );
    })
  );
});

self.addEventListener("fetch", event => {
  if (event.request.url.origin === location.origin) {
    caches.open(internalCache).then(cache => {
      if (event.request.url === "/") {
        return checkCacheAndRespond(cache, "/index.html");
      }

      return checkCacheAndRespond(cache, event.request);
    });
  }
});

checkCacheAndRespond = (cache, request) => {
  cache.match(request).then(resp => {
    if (resp) {
      event.respondWith(resp);
      return;
    }

    return fetch(request).then(networkResp => {
      cache.put(request, networkResp.clone());
      return networkResp;
    });
  });
};
