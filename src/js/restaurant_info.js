let restaurant;
let restaurantLoaded = false,
  mapRetryAttempts = 0,
  maxMapRetry = 5,
  mapTimer,
  dataFailed = false,
  mapInited = false;
var map;
let notificationManager;
const desktopMedia = "(min-width: 900px)";
const mediumMedia = "(min-width: 550px) and (max-width: 899px)";
const baseMedia = "(max-width: 549px)";
const mapTimerGap = 100;
const mapHideTimer = 2000;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  mapInited = true;
  if (dataFailed) {
    return;
  }

  if (restaurantLoaded) {
    self.map = new google.maps.Map(document.getElementById("map"), {
      zoom: 16,
      center: self.restaurant.latlng,
      scrollwheel: false
    });
    const map = document.getElementById("map");
    if (map.classList.contains("failure")) {
      //reshow if map was really slow to load in but still online
      map.classList.remove("failure");
      document.getElementById("map-container").removeAttribute("aria-hidden");
    }
    DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    google.maps.event.addListenerOnce(self.map, "idle", () => {
      document.getElementsByTagName("iframe")[0].title = "Google Maps";
    });
  } else {
    if (mapRetryAttempts < maxMapRetry) {
      mapRetryAttempts = mapRetryAttempts + 1;
      mapTimer = setTimeout(window.initMap, mapTimerGap);
      return;
    }
    dataFailed = true;
  }
};

document.addEventListener("DOMContentLoaded", event => {
  notificationManager = new NotificationManager();
  const restId = getRestaurantIdFromUrl();
  if (!restId) {
    // no id found in URL
    console.error("No restaurant id in URL");
    window.location = "/";
  } else {
    fetchRestaurantFromURL(restId);
    setupRestaurantFavourite(restId);
  }

  SWHelper.registerServiceWorker();
  document.getElementById("skipmap").addEventListener("click", e => {
    document.getElementById("restaurant-container").focus();
  });
});

getRestaurantIdFromUrl = () => {
  return getParameterByName("id");
};

setupRestaurantFavourite = restId => {
  const favouriteBlock = document.querySelector("#favourite-set");
  favouriteBlock.addEventListener("click", e => {
    e.preventDefault();
    const restaurantId = restId;
    const currentState = e.target.getAttribute("data-favourite");
    DBHelper.changeRestaurantFavouriteStatus(
      restaurantId,
      !(Number(currentState) === 1)
    ).then(o => {
      notificationManager.showMessage(
        "Restaurant favourite status updated on server",
        false
      );
      setFavouriteStatusFromServer(restaurantId);
    });
  });

  setFavouriteStatusFromServer(restId);
};

setFavouriteStatusFromServer = restId => {
  const favouriteBlock = document.querySelector("#favourite-set");
  DBHelper.isRestaurantFavourite(restId).then(resp => {
    if (resp) {
      favouriteBlock.classList.add("checked");
      favouriteBlock.setAttribute(
        "aria-label",
        "Remove restaurant as a favourite"
      );
      favouriteBlock.setAttribute("title", "Remove restaurant as a favourite");
      favouriteBlock.setAttribute("data-favourite", "1");
      return;
    }
    favouriteBlock.classList.remove("checked");
    favouriteBlock.setAttribute("aria-label", "Mark restaurant as a favourite");
    favouriteBlock.setAttribute("title", "Mark restaurant as a favourite");
    favouriteBlock.setAttribute("data-favourite", "0");
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = restId => {
  if (self.restaurant) {
    return;
  }

  DBHelper.fetchRestaurantById(restId, (error, restaurant) => {
    self.restaurant = restaurant;
    if (!restaurant) {
      console.error(error);
      return;
    }
    restaurantLoaded = true;
    fillRestaurantHTML();
    fillBreadcrumb();
    setTimeout(() => {
      if (mapInited) {
        return;
      }
      //add class to minimise and then hide from screen readers etc
      document.getElementById("map").classList.add("failure");
      document
        .getElementById("map-container")
        .setAttribute("aria-hidden", true);
    }, mapHideTimer);
  });
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  const sourceSets = DBHelper.responsiveImagesForRestaurant(restaurant);

  const baseSource = document.createElement("source");
  baseSource.srcset = sourceSets.medium;
  baseSource.media = baseMedia;

  const mediumSource = document.createElement("source");
  mediumSource.srcset = sourceSets.large;
  mediumSource.media = mediumMedia;

  const largeSource = document.createElement("source");
  largeSource.srcset = sourceSets.medium;
  largeSource.media = desktopMedia;

  const image = document.createElement("img");
  image.srcset = sourceSets.medium;
  image.alt = DBHelper.imageAltTextForRestaurant(restaurant);
  image.className = "restaurant-img";

  const picture = document.getElementById("restaurant-img");
  picture.appendChild(baseSource);
  picture.appendChild(mediumSource);
  picture.appendChild(largeSource);
  picture.appendChild(image);

  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.setAttribute(
    "aria-label",
    `Restaurant cuisine : ${restaurant.cuisine_type}`
  );
  cuisine.innerText = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill revfillReviewsHTMLiews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");

  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.querySelector("tbody").appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById("reviews-container");

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  const reviewCount = reviews.length;
  for (let i = 0; i < reviewCount; i++) {
    ul.appendChild(createReviewHTML(reviews[i], reviewCount, i + 1));
  }
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, totalCount, pos) => {
  const li = document.createElement("li");
  li.setAttribute("aria-setsize", totalCount);
  li.setAttribute("aria-posinset", pos);
  li.setAttribute(
    "aria-label",
    `Review by ${review.name} - ${review.rating} out of 5`
  );
  const name = document.createElement("p");
  name.classList.add("name");
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement("p");
  date.classList.add("date");
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement("div");
  rating.setAttribute("aria-hidden", "true");
  rating.classList.add("rating");
  for (let i = 0; i < 5; i++) {
    if (review.rating > i) {
      rating.innerHTML += '<span class="checked">★</span>';
      continue;
    }
    rating.innerHTML += "<span>☆</span>";
  }

  const ratingAccessible = document.createElement("div");
  ratingAccessible.classList.add("plainrating");
  ratingAccessible.innerText = `Rating: ${review.rating} out of 5`;

  li.appendChild(ratingAccessible);
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.classList.add("comments");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  li.setAttribute("aria-current", "page");
  breadcrumb.querySelector("ol").appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};
