/*  The Pie Lab — Service Worker  */
const CACHE_NAME = "pielab-v48";

/* ── Derive base path so caching works on both localhost and /Pizza-Lab/ ── */
const BASE = self.registration.scope;

/* ── Shell assets (app skeleton — always cached) ── */
/* Version query strings MUST match the <script>/<link> tags in HTML pages */
const APP_SHELL_PATHS = [
  "",
  "index.html",
  "calculator.html",
  "schedule.html",
  "journal.html",
  "kitchen.html",
  "learn.html",
  "legal.html",
  "style.css?v=28",
  "js/premium.js?v=3",
  "js/toolkit.js?v=5",
  "js/calculator.js?v=16",
  "js/scheduler.js",
  "js/scheduler-guide.js",
  "js/photo-store.js?v=1",
  "js/journal-ui.js?v=16",
  "js/kitchen.js?v=10",
  "js/knowledge.js?v=3",
  "js/nav.js?v=7",
  "js/carousel.js",
  "js/onboarding.js",
  "js/first-bake.js",
  "js/user-profile.js?v=5",
  "js/pie-notifications.js",
  "js/capacitor-init.js",
  "js/vendor/html2canvas.min.js",
  "recipes.js?v=6",
  "knowledge-data.js?v=2",
  "tools-data.js?v=4",
  "scheduler-data.js?v=5",
  "journal.js?v=4",
  "assets/logos/favicon-32.svg",
  "assets/logos/logo-monogram-512.svg",
  "assets/logos/logo-horizontal.svg",
  "assets/logos/logo-transparent.svg",
  "manifest.json",
];

/* ── External fonts (cached on first successful load) ── */
const FONT_URLS = [
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap",
];

/* ── Images (cached on first load, not blocking install) ── */
const IMAGE_PATHS = [
  "Images/Neapolitan.webp",
  "Images/New-York.webp",
  "Images/Grandma.webp",
  "Images/Chicago-Tavern.webp",
  "Images/Sicilian.webp",
  "Images/Ohio-Valley.webp",
  "assets/logos/logo-stacked.svg",
  "assets/logos/logo-stacked-light.svg",
  "assets/logos/logo-horizontal-light.svg",
  "assets/logos/logo-watermark.png",
];

/* ── Install: pre-cache the app shell ── */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache images in background (don't block install)
      IMAGE_PATHS.forEach((p) =>
        cache.add(BASE + p).catch(() => {/* non-critical */})
      );
      // Cache Google Fonts in background (for offline use)
      FONT_URLS.forEach((url) =>
        cache.add(url).catch(() => {/* non-critical */})
      );
      // App shell must succeed
      return cache.addAll(APP_SHELL_PATHS.map((p) => BASE + p));
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
