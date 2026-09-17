// The bonus-stage chest. Opening it is the only thing that fetches the art:
// the six <img> ship with data-src and get a real src here, so a booth phone
// that never clicks never pays the 1.1 MB.
export function initChest({ reducedMotion }) {
  const chest = document.getElementById('chest');
  const loot = document.getElementById('loot');
  const box = document.getElementById('lightbox');
  if (!chest || !loot) return;

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
  chest.addEventListener('click', reveal);

  if (!box || typeof box.showModal !== 'function') return;
  const img = box.querySelector('img');
  let opener = null;

  for (const tile of loot.querySelectorAll('.tile')) {
    tile.addEventListener('click', () => {
      const source = tile.querySelector('img');
      if (!source?.src) return;
      img.src = source.src;
      img.alt = source.alt;
      opener = tile;
      box.showModal();
    });
  }
  box.querySelector('.close')?.addEventListener('click', () => box.close());
  // A click on the backdrop lands on the dialog element itself, not its children.
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
  box.addEventListener('close', () => {
    img.removeAttribute('src');
    opener?.focus();
  });
}
