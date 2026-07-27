/* Service Worker — Code de la Route Révision Audio
   Stratégie : app-shell en cache (offline), réseau d'abord pour la navigation. */
const CACHE = "cdlr-v11";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./data.js",
  "./visuals.js",
  "./images.js",
  "./ecf_data.js",
  "./tts.js",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./icon-32.png"
];

function sameOrigin(req) {
  try { return new URL(req.url).origin === self.location.origin; }
  catch (e) { return false; }
}

function canCache(req, res) {
  return sameOrigin(req) && res && res.ok && (res.type === "basic" || res.type === "default");
}

function cacheIfSafe(req, res) {
  if (canCache(req, res)) caches.open(CACHE).then(c => c.put(req, res.clone()));
  return res;
}

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (!sameOrigin(req)) return;
  // Pages : réseau d'abord (pour récupérer les mises à jour), repli cache hors-ligne
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => cacheIfSafe(req, res))
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }
  // Autres ressources : cache d'abord, complète au réseau
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      return cacheIfSafe(req, res);
    }).catch(() => cached))
  );
});
