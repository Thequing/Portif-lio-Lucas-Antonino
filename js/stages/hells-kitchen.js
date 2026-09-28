// 04 Hell's Kitchen — the damage table.
//
// Tap a damage type and an enemy. The readout shows the mitigation with the
// real values substituted and the damage that survives it.
//
// The interesting cells are the bad ones, so completion is awarded for finding
// a wall rather than a win: physical into heavy armour, or a ground tower
// against a flier, which is not "reduced to zero" but "no valid target" — a
// different thing, and the one a tower-defense player has to internalise.
import { tr } from '../i18n.js';
import { TYPES, ENEMIES, BASE_DAMAGE, resolve, mitigation, FORMULA } from './data/hk-damage.js';

export const id = 'hells-kitchen';

let els = null;
let ctx = null;
let picked = { type: 'physical', enemy: 'grunt' };

function paint() {
  for (const button of els.chips) {
    const group = button.dataset.group;
    button.setAttribute('aria-pressed', String(picked[group] === button.dataset.value));
  }

  const type = TYPES.find((t) => t.id === picked.type);
  const enemy = ENEMIES.find((e) => e.id === picked.enemy);
  const result = resolve(picked.type, picked.enemy);

  if (result.blocked) {
    els.formula.textContent = tr('hk.game.notarget');
    els.damage.textContent = '—';
    els.readout.className = 'hk-readout is-blocked';
    els.mitigated.textContent = tr('hk.game.noreach');
    ctx.complete(); // the wall is the lesson
    return;
  }

  const m = mitigation(type, enemy);
  if (type.mitigatedBy) {
    const stat = enemy[type.mitigatedBy];
    els.formula.textContent =
      `${BASE_DAMAGE} × (1 − ${stat}/(${stat}+${FORMULA.k}))${type.splash ? ` × ${FORMULA.splashFactor}` : ''}`;
  } else {
    els.formula.textContent = `${BASE_DAMAGE} × 1  ·  ${tr('hk.game.ignores')}`;
  }

  els.damage.textContent = String(result.damage);
  els.mitigated.textContent = `−${result.mitigated} ${tr('hk.game.mitigated')} (${(m * 100).toFixed(0)}%)`;
  els.readout.className = `hk-readout${m > 0.5 ? ' is-wall' : ''}`;
  if (m > 0.5) ctx.complete(); // also a wall, just a softer one
}

function onChip(e) {
  const button = e.currentTarget;
  picked[button.dataset.group] = button.dataset.value;
  paint();
}

export function mount(root, context) {
  ctx = context;
  picked = { type: 'physical', enemy: 'grunt' };

  const chips = (group, items) => items.map((item) => `
    <button class="hk-chip" type="button" data-group="${group}" data-value="${item.id}" aria-pressed="false">
      ${tr(`hk.game.${group}.${item.id}`)}
    </button>`).join('');

  root.innerHTML = `
    <div class="hk">
      <p class="game-hint">${tr('hk.game.hint')}</p>
      <p class="hk-group-label">${tr('hk.game.damage')}</p>
      <div class="hk-chips">${chips('type', TYPES)}</div>
      <p class="hk-group-label">${tr('hk.game.enemy')}</p>
      <div class="hk-chips">${chips('enemy', ENEMIES)}</div>
      <div class="hk-readout">
        <p class="hk-formula"></p>
        <p class="hk-damage"></p>
        <p class="hk-mitigated"></p>
      </div>
    </div>`;

  els = {
    chips: [...root.querySelectorAll('.hk-chip')],
    readout: root.querySelector('.hk-readout'),
    formula: root.querySelector('.hk-formula'),
    damage: root.querySelector('.hk-damage'),
    mitigated: root.querySelector('.hk-mitigated'),
  };
  for (const chip of els.chips) chip.addEventListener('click', onChip);
  paint();
}

export function unmount() {
  els = null;
  ctx = null;
}
