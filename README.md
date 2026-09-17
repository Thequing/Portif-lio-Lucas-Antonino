# Lucas Antonino — Portfolio

Static site. No build step: what is committed is what is served.

## Structure

The page is laid out as a game's front-end, in this order:

| Section | id | What it is |
|---|---|---|
| HUD | `#hud` | Fixed 44px bar: name, six stage segments (links, filled as you pass each stage), current stage label, EN/PT. Driven by `js/hud.js` with IntersectionObserver, so it works without GSAP. |
| Title screen | `#title` | Steam Veins attract-mode video, the name as logo, *Press start* (scrolls to stage 1; Enter does the same). |
| Stages 01–06 | `.stage#stage-n` | One per project. Each carries `style="--stage: …"` (its colour), a stamp (`.stamp-state[data-state]` = cleared / playing / progress / soon), copy, links and a readout strip of numbers taken from the copy. Desktop pins each stage and wipes the clip in (`js/scroll.js`); phones scroll normally. Dino Girls has no footage and shows a locked tile instead. |
| Bonus stage | `#bonus` | A pixel chest (`#chest`, inline SVG). Clicking it pops the six art tiles out of `#loot` and opens a `<dialog>` lightbox on tap. `js/chest.js` sets the images' `src` only on that click, so the 1.1 MB in `Imagens/` never loads for a visitor who does not open it. |
| Source | `#source` | Two code viewers with line numbers. Static. |
| Player | `#player` | Class, bio, education, equipped tools. |
| Continue? | `#continue` | Save contact (vCard), Download CV, links. |

Design tokens live in `css/base.css`: `--cabinet` / `--screen-off` (backgrounds), `--phosphor` (text), `--dim` (secondary), `--coin` (every interactive element and nothing else), `--stage` (per-stage colour). The spec is `docs/superpowers/specs/2026-09-17-arcade-redesign-design.md`.

## Editing copy

All text lives in `js/i18n.js` as `copy.en` and `copy.pt`.
English is *also* inline in `index.html`; the two must match exactly.
Run `node scripts/check.mjs` after editing — it fails on drift.

## Fonts

Self-hosted in `media/font/`, all SIL OFL (see `OFL.txt` there):

- **Jersey 20** — logo, headings, stage numbers, readout values. A bitmap-derived face: one weight, never set below 28px.
- **Atkinson Hyperlegible** 400/700 — everything else.
- **JetBrains Mono** 400 — only inside the code viewers.

## Media

Source clips live in `Gifs/`: the original GIFs (tracked) and raw MP4 screen
captures (git-ignored — they are hundreds of MB each). The clip table in
`scripts/build-media.sh` names the source, the crop and the start/duration
window for each one. To regenerate `media/` after changing a clip:

    bash scripts/build-media.sh

Requires ffmpeg on PATH. If a raw capture is missing locally, ask Lucas for it;
the committed `media/` output is what the site serves either way.

Only MP4 is generated. VP9 WebM measured larger than H.264 for this
material, and because `<source>` order put WebM first it was the file most
browsers actually downloaded — which broke the payload budget for everyone
except Safari. See the comment in `scripts/build-media.sh` before adding it
back.

## Checks

    node --test "scripts/**/*.test.mjs"   # checker unit tests
    node scripts/check.mjs                # assets resolve, i18n consistent

Quote the glob. `node --test scripts/` does not work on Node 24 for Windows —
it bypasses the runner and tries to load `scripts` as a module entry point.

Visual and behavioural QA is a headless Chrome script kept outside the repo
(puppeteer-core against the local Chrome, site served with
`python -m http.server 8765`). It covers desktop and phone in both languages,
the HUD, the chest and lightbox, the pins, reduced motion, a failed GSAP CDN,
and the autoplay-refused path. 97 assertions as of 2026-09-17.

## Payload

Two budgets, because the phone is the path that matters: the site is opened
from a QR code at the BGS booth. The bonus-stage art is excluded from both,
since it only loads on a click.

- Phone (≤1023 px, 720 set): a cold full scroll transfers about 3.0 MB of local
  assets. Budget 4 MB.
- Desktop (1280 set): about 6.6 MB, of which 6.1 MB is the eight 1280 clips.
  Budget 7 MB. (An earlier 6.3 MB figure was a scroll that had not fetched
  every clip in full.)

Plus roughly 100 KB of GSAP from the CDN. None of the clips load until their
stage approaches the viewport. When autoplay is refused (iOS Low Power Mode,
Data Saver) each clip shows a play badge and a tap starts it, so the page never
degrades to a wall of still posters.

## Contact card

`media/lucas-antonino.vcf` is the "Save contact" target. Edit it by hand when
the email, title or links change; it is plain text with CRLF line endings.

## Canvas pieces

- `media/og.png` — the 1200×630 share card (`og:image`). Regenerate with
  `docs/canvas/og.py`.
- `docs/booth-card.pdf` — A6 printable booth card with a QR to the live site.
  Regenerate with `docs/canvas/booth-card.py`.

Both scripts need Python with Pillow (the card also needs reportlab and
qrcode) and the TTF versions of Jersey 20 and Atkinson Hyperlegible, which
they download from the google/fonts repository into a temp folder. The design
philosophy behind them is `docs/canvas/philosophy.md`.
