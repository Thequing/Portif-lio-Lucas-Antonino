// 06 Dino Girls — the block.
//
// The stage has no footage and reads as a locked tile. Rather than leave the
// page's one dead panel dead, the lock becomes a ?-block that dispenses one
// line per press until it is empty.
//
// It dispenses only what the stage copy already says in public. Dino Girls is
// unreleased and it is Kimu's, so this interaction is deliberately the least
// informative of the six — its job is to be the one people press twice.
import { tr } from '../i18n.js';

export const id = 'dino';

const LINES = ['dg.game.l1', 'dg.game.l2', 'dg.game.l3', 'dg.game.l4'];

let els = null;
let ctx = null;
let dispensed = 0;

function press() {
  if (dispensed >= LINES.length) {
    els.block.classList.add('is-empty');
    return;
  }

  const line = document.createElement('li');
  line.textContent = tr(LINES[dispensed]);
  els.out.append(line);
  dispensed++;

  if (!ctx.reducedMotion) {
    els.block.classList.remove('is-bounce');
    void els.block.offsetWidth;
    els.block.classList.add('is-bounce');
  }

  if (dispensed >= LINES.length) {
    els.block.classList.add('is-empty');
    els.block.setAttribute('aria-disabled', 'true');
    els.caption.textContent = tr('dg.game.empty');
    ctx.complete();
  } else {
    els.caption.textContent = `${LINES.length - dispensed}`;
  }
}

export function mount(root, context) {
  ctx = context;
  dispensed = 0;

  root.innerHTML = `
    <div class="block-game">
      <p class="game-hint">${tr('dg.game.hint')}</p>
      <button class="block" type="button" aria-label="${tr('dg.game.label')}">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <rect class="block-body" x="0" y="0" width="16" height="16"/>
          <g class="block-rivets">
            <rect x="1" y="1" width="2" height="2"/><rect x="13" y="1" width="2" height="2"/>
            <rect x="1" y="13" width="2" height="2"/><rect x="13" y="13" width="2" height="2"/>
          </g>
          <path class="block-mark" d="M6 4h4v1h1v3h-1v1H9v1H7V8h1V7h1V6H8V5H6z"/>
          <rect class="block-mark" x="7" y="11" width="2" height="2"/>
        </svg>
      </button>
      <p class="block-caption">${LINES.length}</p>
      <ul class="block-out" aria-live="polite"></ul>
    </div>`;

  els = {
    block: root.querySelector('.block'),
    out: root.querySelector('.block-out'),
    caption: root.querySelector('.block-caption'),
  };
  els.block.addEventListener('click', press);
}

export function unmount() {
  els = null;
  ctx = null;
  dispensed = 0;
}
