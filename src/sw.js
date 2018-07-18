importScripts("js/idb.min.js");

const baseCacheValues = [
  "/index.html",
  "/restaurant.html",
  "/css/styles.core.min.css",
  "/css/styles.large.min.css",
  "/css/styles.medium.min.css",
  "/js/dbhelper.min.js",
  "/js/main.min.js",
  "/js/swhelper.min.js",
  "/js/restaurant_info.min.js",
  "/js/notifications.min.js",
  "/favicon.ico",
  "/img/static/default-image.webp",
  "/img/static/placeholder.webp",
  "/img/static/icon-96x96.webp",
  "/img/static/icon-128x128.webp",
  "/img/static/icon-144x144.webp",
  "/img/static/icon-152x152.webp",
  "/img/static/icon-192x192.webp",
  "/img/static/icon-384x384.webp",
  "/img/static/icon-512x512.webp"
];

const version = "v0.2";
const storeVersion = 1;
const uniquePrefix = "restaurantreviews";
const internalCache = `${uniquePrefix}-static-${version}`;
const restaurantDataUrl = `http://${location.hostname}:1337/restaurants`;
const reviewsUrl = `http://${location.hostname}:1337/reviews`;
const storeName = `${uniquePrefix}-store`;
const restaurantStore = "restaurants";
const reviewStore = "reviews";

initStore = () => {
  idb
    .open(storeName, storeVersion, upgradeDb => {
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore(restaurantStore, { keyPath: "id" });
          upgradeDb.createObjectStore(reviewStore, { keyPath: "id" });
          break;
      }
    })
    .then(db => {
      fetch(restaurantDataUrl)
        .then(resp => {
          return resp.json();
        })
        .then(rests => {
          const tx = db.transaction(restaurantStore, "readwrite");
          rests.map(rest => {
            tx.objectStore(restaurantStore).put(rest);
          });
        });
    });
};

cacheBaseAssets = () => {
  return caches.open(internalCache).then(cache => {
    return cache.addAll(baseCacheValues);
  });
};

cleanOldCaches = () => {
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
  });
};

checkCacheAndRespond = (cache, request) => {
  return cache.match(request).then(resp => {
    if (resp) {
      return resp;
    }

    return fetch(request).then(networkResp => {
      cache.put(request, networkResp.clone());
      return networkResp;
    });
  });
};

getStore = () => {
  return idb.open(storeName, storeVersion);
};

generateResponseFromJson = json => {
  return new Response(JSON.stringify(json), {
    headers: { "Content-Type": "application/json" }
  });
};

self.addEventListener("install", event => {
  event.waitUntil(cacheBaseAssets());
});

self.addEventListener("activate", event => {
  event.waitUntil(cleanOldCaches());
  event.waitUntil(initStore());
});

self.addEventListener("fetch", event => {
  const urlString = event.request.url;
  const url = new URL(urlString);
  if (urlString.startsWith(restaurantDataUrl)) {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const originalResp = resp.clone();
          resp.json().then(rests => {
            getStore().then(db => {
              const tx = db.transaction(restaurantStore, "readwrite");
              if (Array.isArray(rests)) {
                rests.map(rest => {
                  tx.objectStore(restaurantStore).put(rest);
                });
              } else {
                tx.objectStore(restaurantStore).put(rests);
              }
            });
          });
          return originalResp;
        })
        .catch(() => {
          const isSingleRestaurant = Number.isInteger(
            Number(urlString.substring(urlString.length - 1))
          );

          return getStore().then(db => {
            const tx = db.transaction(restaurantStore, "readonly");
            if (isSingleRestaurant) {
              const restId = Number(
                urlString.substring(
                  urlString.lastIndexOf("/") + 1,
                  urlString.length
                )
              );

              return tx
                .objectStore(restaurantStore)
                .get(restId)
                .then(rest => {
                  return generateResponseFromJson(rest);
                });
            } else {
              return tx
                .objectStore(restaurantStore)
                .getAll()
                .then(restaurants => {
                  return generateResponseFromJson(restaurants);
                });
            }
          });
        })
    );
  }

  if (url.origin === location.origin) {
    event.respondWith(
      caches.open(internalCache).then(cache => {
        //handle route path equiv
        if (url.pathname === "/") {
          return checkCacheAndRespond(cache, "/index.html");
        }
        //as datasource is cached, only cache page skeleton once
        if (url.pathname.startsWith("/restaurant.html")) {
          return checkCacheAndRespond(cache, "/restaurant.html");
        }

        return checkCacheAndRespond(cache, event.request);
      })
    );
  }
});
