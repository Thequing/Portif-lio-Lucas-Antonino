import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// The \b matches at the hyphen in "data-src" too, which is deliberate: video clips
// are referenced only from data-src, so dropping that coverage would make a typo in
// a clip path invisible. `poster` is listed explicitly for the same reason.
// scripts/check.test.mjs locks both behaviours in.
const SRC_HREF = /\b(?:src|href|poster)\s*=\s*"([^"]+)"/g;
const I18N_EL = /<([a-z0-9]+)\b[^>]*\bdata-i18n\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/\1>/gi;
const EXTERNAL = /^(?:https?:|mailto:|tel:|data:|#|\/\/)/i;

// Parses `en: { 'k': 'v', ... }` out of the dictionary without importing it,
// so a syntax error in i18n.js is reported rather than thrown.
function parseLocale(source, locale) {
  const open = source.indexOf(`${locale}:`);
  if (open === -1) return null;
  const start = source.indexOf('{', open);
  let depth = 0;
  let end = start;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  const body = source.slice(start + 1, end);
  const entries = {};
  const pair = /['"]([^'"]+)['"]\s*:\s*(['"])((?:\\.|(?!\2)[\s\S])*)\2/g;
  let m;
  while ((m = pair.exec(body)) !== null) {
    entries[m[1]] = m[3].replace(/\\(['"])/g, '$1');
  }
  return entries;
}

function normalise(text) {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export function checkAll(rootDir) {
  const errors = [];

  const htmlPath = join(rootDir, 'index.html');
  const i18nPath = join(rootDir, 'js', 'i18n.js');

  if (!existsSync(htmlPath)) return { errors: [`missing index.html at ${htmlPath}`] };
  if (!existsSync(i18nPath)) return { errors: [`missing js/i18n.js at ${i18nPath}`] };

  const html = readFileSync(htmlPath, 'utf8');
  const i18nSrc = readFileSync(i18nPath, 'utf8');

  const en = parseLocale(i18nSrc, 'en');
  const pt = parseLocale(i18nSrc, 'pt');
  if (!en) errors.push('js/i18n.js: could not parse an `en` block');
  if (!pt) errors.push('js/i18n.js: could not parse a `pt` block');

  // 1. every local src/href resolves
  for (const [, url] of html.matchAll(SRC_HREF)) {
    if (EXTERNAL.test(url)) continue;
    const clean = url.split(/[?#]/)[0];
    if (!clean) continue;
    if (!existsSync(join(rootDir, decodeURIComponent(clean)))) {
      errors.push(`missing asset: ${clean}`);
    }
  }

  if (en && pt) {
    // 2. inline English matches copy.en
    // 4. data-i18n keys are defined
    for (const [, , key, inner] of html.matchAll(I18N_EL)) {
      if (!(key in en)) {
        errors.push(`data-i18n="${key}" is not defined in copy.en`);
        continue;
      }
      const actual = normalise(inner);
      const expected = normalise(en[key]);
      if (actual !== expected) {
        errors.push(
          `data-i18n="${key}" drift:\n  markup: ${actual}\n  copy.en: ${expected}`
        );
      }
    }

    // 3. en/pt key parity
    for (const k of Object.keys(en)) {
      if (!(k in pt)) errors.push(`key "${k}" is in copy.en but missing from copy.pt`);
    }
    for (const k of Object.keys(pt)) {
      if (!(k in en)) errors.push(`key "${k}" is in copy.pt but missing from copy.en`);
    }
  }

  return { errors };
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const root = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..');
  const { errors } = checkAll(root);
  if (errors.length) {
    console.error(`\n${errors.length} problem(s):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log('check: all assets resolve, i18n is consistent');
}
