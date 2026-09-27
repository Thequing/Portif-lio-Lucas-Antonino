import { initAnalytics } from './analytics.js';
import { initI18n } from './i18n.js';
import { initMedia } from './media.js';
import { initHud } from './hud.js';
import { initChest } from './chest.js';
import { initScroll } from './scroll.js';
import { initNav } from './nav.js';
import { initStageCard } from './stagecard.js';
import { initKeys } from './keys.js';
import { initReadouts } from './readouts.js';
import { initContinue } from './continue.js';
import { initSource } from './source.js';
import { initSprite } from './sprite.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ready() {
  return new Promise((resolve) => {
    if (window.gsap && window.ScrollTrigger) return resolve();
    const poll = setInterval(() => {
      if (window.gsap && window.ScrollTrigger) {
        clearInterval(poll);
        resolve();
      }
    }, 50);
    setTimeout(() => { clearInterval(poll); resolve(); }, 3000);
  });
}

// Boot: a black frame with a caret until the title video can play, then a
// hard cut. Never longer than 800ms — the page is not held hostage to a clip.
function runLoader() {
  const loader = document.getElementById('loader');
  const hero = document.querySelector('video[data-hero]');
  return new Promise((resolve) => {
    if (!hero || hero.readyState >= 3) return resolve();
    hero.addEventListener('canplay', resolve, { once: true });
    setTimeout(resolve, 800);
  }).then(() => loader?.remove());
}

// Enter on the title screen acts like Press start, as long as nothing else has
// focus and the title screen still fills most of the viewport.
function pressStart() {
  const start = document.getElementById('press-start');
  const title = document.getElementById('title');
  if (!start || !title) return;
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target !== document.body) return;
    if (title.getBoundingClientRect().bottom > window.innerHeight * 0.5) start.click();
  });
}

// Each module is independent: a throw in one (a browser quirk, a missing
// element) is logged and the rest still start, rather than leaving the page
// half-initialised behind the loader.
function safe(name, fn) {
  try { return fn(); } catch (err) { console.error(`${name} failed to start`, err); }
}

async function boot() {
  safe('analytics', initAnalytics);
  safe('i18n', initI18n);
  safe('media', () => initMedia({ reducedMotion }));
  safe('stage card', () => initStageCard({ reducedMotion }));
  safe('hud', initHud);
  const chest = safe('chest', () => initChest({ reducedMotion }));
  safe('nav', initNav);
  safe('keys', () => initKeys({ openChest: chest?.open }));
  safe('readouts', () => initReadouts({ reducedMotion }));
  safe('continue', () => initContinue({ reducedMotion }));
  safe('source', initSource);
  safe('sprite', () => initSprite({ reducedMotion }).catch((err) => console.error('sprite failed', err)));
  safe('press start', pressStart);

  if (reducedMotion) {
    document.getElementById('loader')?.remove();
    return;
  }

  await ready();
  if (!window.gsap || !window.ScrollTrigger) {
    // CDN failed; leave the page static and complete rather than broken.
    document.documentElement.classList.add('no-gsap');
    document.getElementById('loader')?.remove();
    return;
  }

  await runLoader();
  safe('scroll', initScroll);
}

boot();
