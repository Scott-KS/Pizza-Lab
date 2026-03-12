/*  The Pie Lab — Service Worker  */
const CACHE_NAME = "pielab-v1";

/* ── Shell assets (app skeleton — always cached) ── */
const APP_SHELL = [
  "/",
  "/index.html",
  "/calculator.html",
  "/schedule.html",
  "/journal.html",
  "/kitchen.html",
  "/learn.html",
  "/style.css?v=7",
  "/js/toolkit.js",
  "/js/calculator.js",
  "/js/scheduler.js",
  "/js/journal-ui.js",
  "/js/kitchen.js",
  "/js/knowledge.js",
  "/js/nav.js",
  "/js/carousel.js",
  "/js/user-profile.js",
  "/js/pie-notifications.js",
  "/js/capacitor-init.js",
  "/js/vendor/html2canvas.min.js",
  "/assets/logos/favicon-32.svg",
  "/assets/logos/logo-monogram-512.svg",
  "/assets/logos/logo-horizontal.svg",
  "/manifest.json",
];

/* ── Images (cached on first load, not blocking install) ── */
const IMAGE_ASSETS = [
  "/Images/Neapolitan.webp",
  "/Images/New-York.webp",
  "/Images/Grandma.webp",
  "/Images/Chicago-Tavern.webp",
  "/Images/Sicilian.webp",
  "/Images/Ohio-Valley.webp",
  "/assets/logos/logo-stacked.svg",
  "/assets/logos/logo-stacked-light.svg",
  "/assets/logos/logo-watermark.png",
];

/* ── Install: pre-cache the app shell ── */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache images in background (don't block install)
      IMAGE_ASSETS.forEach((url) =>
        cache.add(url).catch(() => {/* non-critical */})
      );
      // App shell must succeed
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

/* ── Activate: clean old caches ── */
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch: cache-first for app shell, network-first for fonts ── */
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin API calls
  if (e.request.method !== "GET") return;

  // Google Fonts: network-first (cache for offline)
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else: cache-first, fallback to network
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request).then((res) => {
          // Cache successful same-origin responses
          if (res.ok && url.origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          }
          return res;
        })
    )
  );
});
