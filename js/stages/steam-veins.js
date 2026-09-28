// 01 Steam Veins — the damage dummy.
//
// The interesting behaviour is the refusal: a hit inside the invulnerability
// window does nothing, and the readout says so. That gate is the first line of
// RespondTakeDamage in the source viewer on this page, and it is the part of
// enemy combat nobody sees unless you show them.
//
// Values follow the EnemyBase.cs excerpt: an i-frame window opened by a hit,
// knockback applied on the same frame, a phase change on a health threshold,
// and an execution state at zero.
import { tr } from '../i18n.js';

export const id = 'steam-veins';

const MAX_HP = 100;
const IFRAME_MS = 420;
const PHASE_THRESHOLD = 0.6; // of max, from the health-threshold phase change
const HIT = { min: 9, max: 16 };

let state = null;
let ctx = null;

function say(kind, detail) {
  const line = document.createElement('li');
  line.className = `dummy-log-line is-${kind}`;
  line.textContent = detail;
  state.log.prepend(line);
  while (state.log.children.length > 5) state.log.lastElementChild.remove();
}

function paint() {
  const pct = Math.max(0, state.hp / MAX_HP);
  state.bar.style.setProperty('--hp', String(pct));
  state.bar.setAttribute('aria-valuenow', String(Math.max(0, Math.round(state.hp))));
  state.figure.classList.toggle('is-phase2', state.phase === 2);
  state.figure.classList.toggle('is-dead', state.hp <= 0);
  state.phaseTag.textContent = state.hp <= 0
    ? ctx.copy.execution
    : `${ctx.copy.phase} ${state.phase}`;
}

function hit() {
  if (state.hp <= 0) {
    reset();
    return;
  }

  const now = performance.now();
  if (now < state.invulnerableUntil) {
    // The gate. Nothing happens on purpose, and that is the demonstration.
    state.figure.classList.add('is-rejected');
    setTimeout(() => state.figure?.classList.remove('is-rejected'), 120);
    say('gate', ctx.copy.iframe);
    return;
  }

  const damage = HIT.min + Math.floor(Math.random() * (HIT.max - HIT.min + 1));
  const before = state.hp;
  state.hp = Math.max(0, state.hp - damage);
  state.invulnerableUntil = now + IFRAME_MS;

  // Knockback and flinch are CSS: the sprite has a single frame, so the
  // response is expressed as transform and filter rather than animation.
  state.figure.classList.remove('is-hit');
  void state.figure.offsetWidth; // restart the transition
  state.figure.classList.add('is-hit');

  popNumber(damage);
  say('hit', `−${damage}`);

  if (before / MAX_HP > PHASE_THRESHOLD && state.hp / MAX_HP <= PHASE_THRESHOLD && state.phase === 1) {
    state.phase = 2;
    say('phase', ctx.copy.phaseChange);
  }

  if (state.hp <= 0) {
    say('dead', ctx.copy.executionLog);
    ctx.complete();
  }

  paint();
}

function popNumber(damage) {
  const pop = document.createElement('span');
  pop.className = 'dummy-pop';
  pop.textContent = `−${damage}`;
  pop.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 40)}px`);
  state.stage.append(pop);
  if (ctx.reducedMotion) { setTimeout(() => pop.remove(), 400); return; }
  pop.addEventListener('animationend', () => pop.remove(), { once: true });
}

function reset() {
  state.hp = MAX_HP;
  state.phase = 1;
  state.invulnerableUntil = 0;
  state.log.replaceChildren();
  say('reset', ctx.copy.reset);
  paint();
}

export function mount(root, context) {
  ctx = {
    ...context,
    copy: {
      iframe: tr('sv.game.iframe'),
      phase: tr('sv.game.phase'),
      phaseChange: tr('sv.game.phasechange'),
      execution: tr('sv.game.execution'),
      executionLog: tr('sv.game.executionlog'),
      reset: tr('sv.game.reset'),
      hint: tr('sv.game.hint'),
      hp: tr('sv.game.hp'),
    },
  };

  root.innerHTML = `
    <div class="dummy">
      <p class="game-hint">${ctx.copy.hint}</p>
      <div class="dummy-stage">
        <button class="dummy-figure" type="button" aria-label="${ctx.copy.hp}">
          <img src="media/minigames/dummy.png" width="32" height="32" alt="" decoding="async">
        </button>
      </div>
      <div class="dummy-meta">
        <div class="dummy-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${MAX_HP}" aria-valuenow="${MAX_HP}" aria-label="${ctx.copy.hp}"><span></span></div>
        <p class="dummy-phase"></p>
      </div>
      <ul class="dummy-log" aria-live="polite"></ul>
    </div>`;

  state = {
    hp: MAX_HP,
    phase: 1,
    invulnerableUntil: 0,
    stage: root.querySelector('.dummy-stage'),
    figure: root.querySelector('.dummy-figure'),
    bar: root.querySelector('.dummy-bar'),
    phaseTag: root.querySelector('.dummy-phase'),
    log: root.querySelector('.dummy-log'),
  };

  state.figure.addEventListener('click', hit);
  paint();
}

export function unmount() {
  state = null;
  ctx = null;
}
