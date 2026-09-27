import { t } from './i18n.js';

// The continue screen: an arcade countdown, a share button, and a sprite that
// waves back.

// 9 to 0, once, when the screen first comes into view. Any press stops it —
// the visitor has "continued". Clicks, not pointerdown: on a phone every
// scroll gesture starts with a pointerdown and would stop it at once.
// At 0 there is no game over in the hostile sense: a line says the contact
// card still works, and Save contact blinks like an Insert Coin prompt. It
// never hides or disables anything.
function countdown(section) {
  const num = section.querySelector('.countdown');
  const over = section.querySelector('.game-over');
  const coin = section.querySelector('.btn-solid');
  if (!num) return;

  let n = 9;
  let id = 0;

  function halt() {
    clearInterval(id);
    for (const type of ['click', 'keydown']) window.removeEventListener(type, stop);
  }

  function stop() {
    halt();
    num.textContent = '';
  }

  function tick() {
    n--;
    num.textContent = String(n);
    if (n > 0) return;
    halt();
    if (over) over.hidden = false;
    coin?.classList.add('insert-coin');
  }

  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    num.textContent = String(n);
    id = setInterval(tick, 1000);
    for (const type of ['click', 'keydown']) window.addEventListener(type, stop);
  }, { threshold: 0.6 });
  io.observe(section);
}

// Web Share where the browser has it (the phone share sheet), a clipboard copy
// where it does not, and no button at all where neither works.
function share() {
  const btn = document.querySelector('#continue .share');
  if (!btn) return;
  const canShare = typeof navigator.share === 'function';
  const canCopy = !!navigator.clipboard?.writeText;
  if (!canShare && !canCopy) return;
  btn.hidden = false;

  const url = `${location.origin}${location.pathname}`;
  btn.addEventListener('click', async () => {
    if (canShare) {
      try {
        await navigator.share({ title: document.title, url });
      } catch { /* the visitor closed the share sheet */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      const label = btn.textContent;
      btn.textContent = t('continue.copied');
      setTimeout(() => { btn.textContent = t('continue.share') || label; }, 2000);
    } catch { /* clipboard refused; nothing to report */ }
  });
}

// Tap the sprite and it hops and says goodbye.
function waver() {
  const btn = document.querySelector('.waver');
  const say = btn?.querySelector('.waver-say');
  if (!btn || !say) return;
  let timer = 0;
  btn.addEventListener('click', () => {
    say.textContent = t('waver.say');
    btn.classList.remove('is-hopping');
    void btn.offsetWidth;
    btn.classList.add('is-hopping');
    clearTimeout(timer);
    timer = setTimeout(() => { say.textContent = ''; }, 2500);
  });
}

export function initContinue({ reducedMotion }) {
  const section = document.getElementById('continue');
  if (!section) return;
  if (!reducedMotion) countdown(section);
  share();
  waver();
}
