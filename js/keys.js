import { goTo, sections, currentIndex } from './nav.js';
import { toast } from './toast.js';
import { t } from './i18n.js';
import { track } from './analytics.js';

// Controller-style navigation: 1–6 jump to a stage, ← → step through every
// section, Esc returns to the title screen. And the Konami code, because the
// page is a game's front-end and someone at the booth will try it. Phones have
// no keyboard, so five quick taps on the logo do the same.
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

function isTyping(el) {
  return el.closest('input, textarea, select, [contenteditable="true"]');
}

export function initKeys({ openChest }) {
  let entered = [];
  let cheated = false;

  function cheat() {
    if (cheated) return;
    cheated = true;
    track('cheat');
    document.documentElement.classList.add('cheat');
    openChest?.();
    goTo(document.getElementById('bonus'));
    toast(t('cheat.toast'), { sprite: 'Imagens/Kunai_Explosion-Sheet.gif' });
  }

  // Tracks the code as a prefix match, so a mistyped key restarts it without
  // needing ten more presses to flush.
  function feedKonami(key) {
    entered.push(key.length === 1 ? key.toLowerCase() : key);
    while (entered.length && !KONAMI.slice(0, entered.length).every((k, i) => k === entered[i])) {
      entered.shift();
    }
    if (entered.length === KONAMI.length) {
      entered = [];
      cheat();
      return true;
    }
    return false;
  }

  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (isTyping(e.target) || document.querySelector('dialog[open]')) return;
    if (feedKonami(e.key)) return e.preventDefault();

    // ← → belong to the source viewer's tab strip while a tab has focus.
    if (e.target.getAttribute?.('role') === 'tab') return;
    // Four keys into the code, the arrows are for the code, not for moving.
    const midCode = entered.length >= 4;

    const all = sections();
    let target = null;
    if (/^[1-6]$/.test(e.key)) target = document.getElementById(`stage-${e.key}`);
    else if (e.key === 'Escape') target = document.getElementById('title');
    else if (e.key === 'ArrowRight' && !midCode) target = all[Math.min(currentIndex() + 1, all.length - 1)];
    else if (e.key === 'ArrowLeft' && !midCode) target = all[Math.max(currentIndex() - 1, 0)];
    if (!target) return;
    e.preventDefault();
    goTo(target);
  });

  const logo = document.querySelector('#title .logo');
  if (logo) {
    let taps = 0;
    let last = 0;
    logo.addEventListener('click', () => {
      const now = performance.now();
      taps = now - last < 600 ? taps + 1 : 1;
      last = now;
      if (taps >= 5) { taps = 0; cheat(); }
    });
  }
}
