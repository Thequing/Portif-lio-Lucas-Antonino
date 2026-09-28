// Offline shell, for the hall.
//
// Lucas is at BGS 2026 without a machine running a build, so these interactions
// are the only thing anyone can put their hands on — and conference wifi should
// be assumed dead. Open the site once on a working connection and the page,
// every module and all six interactions keep working with the radio off.
//
// The video clips are deliberately NOT precached: they are megabytes each and
// they degrade to their posters, which are. A visitor who cannot watch a clip
// but can still run the balance suite has lost the less interesting half.
const VERSION = 'v1';
const CACHE = `portfolio-shell-${VERSION}`;

const SHELL = [
  './',
  'index.html',
  'css/base.css',
  'css/layout.css',
  'css/components.css',
  'js/main.js',
  'js/i18n.js',
  'js/media.js',
  'js/hud.js',
  'js/chest.js',
  'js/scroll.js',
  'js/portrait.js',
  'js/arcade.js',
  'js/progress.js',
  'js/analytics.js',
  'js/continue.js',
  'js/keys.js',
  'js/nav.js',
  'js/readouts.js',
  'js/source.js',
  'js/sprite.js',
  'js/stagecard.js',
  'js/toast.js',
  // Self-hosted GSAP: same reasoning as the rest of this file, and without it
  // the pins and the stage wipes are the first thing the hall takes away.
  'js/vendor/gsap.min.js',
  'js/vendor/ScrollTrigger.min.js',
  'js/stages/steam-veins.js',
  'js/stages/midnight.js',
  'js/stages/drift.js',
  'js/stages/drift-suite.js',
  'js/stages/drift-worker.js',
  'js/stages/hells-kitchen.js',
  'js/stages/kuroneko.js',
  'js/stages/dino.js',
  'js/stages/data/drift-scorer.js',
  'js/stages/data/hk-damage.js',
  'js/stages/data/kn-script.js',
  'media/font/jersey-20-400.woff2',
  'media/font/atkinson-hyperlegible-400.woff2',
  'media/font/atkinson-hyperlegible-700.woff2',
  'media/font/jetbrains-mono-400.woff2',
  'media/minigames/dummy.png',
  'media/minigames/lens.png',
  'media/sprite/kuroneko-wave.json',
  'media/sprite/kuroneko-wave.png',
  'media/art/dino-girls-capsule.jpg',
  'media/me/pixel-me.png',
  'media/me/real-me-512.webp',
  'media/favicon.svg',
  'media/lucas-antonino.vcf',
  // The two things a visitor most wants after scanning the code.
  'Lucas_Antonino_CV.pdf',
  'media/poster/steam-veins-title.webp',
  'media/poster/steam-veins-combat.webp',
  'media/poster/steam-veins-chapel.webp',
  'media/poster/midnight-street.webp',
  'media/poster/midnight-boss.webp',
  'media/poster/framed-drift.webp',
  'media/poster/hells-kitchen.webp',
  'media/poster/kuroneko.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      // One failure must not abandon the whole precache, so each entry is added
      // on its own and a miss is logged rather than thrown.
      await Promise.all(SHELL.map(async (url) => {
        try {
          const response = await fetch(new Request(url, { cache: 'reload' }));
          if (response.ok) await cache.put(url, response);
        } catch {
          // Offline during install, or the file moved. The runtime handler will
          // pick it up on a later visit.
        }
      }));
      await self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('portfolio-shell-') && k !== CACHE)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // GSAP's CDN stays the network's problem

  // Video is never cached: megabytes each, and the posters already are.
  if (url.pathname.includes('/media/video/')) return;

  // The page itself: network first, so an update is seen as soon as there is a
  // network, and the cached copy is the fallback rather than the default.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((c) => c.put('index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('index.html').then((r) => r || Response.error()))
    );
    return;
  }

  // Everything else: cache first. These are versioned by deploy, not by URL, so
  // a hit is served immediately and a miss is fetched and kept.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return response;
      });
    })
  );
});
