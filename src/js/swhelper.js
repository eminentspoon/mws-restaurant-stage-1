class SWHelper {
  static registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.min.js").then(() => {
        window.addEventListener("online", () => {
          navigator.serviceWorker.controller.postMessage("sync-offline");
        });
      });
    }
  }
}
