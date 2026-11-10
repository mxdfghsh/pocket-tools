/* 口袋小站 · Service Worker（离线可用） */
const CACHE = "pocket-v17";
const ASSETS = [
  "./", "./index.html", "./tools.html", "./hub.html", "./web.html", "./play.html",
  "./games.html", "./links.html", "./about.html", "./nes.html", "./chess.html", "./dos.html",
  "./home.css", "./style.css", "./games.css", "./theme.css", "./skins.css", "./splash.css",
  "./theme.js", "./skin.js", "./ui.js", "./motion.css", "./motion.js",
  "./app.js", "./extra.js", "./extra2.js", "./extra3.js", "./extra4.js", "./extra5.js", "./qrcode.js", "./landing.js", "./games.js", "./games-more.js", "./chess.js", "./nes.js", "./pwa.js",
  "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(ASSETS.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // 模拟器大文件不进缓存（省空间）
  if (/\/js-dos\/|\.jsdos$|\.wasm$|\/big\//.test(url.pathname)) return;

  // 页面：网络优先，离线回退缓存
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((r) => {
          const cp = r.clone();
          caches.open(CACHE).then((c) => c.put(req, cp)).catch(() => {});
          return r;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("./index.html")))
    );
    return;
  }

  // 静态资源：缓存优先
  e.respondWith(
    caches.match(req).then(
      (m) =>
        m ||
        fetch(req)
          .then((r) => {
            const cp = r.clone();
            caches.open(CACHE).then((c) => c.put(req, cp)).catch(() => {});
            return r;
          })
          .catch(() => m)
    )
  );
});
