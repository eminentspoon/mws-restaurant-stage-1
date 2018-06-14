let restaurants,
  neighborhoods,
  cuisines,
  mapLoaded = false,
  mapFailure = false,
  markerRetryAttempts = 0,
  maxMarkerRetry = 5,
  markerTimer;

var map;
var markers = [];

const desktopMedia = "(min-width: 900px)";
const mediumMedia = "(min-width: 550px) and (max-width: 899px)";
const baseMedia = "(max-width: 549px)";
const markerTimerGap = 500;
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  SWHelper.registerServiceWorker();
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();

  document.getElementById("skipmap").addEventListener("click", e => {
    document
      .getElementById("filter-container")
      .querySelectorAll("select")[0]
      .focus();
  });
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");

  cuisines.forEach(cuisine => {
    const option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  mapLoaded = true;

  google.maps.event.addListenerOnce(self.map, "idle", () => {
    document.getElementsByTagName("iframe")[0].title = "Google Maps";
  });
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  const noresults = document.getElementById("noresults");

  if (restaurants.length === 0) {
    const li = document.createElement("li");
    li.setAttribute("aria-setsize", 1);
    li.setAttribute("aria-posinset", 1);
    li.setAttribute("aria-label", "No results");
    li.innerText = "There are no matching restaurants";
    li.className = "noresults";
    ul.append(li);
  }
  const restaurantCount = restaurants.length;

  for (let i = 0; i < restaurantCount; i++) {
    ul.append(createRestaurantHTML(restaurants[i], restaurantCount, i + 1));
  }

  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant, totalCount, pos) => {
  const li = document.createElement("li");
  li.setAttribute("aria-setsize", totalCount);
  li.setAttribute("aria-posinset", pos);
  li.setAttribute("aria-label", restaurant.name);
  const picture = document.createElement("picture");
  const sourceSets = DBHelper.responsiveImagesForRestaurant(restaurant);

  const baseSource = document.createElement("source");
  baseSource.srcset = sourceSets.medium;
  baseSource.media = baseMedia;
  picture.appendChild(baseSource);

  const mediumSource = document.createElement("source");
  mediumSource.srcset = sourceSets.small;
  mediumSource.media = mediumMedia;
  picture.append(mediumSource);

  const largeSource = document.createElement("source");
  largeSource.srcset = sourceSets.small;
  largeSource.media = desktopMedia;
  picture.append(largeSource);

  const image = document.createElement("img");
  image.srcset = sourceSets.large;
  image.alt = DBHelper.imageAltTextForRestaurant(restaurant);
  image.className = "restaurant-img";
  picture.append(image);

  li.append(picture);

  const name = document.createElement("h2");
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement("a");
  more.innerHTML = "View Details";
  more.setAttribute("aria-label", `View Details for ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  if (mapFailure) {
    return;
  }
  clearTimeout(markerTimer);
  if (mapLoaded) {
    markerRetryAttempts = 0;
    restaurants.forEach(restaurant => {
      // Add marker to the map
      const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
      google.maps.event.addListener(marker, "click", () => {
        window.location.href = marker.url;
      });
      self.markers.push(marker);
    });
  } else {
    if (markerRetryAttempts < maxMarkerRetry) {
      markerRetryAttempts = markerRetryAttempts + 1;
      markerTimer = setTimeout(addMarkersToMap, markerTimerGap);
      return;
    }
    //stop multiple retries after giving up
    mapFailure = true;
    //add class to minimise and then hide from screen readers etc
    document.getElementById("map").classList.add("failure");
    document.getElementById("map-container").setAttribute("aria-hidden", true);
  }
};
