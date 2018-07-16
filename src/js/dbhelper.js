/**
 * Common database helper functions.
 */
class DBHelper {
  static get API_ADDRESS() {
    const port = 1337; // Change this to your server port
    const hostname = window.location.hostname;
    return `http://${hostname}:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch(DBHelper.API_ADDRESS)
      .then(resp => {
        if (!resp.ok) {
          throw Error(resp.statusText);
        }
        return resp.json();
      })
      .then(restaurants => {
        callback(null, restaurants);
      })
      .catch(err => {
        const error = `Unable to get list of restaurants: ${err}`;
        callback(error, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    fetch(`${DBHelper.API_ADDRESS}/${id}`)
      .then(resp => {
        if (!resp.ok) {
          if (resp.status === 404) {
            callback("Restaurant does not exist", null);
            return;
          }

          throw Error(resp.statusText);
        }
        return resp.json();
      })
      .then(restaurant => {
        callback(null, restaurant);
      })
      .catch(err => {
        const error = `Unable to get restaurant: ${err}`;
        callback(error, null);
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  static async fetchFavourites() {
    return fetch(`${DBHelper.API_ADDRESS}/?is_favorite=true`)
      .then(resp => {
        if (!resp.ok) {
          throw Error(resp.statusText);
        }
        return resp.json();
      })
      .then(restaurants => {
        return restaurants;
      })
      .catch(err => {
        const error = `Unable to get list of favourite restaurants: ${err}`;
        throw Error(error);
      });
  }

  static async isRestaurantFavourite(restId) {
    return this.fetchFavourites().then(restaurants => {
      if (restaurants.filter(o => o.id === Number(restId)).length > 0) {
        return true;
      }
      return false;
    });
  }

  static async changeRestaurantFavouriteStatus(restId, isFavourite) {
    return fetch(
      `${
        DBHelper.API_ADDRESS
      }/${restId}/?is_favorite=${isFavourite.toString()}`,
      {
        method: "PUT"
      }
    )
      .then(resp => {
        if (!resp.ok) {
          throw Error("Unable to perform restaurant favourite action: " + err);
        }
        return;
      })
      .catch(err => {
        throw Error("Unable to perform restaurant favourite action: " + err);
      });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  static imageAltTextForRestaurant(restaurant) {
    return `${restaurant.name} - a ${
      restaurant.neighborhood
    } based restaurant serving ${restaurant.cuisine_type.toLowerCase()}-style food.`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph) {
      return `/img/${restaurant.photograph}.webp`;
    }

    return "/img/static/default-image.webp";
  }

  static defaultPlaceholderImage() {
    return "/img/static/placeholder.webp";
  }

  static responsiveImagesForRestaurant(restaurant) {
    const baseImageUrl = this.imageUrlForRestaurant(restaurant);
    return {
      small:
        baseImageUrl.indexOf("/static/") > -1
          ? baseImageUrl
          : this.buildSourceset(baseImageUrl, "small"),
      medium:
        baseImageUrl.indexOf("/static/") > -1
          ? baseImageUrl
          : this.buildSourceset(baseImageUrl, "medium"),
      large:
        baseImageUrl.indexOf("/static/") > -1
          ? baseImageUrl
          : this.buildSourceset(baseImageUrl, "large")
    };
  }

  static buildSourceset(imgName, size) {
    return `${this.injectImageStem(
      imgName,
      `-${size}`
    )}, ${this.injectImageStem(imgName, `-${size}-2x`)} 2x`;
  }

  static injectImageStem(baseImg, inject) {
    const filenamePeriodPos = baseImg.lastIndexOf(".");

    return (
      baseImg.substring(0, filenamePeriodPos) +
      inject +
      baseImg.substring(filenamePeriodPos, baseImg.length)
    );
  }
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
