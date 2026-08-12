import { initI18n } from './i18n.js';
import { initMedia } from './media.js';
import { initScroll } from './scroll.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ready() {
  return new Promise((resolve) => {
    if (window.gsap && window.ScrollTrigger && window.SplitText) return resolve();
    const poll = setInterval(() => {
      if (window.gsap && window.ScrollTrigger && window.SplitText) {
        clearInterval(poll);
        resolve();
      }
    }, 50);
    setTimeout(() => { clearInterval(poll); resolve(); }, 3000);
  });
}

function runLoader() {
  const loader = document.getElementById('loader');
  const count = loader.querySelector('.loader-count');
  const hero = document.querySelector('video[data-hero]');

  const media = new Promise((resolve) => {
    if (!hero) return resolve();
    if (hero.readyState >= 3) return resolve();
    hero.addEventListener('canplay', resolve, { once: true });
    setTimeout(resolve, 3000); // never hold the page hostage
  });

  const counter = { value: 0 };
  const tween = window.gsap.to(counter, {
    value: 100,
    duration: 1.2,
    ease: 'power1.inOut',
    onUpdate: () => { count.textContent = String(Math.round(counter.value)); },
  });

  return Promise.all([media, tween]).then(
    () =>
      new Promise((resolve) => {
        loader.classList.add('done');
        window.gsap.to(loader, {
          opacity: 0,
          duration: 0.6,
          onComplete: () => { loader.remove(); resolve(); },
        });
      })
  );
}

function revealHero() {
  const { gsap, SplitText } = window;
  // ready() resolves on a 3s timeout whether or not every plugin arrived, so
  // SplitText can legitimately be missing here. Without this guard the throw
  // would propagate out of boot() and initScroll() would never run, costing the
  // whole scroll system to save one title animation.
  if (!SplitText) return;
  const split = new SplitText('#hero h1', { type: 'chars' });
  gsap.from(split.chars, {
    yPercent: 120,
    opacity: 0,
    stagger: 0.03,
    duration: 0.9,
    ease: 'power4.out',
  });
}

async function boot() {
  initI18n();
  initMedia({ reducedMotion });

  if (reducedMotion) {
    document.getElementById('loader')?.remove();
    return;
  }

  await ready();
  if (!window.gsap) {
    // CDN failed; leave the page static and readable rather than broken.
    document.getElementById('loader')?.remove();
    return;
  }

  await runLoader();
  revealHero();
  initScroll();
}

boot();
