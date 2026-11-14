const V = 'mi-dinero-v1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
const FONTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fuentes: usar copia guardada y actualizarla en segundo plano.
  if (FONTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(V).then(c =>
        c.match(req).then(hit => {
          const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit);
          return hit || net;
        })
      )
    );
    return;
  }

  // Cotización del dólar y cualquier otro sitio: siempre por red, sin guardar.
  if (url.origin !== location.origin) return;

  // Archivos de la app: primero la red (así llegan las actualizaciones) y, sin conexión, la copia guardada.
  e.respondWith(
    fetch(req)
      .then(r => { const copy = r.clone(); caches.open(V).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
  );
});
