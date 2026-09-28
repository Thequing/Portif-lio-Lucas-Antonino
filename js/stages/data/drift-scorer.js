// Framed Drift — the scorer, ported to JS.
//
// ready === false: the numbers below are a STAND-IN, not Lucas's balance. The
// page shows only `Score()`, `ScoreWithoutPromotions()` and `MeasureUplift()`;
// `SegmentScore` and `Context` — the parts that actually produce a number — are
// not public, so they cannot be ported yet. Until they are, arcade.js does not
// render this stage's launcher and nothing here reaches a visitor.
//
// To make it real:
//   1. port SegmentScore and Context faithfully into this file,
//   2. run the C# balance suite once and commit its output as drift-golden.json,
//   3. flip ready to true.
// drift.test.mjs then holds the port to the golden vectors, and the claim that
// the port is verified against recorded C# output becomes true.
export const ready = false;

// From the DriftScorer.cs excerpt on the page: the balance suite's exit criteria.
// These bands are real — they are quoted in the source viewer and the stage copy.
export const TARGETS = {
  uplift: { min: 0.2, max: 0.3, quoted: 0.245 },
  winRate: { min: 0.5, max: 0.6 },
  failureRate: { max: 0.05 },
};

// The measured C# figure the stage claims, for the comparison line. Never
// presented as the browser's own result.
export const CSHARP = { races: 10000, seconds: 0.06 };

// Deterministic PRNG so a run is reproducible and consumes no ambient randomness,
// mirroring the C# scorer's "consumes no RNG, so scoring twice gives the same
// number". mulberry32.
export function rng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// STAND-IN. Shape is faithful to the excerpt — a segment carries a quality, a
// promoted quality and a multiplier — but the coefficients are invented.
export function segmentScore(outcome, ctx) {
  const quality = outcome.qualityFinal ?? outcome.quality;
  return outcome.base * quality * ctx.segmentMultiplier;
}

// Faithful to Score(): accumulate in double, apply the total multiplier, floor
// once. The comment in the C# is explicit that summing in float drops whole
// units on a large endgame, and JS numbers are doubles, so this matches.
export function score(timeline, ctx) {
  if (!timeline) return 0;
  let sum = 0;
  for (const outcome of timeline) sum += segmentScore(outcome, ctx);
  const total = sum * ctx.totalMultiplier;
  return total <= 0 ? 0 : Math.floor(total);
}

// Faithful to ScoreWithoutPromotions(): the timeline as the simulator left it.
export function scoreWithoutPromotions(timeline, ctx) {
  if (!timeline) return 0;
  let sum = 0;
  for (const outcome of timeline) {
    sum += segmentScore({ ...outcome, qualityFinal: outcome.quality }, ctx);
  }
  const total = sum * ctx.totalMultiplier;
  return total <= 0 ? 0 : Math.floor(total);
}

// Faithful to MeasureUplift(): (all promotions - none) / none.
export function measureUplift(timeline, ctx) {
  const without = scoreWithoutPromotions(timeline, ctx);
  if (without <= 0) return 0;
  const withAll = score(timeline, ctx);
  return (withAll - without) / without;
}

// STAND-IN race generator. The real simulator is a separate assembly; this
// exists so the interaction can be built and tested before it arrives. The
// promotion range is solved so mean uplift lands on the 0.245 the balance suite
// actually measures, which keeps an enabled stand-in coherent rather than
// looking like broken balance.
export function simulateRace(next) {
  const segments = 12;
  const timeline = [];
  let failed = false;
  for (let i = 0; i < segments; i++) {
    const roll = next();
    if (roll < 0.0026) { failed = true; break; }
    const quality = 0.55 + next() * 0.5;
    timeline.push({
      base: 900 + Math.floor(next() * 400),
      quality,
      qualityFinal: Math.min(1.35, quality * (1 + next() * 0.5)),
    });
  }
  return { timeline, failed };
}

export const CONTEXT = { segmentMultiplier: 1.0, totalMultiplier: 1.12 };
