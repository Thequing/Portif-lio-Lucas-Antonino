// The cabinet: one shared panel that any stage's interaction mounts into.
//
// Deliberately NOT a modal. `show()` rather than `showModal()` means the page
// underneath keeps scrolling, keeps its focus order and never has to be dealt
// with before the visitor can move on. Someone who opens the dummy, decides
// they would rather keep reading, and scrolls, should not first have to find a
// close button — the panel lets go on its own when its stage leaves.
//
// Five ways out: the ✕, Esc, a tap outside the panel, the launcher again, and
// scrolling away. The cabinet never opens by itself and never moves the page.
import * as progress from './progress.js';
import { tr } from './i18n.js';

// dataPath is imported eagerly (these modules are a couple of KB and hold no
// DOM code) purely to read `ready`. A stage whose balance numbers are still
// stand-ins renders no launcher at all, so the build cannot publish invented
// figures by forgetting a flag somewhere else.
const REGISTRY = [
  { id: 'steam-veins', stage: 'stage-1', module: './stages/steam-veins.js' },
  { id: 'midnight', stage: 'stage-2', module: './stages/midnight.js' },
  { id: 'drift', stage: 'stage-3', module: './stages/drift.js', data: './stages/data/drift-scorer.js' },
  { id: 'hells-kitchen', stage: 'stage-4', module: './stages/hells-kitchen.js', data: './stages/data/hk-damage.js' },
  { id: 'kuroneko', stage: 'stage-5', module: './stages/kuroneko.js', data: './stages/data/kn-script.js' },
  { id: 'dino', stage: 'stage-6', module: './stages/dino.js' },
];

let cabinet = null;
let panel = null;
let heading = null;
let mount = null;
let openEntry = null;
let openModule = null;
let opener = null;
let reducedMotion = false;

export function close() {
  if (!openEntry) return;
  try {
    openModule?.unmount?.();
  } catch (err) {
    console.warn('arcade: unmount failed', err);
  }
  mount.replaceChildren();
  delete mount.dataset.stage;
  cabinet.close();
  cabinet.hidden = true;
  const back = opener;
  back?.setAttribute('aria-expanded', 'false');
  openEntry = null;
  openModule = null;
  opener = null;
  back?.focus();
}

async function open(entry, launcher) {
  if (openEntry?.id === entry.id) { close(); return; } // the launcher toggles
  if (openEntry) close();

  opener = launcher;
  openEntry = entry;
  launcher.setAttribute('aria-busy', 'true');
  launcher.setAttribute('aria-expanded', 'true');

  let mod;
  try {
    mod = await import(entry.module);
  } catch (err) {
    // One broken interaction must not take the other five with it.
    console.error(`arcade: ${entry.id} failed to load`, err);
    launcher.remove();
    openEntry = null;
    opener = null;
    return;
  } finally {
    launcher.removeAttribute('aria-busy');
  }

  if (openEntry?.id !== entry.id) return; // dismissed while loading

  openModule = mod;
  const stage = document.getElementById(entry.stage);
  cabinet.style.setProperty('--stage', stage?.style.getPropertyValue('--stage') || '');
  heading.textContent = launcher.dataset.cabinetTitle || '';

  // Names whichever interaction is mounted: lets CSS and tests target the panel
  // by stage rather than guessing from its contents.
  mount.dataset.stage = entry.id;
  cabinet.hidden = false;
  cabinet.show();

  try {
    mod.mount(mount, {
      reducedMotion,
      complete: () => progress.clear(entry.id),
      close,
    });
  } catch (err) {
    console.error(`arcade: ${entry.id} failed to mount`, err);
    close();
    return;
  }

  // Focus the panel so a keyboard lands inside it, without trapping: tabbing
  // past the end walks back out into the page, which is the behaviour of a
  // thing you are allowed to ignore.
  panel.focus({ preventScroll: true });
}

function buildCabinet() {
  cabinet = document.getElementById('cabinet');
  if (!cabinet) return false;
  panel = cabinet.querySelector('.cabinet-panel');
  heading = cabinet.querySelector('.cabinet-title');
  mount = cabinet.querySelector('.cabinet-mount');

  cabinet.querySelector('.cabinet-close')?.addEventListener('click', close);
  // There is no backdrop to click through: the cabinet is docked into a corner
  // and everything around it is the live page, which keeps working untouched.
  // `show()` does not handle Esc the way showModal() does, so it is wired here.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openEntry) { e.preventDefault(); close(); }
  });
  return true;
}

function launcherFor(entry) {
  const stage = document.getElementById(entry.stage);
  const copy = stage?.querySelector('.copy');
  if (!copy) return null;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'try-it';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'cabinet');
  button.dataset.stageId = entry.id;
  const label = tr('arcade.try');
  button.textContent = label;
  button.dataset.cabinetTitle = stage.querySelector('h2')?.textContent || '';
  button.addEventListener('click', () => open(entry, button));

  // Before the readouts, so the strip of numbers stays the stage's last word.
  const readouts = copy.querySelector('.readouts');
  if (readouts) copy.insertBefore(button, readouts);
  else copy.append(button);
  return button;
}

export async function initArcade({ reducedMotion: rm = false } = {}) {
  reducedMotion = rm;
  if (!buildCabinet()) return;

  const live = [];
  for (const entry of REGISTRY) {
    if (entry.data) {
      try {
        const { ready } = await import(entry.data);
        if (!ready) continue; // stand-in numbers: no launcher, nothing published
      } catch (err) {
        console.warn(`arcade: ${entry.id} data unavailable`, err);
        continue;
      }
    }
    const button = launcherFor(entry);
    if (button) live.push({ entry, button });
  }

  // Close when the open interaction's own stage has left the viewport: the
  // visitor scrolled past it, which is a decision, not an accident.
  //
  // Measured on scroll rather than watched with an IntersectionObserver. The
  // observer's callback is queued, and with a pinned stage being laid out at the
  // same moment it could arrive after the scroll had finished — so the panel
  // sometimes outlived its stage. Reading the rect is synchronous and cannot.
  //
  // Gated on a real gesture. Scroll position also moves when the page relayouts
  // — an offline clip collapsing to its fallback box, say — and the panel must
  // not treat the page shifting under the visitor as the visitor leaving.
  let gestureUntil = 0;
  const gesture = () => { gestureUntil = performance.now() + 1200; };
  for (const type of ['wheel', 'touchmove', 'keydown', 'pointerdown']) {
    window.addEventListener(type, gesture, { passive: true });
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!openEntry || ticking || performance.now() > gestureUntil) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (!openEntry) return;
      const stage = document.getElementById(openEntry.stage);
      if (!stage) return;
      // A full screen of slack before letting go. Closing as soon as the
      // stage's edge crossed the fold snatched the panel away from anyone who
      // had merely nudged the page — and a short stage (Dino Girls has no clip,
      // so its section is barely taller than its copy) crossed that line almost
      // immediately, as did the page shifting to reach a control inside the
      // panel itself. Scrolling a whole screen past a stage is a decision;
      // everything short of that is not.
      const slack = window.innerHeight;
      const rect = stage.getBoundingClientRect();
      if (rect.bottom < -slack || rect.top > window.innerHeight + slack) close();
    });
  }, { passive: true });

  // Re-label on a language change; the panel title is composed, like the HUD's.
  document.addEventListener('langchange', () => {
    const label = tr('arcade.try');
    for (const { entry, button } of live) {
      button.textContent = label;
      button.dataset.cabinetTitle =
        document.getElementById(entry.stage)?.querySelector('h2')?.textContent || '';
      if (openEntry?.id === entry.id) heading.textContent = button.dataset.cabinetTitle;
    }
    // An interaction builds its own strings at mount, so switching language
    // while one is open remounts it rather than leaving half of it in English.
    if (openEntry && openModule) {
      const entry = openEntry;
      const back = opener;
      close();
      const again = live.find((l) => l.entry.id === entry.id);
      if (again) open(entry, again.button ?? back);
    }
  });

  paintPips();
  document.addEventListener('progresschange', paintPips);
}

// A HUD segment gains a pip once its stage's interaction has been completed.
function paintPips() {
  const cleared = progress.read();
  const segs = [...document.querySelectorAll('.hud-seg')];
  REGISTRY.forEach((entry, i) => {
    segs[i]?.classList.toggle('is-cleared', cleared.has(entry.id));
  });
  const tally = document.querySelector('.cleared-tally');
  if (tally) {
    tally.textContent = `${cleared.size}/${REGISTRY.length}`;
    tally.hidden = cleared.size === 0;
  }
}
