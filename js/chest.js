import { track } from './analytics.js';

// The bonus-stage chest. Opening it is the only thing that fetches the art:
// the six <img> ship with data-src and get a real src here, so a booth phone
// that never clicks never pays the 1.1 MB.
export function initChest({ reducedMotion }) {
  const chest = document.getElementById('chest');
  const loot = document.getElementById('loot');
  const box = document.getElementById('lightbox');
  if (!chest || !loot) return {};

  function reveal() {
    if (chest.getAttribute('aria-expanded') === 'true') return;
    chest.setAttribute('aria-expanded', 'true');
    chest.classList.add('is-open');

    for (const img of loot.querySelectorAll('img[data-src]')) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    }
    loot.hidden = false;

    const items = [...loot.children];
    if (reducedMotion || !window.gsap) {
      for (const li of items) li.classList.add('is-landed');
      return;
    }
    // Items launch out of the chest on a short arc and land in the grid; the
    // CSS sparkle fires on .is-landed.
    window.gsap.from(items, {
      y: -120,
      x: (i) => (i - (items.length - 1) / 2) * 18,
      opacity: 0,
      scale: 0.6,
      duration: 0.5,
      ease: 'back.out(1.6)',
      stagger: 0.06,
      onComplete: () => { for (const li of items) li.classList.add('is-landed'); },
    });
  }
  chest.addEventListener('click', () => {
    if (chest.getAttribute('aria-expanded') !== 'true') track('chest');
    reveal();
  });

  const api = { open: reveal };
  if (!box || typeof box.showModal !== 'function') return api;
  const img = box.querySelector('img');
  const count = box.querySelector('.lightbox-count');
  const tiles = [...loot.querySelectorAll('.tile')];
  let index = 0;

  // The lightbox pages through the loot like an item viewer: buttons, ← →,
  // and a horizontal swipe on touch screens.
  function show(i) {
    index = (i + tiles.length) % tiles.length;
    const source = tiles[index].querySelector('img');
    img.src = source.src;
    img.alt = source.alt;
    if (count) count.textContent = `${index + 1} / ${tiles.length}`;
  }

  tiles.forEach((tile, i) => {
    tile.addEventListener('click', () => {
      if (!tile.querySelector('img')?.src) return;
      show(i);
      box.showModal();
    });
  });
  box.querySelector('.prev')?.addEventListener('click', () => show(index - 1));
  box.querySelector('.next')?.addEventListener('click', () => show(index + 1));
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });
  let touchX = null;
  box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
  });
  box.querySelector('.close')?.addEventListener('click', () => box.close());
  // A click on the backdrop lands on the dialog element itself, not its children.
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  // Focus goes back to the tile last shown, which may not be the one opened.
  box.addEventListener('close', () => {
    img.removeAttribute('src');
    tiles[index]?.focus();
  });
  return api;
}
