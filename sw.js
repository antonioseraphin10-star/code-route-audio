/* Service Worker — Code de la Route Révision Audio
   Stratégie : app-shell en cache (offline), réseau d'abord pour la navigation. */
const CACHE = "cdlr-v13";
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
  // Copie faite tout de suite : plus tard, le corps de la réponse est déjà lu
  // par la page et clone() échoue (« body already used »).
  if (canCache(req, res)) {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
  }
  return res;
}

self.addEventListener("install", e => {
  // cache: "reload" contourne le cache HTTP du navigateur (GitHub Pages : 10 min),
  // sinon une nouvelle version pourrait s'installer avec l'ancien app.js.
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(url => new Request(url, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
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
  // Pages : réseau d'abord (pour récupérer les mises à jour), repli cache hors-ligne.
  // L'app n'a qu'une page : on la range toujours sous ./index.html, pour que des
  // adresses avec paramètres (?utm=…) ne remplissent pas le cache.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        const isPage = /text\/html/.test(res.headers.get("content-type") || "");
        return isPage ? cacheIfSafe(new Request("./index.html"), res) : res;
      })
        .catch(() => caches.match("./index.html")
          .then(r => r || caches.match(req, { ignoreSearch: true }))
          .then(r => r || Response.error()))
    );
    return;
  }
  // Autres ressources : cache d'abord, complète au réseau
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      return cacheIfSafe(req, res);
    }).catch(() => Response.error()))
  );
});
