class SWHelper {
  static registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.min.js");
    }
  }
}
