# Arcade Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio's visual system as a game front-end (title screen → stages → bonus chest → source → player → continue) with a fixed HUD, keeping every clip, both languages and the payload budgets.

**Architecture:** Static site, no build step. `index.html` is the English source of truth and `js/i18n.js` mirrors it (the checker fails on drift). CSS is split by responsibility (tokens / layout / components). JS is ES modules: `main.js` boots the always-on modules (`i18n`, `media`, `hud`, `chest`) and then, only if GSAP arrived from the CDN, the loader and stage pins in `scroll.js`.

**Tech Stack:** HTML, CSS, vanilla ES modules, GSAP 3 + ScrollTrigger from jsdelivr, self-hosted woff2 fonts, Node 24 for checks, puppeteer-core + Chrome in the scratchpad for headless QA, Python (Pillow, reportlab, qrcode) for the canvas pieces.

**Spec:** `docs/superpowers/specs/2026-09-17-arcade-redesign-design.md`

## Global Constraints

- No build step: what is committed is what is served (GitHub Pages).
- Inline English in `index.html` must match `copy.en` in `js/i18n.js` exactly; `node scripts/check.mjs` fails on drift. Write `&` literally in text nodes, not `&amp;`.
- Every local `src`/`href`/`poster` must resolve; the checker verifies.
- Payload on a cold full scroll: phone (≤1023px, 720 set) ≤ 4 MB; desktop (1280 set) ≤ 6.5 MB. Bonus-stage images are click-gated and excluded.
- Tokens exactly as the spec: `--cabinet` `#000000` / `#0f0e12`, `--phosphor` `#f2ead7`, `--dim` `#9b917c`, `--coin` `#ffd23f`; stage colours SV `#e8452f`, MM `#9fb4c4`, FD `#b46cff`, HK `#ff7a1a`, KN `#17c3b2`, DG `#4ade80`.
- Fonts: Jersey 20 (display, never < 28px), Atkinson Hyperlegible 400/700 (body), JetBrains Mono 400 (code viewer only). Space Grotesk removed.
- `--coin` only on interactive elements. Stage colour never on links.
- `prefers-reduced-motion: reduce`: no blink, no pin, no wipes, chest cuts open, loader removed immediately.
- GSAP missing: page complete and static; HUD, chest, lightbox still work.
- Touch targets ≥ 44px. Contrast ≥ 4.5:1 for all text pairs listed in the spec.
- Headless QA runs from the session scratchpad with `puppeteer-core` and `C:/Program Files/Google/Chrome/Application/chrome.exe`, `--autoplay-policy=no-user-gesture-required`, site served by `python -m http.server 8765` from the repo root.

---

### Task 1: Fonts

**Files:**
- Create: `media/font/jersey-20-400.woff2`, `media/font/atkinson-hyperlegible-400.woff2`, `media/font/atkinson-hyperlegible-700.woff2`
- Delete: `media/font/space-grotesk-400.woff2`, `media/font/space-grotesk-700.woff2`
- Modify: `media/font/OFL.txt`

**Interfaces:**
- Produces: the three woff2 paths above, referenced by `css/base.css` in Task 3.

- [ ] **Step 1: Fetch woff2 from the Google Fonts CSS API with a modern UA (latin subset)**

Run from the scratchpad:

```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
curl -sA "$UA" "https://fonts.googleapis.com/css2?family=Jersey+20&family=Atkinson+Hyperlegible:wght@400;700&display=swap" -o fonts.css
grep -o "https://fonts.gstatic.com[^)]*" fonts.css
```

Pick the latin (not latin-ext) URL for each of the three faces, `curl -o` each into `media/font/` with the names above.

- [ ] **Step 2: Verify they are woff2 and sized as expected**

Run: `ls -l media/font/*.woff2 && head -c 4 media/font/jersey-20-400.woff2 | od -c`
Expected: three new files, magic bytes `w O F 2`, each < 80 KB.

- [ ] **Step 3: Remove Space Grotesk and update OFL.txt**

`git rm media/font/space-grotesk-*.woff2`. Replace the font names in `OFL.txt`'s copyright lines with: "Jersey 20 © 2023 The Jersey Project Authors (https://github.com/scfried/soft-type-jersey)"; "Atkinson Hyperlegible © 2020 Braille Institute of America"; "JetBrains Mono © 2020 The JetBrains Mono Project Authors". Keep the OFL body.

- [ ] **Step 4: Commit**

```bash
git add media/font && git commit -m "Swap Space Grotesk for Jersey 20 and Atkinson Hyperlegible"
```

---

### Task 2: index.html and i18n dictionary

**Files:**
- Modify: `index.html` (full rewrite), `js/i18n.js` (both locales)
- Test: `node scripts/check.mjs`

**Interfaces:**
- Produces the DOM every later task binds to:
  - `#hud` with `.hud-name`, `.hud-stages > a.hud-seg[href="#stage-n"][data-stage="n"]`, `.hud-current`, `.lang button[data-lang]`
  - `#title` with `video[data-hero]`, `h1.logo`, `a#press-start[href="#stage-1"]`
  - `section.stage#stage-1..6[style="--stage: …"]` each with `.stamp`, `.stamp-state[data-state="cleared|playing|progress|soon"]`, `.stamp-credit`, `h2`, `.lede`, `ul`, `.links`, `.readouts > .readout > .readout-value + .readout-label`, and either `.clips > figure.shot > video[data-slug]` or `.locked` (stage 6)
  - `#bonus` with `button#chest[aria-expanded="false"][aria-controls="loot"]` containing the inline SVG (`#chest-lid` group), `ul#loot > li > button.tile > img[data-src][alt]`, `dialog#lightbox > img + button.close`
  - `#source` with two `.viewer > .viewer-tab + .viewer-caption + pre.code > code > span.line`
  - `#player` with `.profile`, `.equipped > span`
  - `#continue` with `.btn.btn-solid[href$=".vcf"]`, `.btn[href$=".pdf"]`, `.links`, `footer`
  - `#loader` with `.loader-caret`

- [ ] **Step 1: Define the i18n key set**

Replace `copy.en` / `copy.pt` with exactly these keys (project copy values are copied verbatim from the current dictionary; only new keys are listed with values):

```
hud.stage              'Stage'
title.role             (= old hero.role)
title.summary          (= old hero.summary)
title.start            'Press start'
title.tally            '1 shipped · 1 in production · 1 demo at BGS 2026'
stamp.cleared          'Cleared'
stamp.playing          'Now playing'
stamp.progress         'In progress'
stamp.soon             'Coming soon'
sv.credit              'Steam, Aug 2025, Kimu Studios'
mm.credit              'BGS 2026 booth, two-person team, code lead'
fd.credit              'Solo, Unity 6'
hk.credit              'Independent team, Unity 6'
kn.credit              'Solo'
dg.credit              'Kimu Studios, gameplay programmer'
sv.title/lede/b1..b4, mm.title/lede/b1..b5, fd.title/lede/b1..b5,
hk.title/lede/b1..b5, kn.title/lede/b1..b3, dg.title/lede/b1..b2   (unchanged)
ro.role 'Role'  ro.audio 'Audio'  ro.tests 'Tests'  ro.demo 'Demo'  ro.boss 'Boss'
ro.races 'Races'  ro.parity 'Parity'  ro.rooms 'Rooms'  ro.dmg 'Damage types'
ro.tiers 'Tower tiers'  ro.cmds 'Commands'  ro.deps 'Engine deps'
ro.sv.role 'Enemy combat'  ro.sv.audio 'FMOD'  ro.mm.demo '10–12 min'
ro.fd.races '10,000 / 0.06 s'  ro.fd.parity '0.06 %'
bonus.heading 'Bonus stage'  bonus.body 'Art and assets made alongside the code.'
bonus.open 'Open the chest'  bonus.close 'Close'
source.heading 'Source'  source.caption (= old code.caption)  source.caption2 (= old code.caption2)  source.link 'More on GitHub'
player.heading 'Player'  player.class (= old hero.role)  player.body (= old positioning.body)
player.degree/gamedesign/database (= old bg.*)  player.equipped 'Equipped'
continue.heading 'Continue?'  continue.body (= old contact.body)
continue.vcard 'Save contact'  continue.cv 'Download CV'  continue.footer 'Built by hand · 2026'
nav.steam 'Steam page'  nav.demo 'Demo'  nav.project 'View project'
lightbox.close 'Close'
```

Portuguese for new keys: `hud.stage` 'Fase'; `title.start` 'Aperte start'; `title.tally` '1 lançado · 1 em produção · 1 demo na BGS 2026'; stamps 'Concluída' / 'Jogando agora' / 'Em andamento' / 'Em breve'; credits 'Steam, ago 2025, Kimu Studios' / 'Estande da BGS 2026, dupla, lidero o código' / 'Solo, Unity 6' / 'Equipe independente, Unity 6' / 'Solo' / 'Kimu Studios, programador de gameplay'; readout labels 'Papel' 'Áudio' 'Testes' 'Demo' 'Chefe' 'Corridas' 'Paridade' 'Salas' 'Tipos de dano' 'Níveis de torre' 'Comandos' 'Deps. da engine'; readout values 'Combate dos inimigos' 'FMOD' '10–12 min' '10.000 / 0,06 s' '0,06 %'; `bonus.heading` 'Fase bônus', `bonus.body` 'Arte e assets feitos junto com o código.', `bonus.open` 'Abrir o baú', `bonus.close` 'Fechar'; `source.heading` 'Código', `source.link` 'Mais no GitHub'; `player.heading` 'Jogador', `player.equipped` 'Equipado'; `continue.heading` 'Continuar?', `continue.vcard` 'Salvar contato', `continue.cv` 'Baixar CV', `continue.footer` 'Feito à mão · 2026'; `lightbox.close` 'Fechar'.

Numeric readout values (103, 1, 135, 16, 4, 4, 10, 0) are not translated and carry no `data-i18n`.

- [ ] **Step 2: Rewrite index.html to the spec structure**

Head: keep the `js` class script, favicon, viewport; add `<meta property="og:title|og:description|og:image|og:url">` and `<meta name="twitter:card" content="summary_large_image">` (og:image → `media/og.png`, produced in Task 9; the checker will flag it missing until then, so add a placeholder 1×1 `media/og.png` now via Python Pillow and overwrite in Task 9); preload `jersey-20-400.woff2`; the three stylesheets.

Body order: `#loader` → `#hud` → `<main>` with `#title`, `#stage-1`…`#stage-6`, `#bonus`, `#source`, `#player`, `#continue` → GSAP scripts (gsap + ScrollTrigger only; SplitText is no longer used) → `js/main.js`.

Stage markup (stage 1 shown; others follow the table in the spec, clip side handled by CSS `:nth-of-type`):

```html
<section class="stage" id="stage-1" style="--stage:#e8452f" aria-labelledby="t-sv">
  <div class="stage-inner">
    <div class="clips">
      <figure class="shot"> <video data-slug="steam-veins-combat" poster="media/poster/steam-veins-combat.webp" preload="none" muted loop playsinline aria-label="…"><source data-src="media/video/steam-veins-combat-1280.mp4" type="video/mp4"></video><noscript><img src="media/poster/steam-veins-combat.webp" alt="Steam Veins combat"></noscript></figure>
      <figure class="shot"> …chapel… </figure>
    </div>
    <div class="copy">
      <p class="stamp"><span class="stamp-num"><span data-i18n="hud.stage">Stage</span> 01</span> <span class="stamp-state" data-state="cleared" data-i18n="stamp.cleared">Cleared</span> <span class="stamp-credit" data-i18n="sv.credit">Steam, Aug 2025, Kimu Studios</span></p>
      <h2 id="t-sv" data-i18n="sv.title">Steam Veins</h2>
      <p class="lede" data-i18n="sv.lede">…</p>
      <ul><li data-i18n="sv.b1">…</li>…</ul>
      <p class="links"><a href="https://store.steampowered.com/app/3201780/Steam_Veins/" target="_blank" rel="noopener" data-i18n="nav.steam">Steam page</a><a href="https://drive.google.com/file/d/1FfMGEfl98RtVbwcl-iNgrTfCKKT5UiSN/view?usp=sharing" target="_blank" rel="noopener" data-i18n="nav.demo">Demo</a></p>
      <dl class="readouts">
        <div class="readout"><dd class="readout-value" data-i18n="ro.sv.role">Enemy combat</dd><dt class="readout-label" data-i18n="ro.role">Role</dt></div>
        <div class="readout"><dd class="readout-value" data-i18n="ro.sv.audio">FMOD</dd><dt class="readout-label" data-i18n="ro.audio">Audio</dt></div>
      </dl>
    </div>
  </div>
</section>
```

Stage 6 replaces `.clips` with `<div class="locked" aria-hidden="true"><span>?</span></div>`.

Bonus stage:

```html
<section id="bonus" aria-labelledby="t-bonus">
  <h2 id="t-bonus" data-i18n="bonus.heading">Bonus stage</h2>
  <p class="lede" data-i18n="bonus.body">Art and assets made alongside the code.</p>
  <button id="chest" type="button" aria-expanded="false" aria-controls="loot">
    <span class="visually-hidden" data-i18n="bonus.open">Open the chest</span>
    <svg viewBox="0 0 64 48" aria-hidden="true" shape-rendering="crispEdges"> …pixel chest: g#chest-body, g#chest-lid, rect.latch… </svg>
  </button>
  <ul id="loot" hidden>
    <li><button type="button" class="tile"><img data-src="Imagens/ShrineWithSnow.png" alt="Painted shrine background under falling snow"><noscript><img src="Imagens/ShrineWithSnow.png" alt=""></noscript></button></li>
    … five more, in spec order …
  </ul>
  <dialog id="lightbox"><img alt=""><button type="button" class="close" data-i18n="lightbox.close">Close</button></dialog>
</section>
```

The chest SVG is drawn on a 64×48 grid with 4px cells: body rows 20–44, lid rows 8–20 (an arc of stepped rects), latch 4×6 at (30,22) with `fill="var(--coin)"`, outlines `fill="var(--phosphor)"`, body fill `var(--cabinet)`. `#chest-lid` has `transform-origin: 8px 20px` (back hinge).

Source viewers keep the existing `.line` spans verbatim, wrapped:

```html
<div class="viewer">
  <p class="viewer-tab">EnemyBase.cs</p>
  <p class="viewer-caption" data-i18n="source.caption">…</p>
  <pre class="code"><code>…existing lines…</code></pre>
</div>
```

- [ ] **Step 3: Run the checker**

Run: `node scripts/check.mjs && node --test "scripts/**/*.test.mjs"`
Expected: `ok` with zero errors (assets resolve, en/pt key sets equal, inline English matches).

- [ ] **Step 4: Commit**

```bash
git add index.html js/i18n.js media/og.png && git commit -m "Restructure the page as title screen, stages, bonus, source, player, continue"
```

---

### Task 3: CSS — tokens, layout, components

**Files:**
- Modify: `css/base.css`, `css/layout.css`, `css/components.css` (full rewrites)

**Interfaces:**
- Consumes: DOM from Task 2, fonts from Task 1.
- Produces: class contracts used by JS — `.hud-seg.is-reached`, `.hud-seg.is-current`, `#chest.is-open`, `#loot li.is-landed`, `.shot[data-blocked]`, `html.js`, `html.no-gsap`.

- [ ] **Step 1: base.css** — `@font-face` ×4; `:root` tokens from Global Constraints plus `--stage: var(--dim)` default, type scale vars from the spec, `--gutter: clamp(1rem, 5vw, 5rem)`; reset; `body { background: #0f0e12; color: var(--phosphor); font: 1.0625rem/1.6 'Atkinson Hyperlegible', system-ui, sans-serif; }`; `h1, h2, .display { font-family: 'Jersey 20', 'Atkinson Hyperlegible', sans-serif; font-weight: 400; line-height: 0.95; letter-spacing: 0; }`; `:focus-visible { outline: 2px solid var(--coin); outline-offset: 3px; }`; `.visually-hidden`; `img, video { max-width: 100%; display: block; }`.

- [ ] **Step 2: layout.css** — `#hud` fixed top 44px grid `auto 1fr auto`, `.hud-stages` centred flex of 6 × 44×8px segments (`a` with padding to make 44px hit area, inner bar 8px), phone: hide `.hud-name` and `.hud-current`. `#title` `min-height: 100svh; display: grid; place-content: center; text-align: center; background: #000;` with `.hero-bg` absolute cover and `::after` scrim; `.tally` absolute bottom-left. `.stage { padding: clamp(4rem, 10vh, 8rem) var(--gutter); background: color-mix(in oklab, var(--stage) 7%, #0f0e12); border-top: 1px solid var(--stage); }`, `.stage-inner { min-height: calc(100svh - 44px); display: grid; align-items: center; gap: clamp(2rem, 5vw, 5rem); }`, `@media (min-width: 1024px) { .stage-inner { grid-template-columns: 1.2fr 1fr } .stage:nth-of-type(even) .clips { order: 2 } }`; `.clips { display: grid; gap: .75rem } .clips .shot video { max-height: 38vh; object-fit: cover }`. `#bonus`, `#source`, `#player`, `#continue`: `padding: clamp(5rem, 12vh, 9rem) var(--gutter)`, `#continue { background: #000 }`. `.copy > * + * { margin-top: 1rem }`; `h2 + .lede { margin-top: 1.25rem }` — this is the fix for the heading/paragraph collision.

- [ ] **Step 3: components.css** — stamps (`.stamp-num` Jersey 1.75rem `--stage`; `.stamp-state` pill 1px border, colour by `[data-state]`: cleared → `--stage`, playing → `--coin`, progress/soon → `--dim`), bullets (6×6 `--stage` square), `.links a` (`--coin`, 1px underline), `.readouts` (flex wrap, `.readout-value` Jersey 2.5rem `--stage`, `.readout-label` .8125rem `--dim`), `.locked` (aspect 16/9, 1px `--dim` border, Jersey `?` 8rem), `.btn`/`.btn-solid`, `.equipped span` chips, `#press-start` (`--coin`, 48px tall, `@keyframes blink { 50% { opacity: .15 } }` 1s `steps(1)`, paused on hover/focus), `#loader` (fixed, `#000`, `.loader-caret` Jersey blinking `_`), `#chest` (160px / 120px, transparent, `#chest-lid { transform-origin: 8px 20px; transition: transform .35s }`, `.is-open #chest-lid { transform: rotate(-100deg) }`), `#loot` grid `repeat(auto-fit, minmax(160px, 1fr))`, `.tile` (1px `--dim` border, `img { aspect-ratio: 4/3; object-fit: cover }`), `#lightbox` (`::backdrop` rgba(0,0,0,.85), img `max-height: 85vh`), `.viewer` (`max-width: 84ch`, `.viewer-tab` Atkinson 700 on a 1px-bordered tab, `.code` JetBrains Mono .8rem/1.7 with `counter-reset: line` and `.line::before { counter-increment: line; content: counter(line); width: 3ch; color: var(--dim) }`), `.shot[data-blocked] .play span` restyled `--coin` ring. `@media (prefers-reduced-motion: reduce)` disables blink and lid transition. `html.no-gsap .stage .clips, html.no-gsap .copy { visibility: visible }` (guard against GSAP `from` states).

- [ ] **Step 4: Visual check**

Run the screenshot script from the scratchpad (`node shots.mjs http://localhost:8765/ desk 1440 900`) and read `desk-00.png`, a stage frame, and the bonus/source frames. Expected: fonts loaded (Jersey logo visible), stage tints visible, no heading/paragraph collision, no horizontal overflow (`document.documentElement.scrollWidth === innerWidth`).

- [ ] **Step 5: Commit**

```bash
git add css && git commit -m "Restyle with cabinet/phosphor/coin tokens, Jersey 20 and Atkinson"
```

---

### Task 4: HUD module

**Files:**
- Create: `js/hud.js`
- Modify: `js/main.js` (import + call)

**Interfaces:**
- Produces: `export function initHud()`; toggles `.is-reached` and `.is-current` on `.hud-seg`, sets `.hud-current` text to `"<Stage> 0n · <title>"`.

- [ ] **Step 1: Write hud.js**

```js
export function initHud() {
  const segs = [...document.querySelectorAll('.hud-seg')];
  const current = document.querySelector('.hud-current');
  const stages = [...document.querySelectorAll('.stage')];
  if (!segs.length || !stages.length) return;

  const label = (i) => {
    const stageWord = document.querySelector('[data-i18n="hud.stage"]')?.textContent || 'Stage';
    const title = stages[i].querySelector('h2')?.textContent || '';
    return `${stageWord} ${String(i + 1).padStart(2, '0')} · ${title}`;
  };

  // A stage is "reached" once its top has crossed the viewport middle; the
  // HUD then keeps it filled on the way back up until the stage above is
  // current again, so the bar behaves like progress, not like a spotlight.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = stages.indexOf(e.target);
      if (e.isIntersecting) {
        segs.forEach((s, j) => {
          s.classList.toggle('is-reached', j <= i);
          s.classList.toggle('is-current', j === i);
        });
        if (current) current.textContent = label(i);
      }
    }
  }, { rootMargin: '-50% 0px -50% 0px' });
  stages.forEach((s) => io.observe(s));

  // Above stage 1 nothing is reached.
  const title = document.getElementById('title');
  if (title) new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { segs.forEach((s) => s.classList.remove('is-reached', 'is-current')); if (current) current.textContent = ''; }
  }, { rootMargin: '-50% 0px -50% 0px' }).observe(title);
}
```

- [ ] **Step 2: Headless assertion** (add to the scratchpad QA script, Task 7 collects them): scroll to `#stage-3` centre → `.hud-seg.is-reached` count === 3 and `.hud-seg[data-stage="3"].is-current` exists; scroll to top → 0 reached.

- [ ] **Step 3: Commit** `git add js/hud.js js/main.js && git commit -m "Add HUD stage bar"`

---

### Task 5: Chest and lightbox

**Files:**
- Create: `js/chest.js`
- Modify: `js/main.js`

**Interfaces:**
- Produces: `export function initChest({ reducedMotion })`. Opens once; promotes `img[data-src]` → `src` on open; lightbox via `<dialog>`.

- [ ] **Step 1: Write chest.js**

```js
export function initChest({ reducedMotion }) {
  const chest = document.getElementById('chest');
  const loot = document.getElementById('loot');
  const box = document.getElementById('lightbox');
  if (!chest || !loot) return;

  function reveal() {
    if (chest.getAttribute('aria-expanded') === 'true') return;
    chest.setAttribute('aria-expanded', 'true');
    chest.classList.add('is-open');
    for (const img of loot.querySelectorAll('img[data-src]')) {
      img.src = img.dataset.src; img.removeAttribute('data-src');
    }
    loot.hidden = false;
    const items = [...loot.children];
    if (reducedMotion || !window.gsap) {
      items.forEach((li) => li.classList.add('is-landed'));
      return;
    }
    window.gsap.from(items, {
      y: -120, x: (i) => (i - items.length / 2) * 18, opacity: 0, scale: 0.6,
      duration: 0.5, ease: 'back.out(1.6)', stagger: 0.06,
      onComplete: () => items.forEach((li) => li.classList.add('is-landed')),
    });
  }
  chest.addEventListener('click', reveal);

  if (box) {
    const img = box.querySelector('img');
    let opener = null;
    for (const tile of loot.querySelectorAll('.tile')) {
      tile.addEventListener('click', () => {
        const src = tile.querySelector('img');
        img.src = src.src; img.alt = src.alt; opener = tile;
        box.showModal();
      });
    }
    box.querySelector('.close')?.addEventListener('click', () => box.close());
    box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
    box.addEventListener('close', () => { opener?.focus(); img.removeAttribute('src'); });
  }
}
```

`.is-landed` triggers the CSS sparkle: `#loot li::after` — a 4-point star (`clip-path: polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)`) in `--coin`, `@keyframes spark { 0%{transform:scale(0)} 50%{transform:scale(1)} 100%{transform:scale(0)} }` .3s, applied on `.is-landed` and disabled under reduced motion.

- [ ] **Step 2: Headless assertion**: before click, `#loot img[src]` count 0 and no `Imagens/` request seen; click `#chest` → `aria-expanded="true"`, six `img[src]`, six 200 responses from `Imagens/`; click first `.tile` → `#lightbox[open]`; press Escape → not open and `document.activeElement` is the tile.

- [ ] **Step 3: Commit** `git add js/chest.js js/main.js && git commit -m "Add the bonus-stage chest with pop-out loot and a lightbox"`

---

### Task 6: Boot, loader and stage pins

**Files:**
- Modify: `js/main.js`, `js/scroll.js`
- Delete: `js/cursor.js`

**Interfaces:**
- Consumes: `initHud`, `initChest`, `initI18n`, `initMedia`.
- Produces: `html.no-gsap` class when the CDN failed; `initScroll()` pins stages ≥1024px.

- [ ] **Step 1: main.js**

```js
import { initI18n } from './i18n.js';
import { initMedia } from './media.js';
import { initHud } from './hud.js';
import { initChest } from './chest.js';
import { initScroll } from './scroll.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ready() { /* poll for gsap + ScrollTrigger, 3s cap — as today, minus SplitText */ }

function runLoader() {
  const loader = document.getElementById('loader');
  const hero = document.querySelector('video[data-hero]');
  const canPlay = new Promise((r) => {
    if (!hero || hero.readyState >= 3) return r();
    hero.addEventListener('canplay', r, { once: true });
    setTimeout(r, 800);
  });
  return canPlay.then(() => loader?.remove()); // hard cut, per spec
}

function pressStart() {
  const start = document.getElementById('press-start');
  const title = document.getElementById('title');
  if (!start || !title) return;
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target !== document.body) return;
    const r = title.getBoundingClientRect();
    if (r.bottom > window.innerHeight * 0.5) start.click();
  });
}

async function boot() {
  initI18n();
  initMedia({ reducedMotion });
  initHud();
  initChest({ reducedMotion });
  pressStart();
  if (reducedMotion) { document.getElementById('loader')?.remove(); return; }
  await ready();
  if (!window.gsap) { document.documentElement.classList.add('no-gsap'); document.getElementById('loader')?.remove(); return; }
  await runLoader();
  initScroll();
}
boot();
```

- [ ] **Step 2: scroll.js** — keep only `pinStages()` inside `ScrollTrigger.matchMedia('(min-width: 1024px)')`: per `.stage` with `.clips`, timeline `scrollTrigger: { trigger: '.stage-inner', start: 'top 44px', end: '+=100%', pin: true, scrub: 0.5, anticipatePin: 1 }`; `tl.fromTo(clips, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.4, ease: 'none' }, 0)`; `tl.from([stamp, h2], { opacity: 0, duration: 0.01 }, 0.3)`; `tl.from(rest, { opacity: 0, duration: 0.01 }, 0.5)`. Stage 6 (no clips) gets the two copy cuts only, no pin. Delete everything else (rail, accent crossfade, reveals, marquee, typeCode, parallax). `git rm js/cursor.js`.

- [ ] **Step 3: Headless assertions**: at 1440×900 after scrolling 1.1 viewports into stage 1, `.stage-inner` bounding box height ≤ 856 and the two clips both fully inside the viewport; with `prefers-reduced-motion` emulated, no `pin-spacer` elements exist and `#loader` is gone within 100 ms; with the GSAP requests aborted, `html.no-gsap` is set, all `.copy` visible, HUD and chest still work.

- [ ] **Step 4: Commit** `git add -A js && git commit -m "Boot as a title screen; pin stages with a hard wipe; drop cursor, marquee, reveals"`

---

### Task 7: Headless QA suite, contrast and payload

**Files:**
- Create (scratchpad, not committed): `qa.mjs`

- [ ] **Step 1: Write qa.mjs** covering, for each of `{1440×900, 1280×720, 390×844} × {en, pt}`: no 4xx, `scrollWidth === innerWidth` at every step of a full stepped scroll, every `video[data-slug]` `!paused` after its section was scrolled past, HUD assertions (Task 4), chest and lightbox assertions (Task 5), pin/reduced-motion/no-gsap assertions (Task 6), `#press-start` click lands `#stage-1` top within 44±2 px, and after `localStorage.lang='pt'` + reload no `[data-i18n]` still holds its English text where `copy.pt[key] !== copy.en[key]`. Autoplay-refused run: `evaluateOnNewDocument` overriding `HTMLMediaElement.prototype.play` to reject until `window.__allow = true`; assert every `.shot` has `[data-blocked]` and a `.play`, then set the flag, click one, assert it plays. Payload: sum `content-length` of `localhost` responses on the cold stepped scroll without opening the chest; print phone and desktop totals.

- [ ] **Step 2: Contrast script** (Python, no deps): compute WCAG ratio for `--phosphor` and `--dim` on `#000`, `#0f0e12` and on each `color-mix(oklab, stage 7%, #0f0e12)` (approximate the mix in sRGB linear space — within 0.1 of the browser value, adequate for a ≥ 4.5 gate with margin), plus `--coin` on `#000` and `#000` on `--coin`. All ≥ 4.5 or adjust `--dim` upward and re-run Task 3's screenshot.

- [ ] **Step 3: Run everything**: `node scripts/check.mjs && node --test "scripts/**/*.test.mjs"`, `node qa.mjs`, `python contrast.py`. Fix and re-run until all pass. Record phone/desktop MB.

- [ ] **Step 4: Commit any fixes** with a message naming what QA caught.

---

### Task 8: README

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** Replace the fonts/media paragraphs: list the three faces and their OFL; describe the page order and the class contract (`.stage`, `#hud`, `#chest`); note the chest gating (`Imagens/` loads only on click, excluded from the budgets); update the payload numbers from Task 7; add `media/og.png` and `docs/booth-card.pdf` under a "Canvas pieces" heading with how they were generated (scratchpad scripts, regenerate by hand).

- [ ] **Step 2: Commit** `git add README.md && git commit -m "Document the arcade structure, chest gating and canvas pieces"`

---

### Task 9: OG share card (canvas-design)

**Files:**
- Create: `media/og.png` (overwrites Task 2's placeholder), `docs/canvas/philosophy.md`
- Modify: `index.html` if `og:` meta text changes

- [ ] **Step 1:** Invoke the `canvas-design` skill. Write the philosophy (`docs/canvas/philosophy.md`, 4–6 paragraphs, named movement) grounded in the spec's tokens: cabinet black, phosphor, coin, six stage colours as the only chroma, Jersey 20 as the single display voice.
- [ ] **Step 2:** Render 1200×630 with Pillow (`pip install pillow` in the scratchpad if missing) using the woff2 → the same faces are needed as TTF for Pillow: download the TTFs from the Google Fonts GitHub (`google/fonts` repo, `ofl/jersey20/Jersey20-Regular.ttf`, `ofl/atkinsonhyperlegible/AtkinsonHyperlegible-Regular.ttf`) into the scratchpad, not the repo. Composition: name in Jersey large, role line, six segments in stage colours, `Press start` in coin; ≥ 60 px safe margin; no screenshots.
- [ ] **Step 3:** Read the PNG back, refine once (spacing, alignment, nothing overlapping), save. Verify `node scripts/check.mjs` still passes and the file is < 300 KB.
- [ ] **Step 4: Commit** `git add media/og.png docs/canvas && git commit -m "Add the share card"`

---

### Task 10: Booth QR card (canvas-design)

**Files:**
- Create: `docs/booth-card.pdf`

- [ ] **Step 1:** `pip install qrcode reportlab` in the scratchpad. If either fails, produce the PDF with a 30×30 mm outlined slot labelled "QR" and report it.
- [ ] **Step 2:** A6 with 3 mm bleed (111×154 mm page), same philosophy as Task 9: cabinet black, name in Jersey (register the TTFs with reportlab), role, QR (error correction M, coin modules on black tested to scan — verify by decoding the rendered QR with `pyzbar` if installable; otherwise render QR black-on-phosphor to be safe), "Find me at BGS 2026", the URL in small type.
- [ ] **Step 3:** Read a raster of page 1 back (`pdftoppm` if available, else render the same layout to PNG with Pillow for review), refine once.
- [ ] **Step 4: Commit** `git add docs/booth-card.pdf && git commit -m "Add the printable booth card"`

---

### Task 11: Final verification and handoff

- [ ] **Step 1:** Re-run Task 7's full suite on the final tree; `git status` clean.
- [ ] **Step 2:** Report to Lucas: screenshots of title, one stage, bonus open, continue at desktop and phone; payload numbers; anything left open (CV PDF still March; push to GitHub Pages is his call — ask before pushing).
