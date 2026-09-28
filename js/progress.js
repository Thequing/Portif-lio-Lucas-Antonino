// Which stage interactions have been completed. Six booleans under one key,
// so a visitor who comes back to the page still has their pips filled.
//
// Everything here tolerates localStorage being absent, full, or holding junk
// from an older version of the site: a bad read yields six falses rather than
// throwing, because a broken pip must never take the page down with it.
const KEY = 'stages.cleared';
export const STAGE_IDS = [
  'steam-veins',
  'midnight',
  'drift',
  'hells-kitchen',
  'kuroneko',
  'dino',
];

export function read() {
  const cleared = new Set();
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cleared; // private mode, or storage blocked
  }
  if (!raw) return cleared;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return cleared;
    for (const id of parsed) if (STAGE_IDS.includes(id)) cleared.add(id);
  } catch {
    // Not JSON. Leave it alone rather than guessing at it.
  }
  return cleared;
}

export function isCleared(id) {
  return read().has(id);
}

export function count() {
  return read().size;
}

// Marking a stage that is already marked is a no-op and fires no event, so a
// module can call this on every completion without knowing whether it is the
// first one.
export function clear(id) {
  if (!STAGE_IDS.includes(id)) return false;
  const cleared = read();
  if (cleared.has(id)) return false;
  cleared.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...cleared]));
  } catch {
    // Out of quota or blocked: the pip still lights for this visit.
  }
  document.dispatchEvent(
    new CustomEvent('progresschange', { detail: { id, count: cleared.size } })
  );
  return true;
}

export function reset() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* nothing to do */ }
  document.dispatchEvent(
    new CustomEvent('progresschange', { detail: { id: null, count: 0 } })
  );
}
