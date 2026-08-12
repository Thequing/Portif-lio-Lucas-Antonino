import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkAll } from './check.mjs';

function fixture(html, i18n, files = []) {
  const dir = mkdtempSync(join(tmpdir(), 'check-'));
  writeFileSync(join(dir, 'index.html'), html);
  mkdirSync(join(dir, 'js'), { recursive: true });
  writeFileSync(join(dir, 'js', 'i18n.js'), i18n);
  for (const f of files) {
    const full = join(dir, f);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, 'x');
  }
  return dir;
}

const GOOD_I18N = `export const copy = {
  en: { 'hero.role': 'Gameplay Programmer' },
  pt: { 'hero.role': 'Programador de Gameplay' },
};`;

test('passes when everything is consistent', () => {
  const dir = fixture(
    `<img src="media/poster/a.webp"><h2 data-i18n="hero.role">Gameplay Programmer</h2>`,
    GOOD_I18N,
    ['media/poster/a.webp']
  );
  assert.deepEqual(checkAll(dir).errors, []);
  rmSync(dir, { recursive: true, force: true });
});

test('reports a missing local asset', () => {
  const dir = fixture(`<img src="media/poster/gone.webp">`, GOOD_I18N);
  const { errors } = checkAll(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /gone\.webp/);
  rmSync(dir, { recursive: true, force: true });
});

test('ignores external and anchor hrefs', () => {
  const dir = fixture(
    `<a href="https://store.steampowered.com/app/1">s</a><a href="#work">w</a><a href="mailto:a@b.c">m</a>`,
    GOOD_I18N
  );
  assert.deepEqual(checkAll(dir).errors, []);
  rmSync(dir, { recursive: true, force: true });
});

test('reports inline text drifting from copy.en', () => {
  const dir = fixture(
    `<h2 data-i18n="hero.role">Gameplay Developer</h2>`,
    GOOD_I18N
  );
  const { errors } = checkAll(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /hero\.role/);
  rmSync(dir, { recursive: true, force: true });
});

test('reports a key present in en but missing from pt', () => {
  const dir = fixture(
    `<h2 data-i18n="hero.role">Gameplay Programmer</h2>`,
    `export const copy = {
       en: { 'hero.role': 'Gameplay Programmer', 'hero.extra': 'X' },
       pt: { 'hero.role': 'Programador de Gameplay' },
     };`
  );
  const { errors } = checkAll(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /hero\.extra/);
  rmSync(dir, { recursive: true, force: true });
});

test('reports a data-i18n key defined nowhere', () => {
  const dir = fixture(`<h2 data-i18n="hero.ghost">Ghost</h2>`, GOOD_I18N);
  const { errors } = checkAll(dir);
  assert.ok(errors.some((e) => /hero\.ghost/.test(e)));
  rmSync(dir, { recursive: true, force: true });
});
