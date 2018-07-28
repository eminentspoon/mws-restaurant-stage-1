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
  "/img/static/icon-96x96.webp",
  "/img/static/icon-128x128.webp",
  "/img/static/icon-144x144.webp",
  "/img/static/icon-152x152.webp",
  "/img/static/icon-192x192.webp",
  "/img/static/icon-384x384.webp",
  "/img/static/icon-512x512.webp"
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

syncOfflineReviews = async () => {
  const unsubmittedReviews = await getAllUnsubmittedReviews();
  const reviewsToDelete = [];

  console.log("our unsubmitted reviews are ", unsubmittedReviews);

  return Promise.all(
    unsubmittedReviews.map(review => {
      const currId = review.id;
      return fetch(reviewsApiUrl, {
        method: "POST",
        body: JSON.stringify(Object.assign(review, { id: undefined }))
      })
        .then(o => {
          console.log("sucessfully added ", o);
          reviewsToDelete.push(currId);
        })
        .catch(err => {
          console.log("fetch failed");
          return Promise.reject(err);
        });
    })
  )
    .then(() => {
      return Promise.all(
        reviewsToDelete.map(id => {
          console.log("deleting ", id);
          return deleteFromUnsubmittedReviews(id);
        })
      );
    })
    .catch(err => {
      console.log("an error occured in a fetch");
      return Promise.reject("something went wrong", err);
    });
};

syncOfflineFavourites = async () => {
  const unsyncedFavouriteStatus = await getAllUnsyncedFavourites();
  const favouritesSynced = [];

  console.log("our unsynced favourites are ", unsyncedFavouriteStatus);

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
          console.log("sucessfully synced favourite ", o);
          favouritesSynced.push(currId);
        })
        .catch(err => {
          console.log("fetch failed");
          return Promise.reject(err);
        });
    })
  )
    .then(() => {
      return Promise.all(
        favouritesSynced.map(id => {
          console.log("deleting ", id);
          return deleteFromUnsyncedFavourites(id);
        })
      );
    })
    .catch(err => {
      console.log("an error occured in a fetch");
      return Promise.reject("something went wrong", err);
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
  console.log("Getting store");
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

  if (urlString.startsWith(restaurantApiUrl)) {
    if (
      event.request.method === "PUT" &&
      urlString.indexOf("is_favorite") > 0
    ) {
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
            console.log(err);
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

  if (urlString.startsWith(reviewsApiUrl)) {
    if (urlString === reviewsApiUrl && event.request.method === "POST") {
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
    }

    if (urlString.startsWith(`${reviewsApiUrl}/?restaurant_id=`)) {
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
