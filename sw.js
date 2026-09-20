// Прави приложението достъпно без интернет.
// Изисква се от pauza.feature („Паузата работи без интернет“) и
// nuzhna-mi-e-pomosht.feature („Страницата работи без интернет“).
// Работи само през HTTPS или localhost.

const CACHE = 'moyat-pat-v1';
const SHELL = ['./', './index.html', './manifest.json', './apple-touch-icon.png', './icon-512.png'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())));

function keep(req, res) {
  const copy = res.clone();
  caches.open(CACHE).then(c => c.put(req, copy));
  return res;
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Самата страница: първо мрежата, за да идват новите версии. Без мрежа — от кеша.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => keep('./index.html', res))
        .catch(() => caches.match('./index.html')));
    return;
  }

  // Икони и шрифт: първо кеша, за да тръгва мигновено.
  e.respondWith(
    caches.match(e.request)
      .then(hit => hit || fetch(e.request).then(res => keep(e.request, res))));
});
