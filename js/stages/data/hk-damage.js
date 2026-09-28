// Hell's Kitchen — damage types against armour and resistance.
//
// ready === false: these values are a STAND-IN. The real mitigation formula and
// the per-enemy armour and resistance figures are balance Lucas did, and putting
// invented numbers on a portfolio page next to a claim about his balance work
// would misrepresent it. arcade.js does not render this stage's launcher while
// ready is false.
//
// To make it real: replace FORMULA, TYPES and ENEMIES with the values from the
// project, and flip ready. hells-kitchen.test.mjs already covers every pairing,
// so a wrong transcription fails the suite rather than reaching the page.
export const ready = false;

export const TYPES = [
  { id: 'physical', mitigatedBy: 'armour' },
  { id: 'magic', mitigatedBy: 'resistance' },
  { id: 'true', mitigatedBy: null },
  { id: 'area', mitigatedBy: 'armour', splash: true },
];

export const ENEMIES = [
  { id: 'grunt', armour: 10, resistance: 5, flying: false },
  { id: 'armoured', armour: 120, resistance: 10, flying: false },
  { id: 'warded', armour: 15, resistance: 110, flying: false },
  { id: 'flier', armour: 20, resistance: 20, flying: true },
];

// Towers that cannot elevate their fire have no valid target against a flier.
// The mismatch is the point of the interaction, so it is modelled, not hidden.
export const GROUND_ONLY = new Set(['physical', 'area']);

export const BASE_DAMAGE = 250;

// STAND-IN formula: classic diminishing mitigation, mitigation = v / (v + k).
export const FORMULA = { k: 100, splashFactor: 0.6 };

export function mitigation(type, enemy) {
  if (!type.mitigatedBy) return 0;
  const value = enemy[type.mitigatedBy];
  return value / (value + FORMULA.k);
}

// Returns { damage, mitigated, blocked, reason } — `blocked` drives the
// "no valid target" readout, which is a different thing from zero damage.
export function resolve(typeId, enemyId, base = BASE_DAMAGE) {
  const type = TYPES.find((t) => t.id === typeId);
  const enemy = ENEMIES.find((e) => e.id === enemyId);
  if (!type || !enemy) return { damage: 0, mitigated: 0, blocked: true, reason: 'unknown' };

  if (enemy.flying && GROUND_ONLY.has(type.id)) {
    return { damage: 0, mitigated: 0, blocked: true, reason: 'no-valid-target' };
  }

  const m = mitigation(type, enemy);
  let damage = base * (1 - m);
  if (type.splash) damage *= FORMULA.splashFactor;
  return {
    damage: Math.round(damage),
    mitigated: Math.round(base - damage),
    blocked: false,
    reason: m === 0 ? 'unmitigated' : 'mitigated',
  };
}
