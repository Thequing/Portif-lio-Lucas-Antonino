# Arcade redesign — design spec

Date: 2026-09-17. Supersedes the visual system in
`2026-08-11-portfolio-experience-design.md`; content, clips, i18n, payload
budgets and the no-build-step constraint carry over unchanged.

## Goal

The portfolio is opened from a QR code at the Brasil Game Show 2026 booth by
recruiters and other developers. In three seconds it must say "this person
makes games" and "this person is a systems programmer", and the shipped title
must be the first thing seen. The current site reads as a generic dark
template: near-black plus one accent, tracked ALL-CAPS mono eyebrows, `01 /`
numbering, `A · B · C` status strings, fade-slide-up on every section.

Direction (approved): **the site is a game's front-end.** Title screen, stage
select, source view, player profile, continue screen, bonus stage. Boldness is
spent on the title screen; everything after it is quiet and disciplined.

## Identity tokens

### Colour

| Token | Value | Role |
|---|---|---|
| `--cabinet` | `#000000` on the title screen and the continue screen; `#0f0e12` elsewhere | Black only where the "screen" is off. Body is warm-dark, not blue-tinted. |
| `--phosphor` | `#f2ead7` | All primary text. Warm CRT white, never pure white. |
| `--dim` | `#9b917c` | Secondary text. ≥ 4.5:1 on both cabinet values. |
| `--coin` | `#ffd23f` | Every interactive element: Press start, buttons, links, focus ring, the active HUD segment, the chest latch. One colour means "you can press this". Never used for anything non-interactive. |
| `--stage` | per stage, below | Stamp text, readout digits, the section's top rule and background tint. Not used for links. |

Stage colours: Steam Veins `#e8452f`, MidNight Memories `#9fb4c4`, Framed
Drift `#b46cff` (its night sky; yellow would collide with `--coin`), Hell's
Kitchen `#ff7a1a`, KuroNeko `#17c3b2`, Dino Girls `#4ade80`.

Each stage section sets `background: color-mix(in oklab, var(--stage) 7%,
var(--cabinet))` and a 1px `--stage` rule along its top edge, so scrolling
reads as changing level. Contrast of `--phosphor` and `--dim` must hold on
every tinted background (checked in QA).

### Type

- **Jersey 20** (Google Fonts, OFL, self-hosted woff2): logo, stage titles,
  HUD numerals, section heads. Condensed bitmap-derived scoreboard face. Never
  set below 28px — it is a pixel face and falls apart small.
- **Atkinson Hyperlegible** 400 and 700 (OFL, self-hosted woff2): body,
  bullets, buttons, HUD labels, stamps.
- **JetBrains Mono** 400 stays, used only inside the code viewer.
- Space Grotesk is removed.

Scale: logo `clamp(4rem, 14vw, 12rem)`; stage title `clamp(2.6rem, 6vw,
5.5rem)`; section head `clamp(2.2rem, 4vw, 3.5rem)`; body `1.0625rem/1.6`,
measure 60–70ch; HUD numerals `2.5rem`; HUD labels and stamps `0.8125rem`
Atkinson, sentence case, no letter-spacing, no all-caps.

### Principles

1. Boldness in one place: the title screen.
2. Every structural device is true. Stage numbers because the stages are a
   sequence. Stamps state only what is real. Readouts show only numbers that
   already appear in the copy.
3. Nothing a game UI would not have: no scanline overlay (the clips carry that
   texture already), no glow, no custom cursor, no marquee, no parallax.

## Page structure

```
┌ HUD (fixed top, 44px) ──────────────────────────────────────┐
│ Lucas Antonino   [■■□□□□] Stage 02 · MidNight Memories  EN PT│
├─────────────────────────────────────────────────────────────┤
│ TITLE SCREEN  100svh, Steam Veins attract video, scrimmed    │
│              LUCAS ANTONINO      Jersey, logo-sized, centred │
│        Gameplay & Systems Programmer + one-line summary      │
│                    ▸ Press start ◂   blinks; scrolls to 01   │
│  bottom-left: 1 shipped · 1 in production · 1 demo at BGS    │
├─────────────────────────────────────────────────────────────┤
│ STAGE 01 … STAGE 06   (anatomy below)                        │
├─────────────────────────────────────────────────────────────┤
│ BONUS STAGE   chest → six art items                          │
├─────────────────────────────────────────────────────────────┤
│ SOURCE   code viewer, max 84ch, tab strip, line numbers      │
├─────────────────────────────────────────────────────────────┤
│ PLAYER   profile: class, "what I do", education, equipped    │
├─────────────────────────────────────────────────────────────┤
│ CONTINUE?   Save contact · Download CV · GitHub/LinkedIn/mail│
│ footer line                                                  │
└─────────────────────────────────────────────────────────────┘
```

Order rationale: shipped game first, bio after. The old Positioning section and
the skills marquee fold into Player. The art gallery survives as the bonus
stage, click-gated.

### HUD bar

Fixed top, 44px tall, `--cabinet` background with a 1px `--dim` bottom rule.
Left: name (Atkinson 700). Centre: six segments, each an `<a href="#stage-n">`
44px wide, 8px tall, that fills with its stage colour once the stage has been
reached, and the current stage's number and name beside it. Right: EN / PT
buttons. Replaces the progress rail. On phones (< 1024px) only the segments
and EN / PT show. Segment state is set by IntersectionObserver in
`js/hud.js`; no GSAP dependency, so the HUD works even if the CDN fails.

### Title screen

Full-viewport. Steam Veins title video behind (existing `steam-veins-title`
clip, lazy, poster fallback), scrim `linear-gradient(180deg, rgba(0,0,0,.35),
rgba(0,0,0,.85))`. Centred logo in Jersey; below it the role and the one-line
summary in Atkinson; below that **Press start** — an `<a href="#stage-1">`
styled in `--coin`, 48px tall tap target, blinking at 1s cycle (opacity
1 → 0.15, step), blink stops on hover and focus, off entirely under
reduced motion. Bottom-left corner: "1 shipped · 1 in production · 1 demo at
BGS 2026" in `--dim`. Pressing Enter anywhere while the title screen is in
view also scrolls to stage 01. The Download CV button leaves the hero; CV is
on the continue screen.

### Stage anatomy

Every stage is `<section class="stage" id="stage-n" style="--stage: …">`
with:

1. **Stamp line** — `Stage 01` in Jersey `1.75rem` `--stage`, then a status
   stamp: a 1px-bordered pill in Atkinson 700 whose colour encodes state:
   - *Cleared* → `--stage` (Steam Veins, KuroNeko)
   - *Now playing* → `--coin` (MidNight Memories: the one you can play at the
     booth, so it gets the interactive colour on purpose)
   - *In progress* → `--dim` (Framed Drift, Hell's Kitchen)
   - *Coming soon* → `--dim` (Dino Girls)
   followed by the credit string (studio, year, team, engine) in `--dim`.
2. **Title** — Jersey.
3. **Lede** — Atkinson, `--phosphor`.
4. **Bullets** — Atkinson, `--dim`, marker is a 6×6 `--stage` square.
5. **Links** — `--coin`, underlined 1px, Atkinson 700.
6. **Readout strip** — a row of label/value pairs. Value in Jersey `2.5rem`
   `--stage`, label beneath in Atkinson `0.8125rem` `--dim`. Only measured
   numbers from the copy.

| # | Project | Clip side | Stamp | Readouts |
|---|---|---|---|---|
| 01 | Steam Veins | left, 2 clips stacked | Cleared · Steam, Aug 2025, Kimu Studios | Role: Enemy combat · Audio: FMOD |
| 02 | MidNight Memories | right, 2 clips stacked | Now playing · BGS 2026 booth, two-person team, code lead | Tests: 103 · Demo: 10–12 min · Boss: 1 |
| 03 | Framed Drift | left | In progress · Solo, Unity 6 | Tests: 135 · Races: 10,000 / 0.06 s · Parity: 0.06 % |
| 04 | Hell's Kitchen | right | In progress · Independent team, Unity 6 | Rooms: 16 · Damage types: 4 · Tower tiers: 4 |
| 05 | KuroNeko | left | Cleared · Solo | Commands: 10 · Engine deps: 0 |
| 06 | Dino Girls | locked tile, no clip | Coming soon · Kimu Studios, gameplay programmer | none |

Layout ≥ 1024px: two columns, `1.2fr 1fr`, clip column on the side given
above; alternating sides so six panels do not read as one repeated card.
Two-clip stages stack their clips with `max-height: 38vh` each so the pinned
panel fits a 1440×900 viewport. Below 1024px: single column, clip above copy,
no pin. Clips keep the existing lazy-promote, 720/1280 selection, and the
tap-to-play badge when autoplay is refused; the badge is restyled in `--coin`.

Dino Girls: the clip slot holds a locked tile — a `--cabinet` panel with a 1px
`--dim` border and a Jersey `?` at `8rem` in `--dim` — beside the normal copy
and the Steam link. Honest about having no footage and on-theme.

### Bonus stage — the chest

Section head *Bonus stage*, one line of copy ("Art and assets made alongside
the code."), then a closed chest centred: inline SVG, chunky 1-bit pixel
outline in `--phosphor`, body in `--cabinet`, latch in `--coin`. 160px wide
on desktop, 120px on phones. It is a `<button aria-expanded="false"
aria-controls="loot">`.

On click:

1. Lid rotates open from its back hinge, 0.35s, `power3.out`.
2. Six item tiles pop out one after another, 60ms apart: each launches
   upward on a short arc (`y: -120 → 0`, slight `x` spread, `back.out`) and
   lands in a grid beneath the chest; a `--coin` flash (a 4-point star SVG,
   scale 0 → 1 → 0 over 0.3s) marks each landing.
3. The chest stays open. Tiles are focusable buttons; activating one opens a
   lightbox (`<dialog>`) with the full-size image, closed by Esc, the close
   button, or a tap on the backdrop. Focus returns to the tile.

Items in order: `ShrineWithSnow.png`, `Scene1_Street.png`,
`Scene2_Street.png`, `Est%C3%A1tua2.0.png`, `Kunai_Explosion-Sheet.gif`,
`DracularaWave-Sheet.gif`. The GIF sheets animate inside their tiles once
revealed.

Loading: the six `<img>` carry `data-src`; `js/chest.js` sets `src` only
when the chest opens, so the ~1.1MB never reaches a phone that never clicks.
Keyboard: Enter/Space opens. Reduced motion: lid opens with a cut, tiles
appear in place. No JS: the `.js` class is absent, CSS shows the grid open
with `src` fallbacks provided by `<noscript>`.

### Source

Section head *Source*. Two code viewers, each `max-width: 84ch`, with a tab
strip naming the file (`EnemyBase.cs`, `DriftScorer.cs`) and a one-line
caption beneath the tab, line numbers in a gutter (`counter-increment` on
`.line`), JetBrains Mono `0.8rem/1.7`. Static; no typing animation. "More on
GitHub" link in `--coin`.

### Player

Section head *Player*. A profile panel (1px `--dim` border, no radius):

- Class line: "Gameplay & Systems Programmer".
- "What I do" paragraph (existing `positioning.body` copy).
- Education, three lines (existing `bg.*` copy).
- **Equipped** row: static chips — Unity, Unreal Engine 5, C#, C++,
  Blueprints, FMOD, URP, NUnit — Atkinson 700, 1px `--dim` border, no
  animation. Replaces the marquee.

### Continue?

Section head *Continue?* in Jersey; copy line "Open to gameplay and systems
programming roles. Find me at BGS 2026." Buttons: **Save contact** (solid
`--coin` on `--cabinet` text, primary) and **Download CV** (1px `--coin`
outline). Links row: GitHub, LinkedIn, email. Footer line in `--dim`: "Built
by hand · 2026". Background `#000000`.

## Motion

- **One orchestrated moment — boot.** The loader is a black frame with a
  single blinking underscore in Jersey, held until the hero video can play or
  0.8s, whichever comes first, then a hard cut to the title screen. No
  0 → 100 counter, no per-letter reveal.
- **Stages, ≥ 1024px:** GSAP pin + scrub kept (user-driven). Clip enters with a
  hard horizontal wipe (`clip-path: inset(0 100% 0 0)` → `inset(0)`, `steps`
  easing not used — linear over the first 40% of the scrub); copy cuts in in
  two steps: stamp + title at 30%, everything else at 50%. Pin length `+=100%`.
- **Removed:** generic `[data-reveal]` fades, marquee, cursor ring, parallax
  stills, code typing.
- **Chest:** as above. **Press start blink:** CSS `@keyframes`, `steps(1)`.
- `prefers-reduced-motion: reduce`: no blink, no pin, no wipes, chest cuts
  open, loader removed immediately. Clips get native `controls` as today.
- GSAP unavailable (CDN failed): page is static and complete; HUD, chest and
  lightbox work without it (chest falls back to a CSS transition).

## Files

| Path | Change |
|---|---|
| `index.html` | Rewritten to the structure above. |
| `css/base.css` | Tokens, fonts, type scale, focus ring. |
| `css/layout.css` | HUD, title screen, stage grid, bonus/source/player/continue layout. |
| `css/components.css` | Stamps, readouts, buttons, chips, chest, tiles, lightbox, code viewer, play badge. |
| `js/main.js` | Boot: i18n, media, hud, chest; GSAP-gated: loader, scroll. |
| `js/scroll.js` | Stage pin/wipe only. |
| `js/hud.js` | New. Segment fill + current stage via IntersectionObserver. |
| `js/chest.js` | New. Open, pop-out, image promotion, lightbox. |
| `js/cursor.js` | Deleted. |
| `js/i18n.js` | Keys added: `hud.*`, `title.*`, `stamp.*`, `readout.*`, `bonus.*`, `source.*`, `player.*`, `continue.*`; removed: `hero.scroll`, `craft.*`, `bg.heading`, `contact.*`, marquee has none. Every `*.status` string is split into stamp key + credit key. |
| `media/font/` | Add `jersey-20-400.woff2`, `atkinson-hyperlegible-400.woff2`, `atkinson-hyperlegible-700.woff2`; remove Space Grotesk; update `OFL.txt`. |
| `media/og.png` | New, 1200×630, referenced by `<meta property="og:image">`, `og:title`, `og:description`, `twitter:card`. |
| `docs/booth-card.pdf` | New, A6, printable, QR to the live URL. |
| `scripts/check.mjs` | Unchanged; must pass. Its i18n comparison treats inline markup as the English source, so `&` is written literally in text nodes. |
| `README.md` | Update sections on fonts, structure, chest gating, canvas pieces. |

## Payload

Phone budget 4MB, desktop 6.5MB, unchanged. Fonts: Jersey 20 (~25KB) +
Atkinson ×2 (~40KB) − Space Grotesk ×2 (~40KB) ≈ +25KB. Gallery images are
click-gated and excluded from the cold-scroll measurement. `og.png` is not
loaded by the page. Both budgets are re-measured after the build.

## Testing

- `node scripts/check.mjs` and `node --test "scripts/**/*.test.mjs"` green.
- Headless pass (puppeteer-core, Chrome, `--autoplay-policy=no-user-gesture-required`)
  at 1440×900, 1280×720 and 390×844, EN and PT: no horizontal overflow, no
  4xx, every clip playing after scroll, pinned panels fit the viewport, HUD
  segments fill in order, Press start scrolls to stage 01, chest opens and
  reveals six tiles with images loaded only after the click, lightbox opens
  and closes with focus returned, EN/PT swap leaves no untranslated key.
- Autoplay-refused path (play() overridden to reject): every clip shows the
  coin play badge and a click starts it.
- Reduced-motion path: no pin, no blink, chest opens, page complete.
- Contrast: `--phosphor` and `--dim` against `#000`, `#0f0e12` and each
  stage-tinted background ≥ 4.5:1; `--coin` on `--cabinet` for buttons ≥ 4.5:1;
  `--cabinet` text on `--coin` ≥ 4.5:1.
- Payload measured on a cold full scroll for phone and desktop.

## Canvas pieces

Produced with the canvas-design skill after the site, so they share the
tokens and fonts:

1. **`media/og.png`** 1200×630 — the share card shown when the URL is posted
   on LinkedIn, WhatsApp, Discord. Same identity as the title screen: name in
   Jersey, role line, the six stage segments in their colours. No screenshot
   of a game (the clips are not Lucas's art to trade on in a card).
2. **`docs/booth-card.pdf`** A6 (105×148mm), print-ready with 3mm bleed —
   name, role, QR to `https://thequing.github.io/Portif-lio-Lucas-Antonino/`,
   "Find me at BGS 2026". QR generated with a pure-Python library in the
   scratchpad; if it cannot be installed, the PDF ships with a marked QR slot
   and the gap is reported.

## Out of scope

- The CV PDF content (still March 2026; Lucas owns it).
- Google Drive link verification.
- Any new copy beyond stamps, readout labels, and section heads; the project
  descriptions are unchanged.
