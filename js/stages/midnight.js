// 02 MidNight Memories — the visor.
//
// One screenshot, murky. The magnifying glass is the mask: under it the same
// image is crisp and legible, everywhere else it reads as the naked eye has it.
// That is the mechanic stated as plainly as it can be — this scene is only
// readable through the visor — with nothing to solve and nothing to read.
//
// The scene is stage 02's own poster, which the page has already fetched, so
// the whole interaction costs the 487-byte lens and nothing else.
import { tr } from '../i18n.js';

export const id = 'midnight';

// The boss scene: three Nightmares in fog, the item log and the ammo count all
// sit in it already, so there is genuinely something to find under the glass.
// Stage 02 loads this poster itself, so the interaction costs nothing extra.
const SCENE = 'media/poster/midnight-boss.webp';
// Measured from lens.png: the glass is an ellipse centred at (12.5, 12) of 32
// with radii 11 × 9.5. Kept as fractions so the lens can be any size.
const GLASS = { cx: 0.4062, cy: 0.3906, rx: 0.3438, ry: 0.2969 };
const LENS_PX = 180;
const SWEEP_TO_CLEAR = 0.45;

let els = null;
let ctx = null;
let swept = null;
let done = false;

function moveTo(clientX, clientY) {
  const box = els.field.getBoundingClientRect();
  const x = Math.min(Math.max(clientX - box.left, 0), box.width);
  const y = Math.min(Math.max(clientY - box.top, 0), box.height);
  place(x, y);
}

function place(x, y) {
  els.lens.style.setProperty('--x', `${x}px`);
  els.lens.style.setProperty('--y', `${y}px`);
  // The reveal layer is clipped to the glass, in the field's own coordinates.
  const cx = x + (GLASS.cx - 0.5) * LENS_PX;
  const cy = y + (GLASS.cy - 0.5) * LENS_PX;
  els.reveal.style.clipPath =
    `ellipse(${GLASS.rx * LENS_PX}px ${GLASS.ry * LENS_PX}px at ${cx}px ${cy}px)`;
  mark(cx, cy);
}

// Coverage is tracked on a coarse grid rather than by area, which is both
// cheap and forgiving: the meter fills for sweeping the scene, not for
// painting every pixel of it.
function mark(cx, cy) {
  if (done) return;
  const box = els.field.getBoundingClientRect();
  if (!box.width || !box.height) return;
  const col = Math.floor((cx / box.width) * swept.cols);
  const row = Math.floor((cy / box.height) * swept.rows);
  if (col < 0 || row < 0 || col >= swept.cols || row >= swept.rows) return;
  const i = row * swept.cols + col;
  if (swept.cells[i]) return;
  swept.cells[i] = 1;
  swept.seen++;
  const pct = swept.seen / swept.cells.length;
  els.meter.style.setProperty('--swept', String(Math.min(1, pct / SWEEP_TO_CLEAR)));
  if (pct >= SWEEP_TO_CLEAR) {
    done = true;
    els.field.classList.add('is-swept');
    els.caption.textContent = tr('mm.game.done');
    ctx.complete();
  }
}

function onPointer(e) {
  if (e.pointerType === 'mouse' && e.buttons === 0 && e.type === 'pointermove') {
    // Following the cursor without a button held is the friendlier desktop
    // behaviour; on touch the pointer only exists while it is down anyway.
    moveTo(e.clientX, e.clientY);
    return;
  }
  moveTo(e.clientX, e.clientY);
}

function onKey(e) {
  const step = e.shiftKey ? 48 : 16;
  const box = els.field.getBoundingClientRect();
  const x = parseFloat(els.lens.style.getPropertyValue('--x')) || box.width / 2;
  const y = parseFloat(els.lens.style.getPropertyValue('--y')) || box.height / 2;
  const moves = {
    ArrowLeft: [-step, 0], ArrowRight: [step, 0],
    ArrowUp: [0, -step], ArrowDown: [0, step],
  };
  const move = moves[e.key];
  if (!move) return;
  e.preventDefault();
  place(
    Math.min(Math.max(x + move[0], 0), box.width),
    Math.min(Math.max(y + move[1], 0), box.height)
  );
}

export function mount(root, context) {
  ctx = context;
  done = false;

  root.innerHTML = `
    <div class="visor">
      <p class="game-hint">${tr('mm.game.hint')}</p>
      <div class="visor-field" tabindex="0" role="application" aria-label="${tr('mm.game.label')}" style="--lens:${LENS_PX}px">
        <img class="visor-scene" src="${SCENE}" alt="" decoding="async">
        <div class="visor-reveal" aria-hidden="true"><img src="${SCENE}" alt="" decoding="async"></div>
        <img class="visor-lens" src="media/minigames/lens.png" width="32" height="32" alt="" aria-hidden="true" decoding="async">
      </div>
      <div class="visor-meter"><span></span></div>
      <p class="visor-caption">${tr('mm.game.sweep')}</p>
    </div>`;

  els = {
    field: root.querySelector('.visor-field'),
    reveal: root.querySelector('.visor-reveal'),
    lens: root.querySelector('.visor-lens'),
    meter: root.querySelector('.visor-meter'),
    caption: root.querySelector('.visor-caption'),
  };
  swept = { cols: 8, rows: 5, seen: 0, cells: new Uint8Array(40) };

  els.field.addEventListener('pointermove', onPointer);
  els.field.addEventListener('pointerdown', onPointer);
  els.field.addEventListener('keydown', onKey);

  // Start in the middle so the lens is visible before anything is touched.
  requestAnimationFrame(() => {
    const box = els.field.getBoundingClientRect();
    if (box.width) place(box.width / 2, box.height / 2);
  });
}

export function unmount() {
  els?.field?.removeEventListener('pointermove', onPointer);
  els?.field?.removeEventListener('pointerdown', onPointer);
  els?.field?.removeEventListener('keydown', onKey);
  els = null;
  ctx = null;
  swept = null;
}
