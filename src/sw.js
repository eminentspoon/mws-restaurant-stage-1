importScripts("js/idb.min.js");

const defaultImage = "/img/static/default-image.webp";

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
  defaultImage,
  "/img/static/placeholder.webp",
  "/img/static/icon-96x96.png",
  "/img/static/icon-128x128.png",
  "/img/static/icon-144x144.png",
  "/img/static/icon-152x152.png",
  "/img/static/icon-192x192.png",
  "/img/static/icon-384x384.png",
  "/img/static/icon-512x512.png"
];

const version = "v0.3";
const storeVersion = 1;
const uniquePrefix = "restaurantreviews";
const internalCache = `${uniquePrefix}-static-${version}`;
const restaurantApiUrl = `http://${location.hostname}:1337/restaurants`;
const reviewsApiUrl = `http://${location.hostname}:1337/reviews`;
const storeName = `${uniquePrefix}-store`;
const restaurantStore = "restaurants";
const reviewStore = "reviews";
const unsubmittedReviewStore = "reviews-pending";
const unsubmittedFavouriteStatus = "favourite-pending";

self.addEventListener("install", event => {
  event.waitUntil(cacheBaseAssets());
});

self.addEventListener("activate", event => {
  event.waitUntil(cleanOldCaches());
  event.waitUntil(initStore());
});

self.addEventListener("fetch", event => {
  const urlString = event.request.url;

  // Handle calls to restaurant api
  if (urlString.startsWith(restaurantApiUrl)) {
    if (
      event.request.method === "PUT" &&
      urlString.indexOf("is_favorite") > 0
    ) {
      // Must be updated a restaurant's favourite status
      const urlDataPart = urlString.replace(restaurantApiUrl + "/", "");

      const restId = Number(
        urlDataPart.substring(0, urlDataPart.lastIndexOf("/"))
      );
      const favouriteStatus =
        urlDataPart.substring(
          urlDataPart.lastIndexOf("=") + 1,
          urlDataPart.length
        ) === "true";
      event.respondWith(
        fetch(event.request)
          .then(resp => {
            return getRestaurantFromCache(restId).then(restaurant => {
              restaurant.is_favorite = favouriteStatus;
              return updateRestaurantInCache(restaurant).then(() => {
                return resp;
              });
            });
          })
          .catch(err => {
            return getRestaurantFromCache(restId).then(restaurant => {
              restaurant.is_favorite = favouriteStatus;
              return updateRestaurantInCache(restaurant).then(() => {
                return getRestaurantFromCache(restId).then(restaurant => {
                  const responseJson = generateResponseFromJson(restaurant);
                  return flagFavouriteAsOffline(restId, favouriteStatus).then(
                    () => {
                      return responseJson;
                    }
                  );
                });
              });
            });
          })
      );
    } else {
      // Must be loading one or more restaurants
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
                return tx.complete;
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
  }

  // Handle calls to reviews api
  if (urlString.startsWith(reviewsApiUrl)) {
    if (urlString === reviewsApiUrl && event.request.method === "POST") {
      // Must be adding a new review to a restaurant
      event.respondWith(
        fetch(event.request.clone())
          .then(resp => {
            const originalResp = resp.clone();
            resp.json().then(review => {
              getStore().then(db => {
                const tx = db.transaction(reviewStore, "readwrite");
                tx.objectStore(reviewStore).put(review);
                return tx.complete;
              });
            });
            return originalResp;
          })
          .catch(err => {
            return event.request.json().then(o => {
              return getStore().then(db => {
                const createdDate = new Date().toISOString();
                o.createdAt = createdDate;
                o.updatedAt = createdDate;
                const tx = db.transaction(unsubmittedReviewStore, "readwrite");
                tx.objectStore(unsubmittedReviewStore).put(o);
                return tx.complete.then(() => {
                  return generateResponseFromJson(o);
                });
              });
            });
          })
      );
    } else if (urlString.startsWith(`${reviewsApiUrl}/?restaurant_id=`)) {
      // Must be loading reviews for a specific restaurant
      const restId = Number(
        urlString.replace(`${reviewsApiUrl}/?restaurant_id=`, "")
      );
      event.respondWith(
        fetch(event.request)
          .then(resp => {
            const originalResp = resp.clone();
            resp.json().then(reviews => {
              getStore().then(db => {
                const tx = db.transaction(reviewStore, "readwrite");
                if (Array.isArray(reviews)) {
                  reviews.map(review => {
                    tx.objectStore(reviewStore).put(review);
                  });
                } else {
                  tx.objectStore(reviewStore).put(reviews);
                }
                return tx.complete;
              });
            });
            return originalResp;
          })
          .catch(() => {
            return getReviewsByRestaurants(restId).then(results => {
              return getUnsubmittedReviewsByRestaurants(restId).then(
                subResults => {
                  subResults.forEach(o => results.push(o));
                  return generateResponseFromJson(results);
                }
              );
            });
          })
      );
    }
  }

  const url = new URL(urlString);
  if (url.origin === location.origin) {
    // Local resource, check to see if it exists in the cache
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

self.addEventListener("message", event => {
  if (event.data === "sync-offline") {
    syncOfflineReviews().catch(err => {
      console.error(
        "There was a problem syncing offline reviews to the server",
        err
      );
    });

    syncOfflineFavourites().catch(err => {
      console.error(
        "There was a problem syncing favourite restaurants to the server",
        err
      );
    });
  }
});

initStore = () => {
  idb
    .open(storeName, storeVersion, upgradeDb => {
      switch (upgradeDb.oldVersion) {
        case 0:
          upgradeDb.createObjectStore(restaurantStore, { keyPath: "id" });

          let createdReviewStore = upgradeDb.createObjectStore(reviewStore, {
            keyPath: "id"
          });
          createdReviewStore.createIndex("restaurant_id", "restaurant_id", {
            unique: false
          });

          let unsubmittedStore = upgradeDb.createObjectStore(
            unsubmittedReviewStore,
            {
              keyPath: "id",
              autoIncrement: true
            }
          );
          unsubmittedStore.createIndex("restaurant_id", "restaurant_id", {
            unique: false
          });

          upgradeDb.createObjectStore(unsubmittedFavouriteStatus, {
            keyPath: "restaurant_id",
            autoIncrement: false
          });

          break;
      }
    })
    .then(db => {
      fetch(restaurantApiUrl)
        .then(resp => {
          return resp.json();
        })
        .then(rests => {
          const tx = db.transaction(restaurantStore, "readwrite");
          rests.map(rest => {
            tx.objectStore(restaurantStore).put(rest);
          });
          return tx.complete;
        });
    });
};

syncOfflineReviews = async () => {
  const unsubmittedReviews = await getAllUnsubmittedReviews();
  const reviewsToDelete = [];

  return Promise.all(
    unsubmittedReviews.map(review => {
      const currId = review.id;
      return fetch(reviewsApiUrl, {
        method: "POST",
        body: JSON.stringify(Object.assign(review, { id: undefined }))
      })
        .then(o => {
          reviewsToDelete.push(currId);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    })
  )
    .then(() => {
      return Promise.all(
        reviewsToDelete.map(id => {
          return deleteFromUnsubmittedReviews(id);
        })
      );
    })
    .catch(err => {
      return Promise.reject(
        "An error occurred whilst processing offline reviews",
        err
      );
    });
};

syncOfflineFavourites = async () => {
  const unsyncedFavouriteStatus = await getAllUnsyncedFavourites();
  const favouritesSynced = [];

  return Promise.all(
    unsyncedFavouriteStatus.map(favourite => {
      const currId = favourite.restaurant_id;
      return fetch(
        `${restaurantApiUrl}/${currId}/?is_favorite=${
          favourite.favouriteStatus
        }`,
        {
          method: "PUT"
        }
      )
        .then(o => {
          favouritesSynced.push(currId);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    })
  )
    .then(() => {
      return Promise.all(
        favouritesSynced.map(id => {
          return deleteFromUnsyncedFavourites(id);
        })
      );
    })
    .catch(err => {
      return Promise.reject(
        "An error occurred whilst processing offline favourite restaurants",
        err
      );
    });
};

getAllUnsubmittedReviews = async () => {
  return getStore().then(db => {
    const tx = db.transaction(unsubmittedReviewStore, "readonly");

    return tx.objectStore(unsubmittedReviewStore).getAll();
  });
};

getAllUnsyncedFavourites = async () => {
  return getStore().then(db => {
    const tx = db.transaction(unsubmittedFavouriteStatus, "readonly");
    return tx.objectStore(unsubmittedFavouriteStatus).getAll();
  });
};

deleteFromUnsyncedFavourites = async id => {
  return getStore().then(db => {
    const tx = db.transaction(unsubmittedFavouriteStatus, "readwrite");
    return tx.objectStore(unsubmittedFavouriteStatus).delete(id);
    return tx.complete;
  });
};

deleteFromUnsubmittedReviews = async id => {
  return getStore().then(db => {
    const tx = db.transaction(unsubmittedReviewStore, "readwrite");
    tx.objectStore(unsubmittedReviewStore).delete(id);
    return tx.complete;
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

    return fetch(request)
      .then(networkResp => {
        cache.put(request, networkResp.clone());
        return networkResp;
      })
      .catch(err => {
        if (request.url.indexOf(".webp") > -1) {
          return cache.match(defaultImage).then(resp => {
            return resp;
          });
        }
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

getReviewsByRestaurants = async restId => {
  return getStore().then(db => {
    const tx = db.transaction(reviewStore, "readonly");
    return tx
      .objectStore(reviewStore)
      .index("restaurant_id")
      .getAll(restId)
      .then(reviews => {
        return reviews;
      });
  });
};

getUnsubmittedReviewsByRestaurants = async restId => {
  return getStore().then(db => {
    const tx = db.transaction(unsubmittedReviewStore, "readonly");
    return tx
      .objectStore(unsubmittedReviewStore)
      .index("restaurant_id")
      .getAll(restId)
      .then(reviews => {
        return reviews;
      });
  });
};

getRestaurantFromCache = async restId => {
  return getStore().then(db => {
    const tx = db.transaction(restaurantStore, "readonly");
    return tx.objectStore(restaurantStore).get(restId);
  });
};

updateRestaurantInCache = async restaurant => {
  return getStore().then(db => {
    const tx = db.transaction(restaurantStore, "readwrite");
    tx.objectStore(restaurantStore).put(restaurant);
    return tx.complete;
  });
};

flagFavouriteAsOffline = async (restId, favouriteStatus) => {
  return getStore().then(db => {
    const tx = db.transaction(unsubmittedFavouriteStatus, "readwrite");
    tx.objectStore(unsubmittedFavouriteStatus).put({
      restaurant_id: restId,
      favouriteStatus: favouriteStatus
    });
    return tx.complete;
  });
};
