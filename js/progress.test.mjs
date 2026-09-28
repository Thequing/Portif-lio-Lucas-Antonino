import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// progress.js talks to localStorage and document; node has neither, so both are
// stubbed before the module is imported. The point of the tests is the tolerance
// for junk, which is exactly what a browser will hand it one day.
const store = new Map();
let throwOnRead = false;

globalThis.localStorage = {
  getItem(k) {
    if (throwOnRead) throw new DOMException('blocked');
    return store.has(k) ? store.get(k) : null;
  },
  setItem(k, v) { store.set(k, String(v)); },
  removeItem(k) { store.delete(k); },
};

const events = [];
globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
globalThis.document = { dispatchEvent(e) { events.push(e); return true; } };

const { read, isCleared, count, clear, reset, STAGE_IDS } = await import('./progress.js');

beforeEach(() => { store.clear(); events.length = 0; throwOnRead = false; });

test('starts empty', () => {
  assert.equal(count(), 0);
  assert.equal(isCleared('drift'), false);
});

test('clearing a stage persists and fires one event', () => {
  assert.equal(clear('drift'), true);
  assert.equal(isCleared('drift'), true);
  assert.equal(count(), 1);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'progresschange');
  assert.equal(events[0].detail.id, 'drift');
});

test('clearing the same stage twice is a no-op and fires nothing further', () => {
  clear('drift');
  events.length = 0;
  assert.equal(clear('drift'), false);
  assert.equal(count(), 1);
  assert.equal(events.length, 0);
});

test('an unknown id is refused', () => {
  assert.equal(clear('not-a-stage'), false);
  assert.equal(count(), 0);
});

test('all six can be cleared', () => {
  for (const id of STAGE_IDS) clear(id);
  assert.equal(count(), 6);
});

test('junk in storage reads as empty rather than throwing', () => {
  store.set('stages.cleared', 'not json at all');
  assert.equal(count(), 0);
});

test('a JSON value of the wrong shape reads as empty', () => {
  store.set('stages.cleared', '{"drift":true}');
  assert.equal(count(), 0);
});

test('unknown ids stored by an older version are dropped', () => {
  store.set('stages.cleared', '["drift","some-removed-stage"]');
  assert.deepEqual([...read()], ['drift']);
});

test('storage that throws on read yields empty rather than propagating', () => {
  throwOnRead = true;
  assert.equal(count(), 0);
  assert.equal(isCleared('drift'), false);
});

test('reset empties it', () => {
  clear('drift');
  reset();
  assert.equal(count(), 0);
});
