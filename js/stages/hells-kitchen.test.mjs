import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, mitigation, TYPES, ENEMIES, BASE_DAMAGE, GROUND_ONLY } from './data/hk-damage.js';

// Every pairing is exercised, so replacing the stand-in numbers with the real
// balance fails here rather than on the page.

test('every type against every enemy resolves to a sane result', () => {
  for (const type of TYPES) {
    for (const enemy of ENEMIES) {
      const r = resolve(type.id, enemy.id);
      assert.ok(Number.isFinite(r.damage), `${type.id} vs ${enemy.id}`);
      assert.ok(r.damage >= 0, `${type.id} vs ${enemy.id} went negative`);
      assert.ok(r.damage <= BASE_DAMAGE, `${type.id} vs ${enemy.id} exceeded base`);
    }
  }
});

test('true damage is mitigated by nothing, on every enemy it can reach', () => {
  for (const enemy of ENEMIES) {
    const r = resolve('true', enemy.id);
    if (r.blocked) continue;
    assert.equal(r.damage, BASE_DAMAGE, `true damage was reduced against ${enemy.id}`);
    assert.equal(r.reason, 'unmitigated');
  }
});

test('armour blunts physical and barely touches magic', () => {
  const physical = resolve('physical', 'armoured').damage;
  const magic = resolve('magic', 'armoured').damage;
  assert.ok(physical < magic, 'armour should hurt physical more than magic');
});

test('resistance blunts magic and barely touches physical', () => {
  const magic = resolve('magic', 'warded').damage;
  const physical = resolve('physical', 'warded').damage;
  assert.ok(magic < physical, 'resistance should hurt magic more than physical');
});

test('a ground-only type against a flier is blocked, not merely reduced', () => {
  for (const typeId of GROUND_ONLY) {
    const r = resolve(typeId, 'flier');
    assert.equal(r.blocked, true, `${typeId} should have no valid target`);
    assert.equal(r.reason, 'no-valid-target');
    assert.equal(r.damage, 0);
  }
});

test('a type that can elevate its fire still hits a flier', () => {
  const r = resolve('magic', 'flier');
  assert.equal(r.blocked, false);
  assert.ok(r.damage > 0);
});

test('area damage pays a splash penalty against the same armour', () => {
  const single = resolve('physical', 'grunt').damage;
  const area = resolve('area', 'grunt').damage;
  assert.ok(area < single, 'area should trade damage for coverage');
});

test('mitigation rises with the stat it reads', () => {
  const physical = TYPES.find((t) => t.id === 'physical');
  const grunt = ENEMIES.find((e) => e.id === 'grunt');
  const armoured = ENEMIES.find((e) => e.id === 'armoured');
  assert.ok(mitigation(physical, armoured) > mitigation(physical, grunt));
});

test('mitigation is a fraction, never a multiplier above one', () => {
  for (const type of TYPES) {
    for (const enemy of ENEMIES) {
      const m = mitigation(type, enemy);
      assert.ok(m >= 0 && m < 1, `${type.id} vs ${enemy.id} mitigation ${m}`);
    }
  }
});

test('an unknown type or enemy is refused rather than guessed at', () => {
  assert.equal(resolve('psychic', 'grunt').blocked, true);
  assert.equal(resolve('physical', 'dragon').blocked, true);
});

test('damage and mitigated always account for the base', () => {
  const r = resolve('physical', 'grunt');
  assert.equal(r.damage + r.mitigated, BASE_DAMAGE);
});
