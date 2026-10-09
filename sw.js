// 세상의 모든 물리학 실험 서비스 워커: 한 번 열면 앱 파일과 3D·물리 엔진을 저장해 두고, 다음부터는 저장본으로 빠르게(인터넷이 끊겨도) 실행한다.
const CACHE = 'hjs-physics-lab-v58';
const SHELL = ['./install.html', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate';
  const isLib = /cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (isPage) {
    // 페이지: 새 버전을 먼저 받아 보고, 안 되면 저장본
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req)));
  } else if (isLib || url.origin === location.origin) {
    // 라이브러리·그림: 저장본이 있으면 그것을, 없으면 받아서 저장
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    })));
  }
});
