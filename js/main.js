import { initI18n } from './i18n.js';
import { initMedia } from './media.js';
import { initHud } from './hud.js';
import { initChest } from './chest.js';
import { initScroll } from './scroll.js';

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

async function boot() {
  initI18n();
  initMedia({ reducedMotion });
  initHud();
  initChest({ reducedMotion });
  pressStart();

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
  initScroll();
}

boot();
