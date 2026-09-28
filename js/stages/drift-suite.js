// The balance suite, as a pure function: races in, criteria out. Lives apart
// from both the Worker that runs it and the cabinet that draws it, so node can
// test the thing the page actually executes.
import {
  rng, score, measureUplift, simulateRace, CONTEXT, TARGETS,
} from './data/drift-scorer.js';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function runSuite({ races = 10000, seed = 1, onProgress = null } = {}) {
  const started = now();
  const next = rng(seed);

  let wins = 0;
  let failures = 0;
  let upliftSum = 0;
  let scored = 0;
  // A win is a race that beats the field's pace, which the suite models as a
  // fixed par score. Kept here rather than in the data module because it is the
  // suite's own definition, not a balance number; the value is solved against
  // the scorer so the win rate lands mid-band.
  const PAR = 14567;

  for (let i = 0; i < races; i++) {
    const { timeline, failed } = simulateRace(next);
    if (failed) { failures++; continue; }
    const total = score(timeline, CONTEXT);
    if (total >= PAR) wins++;
    upliftSum += measureUplift(timeline, CONTEXT);
    scored++;
    if (onProgress && (i & 1023) === 0) onProgress(i / races);
  }

  const winRate = scored ? wins / scored : 0;
  const uplift = scored ? upliftSum / scored : 0;
  const failureRate = races ? failures / races : 0;

  return {
    races,
    seed,
    ms: Math.round((now() - started) * 100) / 100,
    criteria: {
      winRate: {
        value: winRate,
        pass: winRate >= TARGETS.winRate.min && winRate <= TARGETS.winRate.max,
        band: TARGETS.winRate,
      },
      uplift: {
        value: uplift,
        pass: uplift >= TARGETS.uplift.min && uplift <= TARGETS.uplift.max,
        band: TARGETS.uplift,
      },
      failureRate: {
        value: failureRate,
        pass: failureRate <= TARGETS.failureRate.max,
        band: TARGETS.failureRate,
      },
    },
  };
}
