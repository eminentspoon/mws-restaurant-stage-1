importScripts("node_modules/idb/lib/idb.js");

const baseCacheValues = [
  "/index.html",
  "/restaurant.html",
  "/css/styles.base.css",
  "/css/styles.large.css",
  "/css/styles.medium.css",
  "/css/styles.sub.css",
  "/js/dbhelper.js",
  "/js/main.js",
  "/js/swhelper.js",
  "/js/restaurant_info.js",
  "/data/restaurants.json",
  "/favicon.ico"
];

const version = "v0.2";
const storeVersion = 1;
const uniquePrefix = "restaurantreviews";
const internalCache = `${uniquePrefix}-static-${version}`;
const dataUrl = "http://localhost:1337/restaurants";
const storeName = `${uniquePrefix}-store`;
const objectStoreName = "restaurants";

initStore = () => {
  idb
    .open(storeName, storeVersion, upgradeDb => {
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore(objectStoreName, { keyPath: "id" });
          break;
      }
    })
    .then(db => console.log("db created"));
};

cacheBaseAssets = () => {
  return caches.open(internalCache).then(cache => {
    return cache.addAll(baseCacheValues);
  });
};

storeRestaurantData = () => {
  idb.open(storeName, storeVersion).then(db => {
    var store = db.objectStoreNames[objectStoreName];
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

self.addEventListener("install", event => {
  event.waitUntil(cacheBaseAssets());
});

self.addEventListener("activate", event => {
  event.waitUntil(cleanOldCaches());
  event.waitUntil(initStore());
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
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
