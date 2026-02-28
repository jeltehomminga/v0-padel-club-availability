// Minimal service worker for PWA installability.
// Extend with caching strategies if offline support is needed.
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})
