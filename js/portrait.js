// The player portrait: a 64px sprite that turns over to the photograph behind it.
// Same deal as the chest — the 43 KB face ships as data-src and is fetched on the
// first press, so a visitor who never presses pays 1.6 KB for the sprite alone.
//
// Everything visible is driven by aria-pressed: CSS keys the rotation and the hint
// off the attribute, so the state a screen reader announces and the state the page
// draws cannot drift apart.
export function initPortrait() {
  const button = document.querySelector('.portrait');
  if (!button) return;

  const real = button.querySelector('.portrait-face.is-real');

  // Fetch on the press that reveals it, but also on the first hint of intent, so
  // the face is usually decoded by the time the frame has finished turning.
  function load() {
    if (!real?.dataset.src) return;
    real.src = real.dataset.src;
    real.removeAttribute('data-src');
  }
  button.addEventListener('pointerenter', load, { once: true });
  button.addEventListener('focus', load, { once: true });

  button.addEventListener('click', () => {
    load();
    const flipped = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', String(!flipped));
  });
}
