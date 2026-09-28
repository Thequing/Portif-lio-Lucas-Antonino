import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnose, render, parse, SCRIPTS, COMMANDS } from './data/kn-script.js';

// All four diagnostic classes are covered here even though the cabinet only
// surfaces two of them, so that swapping the stand-in strings for the parser's
// real ones cannot quietly break a class nobody is looking at.

test('a clean script produces no diagnostics', () => {
  const works = SCRIPTS.find((s) => s.id === 'works');
  assert.deepEqual(diagnose(works.source), []);
});

test('an unknown command is reported with its line and token', () => {
  const problems = diagnose('scene a\nspeak Kuro "hi"\nend');
  assert.equal(problems.length, 1);
  assert.equal(problems[0].kind, 'unknown-command');
  assert.equal(problems[0].line, 2);
  assert.equal(problems[0].token, 'speak');
});

test('a duplicate label names the line it was first defined on', () => {
  const problems = diagnose('label a\nsay Kuro "x"\nlabel a\nend');
  const dup = problems.find((p) => p.kind === 'duplicate-label');
  assert.ok(dup);
  assert.equal(dup.line, 3);
  assert.match(dup.message, /line 1/);
});

test('a dead jump is reported and a live one is not', () => {
  const dead = diagnose('jump nowhere "go"\nlabel somewhere\nend');
  assert.equal(dead.filter((p) => p.kind === 'dead-jump').length, 1);

  const live = diagnose('jump somewhere "go"\nlabel somewhere\nend');
  assert.equal(live.filter((p) => p.kind === 'dead-jump').length, 0);
});

test('an empty menu is reported and a populated one is not', () => {
  const empty = diagnose('menu\nend');
  assert.equal(empty.filter((p) => p.kind === 'empty-menu').length, 1);

  const full = diagnose('menu\njump a "one"\njump b "two"\nlabel a\nend\nlabel b\nend');
  assert.equal(full.filter((p) => p.kind === 'empty-menu').length, 0);
});

test('the dead-jump script trips exactly that diagnostic', () => {
  const script = SCRIPTS.find((s) => s.id === 'dead-jump');
  const problems = diagnose(script.source);
  assert.ok(problems.length >= 1);
  assert.equal(problems[0].kind, 'dead-jump');
  assert.equal(problems[0].token, 'apology');
});

test('the empty-menu script trips exactly that diagnostic', () => {
  const script = SCRIPTS.find((s) => s.id === 'empty-menu');
  const problems = diagnose(script.source);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].kind, 'empty-menu');
});

test('every script the cabinet offers is labelled with whether it breaks', () => {
  for (const s of SCRIPTS) {
    const broken = diagnose(s.source).length > 0;
    assert.equal(broken, s.broken, `${s.id} is marked broken:${s.broken} but diagnoses ${broken}`);
  }
});

test('comments and blank lines are skipped', () => {
  assert.deepEqual(diagnose('# a note\n\nscene a\nend'), []);
});

test('parameters are read inline, anywhere in the line', () => {
  const [line] = parse('say Kuro "You came back."');
  assert.equal(line.command, 'say');
  assert.deepEqual(line.args, ['Kuro']);
  assert.equal(line.text, 'You came back.');
});

test('the clean script renders speaker and menu beats', () => {
  const works = SCRIPTS.find((s) => s.id === 'works');
  const beats = render(works.source);
  assert.ok(beats.some((b) => b.speaker === 'Kuro'));
  assert.ok(beats.some((b) => b.menu));
  assert.equal(beats.filter((b) => b.option).length, 2);
});

test('the language has ten commands', () => {
  assert.equal(COMMANDS.length, 10);
});
