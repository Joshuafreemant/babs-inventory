/**
 * Embassy service worker.
 *  - App shell: cache-first, so the UI paints instantly (and at all, offline).
 *  - Catalogue/settings GETs: network-first with a cache fallback, so the
 *    storefront can still show the last-known catalogue with no signal.
 *  - Everything else (POST/PATCH/DELETE, staff/order data) always hits the
 *    network — never serve stale writes or business data from cache.
 *  - Push: shows a notification for new-order alerts and focuses/opens the
 *    console on click.
 */
const CACHE_VERSION = "embassy-v2";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const SHELL_URLS = ["/", "/manifest.webmanifest", "/pwa/icon-192.png", "/pwa/icon-512.png"];

// GET endpoints safe to serve stale-while-offline — read-only, non-sensitive.
const OFFLINE_OK_PATHS = ["/api/products", "/api/settings"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never cache writes
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isOfflineOk = OFFLINE_OK_PATHS.some((p) => url.pathname.startsWith(p));

  if (isOfflineOk) {
    // network-first: always try live data, fall back to last-cached copy
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (url.pathname.startsWith("/api/")) return; // everything else: network only

  // app shell / static assets: cache-first, refresh in the background
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Embassy", body: "You have a new update.", url: "/console" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/pwa/icon-192.png",
      badge: "/pwa/icon-192.png",
      data: { url: data.url || "/console" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/console";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
