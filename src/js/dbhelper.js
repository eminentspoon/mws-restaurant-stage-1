/**
 * Common database helper functions.
 */
class DBHelper {
  static get BASE_API_ADDRESS() {
    const port = 1337; // Change this to your server port
    const hostname = window.location.hostname;

    return `http://${hostname}:${port}`;
  }
  static get RESTAURANT_API_ADDRESS() {
    return `${DBHelper.BASE_API_ADDRESS}/restaurants`;
  }
  static get REVIEW_API_ADDRESS() {
    return `${DBHelper.BASE_API_ADDRESS}/reviews`;
  }

  /**
   * Fetch all restaurants.
   */
  static async fetchRestaurants() {
    return fetch(DBHelper.RESTAURANT_API_ADDRESS)
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
        throw Error(`Unable to get list of restaurants: ${err}`);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static async fetchRestaurantById(id) {
    return fetch(`${DBHelper.RESTAURANT_API_ADDRESS}/${id}`)
      .then(resp => {
        if (!resp.ok) {
          if (resp.status === 404) {
            throw Error("Restaurant does not exist");
          }

          throw Error(resp.statusText);
        }
        return resp.json();
      })
      .then(restaurant => {
        return restaurant;
      })
      .catch(err => {
        const error = `Unable to get restaurant: ${err}`;
        throw Error(error);
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static async fetchRestaurantByCuisine(cuisine) {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        return results;
      })
      .catch(err => {
        throw Error(err);
      });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static async fetchRestaurantByNeighborhood(neighborhood) {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        return results;
      })
      .catch(err => {
        throw Error(err);
      });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static async fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        let results = restaurants;
        if (cuisine != "all") {
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        return results;
      })
      .catch(err => {
        throw Error(err);
      });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static async fetchNeighborhoods() {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        return uniqueNeighborhoods;
      })
      .catch(err => {
        throw Error(err);
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static async fetchCuisines() {
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        return uniqueCuisines;
      })
      .catch(err => {
        throw Error(err);
      });
  }

  static async getReviewsForRestaurant(restId) {
    return fetch(`${DBHelper.REVIEW_API_ADDRESS}/?restaurant_id=${restId}`)
      .then(resp => {
        return resp.json();
      })
      .then(reviews => {
        return reviews;
      });
  }

  static async createReview(reviewObject) {
    return fetch(`${DBHelper.REVIEW_API_ADDRESS}`, {
      body: JSON.stringify(reviewObject),
      method: "POST"
    })
      .then(resp => {
        return resp.json();
      })
      .then(createdReview => {
        return createdReview;
      });
  }

  static async fetchFavourites() {
    return fetch(`${DBHelper.RESTAURANT_API_ADDRESS}/?is_favorite=true`)
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

  static async changeRestaurantFavouriteStatus(restId, isFavourite) {
    return fetch(
      `${
        DBHelper.RESTAURANT_API_ADDRESS
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
