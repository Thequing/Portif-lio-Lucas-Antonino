// Moving between sections: HUD segments, Press start, in-page links and the
// keyboard all come through goTo(), so they land in the same place.
//
// A plain anchor jump to a pinned stage lands where its pin starts — before
// the clip has wiped in and the copy has cut in, so the stage looks empty.
// js/scroll.js registers each pin here, and goTo() lands most of the way
// through it instead, where the whole stage is showing.
const pins = new Map();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function registerPin(section, trigger) {
  pins.set(section, trigger);
}

// Pins exist only at desktop width; when the viewport drops below it they are
// reverted and their start/end go stale.
export function clearPins() {
  pins.clear();
}

export function goTo(section) {
  if (!section) return;
  const behavior = reducedMotion ? 'auto' : 'smooth';
  const pin = pins.get(section);
  if (pin && pin.end > pin.start) {
    window.scrollTo({ top: pin.start + (pin.end - pin.start) * 0.6, behavior });
  } else {
    section.scrollIntoView({ behavior, block: 'start' });
  }
  history.replaceState(null, '', `#${section.id}`);
  // Keyboard and screen-reader users continue from the section they jumped to,
  // not from the control they pressed at the top of the page.
  const heading = section.querySelector('h1, h2');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
}

export function sections() {
  return [...document.querySelectorAll('main > section[id]')];
}

// The section holding the middle of the viewport, as an index into sections().
export function currentIndex() {
  const mid = window.innerHeight / 2;
  return sections().findIndex((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= mid && r.bottom > mid;
  });
}

export function initNav() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href^="#"]');
    const target = link && document.getElementById(link.getAttribute('href').slice(1));
    if (!target || target.parentElement?.tagName !== 'MAIN') return;
    e.preventDefault();
    goTo(target);
  });
}
