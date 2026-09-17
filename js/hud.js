// The HUD stage bar. A stage counts as reached once it holds the viewport
// middle, and stays filled on the way back up until the stage above holds it
// again — so the bar reads as progress through the game, not as a spotlight.
// Pure IntersectionObserver: it must work when the GSAP CDN does not.
export function initHud() {
  const segs = [...document.querySelectorAll('.hud-seg')];
  const current = document.querySelector('.hud-current');
  const stages = [...document.querySelectorAll('.stage')];
  const title = document.getElementById('title');
  if (!segs.length || !stages.length) return;

  let activeIndex = -1;

  function label(i) {
    const stageWord = document.querySelector('[data-i18n="hud.stage"]')?.textContent || 'Stage';
    const name = stages[i].querySelector('h2')?.textContent || '';
    return `${stageWord} ${String(i + 1).padStart(2, '0')} · ${name}`;
  }

  function setActive(i) {
    activeIndex = i;
    segs.forEach((s, j) => {
      s.classList.toggle('is-reached', j <= i);
      s.classList.toggle('is-current', j === i);
    });
    if (current) current.textContent = i < 0 ? '' : label(i);
  }

  const middle = { rootMargin: '-50% 0px -50% 0px' };

  const stageWatch = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) setActive(stages.indexOf(e.target));
    }
  }, middle);
  stages.forEach((s) => stageWatch.observe(s));

  // Above stage 1 nothing has been reached yet.
  if (title) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(-1); }, middle).observe(title);
  }

  // Stage titles are translated in place, so the composed label must be too.
  document.addEventListener('langchange', () => { if (activeIndex >= 0) setActive(activeIndex); });
}
