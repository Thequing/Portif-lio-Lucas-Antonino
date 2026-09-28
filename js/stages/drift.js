// 03 Framed Drift — the balance suite.
//
// One button. A Worker runs the JS port of the scorer, the criteria fill in as
// they resolve, and the timing line prints both numbers side by side with which
// is which. Presenting the browser's time as the C# figure would be a lie; the
// comparison is the more interesting thing anyway, because the reason the same
// code can run in a Worker at all is that the simulation has no engine
// references — which is the claim the stage makes.
import { tr } from '../i18n.js';
import { CSHARP } from './data/drift-scorer.js';
import { runSuite } from './drift-suite.js';

export const id = 'drift';

const RACES = 10000;

let els = null;
let ctx = null;
let worker = null;
let running = false;

const PERCENT = (v) => `${(v * 100).toFixed(1)} %`;
const RATIO = (v) => v.toFixed(3);

const ROWS = [
  { key: 'winRate', label: 'fd.game.winrate', format: PERCENT,
    band: (b) => `${PERCENT(b.min)}–${PERCENT(b.max)}` },
  { key: 'uplift', label: 'fd.game.uplift', format: RATIO,
    band: (b) => `${RATIO(b.min)}–${RATIO(b.max)}` },
  { key: 'failureRate', label: 'fd.game.failures', format: PERCENT,
    band: (b) => `≤ ${PERCENT(b.max)}` },
];

function show(result) {
  running = false;
  els.run.disabled = false;
  els.run.textContent = tr('fd.game.again');

  for (const row of ROWS) {
    const cell = els.rows[row.key];
    const criterion = result.criteria[row.key];
    cell.value.textContent = row.format(criterion.value);
    cell.band.textContent = row.band(criterion.band);
    cell.el.classList.toggle('is-pass', criterion.pass);
    cell.el.classList.toggle('is-fail', !criterion.pass);
    cell.mark.textContent = criterion.pass ? '✓' : '✗';
  }

  const seconds = (result.ms / 1000).toFixed(2);
  els.timing.innerHTML = `
    <span class="timing-row"><b>${seconds} s</b> ${tr('fd.game.inbrowser')}</span>
    <span class="timing-row"><b>${CSHARP.seconds.toFixed(2)} s</b> ${tr('fd.game.incsharp')}</span>`;
  els.note.textContent = tr('fd.game.note');
  ctx.complete();
}

function fallback() {
  // No Worker (or it failed to start): run on the main thread. 10,000 races is
  // a few hundred milliseconds, so the page stutters rather than hangs, and the
  // alternative is a button that does nothing.
  const result = runSuite({ races: RACES, seed: Date.now() & 0xffff });
  show(result);
}

function run() {
  if (running) return;
  running = true;
  els.run.disabled = true;
  els.run.textContent = tr('fd.game.running');
  els.note.textContent = '';

  if (typeof Worker !== 'function') { fallback(); return; }

  try {
    worker?.terminate();
    worker = new Worker(new URL('./drift-worker.js', import.meta.url), { type: 'module' });
  } catch {
    fallback();
    return;
  }

  worker.addEventListener('message', (e) => {
    if (e.data?.type === 'done') show(e.data.result);
  });
  worker.addEventListener('error', () => { worker?.terminate(); worker = null; fallback(); });
  worker.postMessage({ races: RACES, seed: Date.now() & 0xffff });
}

export function mount(root, context) {
  ctx = context;
  running = false;

  const rows = ROWS.map((row) => `
    <div class="suite-row" data-key="${row.key}">
      <span class="suite-mark"></span>
      <span class="suite-label">${tr(row.label)}</span>
      <span class="suite-value">—</span>
      <span class="suite-band"></span>
    </div>`).join('');

  root.innerHTML = `
    <div class="suite">
      <p class="game-hint">${tr('fd.game.hint')}</p>
      <button class="suite-run" type="button">${tr('fd.game.run')}</button>
      <div class="suite-rows">${rows}</div>
      <div class="suite-timing"></div>
      <p class="suite-note"></p>
    </div>`;

  els = {
    run: root.querySelector('.suite-run'),
    timing: root.querySelector('.suite-timing'),
    note: root.querySelector('.suite-note'),
    rows: {},
  };
  for (const row of ROWS) {
    const el = root.querySelector(`.suite-row[data-key="${row.key}"]`);
    els.rows[row.key] = {
      el,
      mark: el.querySelector('.suite-mark'),
      value: el.querySelector('.suite-value'),
      band: el.querySelector('.suite-band'),
    };
  }
  els.run.addEventListener('click', run);
}

export function unmount() {
  worker?.terminate();
  worker = null;
  running = false;
  els = null;
  ctx = null;
}
