/* Life of Me service worker. CACHE/BUILD are bumped by tools/build-workouts.py */
importScripts('workouts-data.js');
const BUILD = 'f69a42649099';
const CACHE = 'life-of-me-v13';
const BLOCKS = self.WORKOUT_BLOCKS || [];
// Precache photos of the two newest blocks; older blocks are cached the first time they are viewed.
const WK_IMAGES = BLOCKS.slice(-2).flatMap((b) => b.workouts.flatMap((w) => w.exercises.flatMap((e) => ['./' + e.image, './' + e.full])));
const ASSETS = ['./', './index.html', './styles.css', './app.js', './scene.js', './workouts-data.js', './manifest.webmanifest',
  './fonts/jakarta.woff2', './fonts/bricolage.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/icon-maskable-512.png',
  ...['winter', 'spring', 'summer', 'autumn'].flatMap((n) => [`./scenes/${n}.webp`, `./scenes/${n}-thumb.jpg`]),
  ...[0, 1, 2, 3, 4, 5].flatMap((i) => [`./scenes/leaf${i}.webp`, `./scenes/petal${i}.webp`]),
  ...WK_IMAGES];
// cache:'reload' bypasses the HTTP cache so an update never precaches stale files.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([...new Set(ASSETS)].map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k.startsWith('life-of-me')).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { if (e.data === 'version' && e.source) e.source.postMessage({ type: 'version', cache: CACHE, build: BUILD }); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true }).then((hit) => {
    if (hit) return hit; // cache-first; every deploy gets a new CACHE name, so there is no stale mixing
    return fetch(req).then((res) => { if (res.ok && res.type === 'basic') c.put(req, res.clone()); return res; }).catch(() => (req.mode === 'navigate' ? c.match('./index.html') : Response.error()));
  })));
});
