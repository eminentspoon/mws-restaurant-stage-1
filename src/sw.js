importScripts("js/idb.js");

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
  "/favicon.ico"
];

const version = "v0.2";
const storeVersion = 1;
const uniquePrefix = "restaurantreviews";
const internalCache = `${uniquePrefix}-static-${version}`;
const dataUrl = `http://${location.hostname}:1337/restaurants`;
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
    .then(db => {
      fetch(dataUrl)
        .then(resp => {
          return resp.json();
        })
        .then(rests => {
          const tx = db.transaction(objectStoreName, "readwrite");
          rests.map(rest => {
            tx.objectStore(objectStoreName).put(rest);
          });
        });
      console.log("db created and seeded");
    });
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
  if (urlString.startsWith(dataUrl)) {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const originalResp = resp.clone();
          resp.json().then(rests => {
            getStore().then(db => {
              const tx = db.transaction(objectStoreName, "readwrite");
              if (Array.isArray(rests)) {
                rests.map(rest => {
                  tx.objectStore(objectStoreName).put(rest);
                });
              } else {
                tx.objectStore(objectStoreName).put(rests);
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
            const tx = db.transaction(objectStoreName, "readonly");
            if (isSingleRestaurant) {
              const restId = Number(
                urlString.substring(
                  urlString.lastIndexOf("/") + 1,
                  urlString.length
                )
              );

              return tx
                .objectStore(objectStoreName)
                .get(restId)
                .then(rest => {
                  return generateResponseFromJson(rest);
                });
            } else {
              return tx
                .objectStore(objectStoreName)
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
