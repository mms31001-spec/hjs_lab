/*
==========================================================================
 세상의 모든 물리학 실험 (세.모.물)
 Copyright © 2026 한재상 (Han Jae Sang). All rights reserved.
 한국저작권위원회 저작권 등록

 이 프로그램의 소스 코드는 저작권법으로 보호되는 저작물입니다.
 저작권자의 사전 서면 허락 없이 전부 또는 일부를 복제, 배포, 변형,
 상업적 이용 등의 행위를 하는 것을 엄격히 금지합니다.
 이를 어기면 저작권법 제136조 등에 따라 민사상 손해배상 책임과 함께
 5년 이하의 징역 또는 5천만 원 이하의 벌금에 처해지거나
 이를 함께 받을 수 있습니다.

 이 웹사이트에 접속하여 실험실을 수업과 학습에 이용하는 것은 자유롭게
 할 수 있습니다.
 이용 문의: hjs31001@korea.kr

 The source code of this program is protected by copyright law and is
 registered with the Korea Copyright Commission. Copying, distributing,
 modifying, or commercially using this source code, in whole or in part,
 without the prior written permission of the copyright holder is strictly
 prohibited. Violations may result in civil liability and criminal
 penalties under Article 136 of the Copyright Act of the Republic of Korea
 (imprisonment of up to five years, a fine of up to 50 million won, or both).
 Using the lab through this website for teaching and learning is permitted.
 Contact: hjs31001@korea.kr
==========================================================================
*/
// 세상의 모든 물리학 실험 서비스 워커: 한 번 열면 앱 파일과 3D·물리 엔진을 저장해 두고, 다음부터는 저장본으로 빠르게(인터넷이 끊겨도) 실행한다.
const CACHE = 'hjs-physics-lab-v300';        // 앱 파일: 새 버전마다 이름을 바꾼다
const LIB = 'hjs-physics-lib-v1';            // 3D·물리 엔진·글꼴: 버전과 관계없이 계속 보관 (업데이트 뒤에도 인터넷 없이 실행)
const SHELL = ['./install.html', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
const LIBS = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js',
  'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@500&display=swap'
];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE); await c.addAll(SHELL);
    const l = await caches.open(LIB);           // 엔진은 설치할 때 미리 받아 둔다 (실패해도 앱 설치는 계속)
    await Promise.all(LIBS.map(async u => { try { if (!(await l.match(u))) { const r = await fetch(u, { mode: 'cors' }); if (r.ok) await l.put(u, r); } } catch (err) {} }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== LIB).map(k => caches.delete(k)))).then(() => self.clients.claim()));
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
    const store = isLib ? LIB : CACHE;
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(store).then(c => c.put(req, copy)); }
      return r;
    })));
  }
});
