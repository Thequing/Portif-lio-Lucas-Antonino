// A one-line notice at the bottom of the screen, as a game prints "Cheat
// enabled". Announced to screen readers through role="status".
let el = null;
let timer = 0;

export function toast(text, { sprite } = {}) {
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.replaceChildren();
  if (sprite) {
    const img = document.createElement('img');
    img.src = sprite;
    img.alt = '';
    img.width = 64;
    img.height = 64;
    el.appendChild(img);
  }
  el.append(text);
  el.classList.add('is-showing');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('is-showing'), 3000);
}
