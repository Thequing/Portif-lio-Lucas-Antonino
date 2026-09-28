import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  rng, score, scoreWithoutPromotions, measureUplift, simulateRace,
  CONTEXT, TARGETS, CSHARP, ready,
} from './data/drift-scorer.js';
import { runSuite } from './drift-suite.js';

const GOLDEN = fileURLToPath(new URL('./data/drift-golden.json', import.meta.url));

// The properties the C# scorer's own comments claim. They hold for the stand-in
// and must still hold once the real SegmentScore lands, which is the point of
// asserting them rather than asserting particular numbers.

test('scoring twice gives the same number — the scorer consumes no RNG', () => {
  const { timeline } = simulateRace(rng(12345));
  assert.equal(score(timeline, CONTEXT), score(timeline, CONTEXT));
});

test('the same seed produces the same race', () => {
  const a = simulateRace(rng(99));
  const b = simulateRace(rng(99));
  assert.deepEqual(a, b);
});

test('different seeds produce different races', () => {
  const a = simulateRace(rng(1));
  const b = simulateRace(rng(2));
  assert.notDeepEqual(a, b);
});

test('a null timeline scores zero rather than throwing', () => {
  assert.equal(score(null, CONTEXT), 0);
  assert.equal(scoreWithoutPromotions(null, CONTEXT), 0);
});

test('the score is floored once, not per segment', () => {
  // Each segment is worth 100.6. Summed then floored that is 201; floored per
  // segment and then summed it would be 200. The C# comment is explicit that
  // the summation must not drop units segment by segment.
  const timeline = [
    { base: 1006, quality: 1, qualityFinal: 1 },
    { base: 1006, quality: 1, qualityFinal: 1 },
  ];
  const ctx = { segmentMultiplier: 0.1, totalMultiplier: 1 };
  assert.equal(score(timeline, ctx), 201);
});

test('promotions never score below the unpromoted timeline', () => {
  for (let seed = 0; seed < 50; seed++) {
    const { timeline } = simulateRace(rng(seed));
    if (!timeline.length) continue;
    assert.ok(score(timeline, CONTEXT) >= scoreWithoutPromotions(timeline, CONTEXT));
  }
});

test('uplift of an unscoreable timeline is zero, not infinity', () => {
  assert.equal(measureUplift([], CONTEXT), 0);
});

test('the suite reports every criterion the stage claims', () => {
  const result = runSuite({ races: 500, seed: 7 });
  for (const key of ['winRate', 'uplift', 'failureRate']) {
    assert.ok(key in result.criteria, `missing criterion ${key}`);
    assert.equal(typeof result.criteria[key].value, 'number');
    assert.equal(typeof result.criteria[key].pass, 'boolean');
  }
  assert.equal(result.races, 500);
  assert.ok(result.ms >= 0);
});

test('the suite is deterministic for a given seed', () => {
  // Everything but `ms`, which is wall-clock and rightly varies.
  const { ms: _a, ...first } = runSuite({ races: 200, seed: 3 });
  const { ms: _b, ...second } = runSuite({ races: 200, seed: 3 });
  assert.deepEqual(first, second);
});

test('the C# comparison figure is quoted, never computed', () => {
  assert.equal(CSHARP.races, 10000);
  assert.equal(CSHARP.seconds, 0.06);
  const result = runSuite({ races: 100, seed: 1 });
  assert.notEqual(result.ms / 1000, CSHARP.seconds);
});

test('the quoted uplift sits inside the band the suite requires', () => {
  assert.ok(TARGETS.uplift.quoted >= TARGETS.uplift.min);
  assert.ok(TARGETS.uplift.quoted <= TARGETS.uplift.max);
});

// The golden file is how the port stops being a promise. It does not exist yet,
// so this test states the contract and skips; committing the file turns it on.
// `ready` must not be flipped while it is still missing.
test('the JS port matches the recorded C# output', { skip: !existsSync(GOLDEN) }, () => {
  const golden = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  for (const vector of golden.vectors) {
    assert.equal(
      score(vector.timeline, vector.context ?? CONTEXT),
      vector.expected,
      `vector ${vector.id} diverged from the C# score`
    );
  }
});

test('the stage stays dark until the golden vectors exist', () => {
  if (!existsSync(GOLDEN)) {
    assert.equal(ready, false, 'ready was flipped before the C# port was verified');
  }
});
