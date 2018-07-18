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
let notificationManager;
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  notificationManager = new NotificationManager();
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
fetchNeighborhoods = async () => {
  return DBHelper.fetchNeighborhoods()
    .then(neighborhoods => {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    })
    .catch(err => {
      notificationManager.showError(err, true);
    });
};

bindLazyLoad = () => {
  const lazyImages = [].slice.call(
    document.querySelectorAll("picture.lazy-load source, picture.lazy-load img")
  );

  if ("IntersectionObserver" in window) {
    let lazyImageObserver = new IntersectionObserver(function(
      entries,
      observer
    ) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.srcset = lazyImage.dataset.srcset;
          lazyImageObserver.unobserve(lazyImage);
        }
      });
    });

    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  }
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
fetchCuisines = async () => {
  return DBHelper.fetchCuisines()
    .then(cuisines => {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    })
    .catch(err => {
      notificationManager.showError(err, true);
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
updateRestaurants = async () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  return DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
    .then(restaurants => {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
      bindLazyLoad();
    })
    .catch(err => {
      notificationManager.showError(err, true);
    });
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

  li.append(createRestaurantImageHTML(restaurant));
  if (restaurant.is_favorite === "true") {
    const favouriteContainer = document.createElement("div");
    favouriteContainer.classList.add("favourite-container");
    favouriteContainer.setAttribute("aria-hidden", true);

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    favouriteContainer.appendChild(overlay);

    const favouriteIcon = document.createElement("span");
    favouriteIcon.classList.add("favourite");
    favouriteIcon.title = `${
      restaurant.name
    } is one of your favourite restaurants`;
    favouriteIcon.innerText = "★";
    favouriteContainer.append(favouriteIcon);
    li.append(favouriteContainer);
  }

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

createRestaurantImageHTML = restaurant => {
  const placeholderImage = DBHelper.defaultPlaceholderImage();
  const picture = document.createElement("picture");
  picture.classList.add("lazy-load");
  const sourceSets = DBHelper.responsiveImagesForRestaurant(restaurant);

  const baseSource = document.createElement("source");
  baseSource.srcset = placeholderImage;
  baseSource.setAttribute("data-srcset", sourceSets.medium);
  baseSource.media = baseMedia;
  picture.appendChild(baseSource);

  const mediumSource = document.createElement("source");
  mediumMedia.srcset = placeholderImage;
  mediumSource.setAttribute("data-srcset", sourceSets.small);
  mediumSource.media = mediumMedia;
  picture.append(mediumSource);

  const largeSource = document.createElement("source");
  largeSource.srcset = placeholderImage;
  largeSource.setAttribute("data-srcset", sourceSets.small);
  largeSource.media = desktopMedia;
  picture.append(largeSource);

  const image = document.createElement("img");
  image.srcset = placeholderImage;
  image.setAttribute("data-srcset", sourceSets.large);
  image.alt = DBHelper.imageAltTextForRestaurant(restaurant);
  image.className = "restaurant-img";
  picture.append(image);

  return picture;
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
