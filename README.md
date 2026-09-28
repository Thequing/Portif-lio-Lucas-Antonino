# Lucas Antonino — Portfolio

Static site. No build step: what is committed is what is served.

## Structure

The page is laid out as a game's front-end, in this order:

| Section | id | What it is |
|---|---|---|
| HUD | `#hud` | Fixed 44px bar: name, six stage segments (links, filled as you pass each stage), current stage label, EN/PT. Driven by `js/hud.js` with IntersectionObserver, so it works without GSAP. |
| Title screen | `#title` | Steam Veins attract-mode video, the name as logo, *Press start* (scrolls to stage 1; Enter does the same). |
| Stages 01–06 | `.stage#stage-n` | One per project. Each carries `style="--stage: …"` (its colour), a stamp (`.stamp-state[data-state]` = cleared / playing / progress / soon), copy, links and a readout strip of numbers taken from the copy. Desktop pins each stage and wipes the clip in (`js/scroll.js`); phones scroll normally. Dino Girls has no public footage and shows its Steam capsule (`media/art/`). Integer readouts tally up on first view (`js/readouts.js`). Every clip is a pause button. On phones, the first visit to each stage flashes a stage card under the HUD (`js/stagecard.js`). |
| The cabinet | `#cabinet` | One shared panel. Each stage's `▸ Try it ◂` button mounts its interaction into it (`js/arcade.js`). See **Stage interactions** below. |
| Bonus stage | `#bonus` | A pixel chest (`#chest`, inline SVG). Clicking it pops the six art tiles out of `#loot` and opens a `<dialog>` lightbox on tap. `js/chest.js` sets the images' `src` only on that click, so the 1.1 MB in `Imagens/` never loads for a visitor who does not open it. |
| Source | `#source` | One code viewer, two file tabs, line numbers. `js/source.js` binds the tabs and highlights C# at load; paste plain code into the markup. Without JS both files show stacked. |
| Player | `#player` | A portrait, then class, bio, education, equipped tools. The portrait is the 64px sprite from `media/me/`; pressing it turns the frame over to the photograph (`js/portrait.js`). The photograph ships as `data-src` and is fetched on the first press, the same bargain the chest makes — a visitor who never presses pays 1.6 KB. |
| Continue? | `#continue` | A 9→0 countdown (any press stops it; at 0 Save contact blinks), KuroNeko (peeks, blinks, pops up, waves), Save contact (vCard), Download CV, Share, links. `js/continue.js`, `js/sprite.js`. A cleared-interaction tally (`n/6`) sits under the heading. |

Design tokens live in `css/base.css`: `--cabinet` / `--screen-off` (backgrounds), `--phosphor` (text), `--dim` (secondary), `--coin` (every interactive element and nothing else), `--stage` (per-stage colour). The spec is `docs/superpowers/specs/2026-09-17-arcade-redesign-design.md`.

## Controls

`js/keys.js`: 1–6 jump to a stage, ← → step through sections, Esc returns to
the title. The Konami code (or five quick taps on the logo) opens the chest.
All in-page jumps go through `goTo()` in `js/nav.js`, which lands pinned
stages part-way into their pin so they arrive fully drawn.

## Analytics

Off by default. To turn it on, create a free site at goatcounter.com and put
its endpoint in `<meta name="goatcounter" content="…">` in `index.html`.
Pageviews plus these events are counted: `save-contact`, `download-cv`,
`share`, `chest`, `cheat`, `wave`, and `out/<host>` for outbound links. The
booth card's QR code adds `?utm_source=bgs-qr`, which GoatCounter shows as
the referrer, so scans are counted separately.

GSAP 3.15.0 is vendored in `js/vendor/` rather than loaded from a CDN, because
of the expo hall's mobile signal.

## KuroNeko sprite

Source: `media/sprite/kuroneko-wave.aseprite`, 32×32, drawn in the site's
palette. Two layers (KuroNeko behind Ledge) and two tags: `intro` plays once
when she comes on screen, then `wave` loops. `js/sprite.js` reads frame
durations and tags from the exported JSON, so after editing, re-export and
nothing else changes:

    Aseprite.exe -b media/sprite/kuroneko-wave.aseprite --sheet media/sprite/kuroneko-wave.png --sheet-type horizontal --data media/sprite/kuroneko-wave.json --format json-array --list-tags --filename-format "{frame}"

Keep the tag names. If the frame count changes, update the `2700%` fallback in
`.waver .sprite` (frames × 100%) — it is only used without JS.

## Editing copy

All text lives in `js/i18n.js` as `copy.en` and `copy.pt`.
English is *also* inline in `index.html`; the two must match exactly.
Run `node scripts/check.mjs` after editing — it fails on drift.

`data-i18n` replaces an element's text. `data-i18n-label` writes `aria-label`
instead, for a control whose whole name is an attribute — the portrait button,
whose two faces are `alt=""` because the button already names them. The English
lives in the `aria-label` itself, so the checker holds it to the same rule.

## Stage interactions

One per stage, each demonstrating the system its stage claims. Spec:
`docs/superpowers/specs/2026-09-28-stage-interactions-design.md`.

| Stage | Interaction | Completed by |
|---|---|---|
| 01 Steam Veins | A damage dummy: i-frames, knockback, a phase change on a health threshold, execution. The refusal is the point — a hit inside the window does nothing and the readout says so. | Killing it |
| 02 MidNight Memories | The visor. One screenshot, fogged; the magnifying glass is the mask and only what is under it is legible. | Sweeping the scene |
| 03 Framed Drift | The balance suite, run live in a Worker, with the browser's time and the C# time side by side and labelled. | A finished run |
| 04 Hell's Kitchen | The damage table: type × enemy, showing the mitigation and what survives it. | Finding a wall |
| 05 KuroNeko | Three prepared scripts — one renders, two the validator refuses. | Breaking it |
| 06 Dino Girls | A ?-block that dispenses one line per press. | Emptying it |

**The cabinet never traps anyone.** It is a `<dialog>` opened with `show()`, not
`showModal()`, docked into a corner (a bottom sheet on phones) and covering well
under half the screen. The page beside it stays scrollable *and clickable* —
every link and every other launcher still works with a panel open. Ways out: the
✕, `Esc`, the launcher again, opening another stage, or scrolling a full screen
past the stage. That last one is gated on a real gesture (`wheel`, `touchmove`,
`keydown`, `pointerdown`), because the page also moves when it relayouts and a
page shifting under the visitor is not the visitor leaving.

**Stages 03, 04 and 05 ship dark.** Their balance numbers, formulas and
diagnostic strings are Lucas's, and stand-ins are in place until the real ones
land. Each data module in `js/stages/data/` exports `ready`, and `arcade.js`
renders no launcher for a stage whose data is not ready — so the build cannot
publish invented figures by forgetting a flag somewhere else. To light one up:
replace the values in its data module, flip `ready`, and make sure its tests
still pass. Framed Drift additionally needs `data/drift-golden.json` — a
recorded run of the C# balance suite — before `ready` may be flipped; a test
enforces that, because "the port is verified against C#" has to be true.

Progress is six booleans in `localStorage` (`js/progress.js`). A completed
interaction fills a pip on its HUD segment and counts toward the `n/6` by the
Continue heading.

## Offline

`sw.js` precaches the shell — page, CSS, every module, fonts, sprites, posters,
43 entries — so the site and all six interactions work with the network off.
This is for the hall: there is no machine running a build at BGS 2026, so these
interactions are the only thing a visitor can play, and venue wifi should be
assumed dead. Open the site once on a working connection first.

The video clips are deliberately *not* cached: megabytes each, and they fall
back to their posters, which are. Bump `VERSION` in `sw.js` when shipping, or
returning visitors keep the old shell.

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

`media/minigames/` holds the interaction sprites. The `.aseprite` sources are
tracked but never served; the PNGs beside them are. To re-export after an edit
(Aseprite CLI, from the Steam install):

    ASE="C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe"
    "$ASE" -b media/minigames/Dummy.aseprite --save-as media/minigames/dummy.png
    "$ASE" -b media/minigames/Lens.aseprite  --save-as media/minigames/lens.png

The lens then needs its glass made translucent, or it hides what it is meant to
reveal — the fill is a single flat colour, dropped to alpha 36:

    python -c "from PIL import Image; im=Image.open('media/minigames/lens.png').convert('RGBA'); px=im.load(); [px.__setitem__((x,y),(211,238,211,36)) for y in range(im.height) for x in range(im.width) if px[x,y][3]>0 and px[x,y][:3]==(211,238,211)]; im.save('media/minigames/lens.png')"

`media/me/` holds the player portrait: `pixel-me.png` (the 64px sprite, served as
is) and `real-me-512.webp` (43 KB, served). `real-me-source.png` is the 3120×4160
cut-out it is made from and is never served — to recrop it:

    python -c "from PIL import Image; im=Image.open('media/me/real-me-source.png').convert('RGBA'); im.crop((295,1150,2595,3450)).resize((512,512), Image.LANCZOS).save('media/me/real-me-512.webp','WEBP',quality=90,method=6)"

The crop is square because the frame is, and it is framed to sit at roughly the
same head size as the sprite so the flip reads as one face turning.

Only MP4 is generated. VP9 WebM measured larger than H.264 for this
material, and because `<source>` order put WebM first it was the file most
browsers actually downloaded — which broke the payload budget for everyone
except Safari. See the comment in `scripts/build-media.sh` before adding it
back.

## Checks

    node --test "{js,scripts}/**/*.test.mjs"   # unit tests
    node scripts/check.mjs                     # assets resolve, i18n consistent

Quote the glob. `node --test scripts/` does not work on Node 24 for Windows —
it bypasses the runner and tries to load `scripts` as a module entry point.

Visual and behavioural QA is a headless Chrome script kept outside the repo
(puppeteer-core against the local Chrome, site served with
`python -m http.server 8765`). It covers desktop and phone in both languages,
the HUD, the chest and lightbox, the pins, reduced motion, a failed GSAP CDN,
and the autoplay-refused path. 97 assertions as of 2026-09-17.

## Payload

Two budgets, because the phone is the path that matters: the site is opened
from a QR code. The bonus-stage art, the player photograph and every stage
interaction are excluded from both, since none of them loads until it is
pressed: the interaction modules are dynamic imports and their sprites are
fetched on mount. Measured 2026-09-28, with GSAP now self-hosted and counted:
phone 3.09 MB, desktop 6.52 MB.

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
