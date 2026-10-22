/* Bolecciona Concepción · service worker
   Objetivo: que la web se pueda instalar y abrir aunque no haya señal.
   - Solo guarda archivos del propio sitio (index, íconos, manifiesto). Nunca toca Firebase, Firestore, Auth ni fuentes: esas peticiones pasan directo a la red.
   - Estrategia «red primero»: si hay internet siempre se descarga la versión más reciente (así las actualizaciones llegan solas); la copia guardada solo se usa sin conexión. */
var CACHE = 'bolecciona-shell-v33';
var SHELL = ['./', 'index.html', 'firebase-config.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return fetch(u, { cache: 'no-cache' }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('bolecciona-shell-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // Firebase, gstatic, fuentes… no se interceptan
  if (url.pathname.slice(-5) === 'sw.js') return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(function (res) {
      if (res && res.ok && res.type === 'basic') { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error());
      });
    })
  );
});
