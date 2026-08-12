# Portfolio Scroll-Driven Experience — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the single-file portfolio as a GSAP scroll-driven, English-first presentation site that loads in under 4 MB instead of 349 MB.

**Architecture:** A static single page. `scripts/build-media.sh` converts the source GIFs to MP4/WebM/WebP once, ahead of time. The page is hand-authored HTML with English copy inline, styled by three CSS files, and animated by five ES modules loaded as `<script type="module">`. GSAP and its plugins come from the official CDN. There is no bundler and no runtime npm dependency.

**Tech Stack:** HTML5, CSS custom properties, ES modules, GSAP 3 + ScrollTrigger + SplitText (CDN), ffmpeg (build-time only), Node 24 `node:test` (verification script only).

**Spec:** `docs/superpowers/specs/2026-08-11-portfolio-experience-design.md`

## Global Constraints

- **No npm packages.** Node is used only to run `scripts/check.mjs` and its tests, both dependency-free. The served site loads no bundler output.
- **No build step to deploy.** `git push` publishes. Everything served is committed.
- **English is the default**, authored inline in the markup. Portuguese lives only in the `copy.pt` dictionary. Every `data-i18n` element's inline text must exactly match its `copy.en` entry.
- **Never invent facts** about shipped work. Missing details become `[TODO: ...]` markers inside `js/i18n.js`, present in both `en` and `pt`.
- **MidNight Memories is Unity, not Unreal.** Its bullets reference C#, never C++ or Blueprints.
- **Payload budget: under 4 MB** for a complete cold scroll.
- **`prefers-reduced-motion: reduce` is a hard gate** — evaluated once in `main.js` before any timeline is constructed.
- Colour tokens, crop filters, and clip slugs are copied verbatim from the spec. Do not re-derive them.
- Every task ends with a commit.

### Accent tokens (verbatim from spec)

```
steam-veins        #e8452f
midnight-memories  #8fa3ad
kuroneko           #17c3b2
johnny-g           #f5c518
dino-girls         #4ade80
neutral            #8b8b99
```

### Base tokens (verbatim from spec)

```
--ink    #08090c      --paper  #f2f3f7
--muted  #6b6b78      --rule   rgba(242,243,247,0.12)
```

---

## File Structure

| File | Responsibility |
| --- | --- |
| `scripts/build-media.sh` | GIF → MP4/WebM/WebP, one-time, manual |
| `scripts/check.mjs` | Asset existence + i18n parity checker |
| `scripts/check.test.mjs` | Tests for the checker |
| `index.html` | Semantic document, English inline, `data-i18n` keys |
| `css/base.css` | Reset, tokens, type scale, focus states |
| `css/layout.css` | Section shells, grid, pin containers |
| `css/components.css` | Cards, buttons, rail, marquee, cursor, code block |
| `js/i18n.js` | Copy dictionary, key binding, `<html lang>`, persistence |
| `js/media.js` | Poster→video swap, IntersectionObserver play/pause |
| `js/scroll.js` | ScrollTrigger timelines, accent tween, progress rail |
| `js/cursor.js` | Magnetic cursor, `pointer: fine` only |
| `js/main.js` | Loader, boot order, reduced-motion gate |
| `media/video/`, `media/poster/`, `media/font/` | Generated and vendored assets |

---

### Task 1: Media pipeline

**Files:**
- Create: `scripts/build-media.sh`
- Create (generated): `media/video/*.mp4`, `media/video/*.webm`, `media/poster/*.webp`
- Modify: `.gitignore` (create if absent)

**Interfaces:**
- Consumes: nothing.
- Produces: for each slug in `steam-veins-title`, `steam-veins-chapel`, `steam-veins-combat`, `midnight-memories`, `kuroneko`, `johnny-g` — the files `media/video/<slug>-1280.mp4`, `media/video/<slug>-720.mp4`, `media/video/<slug>-1280.webm`, `media/poster/<slug>.webp`. Every later task references media by these exact paths.

- [ ] **Step 1: Write the script**

Create `scripts/build-media.sh`:

```bash
#!/usr/bin/env bash
# Converts source GIFs in Gifs/ to web video in media/.
# Run manually after adding or replacing a clip:  bash scripts/build-media.sh
set -euo pipefail

SRC_DIR="Gifs"
OUT_VIDEO="media/video"
OUT_POSTER="media/poster"

mkdir -p "$OUT_VIDEO" "$OUT_POSTER"

# slug|source filename|crop filter (empty = no crop)|width|fps|crf
#
# Crop values are verified against extracted frames. Do not adjust without re-verifying.
#
# Width/fps/crf are per-clip because one profile does not fit this material.
# midnight-memories is a dithered PSX-style render whose game view is natively
# 320x240; high-frequency dither is expensive for H.264, and upscaling it past the
# cropped width spends bits amplifying noise. Encoding it at 960px/30fps/crf26
# measured 930 KB against 2.3 MB at 1280/50/24, with the dither pattern — the whole
# point of the aesthetic — visually intact.
#
# RULE: never let the width exceed the clip's post-crop width. Upscaling before
# encoding costs bitrate and buys nothing.
CLIPS=(
  "steam-veins-title|1SteamVeinsGif2.gif||1280|50|24"
  "steam-veins-chapel|2SteamVeinsGif3.gif||1280|50|24"
  "steam-veins-combat|3SteamVeinsGif4.gif||1280|50|24"
  "midnight-memories|4MidNightMemories1.gif|crop=1192:638:362:134|960|30|26"
  "kuroneko|5KuroNekoDemo_ToLinkedin_1.gif|crop=1604:856:156:136|1280|50|24"
  "johnny-g|JohnnyG1.gif||1280|50|24"
)

for entry in "${CLIPS[@]}"; do
  IFS='|' read -r slug src crop width fps crf <<< "$entry"
  in="$SRC_DIR/$src"

  if [[ ! -f "$in" ]]; then
    echo "MISSING SOURCE: $in" >&2
    exit 1
  fi

  # crop must precede scale in the filter chain
  pre="${crop:+$crop,}"

  echo "==> $slug"

  ffmpeg -y -v error -i "$in" \
    -vf "${pre}fps=$fps,scale=$width:-2:flags=lanczos" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf "$crf" \
    -movflags +faststart -an "$OUT_VIDEO/$slug-1280.mp4"

  ffmpeg -y -v error -i "$in" \
    -vf "${pre}fps=$fps,scale=720:-2:flags=lanczos" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf $((crf + 2)) \
    -movflags +faststart -an "$OUT_VIDEO/$slug-720.mp4"

  ffmpeg -y -v error -i "$in" \
    -vf "${pre}fps=$fps,scale=$width:-2:flags=lanczos" \
    -c:v libvpx-vp9 -crf $((crf + 10)) -b:v 0 -row-mt 1 -an "$OUT_VIDEO/$slug-1280.webm"

  ffmpeg -y -v error -i "$in" \
    -vf "${pre}scale=$width:-2:flags=lanczos" \
    -frames:v 1 -c:v libwebp -quality 82 "$OUT_POSTER/$slug.webp"
done

echo
echo "Per-visitor payload (the 1280 MP4 set — one format is downloaded, not all):"
du -ch "$OUT_VIDEO"/*-1280.mp4 | tail -1
echo "All generated files (repo weight, not transfer weight):"
du -ch "$OUT_VIDEO" "$OUT_POSTER" | tail -1
```

The `-1280` suffix is kept for `midnight-memories` even though it encodes at 960 px, so
that every slug has a uniform filename shape. `js/media.js` builds source URLs by string
pattern; a per-clip width in the filename would force it to know each clip's resolution.

**Budget note:** a browser downloads **one** of the MP4/WebM alternatives, never both,
and one of the 1280/720 variants, never both. The 4 MB budget therefore applies to the
sum of the `-1280.mp4` files, which is the worst realistic case for a desktop visitor who
scrolls the whole page. Summing every generated file measures repository weight, which is
a different and much looser concern.

- [ ] **Step 2: Run it**

Run: `bash scripts/build-media.sh`
Expected: six `==> slug` lines, no errors, and a **per-visitor payload (the `-1280.mp4`
set) under 3.5 MB**. If it exceeds that, stop and report rather than committing — do not
silently raise CRF to hit the number, since that trades away the visual quality this
whole exercise exists to protect.

- [ ] **Step 3: Verify the two crops removed the editor chrome**

This is the step that catches a wrong crop before it reaches the page.

```bash
mkdir -p /tmp/cropcheck
ffmpeg -y -v error -ss 1.2 -i media/video/kuroneko-1280.mp4 \
  -frames:v 1 /tmp/cropcheck/kuroneko.png
ffmpeg -y -v error -ss 1.5 -i media/video/midnight-memories-1280.mp4 \
  -frames:v 1 /tmp/cropcheck/midnight.png
```

Open both PNGs and confirm by eye:
- `kuroneko.png` — no Unity toolbar, no menu bar, no "Game" tab, no dark gutters.
- `midnight.png` — no Unity chrome, and **no red console error text along the bottom**.

If chrome remains, adjust the crop offsets and re-run. Do not proceed until both frames are clean.

- [ ] **Step 4: Confirm dimensions are even**

Run: `for f in media/video/*.mp4; do ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$f"; done`
Expected: every width and height is an even number. Odd dimensions break `yuv420p` playback in some browsers.

- [ ] **Step 5: Keep sources out of the served site but in the repo**

Create `.gitignore`:

```
.vs/
```

`Gifs/` stays tracked as the source of truth. `media/` is committed because there is no build step at deploy time.

- [ ] **Step 6: Commit**

```bash
git add scripts/build-media.sh .gitignore media/
git commit -m "Add media pipeline; convert 349MB of GIF to 3MB of video

Crops Unity editor chrome from the kuroneko and midnight-memories
clips, including a visible console error in the latter."
```

---

### Task 2: Verification script

**Files:**
- Create: `scripts/check.mjs`
- Create: `scripts/check.test.mjs`

**Interfaces:**
- Consumes: nothing at build time. Reads `index.html` and `js/i18n.js` at run time, both of which may not exist yet — the script must handle that by reporting a clear error, not crashing.
- Produces: `checkAll(rootDir)` returning `{ errors: string[] }`. Exported for tests; the CLI entry calls it and sets the exit code.

Written before the site so it can be run continuously as the site is built.

- [ ] **Step 1: Write the failing tests**

Create `scripts/check.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test "scripts/**/*.test.mjs"`
Expected: FAIL — `Cannot find module './check.mjs'`.

Quote the glob. Node expands it internally, which keeps the command identical under
bash and PowerShell. The bare-directory form `node --test scripts/` does **not** work
on Node 24 for Windows — it bypasses the runner and tries to load `scripts` as a
module entry point, failing with `Cannot find module '...\scripts'` whether or not the
tests would pass.

- [ ] **Step 3: Write the checker**

Create `scripts/check.mjs`:

```js
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_HREF = /\b(?:src|href)\s*=\s*"([^"]+)"/g;
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
    // Decoded, so the percent-encoded `Imagens/Est%C3%A1tua2.0.png` that Task 10
    // requires in the markup still resolves against the real filename on disk.
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test "scripts/**/*.test.mjs"`
Expected: PASS, 6/6.

- [ ] **Step 5: Commit**

```bash
git add scripts/check.mjs scripts/check.test.mjs
git commit -m "Add asset and i18n consistency checker with tests"
```

---

### Task 3: Foundation — document shell, tokens, type

**Files:**
- Modify: `index.html` — **replace its contents entirely, in place.** The previous
  version is preserved in git history, and the one fragment later tasks still need (the
  C# sample) has already been extracted to `docs/legacy/RespondTakeDamage.cs`. Do not
  create a second HTML file; there is exactly one `index.html` throughout.
- Create: `css/base.css`
- Create: `media/font/` (vendored WOFF2)

**Interfaces:**
- Consumes: `media/poster/*.webp` from Task 1.
- Produces: the `<html>` skeleton with `id`-bearing `<section>` elements that Task 7 attaches ScrollTriggers to. Section ids, in document order: `hero`, `positioning`, `marquee`, `steam-veins`, `midnight-memories`, `kuroneko`, `johnny-g`, `dino-girls`, `craft`, `code`, `background`, `contact`. Each project section carries `data-accent="<hex>"`.

- [ ] **Step 1: Vendor the fonts**

Download Space Grotesk (400, 700) and JetBrains Mono (400) as WOFF2 into `media/font/`. Both are SIL Open Font License; include the licence text at `media/font/OFL.txt`.

```bash
mkdir -p media/font
# Fetch the WOFF2 files for Space Grotesk 400/700 and JetBrains Mono 400
# from the Google Fonts release on GitHub, then verify:
ls -la media/font/
```

Expected: `space-grotesk-400.woff2`, `space-grotesk-700.woff2`, `jetbrains-mono-400.woff2`, `OFL.txt`.

- [ ] **Step 2: Write `css/base.css`**

```css
@font-face {
  font-family: 'Space Grotesk';
  src: url('../media/font/space-grotesk-400.woff2') format('woff2');
  font-weight: 400; font-display: swap;
}
@font-face {
  font-family: 'Space Grotesk';
  src: url('../media/font/space-grotesk-700.woff2') format('woff2');
  font-weight: 700; font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('../media/font/jetbrains-mono-400.woff2') format('woff2');
  font-weight: 400; font-display: swap;
}

:root {
  --ink: #08090c;
  --paper: #f2f3f7;
  --muted: #6b6b78;
  --rule: rgba(242, 243, 247, 0.12);
  --accent: #8b8b99;

  --display: clamp(3rem, 9vw, 9rem);
  --h2: clamp(2rem, 4vw, 3.5rem);
  --body: 1.125rem;
  --mono: 0.75rem;

  --gutter: clamp(1.25rem, 5vw, 6rem);
}

*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; }

html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}

body {
  background: var(--ink);
  color: var(--paper);
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-size: var(--body);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

h1, h2, h3 { line-height: 1.02; font-weight: 700; letter-spacing: -0.02em; }
h1 { font-size: var(--display); }
h2 { font-size: var(--h2); }

.mono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: var(--mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

a { color: inherit; text-decoration: none; }

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 2px;
}

img, video { max-width: 100%; display: block; }

.visually-hidden {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip-path: inset(50%); white-space: nowrap;
}
```

- [ ] **Step 3: Write the `index.html` skeleton**

Head, plus empty sections with correct ids and accents. Copy is filled in Task 4; media in Task 5.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lucas Antonino — Gameplay Programmer</title>
<meta name="description" content="Gameplay programmer. Unity, Unreal Engine 5, C#, C++. One title shipped on Steam.">

<link rel="preload" href="media/font/space-grotesk-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/layout.css">
<link rel="stylesheet" href="css/components.css">
</head>
<body>

<main>
  <section id="hero"></section>
  <section id="positioning"></section>
  <section id="marquee" aria-hidden="true"></section>

  <section id="steam-veins"       class="project" data-accent="#e8452f"></section>
  <section id="midnight-memories" class="project" data-accent="#8fa3ad"></section>
  <section id="kuroneko"          class="project" data-accent="#17c3b2"></section>
  <section id="johnny-g"          class="project" data-accent="#f5c518"></section>
  <section id="dino-girls"        class="project" data-accent="#4ade80"></section>

  <section id="craft"></section>
  <section id="code"></section>
  <section id="background"></section>
  <section id="contact"></section>
</main>

<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/SplitText.min.js" defer></script>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

Create empty `css/layout.css`, `css/components.css`, and a `js/main.js` containing only `export {};` so the page loads without 404s.

- [ ] **Step 4: Verify it loads clean**

Run: `python -m http.server 8000` and open `http://localhost:8000`.
Expected: black page, no console errors, no 404s in the Network tab. Fonts appear in Network as woff2.

- [ ] **Step 5: Commit**

```bash
git add index.html css/ media/font/ js/main.js
git commit -m "Add document shell, design tokens, and vendored fonts"
```

---

### Task 4: i18n module and full copy

**Files:**
- Create: `js/i18n.js`
- Modify: `index.html` — fill every section with English copy plus `data-i18n` keys

**Interfaces:**
- Consumes: section ids from Task 3.
- Produces:
  - `export const copy = { en: {...}, pt: {...} }`
  - `export function initI18n()` — binds `[data-i18n]`, wires `[data-lang]` buttons, sets `<html lang>`, persists to `localStorage` under key `lang`.
  - `export function currentLang()` returning `'en' | 'pt'`.

- [ ] **Step 1: Write `js/i18n.js`**

```js
export const copy = {
  en: {
    'hero.role': 'Gameplay Programmer',
    'hero.summary': 'I build the systems players actually touch — combat, movement, dialogue, UI. One title shipped on Steam.',
    'hero.cv': 'Download CV',
    'hero.scroll': 'Scroll',

    'positioning.heading': 'What I do',
    'positioning.body': 'I work on gameplay: the code between an input and a response that feels right. Combat state machines, damage and knockback, dialogue parsing, UI flow, and the audio hooks that sell an impact. Unity and Unreal Engine 5, in C#, C++ and Blueprints.',

    'sv.title': 'Steam Veins',
    'sv.status': 'Published on Steam',
    'sv.lede': 'A 2D action game built with a team at Kimu Studios and released on Steam. I worked on gameplay systems and the mechanics around combat.',
    'sv.b1': 'Enemy damage response — invulnerability frames, knockback, collision handling',
    'sv.b2': 'Phase transitions driven by health thresholds',
    'sv.b3': 'FMOD event integration with randomised pitch on melee hits',
    'sv.b4': 'Visual effects integration and performance passes',
    'sv.todo': '[TODO: team size, development duration, release date]',

    'mm.title': 'MidNight Memories',
    'mm.status': 'Solo project',
    'mm.lede': 'A PSX-style first-person game built solo in Unity, focused on atmosphere and an enigmatic narrative.',
    'mm.b1': 'Movement and combat programming in C#',
    'mm.b2': 'Gameplay and UI systems',
    'mm.b3': 'Technical design and full implementation',
    'mm.todo': '[TODO: current status — prototype, demo, or planned release?]',

    'kn.title': 'KuroNeko',
    'kn.status': 'Visual novel · Solo project',
    'kn.lede': 'A visual novel built solo in Unity. I wrote the narrative parser that drives it — script in, branching scene out.',
    'kn.b1': 'Custom narrative parser system in C#',
    'kn.b2': 'Parser integration with Unity scene and UI layers',
    'kn.b3': 'Choice handling and narrative progression',
    'kn.todo': '[TODO: script length or number of branches?]',

    'jg.title': 'Johnny G',
    'jg.status': 'Experimental prototype',
    'jg.lede': 'A prototype built around a single constraint: the player can only move and attack with a grappler. Everything else follows from that.',
    'jg.b1': 'Grappler-based movement system',
    'jg.b2': 'Combat integrated into traversal rather than separate from it',
    'jg.b3': 'Focus on responsiveness and spatial control',

    'dg.title': 'Dino Girls',
    'dg.status': 'In production',
    'dg.lede': 'An upcoming Steam release I contribute to across gameplay systems and mechanics.',
    'dg.b1': 'Gameplay systems and mechanics implementation',
    'dg.b2': 'Technical and creative decision-making with the team',
    'dg.todo': '[TODO: role scope and expected release window]',

    'craft.heading': 'Art and assets',
    'craft.body': 'Backgrounds, sprite sheets and scene work produced alongside the code.',

    'code.heading': 'Code',
    'code.caption': 'Enemy damage response from Steam Veins — invulnerability gate, FMOD audio, health-threshold phase change, and execution state. C#, Unity.',
    'code.link': 'More on GitHub',

    'bg.heading': 'Background',
    'bg.degree': "Bachelor's, Information Technology — UFRN",
    'bg.gamedesign': 'Game Design — Udemy',
    'bg.database': 'Database Administration — IFRS',

    'contact.heading': 'Get in touch',
    'contact.body': 'Open to gameplay programming roles.',
    'contact.cv': 'Download CV',

    'nav.steam': 'Steam page',
    'nav.demo': 'Demo',
    'nav.project': 'View project',
  },

  pt: {
    'hero.role': 'Programador de Gameplay',
    'hero.summary': 'Construo os sistemas que o jogador realmente toca — combate, movimentação, diálogo, UI. Um título publicado na Steam.',
    'hero.cv': 'Baixar CV',
    'hero.scroll': 'Role',

    'positioning.heading': 'O que eu faço',
    'positioning.body': 'Trabalho com gameplay: o código entre um input e uma resposta que parece certa. Máquinas de estado de combate, dano e knockback, parsing de diálogo, fluxo de UI, e os hooks de áudio que vendem o impacto. Unity e Unreal Engine 5, em C#, C++ e Blueprints.',

    'sv.title': 'Steam Veins',
    'sv.status': 'Publicado na Steam',
    'sv.lede': 'Jogo de ação 2D desenvolvido em equipe na Kimu Studios e lançado na Steam. Trabalhei nos sistemas de gameplay e nas mecânicas de combate.',
    'sv.b1': 'Resposta a dano dos inimigos — frames de invulnerabilidade, knockback, tratamento de colisão',
    'sv.b2': 'Transições de fase acionadas por limiares de vida',
    'sv.b3': 'Integração de eventos FMOD com pitch aleatório nos golpes corpo a corpo',
    'sv.b4': 'Integração de efeitos visuais e otimização de performance',
    'sv.todo': '[TODO: tamanho da equipe, duração do desenvolvimento, data de lançamento]',

    'mm.title': 'MidNight Memories',
    'mm.status': 'Projeto solo',
    'mm.lede': 'Jogo em primeira pessoa no estilo PSX, feito solo em Unity, com foco em atmosfera e narrativa enigmática.',
    'mm.b1': 'Programação de movimentação e combate em C#',
    'mm.b2': 'Sistemas de gameplay e UI',
    'mm.b3': 'Design técnico e implementação completa',
    'mm.todo': '[TODO: status atual — protótipo, demo ou lançamento planejado?]',

    'kn.title': 'KuroNeko',
    'kn.status': 'Visual novel · Projeto solo',
    'kn.lede': 'Visual novel feita solo em Unity. Escrevi o parser narrativo que a move — script na entrada, cena ramificada na saída.',
    'kn.b1': 'Sistema de parser narrativo próprio em C#',
    'kn.b2': 'Integração do parser com as camadas de cena e UI do Unity',
    'kn.b3': 'Tratamento de escolhas e progressão narrativa',
    'kn.todo': '[TODO: tamanho do roteiro ou número de ramificações?]',

    'jg.title': 'Johnny G',
    'jg.status': 'Protótipo experimental',
    'jg.lede': 'Protótipo construído em torno de uma única restrição: o jogador só pode se mover e atacar com um grappler. Todo o resto decorre disso.',
    'jg.b1': 'Sistema de movimentação baseado em grappler',
    'jg.b2': 'Combate integrado à travessia, não separado dela',
    'jg.b3': 'Foco em responsividade e domínio do espaço',

    'dg.title': 'Dino Girls',
    'dg.status': 'Em produção',
    'dg.lede': 'Lançamento futuro na Steam no qual contribuo em sistemas de gameplay e mecânicas.',
    'dg.b1': 'Implementação de sistemas de gameplay e mecânicas',
    'dg.b2': 'Decisões técnicas e criativas junto à equipe',
    'dg.todo': '[TODO: escopo do papel e janela de lançamento prevista]',

    'craft.heading': 'Arte e assets',
    'craft.body': 'Cenários, sprite sheets e trabalho de cena produzidos junto com o código.',

    'code.heading': 'Código',
    'code.caption': 'Resposta a dano de inimigo em Steam Veins — verificação de invulnerabilidade, áudio FMOD, mudança de fase por limiar de vida e estado de execução. C#, Unity.',
    'code.link': 'Mais no GitHub',

    'bg.heading': 'Formação',
    'bg.degree': 'Bacharelado em Tecnologia da Informação — UFRN',
    'bg.gamedesign': 'Game Design — Udemy',
    'bg.database': 'Administração de Banco de Dados — IFRS',

    'contact.heading': 'Contato',
    'contact.body': 'Aberto a vagas de programação de gameplay.',
    'contact.cv': 'Baixar CV',

    'nav.steam': 'Página na Steam',
    'nav.demo': 'Demo',
    'nav.project': 'Ver projeto',
  },
};

const STORAGE_KEY = 'lang';
let active = 'en';

export function currentLang() {
  return active;
}

function resolveInitial() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'pt') return stored;
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

function apply(lang) {
  const dict = copy[lang];
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const key = el.dataset.i18n;
    const value = dict[key];
    if (value === undefined) {
      console.warn(`i18n: no "${lang}" entry for key "${key}"`);
      continue; // leave existing text rather than rendering undefined
    }
    el.textContent = value;
  }
  document.documentElement.lang = lang;
  active = lang;
  localStorage.setItem(STORAGE_KEY, lang);

  for (const btn of document.querySelectorAll('[data-lang]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
  }
}

export function initI18n() {
  for (const btn of document.querySelectorAll('[data-lang]')) {
    btn.addEventListener('click', () => apply(btn.dataset.lang));
  }
  apply(resolveInitial());
}
```

- [ ] **Step 2: Fill `index.html` with the English copy**

Every element carrying `data-i18n` must have inline text **byte-identical** to its `copy.en` entry. Example for the hero:

```html
<section id="hero">
  <div class="lang" role="group" aria-label="Language">
    <button type="button" data-lang="en" aria-pressed="true">EN</button>
    <button type="button" data-lang="pt" aria-pressed="false">PT</button>
  </div>
  <h1>Lucas Antonino</h1>
  <p class="mono" data-i18n="hero.role">Gameplay Programmer</p>
  <p class="lede" data-i18n="hero.summary">I build the systems players actually touch — combat, movement, dialogue, UI. One title shipped on Steam.</p>
  <a class="btn" href="Lucas_Antonino_Resumee_PT-BR_US.pdf" download data-i18n="hero.cv">Download CV</a>
</section>
```

Add the scroll cue as the last child of `#hero`:

```html
<p class="mono scroll-cue" data-i18n="hero.scroll">Scroll</p>
```

Apply the same pattern to every section. The project sections use `sv.*`, `mm.*`, `kn.*`, `jg.*`, `dg.*` keys respectively.

Each project section opens with a mono numeral, which is one of the elements the accent
tints as you scroll. Numerals are literal text, not `data-i18n` keys — digits do not
translate:

```html
<p class="mono numeral">01 / <span data-i18n="sv.status">Published on Steam</span></p>
<h2 data-i18n="sv.title">Steam Veins</h2>
```

Numbering runs `01` Steam Veins, `02` MidNight Memories, `03` KuroNeko, `04` Johnny G,
`05` Dino Girls — matching the spec's page architecture. Style `.numeral` to take
`color: var(--accent)`.

- [ ] **Step 3: Build the marquee**

The marquee carries no `data-i18n` keys — these are technology names, identical in both
languages. The list is duplicated because Task 7 animates `xPercent: -50`, which only
loops seamlessly when the track holds exactly two copies.

```html
<section id="marquee" aria-hidden="true" class="marquee">
  <div class="marquee-inner">
    <span>UNITY</span><span>UNREAL ENGINE 5</span><span>C#</span>
    <span>C++</span><span>BLUEPRINTS</span><span>FMOD</span>
    <span>UNITY</span><span>UNREAL ENGINE 5</span><span>C#</span>
    <span>C++</span><span>BLUEPRINTS</span><span>FMOD</span>
  </div>
</section>
```

`aria-hidden` is correct here: the same technologies are announced in readable form by
the positioning and project sections, so a screen reader repeating a scrolling ticker
would be noise.

- [ ] **Step 4: Hide the language toggle when JavaScript is unavailable**

The toggle cannot function without JS, so it must not be offered. Add to `css/components.css`:

```css
.lang { display: none; }
```

and re-show it from `initI18n()` once binding succeeds — append to the end of that function:

```js
  const switcher = document.querySelector('.lang');
  if (switcher) switcher.style.display = 'flex';
```

- [ ] **Step 5: Run the checker to catch drift**

Run: `node scripts/check.mjs`
Expected: PASS. If it reports drift, the markup and dictionary disagree — fix the markup to match `copy.en` exactly.

- [ ] **Step 6: Wire it up and verify in the browser**

In `js/main.js`:

```js
import { initI18n } from './i18n.js';
initI18n();
```

Open the page, click PT, confirm every string switches. Reload, confirm PT persists. Click EN, confirm it switches back with no `undefined` or `null` anywhere. Disable JavaScript and reload — the page stays readable in English and the toggle is not shown.

- [ ] **Step 7: Commit**

```bash
git add js/i18n.js js/main.js index.html
git commit -m "Add i18n module and full English/Portuguese copy

Corrects MidNight Memories from Unreal to Unity, and the project
count from 4 to 5. Missing facts are marked [TODO] in both locales."
```

---

### Task 5: Media module

**Files:**
- Create: `js/media.js`
- Modify: `index.html` — add `<video>` blocks to the five project sections
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `media/video/<slug>-{1280,720}.mp4`, `media/video/<slug>-1280.webm`, `media/poster/<slug>.webp` from Task 1.
- Produces: `export function initMedia({ reducedMotion })` — attaches an IntersectionObserver to every `video[data-slug]`, plays on enter, pauses on exit. When `reducedMotion` is true it attaches `controls` and never autoplays.

- [ ] **Step 1: Add the video markup**

Per project section, using `steam-veins-combat` as the shape:

```html
<figure class="shot">
  <video
    data-slug="steam-veins-combat"
    poster="media/poster/steam-veins-combat.webp"
    preload="none" muted loop playsinline
    aria-label="Steam Veins combat: the player fights enemies in a red-lit stone corridor">
    <source data-src="media/video/steam-veins-combat-1280.webm" type="video/webm">
    <source data-src="media/video/steam-veins-combat-1280.mp4" type="video/mp4">
  </video>
  <noscript>
    <img src="media/poster/steam-veins-combat.webp" alt="Steam Veins combat">
  </noscript>
</figure>
```

`src` is held in `data-src` so nothing downloads until `media.js` promotes it.

- [ ] **Step 2: Write `js/media.js`**

```js
const MOBILE_MAX = 1023;

function promote(video) {
  if (video.dataset.loaded === 'true') return;
  const wantSmall = window.innerWidth <= MOBILE_MAX;
  for (const source of video.querySelectorAll('source[data-src]')) {
    let url = source.dataset.src;
    if (wantSmall && url.endsWith('-1280.mp4')) {
      url = url.replace('-1280.mp4', '-720.mp4');
    }
    // No 720 WebM is generated; drop it on small screens and let MP4 serve.
    if (wantSmall && url.endsWith('.webm')) {
      source.remove();
      continue;
    }
    source.src = url;
    source.removeAttribute('data-src');
  }
  video.dataset.loaded = 'true';
  video.load();
}

export function initMedia({ reducedMotion }) {
  const videos = document.querySelectorAll('video[data-slug]');

  if (reducedMotion) {
    for (const video of videos) {
      promote(video);
      video.setAttribute('controls', '');
    }
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target;
        if (entry.isIntersecting) {
          promote(video);
          video.play().catch(() => {
            // Autoplay can still be refused; the poster remains, which is fine.
          });
        } else {
          video.pause();
        }
      }
    },
    { rootMargin: '200px 0px', threshold: 0.1 }
  );

  for (const video of videos) observer.observe(video);
}
```

- [ ] **Step 3: Wire into `js/main.js`**

```js
import { initI18n } from './i18n.js';
import { initMedia } from './media.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initI18n();
initMedia({ reducedMotion });
```

- [ ] **Step 4: Verify lazy loading actually defers**

Open DevTools → Network, filter Media, hard-reload, and do not scroll.
Expected: **zero** video requests. Scroll to Steam Veins; only then does its MP4 or WebM appear. Scroll past; playback pauses (check `video.paused` in the console).

- [ ] **Step 5: Verify reduced motion**

In DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload.
Expected: videos show native controls and do not autoplay.

- [ ] **Step 6: Commit**

```bash
git add js/media.js js/main.js index.html
git commit -m "Add lazy video loading with viewport-driven playback"
```

---

### Task 6: Layout and components CSS

**Files:**
- Modify: `css/layout.css`
- Modify: `css/components.css`

**Interfaces:**
- Consumes: the class names introduced in Tasks 4 and 5 (`.lede`, `.btn`, `.lang`, `.shot`, `.project`).
- Produces: `.pin-wrap` and `.pin-inner` on project sections, which Task 7's ScrollTrigger pins. A project section's structure is `section.project > .pin-wrap > .pin-inner > (figure.shot + .project-copy)`.

- [ ] **Step 1: Write `css/layout.css`**

```css
main > section {
  position: relative;
  padding: clamp(6rem, 14vh, 12rem) var(--gutter);
}

#hero {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;
}

.project .pin-wrap { min-height: 100svh; display: grid; align-items: center; }

.project .pin-inner {
  display: grid;
  gap: clamp(2rem, 5vw, 5rem);
  grid-template-columns: 1fr;
  align-items: center;
}

@media (min-width: 1024px) {
  .project .pin-inner { grid-template-columns: 1.3fr 1fr; }
}

.project-copy { display: flex; flex-direction: column; gap: 1rem; max-width: 46ch; }
.project-copy ul { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
.project-copy li { padding-left: 1.4rem; position: relative; color: var(--muted); }
.project-copy li::before {
  content: ''; position: absolute; left: 0; top: 0.65em;
  width: 0.7rem; height: 1px; background: var(--accent);
}

.grid-3 {
  display: grid; gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.craft-grid {
  display: grid; gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
```

- [ ] **Step 2: Write `css/components.css`**

```css
.lang { position: fixed; top: 1.25rem; right: var(--gutter); z-index: 60; display: flex; gap: 0.5rem; }
.lang button {
  font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; letter-spacing: 0.08em;
  background: transparent; color: var(--muted);
  border: 1px solid var(--rule); border-radius: 4px;
  padding: 0.35rem 0.6rem; cursor: pointer; transition: color 0.2s, border-color 0.2s;
}
.lang button[aria-pressed='true'] { color: var(--accent); border-color: var(--accent); }

.btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  align-self: flex-start;
  padding: 0.8rem 1.4rem; border: 1px solid var(--accent); border-radius: 999px;
  font-size: 0.95rem; transition: background 0.25s, color 0.25s;
}
.btn:hover { background: var(--accent); color: var(--ink); }

.lede { font-size: clamp(1.15rem, 2vw, 1.5rem); color: var(--paper); max-width: 40ch; }

.shot { position: relative; overflow: hidden; border-radius: 10px; border: 1px solid var(--rule); }
.shot video, .shot img { width: 100%; height: auto; }

.rail {
  position: fixed; left: var(--gutter); top: 50%; translate: 0 -50%;
  width: 2px; height: 32vh; background: var(--rule); z-index: 50;
}
.rail span { display: block; width: 100%; height: 0; background: var(--accent); transform-origin: top; }
@media (max-width: 1023px) { .rail { display: none; } }

.marquee { overflow: hidden; white-space: nowrap; border-block: 1px solid var(--rule); padding-block: 1.5rem; }
.marquee-inner { display: inline-flex; gap: 3rem; will-change: transform; }
.marquee span { font-size: clamp(1.5rem, 4vw, 3rem); font-weight: 700; color: var(--muted); }

.code-block {
  background: #0d0f14; border: 1px solid var(--rule); border-radius: 10px;
  padding: 1.5rem; overflow-x: auto;
  font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; line-height: 1.7;
}
.code-block .line { display: block; }

.cursor {
  position: fixed; top: 0; left: 0; z-index: 100; pointer-events: none;
  width: 28px; height: 28px; border: 1px solid var(--accent); border-radius: 50%;
  translate: -50% -50%; mix-blend-mode: difference;
}
@media (pointer: coarse) { .cursor { display: none; } }
```

- [ ] **Step 3: Verify layout at two widths**

Open at 1440 px and 375 px.
Expected: at 1440 the project sections are two-column; at 375 they stack. No horizontal scrollbar at either width.

- [ ] **Step 4: Commit**

```bash
git add css/layout.css css/components.css
git commit -m "Add layout and component styles"
```

---

### Task 7: Scroll system — rail, reveals, accent transition

**Files:**
- Create: `js/scroll.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `data-accent` on `.project` sections (Task 3); `.rail span` (Task 6).
- Produces: `export function initScroll()`. Assumes `gsap` and `ScrollTrigger` are on `window`. Must be called only when `reducedMotion` is false.

- [ ] **Step 1: Add the rail element to `index.html`**

Immediately before `</body>`:

```html
<div class="rail" aria-hidden="true"><span></span></div>
```

- [ ] **Step 2: Write `js/scroll.js`**

```js
const NEUTRAL = '#8b8b99';

export function initScroll() {
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  // Progress rail
  gsap.to('.rail span', {
    height: '100%',
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
  });

  // Accent cross-fade: each project owns the accent while it holds the viewport middle
  for (const section of document.querySelectorAll('.project')) {
    const accent = section.dataset.accent;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => gsap.to(':root', { '--accent': accent, duration: 0.5 }),
      onEnterBack: () => gsap.to(':root', { '--accent': accent, duration: 0.5 }),
      onLeave: () => gsap.to(':root', { '--accent': NEUTRAL, duration: 0.5 }),
      onLeaveBack: () => gsap.to(':root', { '--accent': NEUTRAL, duration: 0.5 }),
    });
  }

  // Generic reveal for anything marked
  for (const el of document.querySelectorAll('[data-reveal]')) {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  }

  // Marquee, driven continuously and skewed by scroll velocity
  const marquee = document.querySelector('.marquee-inner');
  if (marquee) {
    const loop = gsap.to(marquee, {
      xPercent: -50,
      repeat: -1,
      duration: 20,
      ease: 'none',
    });
    ScrollTrigger.create({
      trigger: '.marquee',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const skew = gsap.utils.clamp(-12, 12, self.getVelocity() / 220);
        gsap.to(marquee, { skewX: skew, duration: 0.4, overwrite: true });
        loop.timeScale(1 + Math.abs(skew) / 6);
      },
    });
  }
}
```

**Note on the CSS-variable tween:** GSAP animates custom properties on a selector string only when the property is registered or already set. `--accent` is set on `:root` in `base.css`, so this works. Verify in Step 4 — if the accent snaps instead of fading, register it with `CSS.registerProperty({ name: '--accent', syntax: '<color>', inherits: true, initialValue: NEUTRAL })` in `main.js` before `initScroll()`.

- [ ] **Step 3: Add `data-reveal` to content blocks**

Add `data-reveal` to each `.project-copy`, each `.grid-3 > *`, the code block, and the contact heading.

- [ ] **Step 4: Wire and verify**

In `js/main.js`, after `initMedia`:

```js
import { initScroll } from './scroll.js';
if (!reducedMotion) initScroll();
```

Open the page and scroll. Expected: the rail fills as you descend; the accent transitions between crimson, steel, teal, yellow and green as each project takes the middle of the viewport; content blocks rise into place once; the marquee runs and skews when you scroll fast.

- [ ] **Step 5: Commit**

```bash
git add js/scroll.js js/main.js index.html
git commit -m "Add scroll system: progress rail, reveals, accent cross-fade"
```

---

### Task 8: Pinned project panels

**Files:**
- Modify: `js/scroll.js`

**Interfaces:**
- Consumes: `.project .pin-wrap` / `.pin-inner` structure from Task 6.
- Produces: `pinProjects()`, called from `initScroll()`. Only active at ≥1024 px, via `ScrollTrigger.matchMedia`.

This is where the spec's replacement for scrubbed playback lands: the clip plays natively while its section is pinned, and scroll drives the surrounding layout instead.

- [ ] **Step 1: Add `pinProjects` to `js/scroll.js`**

```js
function pinProjects() {
  const { gsap, ScrollTrigger } = window;

  ScrollTrigger.matchMedia({
    '(min-width: 1024px)': () => {
      for (const section of document.querySelectorAll('.project')) {
        const wrap = section.querySelector('.pin-wrap');
        const shot = section.querySelector('.shot');
        const copyEl = section.querySelector('.project-copy');
        if (!wrap || !copyEl) continue;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrap,
            start: 'top top',
            end: '+=120%',
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
          },
        });

        // Clip enters behind an expanding mask, then settles smaller
        if (shot) {
          tl.from(shot, { clipPath: 'inset(50% 0% 50% 0%)', duration: 0.5, ease: 'power2.out' }, 0)
            .from(shot, { scale: 1.12, duration: 1.0, ease: 'none' }, 0);
        }

        // Copy steps in beside it
        tl.from(
          copyEl.children,
          { y: 30, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' },
          0.25
        );
      }
    },
  });
}
```

Sections with no `.shot` — Dino Girls — still pin and still step their copy in; the `if (shot)` guard handles it.

- [ ] **Step 2: Call it from `initScroll()`**

Add `pinProjects();` as the last statement of `initScroll()`.

- [ ] **Step 3: Verify pinning**

At ≥1024 px, scroll slowly through Steam Veins.
Expected: the section holds in place while the copy steps in; the video keeps playing at normal speed the whole time (it must **not** slow down or stutter — if it does, a scrub has been wired to the video, which this design explicitly rejects); the section releases and the next one takes over.

At 375 px: no pinning; sections scroll normally.

- [ ] **Step 4: Verify no layout jump on pin**

Watch the section boundary as each pin engages and releases. A visible jump means `anticipatePin` needs raising or the pin container has a margin — move spacing to padding.

- [ ] **Step 5: Commit**

```bash
git add js/scroll.js
git commit -m "Pin project panels with mask-in and stepped copy"
```

---

### Task 9: Hero, loader, and split-text title

**Files:**
- Modify: `js/main.js`
- Modify: `index.html`
- Modify: `css/components.css`

**Interfaces:**
- Consumes: `initI18n`, `initMedia`, `initScroll`.
- Produces: the boot sequence. The loader must resolve even if the hero video never fires `canplay` — a hard 3-second timeout guarantees the page is never held hostage by media.

- [ ] **Step 1: Add the loader markup and hero video**

```html
<div class="loader" id="loader" aria-hidden="true">
  <span class="loader-count">0</span>
</div>
```

Add the hero background video inside `#hero`. It carries **both** `data-slug` and
`data-hero`: `media.js` finds it by `data-slug` for lazy playback, and `main.js` finds it
by `data-hero` to gate the loader. Omitting either breaks one of them.

```html
<video class="hero-bg"
  data-slug="steam-veins-title" data-hero
  poster="media/poster/steam-veins-title.webp"
  preload="none" muted loop playsinline aria-hidden="true">
  <source data-src="media/video/steam-veins-title-1280.webm" type="video/webm">
  <source data-src="media/video/steam-veins-title-1280.mp4" type="video/mp4">
</video>
```

It is `aria-hidden` because it is decorative — the hero's meaning is carried by the
heading and summary text, not the footage.

Style it as a full-bleed backdrop with the text legible above it:

```css
#hero { position: relative; isolation: isolate; }
.hero-bg {
  position: absolute; inset: 0; z-index: -2;
  width: 100%; height: 100%; object-fit: cover;
}
#hero::after {
  content: ''; position: absolute; inset: 0; z-index: -1;
  background: linear-gradient(180deg, rgba(8,9,12,0.55), rgba(8,9,12,0.92));
}
```

The overlay is not optional — the title screen is a bright, busy image and the hero text
fails contrast against it unscrimmed.

- [ ] **Step 2: Style the loader**

```css
.loader {
  position: fixed; inset: 0; z-index: 200;
  background: var(--ink); display: grid; place-items: center;
}
.loader-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(3rem, 12vw, 9rem); color: var(--paper);
}
.loader.done { pointer-events: none; }
```

- [ ] **Step 3: Write the boot sequence in `js/main.js`**

```js
import { initI18n } from './i18n.js';
import { initMedia } from './media.js';
import { initScroll } from './scroll.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ready() {
  return new Promise((resolve) => {
    if (window.gsap && window.ScrollTrigger && window.SplitText) return resolve();
    const poll = setInterval(() => {
      if (window.gsap && window.ScrollTrigger && window.SplitText) {
        clearInterval(poll);
        resolve();
      }
    }, 50);
    setTimeout(() => { clearInterval(poll); resolve(); }, 3000);
  });
}

function runLoader() {
  const loader = document.getElementById('loader');
  const count = loader.querySelector('.loader-count');
  const hero = document.querySelector('video[data-hero]');

  const media = new Promise((resolve) => {
    if (!hero) return resolve();
    if (hero.readyState >= 3) return resolve();
    hero.addEventListener('canplay', resolve, { once: true });
    setTimeout(resolve, 3000); // never hold the page hostage
  });

  const counter = { value: 0 };
  const tween = window.gsap.to(counter, {
    value: 100,
    duration: 1.2,
    ease: 'power1.inOut',
    onUpdate: () => { count.textContent = String(Math.round(counter.value)); },
  });

  return Promise.all([media, tween]).then(
    () =>
      new Promise((resolve) => {
        loader.classList.add('done');
        window.gsap.to(loader, {
          opacity: 0,
          duration: 0.6,
          onComplete: () => { loader.remove(); resolve(); },
        });
      })
  );
}

function revealHero() {
  const { gsap, SplitText } = window;
  const split = new SplitText('#hero h1', { type: 'chars' });
  gsap.from(split.chars, {
    yPercent: 120,
    opacity: 0,
    stagger: 0.03,
    duration: 0.9,
    ease: 'power4.out',
  });
}

async function boot() {
  initI18n();
  initMedia({ reducedMotion });

  if (reducedMotion) {
    document.getElementById('loader')?.remove();
    return;
  }

  await ready();
  if (!window.gsap) {
    // CDN failed; leave the page static and readable rather than broken.
    document.getElementById('loader')?.remove();
    return;
  }

  await runLoader();
  revealHero();
  initScroll();
}

boot();
```

`initCursor` is deliberately absent — `js/cursor.js` does not exist until Task 11, and
importing a missing module aborts the whole module graph and blanks the page. Task 11
adds both the import and the call.

Note the ordering: `initI18n()` runs before the loader clears, so the correct language is already in place when the page is revealed. No flash of English for a Portuguese visitor.

- [ ] **Step 4: Verify the loader cannot hang**

Throttle the network to Slow 3G and reload.
Expected: the counter reaches 100 and the loader clears within roughly 3 seconds regardless of video state. Then block the GSAP CDN in DevTools and reload — expected: the loader is removed and the page is fully readable, unanimated.

- [ ] **Step 5: Commit**

```bash
git add js/main.js index.html css/components.css
git commit -m "Add loader and split-text hero reveal with fail-safe timeouts"
```

---

### Task 10: Remaining sections — craft, code, background, contact

**Files:**
- Modify: `index.html`
- Modify: `js/scroll.js`

**Interfaces:**
- Consumes: `data-reveal` from Task 7; stills in `Imagens/`.
- Produces: `typeCode()` in `scroll.js`, called from `initScroll()`.

- [ ] **Step 1: Build the craft grid**

Use the stills the current site never displays: `Imagens/ShrineWithSnow.png`, `Imagens/Scene1_Street.png`, `Imagens/Scene2_Street.png`, `Imagens/Estátua2.0.png`, `Imagens/Kunai_Explosion-Sheet.gif`, `Imagens/DracularaWave-Sheet.gif`.

The `Estátua2.0.png` filename contains a non-ASCII character. URL-encode it in the markup as `Imagens/Est%C3%A1tua2.0.png` — an unencoded accented character will 404 on GitHub Pages even though it works locally. Verify with `node scripts/check.mjs`, which resolves the decoded path.

Each image gets `loading="lazy"`, real `alt` text, and `data-parallax` for Task 10 Step 3.

- [ ] **Step 2: Build the code section**

Wrap each source line of `RespondTakeDamage` in `<span class="line">` so lines can be
staggered. The method body is preserved verbatim at `docs/legacy/RespondTakeDamage.cs`
(43 lines) — read it from there. Do **not** try to recover it from `index.html`, which
was replaced in Task 3.

HTML-escape the source when embedding it: the method contains
`GetComponentInChildren<IgnoreCollisionOnDamage>()`, and an unescaped `<` opens a bogus
tag that swallows the rest of the block. Escape `<` as `&lt;` and `>` as `&gt;`.

- [ ] **Step 3: Add `typeCode` and parallax to `js/scroll.js`**

```js
function typeCode() {
  const { gsap } = window;
  const lines = document.querySelectorAll('.code-block .line');
  if (!lines.length) return;
  gsap.from(lines, {
    opacity: 0,
    x: -12,
    stagger: 0.025,
    duration: 0.35,
    ease: 'none',
    scrollTrigger: { trigger: '.code-block', start: 'top 75%' },
  });
}

function parallaxStills() {
  const { gsap } = window;
  for (const img of document.querySelectorAll('[data-parallax]')) {
    gsap.to(img, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
    });
  }
}
```

Call both from `initScroll()`.

- [ ] **Step 4: Build background and contact sections**

Background: a `.grid-3` of the three qualifications using `bg.*` keys.
Contact: heading, body, CV download, and links to GitHub, LinkedIn, and email.

Preserve every external URL from the legacy site verbatim. They are recorded in
`docs/legacy/external-links.md`, extracted before Task 3 replaced `index.html` —
read them from there, not from `index.html`, which no longer contains them.

There are **nine** entries, not the six this plan originally claimed: two Steam
pages, **three** Google Drive links (a Demo file for Steam Veins plus project
folders for MidNight Memories and Johnny G), GitHub twice, LinkedIn, and the
email `lvantonino@hotmail.com` — which a URL grep misses because it has no
scheme. KuroNeko has no external link; do not invent one.

- [ ] **Step 5: Verify every link**

Run: `node scripts/check.mjs`
Expected: PASS.

Then click every external link manually and confirm each resolves, checking off the
table in `docs/legacy/external-links.md`. The checker deliberately skips external
URLs; only a human can confirm they still work. The three Google Drive links are the
likely failures — Drive sharing permissions expire or get revoked far more often than
Steam or GitHub URLs.

- [ ] **Step 6: Commit**

```bash
git add index.html js/scroll.js
git commit -m "Add craft, code, background, and contact sections"
```

---

### Task 11: Magnetic cursor

**Files:**
- Create: `js/cursor.js`

**Interfaces:**
- Consumes: `.cursor` styling from Task 6.
- Produces: `export function initCursor()`. No-ops on coarse pointers.

- [ ] **Step 1: Write `js/cursor.js`**

```js
export function initCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const { gsap } = window;

  const ring = document.createElement('div');
  ring.className = 'cursor';
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);

  const x = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });

  window.addEventListener('pointermove', (e) => { x(e.clientX); y(e.clientY); });

  for (const target of document.querySelectorAll('a, button')) {
    target.addEventListener('pointerenter', () =>
      gsap.to(ring, { scale: 2.2, duration: 0.3 })
    );
    target.addEventListener('pointerleave', () =>
      gsap.to(ring, { scale: 1, duration: 0.3 })
    );
  }
}
```

- [ ] **Step 2: Wire it into `js/main.js`**

Now that the module exists, add the import at the top:

```js
import { initCursor } from './cursor.js';
```

and call it as the last line of `boot()`, after `initScroll()`.

- [ ] **Step 3: Verify**

Move the pointer: the ring trails smoothly and grows over links and buttons. On a touch device or with `pointer: coarse` emulated, no ring is created at all. Reload with reduced motion on — `boot()` returns before `initCursor()`, so no ring appears.

- [ ] **Step 4: Commit**

```bash
git add js/cursor.js js/main.js
git commit -m "Add magnetic cursor for fine pointers"
```

---

### Task 12: Retire the old page, final QA sweep

**Files:**
- Delete: `docs/legacy/` — the scaffolding that carried the C# sample and the external
  link table across the rebuild; both now live in `index.html` and the originals are in
  git history. Delete only after Step 3's link check passes, not before.
- Modify: `index.html` (replaced in place across Tasks 3–10; verify only)
- Create: `README.md`

**Interfaces:** none — this task ships.

- [ ] **Step 1: Confirm the old markup is fully gone**

Run: `grep -n "carousel\|data-pt\|setInterval\|Segoe UI" index.html`
Expected: no matches. Any hit means a fragment of the old page survived.

- [ ] **Step 2: Run the full check**

```bash
node --test "scripts/**/*.test.mjs"
node scripts/check.mjs
```

Expected: all tests pass, checker exits 0.

- [ ] **Step 3: Work the QA checklist from the spec**

Record the actual result for each, and do not mark the task complete while any line fails:

- [ ] Cold load, Fast 3G throttle: total transfer for a full scroll **under 4 MB** (read the DevTools Network total)
- [ ] Every project video plays, loops, pauses off-screen
- [ ] Language toggle switches all copy both directions; no `null` or `undefined` visible
- [ ] Language choice survives reload
- [ ] `prefers-reduced-motion: reduce`: no loader, no pinning, page fully readable
- [ ] Keyboard-only traversal reaches every link and control with a visible focus ring
- [ ] 375 px and 1440 px: no horizontal overflow
- [ ] CV PDF downloads
- [ ] All external links resolve — all nine in `docs/legacy/external-links.md`
- [ ] No console errors or warnings

- [ ] **Step 4: Write `README.md`**

```markdown
# Lucas Antonino — Portfolio

Static site. No build step: what is committed is what is served.

## Editing copy

All text lives in `js/i18n.js` as `copy.en` and `copy.pt`.
English is *also* inline in `index.html`; the two must match exactly.
Run `node scripts/check.mjs` after editing — it fails on drift.

Entries marked `[TODO: ...]` need real details filled in.

## Media

Source GIFs live in `Gifs/`. To regenerate `media/` after changing one:

    bash scripts/build-media.sh

Requires ffmpeg on PATH.

## Checks

    node --test "scripts/**/*.test.mjs"   # checker unit tests
    node scripts/check.mjs                # assets resolve, i18n consistent
```

- [ ] **Step 5: Commit and deploy**

```bash
git add README.md index.html
git commit -m "Retire legacy markup; add README and ship"
git push origin main
```

Then confirm the live GitHub Pages URL renders correctly — Pages is case-sensitive where Windows is not, so a path that works locally can still 404 in production.

---

## Deferred — needs the author, not the implementer

These are tracked so they are not silently lost. None block shipping.

1. **`[TODO:]` markers in `js/i18n.js`** — team size and dates for Steam Veins, current status of MidNight Memories, script scale for KuroNeko, role scope for Dino Girls. The site ships with the markers visible; they should be filled or the sentences cut.
2. **Repository weight** — 349 MB of GIF remains in git history. Reclaiming it needs `git filter-repo` and a force-push. Out of scope by decision.
3. **Dino Girls has no media.** If a clip becomes available, add it to `CLIPS` in `build-media.sh` and give the section a `.shot`; the pinning code already handles it.
