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
    fetchRestaurantFromURL(restId).then(o => {
      setupRestaurantFavourite(restId);
      setupRestaurantReview(restId);
    });
  }

  SWHelper.registerServiceWorker();
  document.getElementById("skipmap").addEventListener("click", e => {
    document.getElementById("restaurant-container").focus();
  });
});

setupRestaurantReview = restId => {
  const addReviewBtn = document.getElementById("review-add");
  addReviewBtn.addEventListener("click", () => {
    showReviewAdditionForm(restId);
  });
  const dialog = document.getElementById("review-dialog");
  dialog.addEventListener("close", () => {
    const commentsArea = document.getElementById("review-comments");
    const ratingArea = document.querySelector("#review-rating");
    const name = document.getElementById("review-name");
    const elements = ratingArea.querySelectorAll("button.rating-button");
    ratingArea.removeAttribute("data-selectedrating");
    ratingArea.setAttribute("aria-label", `Restaurant not yet rated`);
    name.value = "";
    commentsArea.value = "";
    elements.forEach(o => {
      o.classList.remove("checked");
    });
  });

  const dialogAdd = document.getElementById("dialog-add");
  dialogAdd.addEventListener("click", addReview);

  const dialogCancel = document.getElementById("dialog-cancel");
  dialogCancel.addEventListener("click", closeReviewDialog);

  const ratingElements = document.querySelectorAll("button.rating-button");
  ratingElements.forEach(o => o.addEventListener("click", handleRatingClick));
};

function sanitiseText(str) {
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

handleRatingClick = e => {
  let currEle = e.target;
  let rating = Number(currEle.getAttribute("data-rating"));
  const commentsArea = document.getElementById("review-comments");
  const ratingArea = document.querySelector("#review-rating");
  const elements = ratingArea.querySelectorAll("button.rating-button");
  const elementCount = elements.length;
  ratingArea.setAttribute("data-selectedrating", rating);
  ratingArea.setAttribute("aria-label", `Rated ${rating} out of 5`);

  for (let i = 0; i < elementCount; i++) {
    let currentElement = elements[i];
    if (i + 1 <= rating) {
      if (!currentElement.classList.contains("checked")) {
        currentElement.classList.add("checked");
      }
      continue;
    }
    currentElement.classList.remove("checked");
  }
  commentsArea.focus();
};

closeReviewDialog = () => {
  const dialog = document.getElementById("review-dialog");
  dialog.close();
};

addReview = async () => {
  let errors = [];
  let isErrored = false;
  const name = sanitiseText(document.getElementById("review-name").value);
  const dialog = document.getElementById("review-dialog");
  const rating = document.getElementById("review-rating");
  let selectedRating = sanitiseText(rating.getAttribute("data-selectedrating"));
  const comments = sanitiseText(
    document.getElementById("review-comments").value
  );

  if (name.length === 0) {
    errors.push("Name must be provided");
    isErrored = true;
  }

  if (
    !selectedRating ||
    isNaN(Number(selectedRating)) ||
    Number(selectedRating) < 1 ||
    Number(selectedRating) > 5
  ) {
    errors.push("Rating must be provided");
    isErrored = true;
  }

  if (comments.length === 0) {
    errors.push("Comments must be provided");
    isErrored = true;
  }

  if (isErrored) {
    let errorText = "Unable to create review:\r\n";

    if (errors.length > 1) {
      for (let i = 0; i < errors.length; i++) {
        errorText += errors[i];
        if (i < errors.length - 1) {
          errorText += "\r\n";
        }
      }
    } else {
      errorText += errors[0];
    }

    notificationManager.showError(errorText, false);
    return;
  }

  const createdReview = await DBHelper.createReview({
    restaurant_id: Number(getRestaurantIdFromUrl()),
    name: name,
    rating: Number(selectedRating),
    comments: comments
  });
  addSingleReviewToPage(createdReview);
  notificationManager.showMessage(
    "Your review has been added successfully",
    false
  );
  dialog.close();
};

showReviewAdditionForm = restId => {
  let dialog = document.getElementById("review-dialog");
  dialog.setAttribute("data-restid", restId);
  dialog.showModal();
};

getRestaurantIdFromUrl = () => {
  return getParameterByName("id");
};

setupRestaurantFavourite = restId => {
  const favouriteBlock = document.querySelector("#favourite-set");
  favouriteBlock.addEventListener("click", e => {
    e.preventDefault();
    const restaurantId = restId;
    const currentState = e.target.getAttribute("data-favourite");
    const newStatus = !(Number(currentState) === 1);

    DBHelper.changeRestaurantFavouriteStatus(restaurantId, newStatus).then(
      o => {
        notificationManager.showMessage(
          "Restaurant favourite status updated on server",
          false
        );
        self.restaurant.is_favorite = newStatus ? "true" : "false";
        setFavouriteStatusOnPage();
      }
    );
  });

  setFavouriteStatusOnPage();
};

setFavouriteStatusOnPage = () => {
  const favouriteBlock = document.querySelector("#favourite-set");
  if (self.restaurant) {
    if (self.restaurant.is_favorite.toString() === "true") {
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
  }
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = async restId => {
  if (self.restaurant) {
    return;
  }
  return DBHelper.fetchRestaurantById(restId)
    .then(restaurant => {
      self.restaurant = restaurant;
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

      return;
    })
    .catch(err => {
      notificationManager.showError(err.text, true);
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
fillReviewsHTML = async () => {
  const reviews = await DBHelper.getReviewsForRestaurant(self.restaurant.id);
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
};

addSingleReviewToPage = review => {
  const ul = document.getElementById("reviews-list");
  let currEntries = ul.querySelectorAll("li");
  const currEntryLength = currEntries.length + 1;

  currEntries.forEach(o => o.setAttribute("aria-setsize", currEntryLength));
  ul.appendChild(createReviewHTML(review, currEntryLength, currEntryLength));
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
  date.innerHTML = new Date(review.updatedAt).toDateString();
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
