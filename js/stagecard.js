// Phones get no pinned stages and no HUD label, so a stage used to arrive as
// just more scrolling. The first time each stage reaches the middle of the
// screen, a "Stage 02 · MidNight Memories" banner cuts in under the HUD, holds,
// and cuts out — the stage-start card a game would show.
//
// Only the first visit: a banner on every pass reads as nagging on the way
// back up. It sits under the HUD, never over the stage copy, and ignores
// pointer events, so it never has to be dismissed.
export function initStageCard({ reducedMotion }) {
  if (reducedMotion) return;
  const phones = window.matchMedia('(max-width: 1023px)');
  const seen = new Set();

  const card = document.createElement('div');
  card.className = 'stage-card';
  card.setAttribute('aria-hidden', 'true');
  card.innerHTML = '<span class="stage-card-num"></span><span class="stage-card-name"></span>';
  document.body.appendChild(card);
  const num = card.querySelector('.stage-card-num');
  const name = card.querySelector('.stage-card-name');

  document.addEventListener('stagechange', ({ detail: { index, stage } }) => {
    if (!phones.matches || seen.has(index)) return;
    seen.add(index);
    const word = document.querySelector('[data-i18n="hud.stage"]')?.textContent || 'Stage';
    num.textContent = `${word} ${String(index + 1).padStart(2, '0')}`;
    name.textContent = stage.querySelector('h2')?.textContent || '';
    card.style.setProperty('--stage', stage.style.getPropertyValue('--stage'));
    // Restart the animation even if the previous card is still showing.
    card.classList.remove('is-showing');
    void card.offsetWidth;
    card.classList.add('is-showing');
  });
  card.addEventListener('animationend', () => card.classList.remove('is-showing'));
}
