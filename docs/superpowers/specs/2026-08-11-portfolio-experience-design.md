# Portfolio → Scroll-Driven Presentation Experience

**Date:** 2026-08-11
**Repo:** `Portif-lio-Lucas-Antonino`
**Status:** Approved, ready for implementation planning

## Goal

Rebuild the existing single-file portfolio as a scroll-driven, animated presentation
site in the vein of gsap.com, reusing the media already in the repository.

**Primary audience:** hiring managers and recruiters at international game studios.
English-first, Portuguese available via toggle. The site should make a recruiter's
next action obvious: download the CV, open the Steam page, or make contact.

**Secondary goal:** the site is itself a work sample. A gameplay programmer whose
portfolio demonstrates motion, performance, and state handling is making an argument
about their competence that bullet points cannot.

## Starting state

A single `index.html`, 954 lines, with inline CSS and JS. Dark purple/indigo theme,
Segoe UI, glow borders. Two carousels driven by a `setInterval`. Language switching
via paired `data-pt` / `data-en` attributes.

Media on disk:

| Asset | Detail |
| --- | --- |
| `Gifs/1SteamVeinsGif2.gif` | 1920×1080, 100 fps, 1.35 s, **95 MB** — title screen |
| `Gifs/2SteamVeinsGif3.gif` | 1920×1080, 100 fps, 1.50 s, **75 MB** |
| `Gifs/3SteamVeinsGif4.gif` | 1920×1080, 100 fps, 1.65 s, **77 MB** |
| `Gifs/4MidNightMemories1.gif` | 1920×1050, 100 fps, 3.00 s, **100 MB** |
| `Gifs/5KuroNekoDemo_ToLinkedin_1.gif` | 1920×1050, 100 fps, 2.55 s, 554 KB |
| `Gifs/JohnnyG1.gif` | 1920×1080, 100 fps, 3.00 s, 2.8 MB |
| `Imagens/` | 12 stills and sprite sheets, ~1.1 MB total |
| `Lucas_Antonino_Resumee_PT-BR_US.pdf` | 394 KB |

**Total GIF payload: 349 MB.** Every visitor downloads this today. This is the single
largest defect in the current site and the primary constraint on the redesign.

### Known defects in the current file

1. Line 372 — nested `<ul>` opened, only one `</ul>` closes both.
2. Line 453 — nested `<section>` opened, never closed.
3. Stats bar reads "4 Projects" while five projects are described.
4. `setLanguage()` writes `el.getAttribute('data-' + lang)` into `innerHTML` without a
   null guard. Any element carrying `data-pt` but not `data-en` renders the literal
   string `"null"` when switching to English.
5. Carousel `setInterval` runs for every carousel forever, including off-screen ones,
   and is never cleared.

All five are fixed by the rebuild.

## Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Audience | International studios, English-first | Determines default language and copy register |
| Structure | Single scroll-driven page | Matches reference; no routing; deploys to Pages unchanged |
| Stack | Vanilla + GSAP via CDN, split files | No build step, no npm; same deploy flow as today |
| Art direction | Chameleon — per-project accent | Media is the strongest asset; site feels authored by the same hand |
| Motion | Cinematic, full treatment | Site doubles as a work sample |
| Copy | Rewrite for impact, mark gaps as TODO | Never invent facts about shipped work |
| Video scrubbing | **Rejected** — see below | Clips are too short for scrub to read correctly |
| Git history rewrite | **Out of scope** | Destructive, force-push; separate decision |

### Why scrubbed playback was rejected

Scroll-scrubbed video was in the approved motion list and has been removed.

The clips run 1.35–3.0 seconds. Mapping 135 frames across a full pinned section gives
roughly 15 px of scroll per frame. On pixel art with hard edges this reads as a
stuttering slideshow rather than slow motion — it looks like a bug, not an effect.
Scrubbing suits clips of 10 s and longer.

**Replacement:** video plays natively at full speed on loop while the section is
pinned. Scroll drives everything around it — the clip enters behind an expanding mask,
scales down as copy steps in beside it, and the section accent bleeds outward into nav,
rules, numerals, and cursor. The pinned-cinema feel is preserved; the footage plays as
it was recorded.

## Media pipeline

`scripts/build-media.sh`, committed to the repo, converts `Gifs/` → `media/` using
ffmpeg. Re-run manually when a clip is added or replaced.

Per source GIF, four outputs:

| Output | Encoding |
| --- | --- |
| `media/video/<name>-1280.mp4` | H.264 high, yuv420p, `fps=50`, `scale=1280:-2:lanczos`, CRF 24, `+faststart` |
| `media/video/<name>-720.mp4` | as above at `scale=720:-2` |
| `media/video/<name>-1280.webm` | VP9, CRF 34, `-b:v 0`, `-row-mt 1` |
| `media/poster/<name>.webp` | first frame, `-quality 82` |

All outputs are silent (`-an`); the sources have no audio track.

Source filenames are renamed to semantic slugs on the way out, so the markup reads
clearly and ordering is not encoded in the name:

| Source | Slug |
| --- | --- |
| `1SteamVeinsGif2.gif` | `steam-veins-title` |
| `2SteamVeinsGif3.gif` | `steam-veins-combat` |
| `3SteamVeinsGif4.gif` | `steam-veins-boss` |
| `4MidNightMemories1.gif` | `midnight-memories` |
| `5KuroNekoDemo_ToLinkedin_1.gif` | `kuroneko` |
| `JohnnyG1.gif` | `johnny-g` |

The `steam-veins-combat` and `steam-veins-boss` slugs are provisional — the
implementation should confirm each clip's actual content from a extracted frame and
rename to match before wiring the markup.

Measured result at 1280 px H.264 CRF 24, all six clips: **3.1 MB total**, versus 349 MB
of GIF. A frame extracted from the converted Steam Veins clip was inspected and shows
no visible quality loss.

`Gifs/` remains in the repository as the source of truth but is no longer referenced by
any served page.

**Repository size caveat:** the 349 MB already exists in git history, so `git clone`
remains slow regardless of what the working tree serves. Only a history rewrite
(`git filter-repo` or BFG) would reclaim it, which rewrites every commit hash and
requires a force-push. Deliberately excluded from this work.

### Playback behaviour

`<video muted playsinline loop preload="none" poster="...">`. Sources are selected by
viewport width. An IntersectionObserver in `js/media.js` calls `play()` when a section
approaches the viewport and `pause()` when it leaves, so at most one or two clips ever
decode at once. Nothing downloads until its section is near.

## Page architecture

```
00  LOADER          0→100 counter; gates on hero video canplay + fonts ready
01  HERO            Steam Veins title screen, full-bleed loop
                    "LUCAS ANTONINO" — SplitText char stagger
                    role line, scroll cue, PT/EN toggle, CV button
02  POSITIONING     short first-person statement; scroll-velocity skew
03  MARQUEE         UNITY · UNREAL ENGINE 5 · C# · C++ · BLUEPRINTS · FMOD
04  PROJECT 01      Steam Veins        #ff7a2f   3 clips, pinned
05  PROJECT 02      MidNight Memories  #6d7ce8   1 clip, pinned
06  PROJECT 03      KuroNeko           #17c3b2   clip + VN screenshot
07  PROJECT 04      Johnny G           #b5179e   1 clip, pinned
08  PROJECT 05      Dino Girls         #4ade80   typographic, no media
09  CRAFT           parallax grid of stills and sprite sheets
10  CODE            RespondTakeDamage; lines type in on section enter
11  BACKGROUND      UFRN · Udemy · IFRS
12  CONTACT         CV download, GitHub, LinkedIn, email
```

Steam Veins leads because it is the only shipped title. Dino Girls has no media of its
own; rather than leave a visual hole it receives a deliberately typographic
"in production" panel, making the absence a design choice. Section 09 employs stills
currently unused by the site — `ShrineWithSnow.png`, `Scene1_Street.png`,
`Scene2_Street.png`, `Estátua2.0.png`, `Kunai_Explosion-Sheet.gif`,
`DracularaWave-Sheet.gif`.

## Design tokens

```
--ink        #08090c      page ground
--paper      #f2f3f7      primary text
--muted      #6b6b78      secondary text
--rule       rgba(242,243,247,0.12)

--accent                  per-section, animated on the root element
```

Type: Space Grotesk for display and body, JetBrains Mono for metadata, section
numerals, and code. Both are SIL Open Font License and are downloaded once, converted to
WOFF2, and committed under `media/font/`. Self-hosting means no font CDN sits on the
critical render path. GSAP is also third-party but loads `defer`red and is never render-
blocking; if it fails the page still renders, unanimated.

Display scale `clamp(3rem, 9vw, 9rem)`; body 1.125rem at 1.6 line-height; mono details
0.75rem with 0.08em letter-spacing.

### Accent transition

`--accent` is defined on `:root` and tweened by GSAP as each project section crosses
the viewport midpoint. Consumers: progress rail fill, section numerals, hairline rules,
link underlines, cursor ring, and the focus outline. Non-project sections
(02, 03, 09–12) resolve to a neutral `#8b8b99`.

## Module structure

| File | Responsibility | Depends on |
| --- | --- | --- |
| `index.html` | semantic document, `data-i18n` keys, no inline style or script | — |
| `css/base.css` | reset, tokens, type scale, focus states | — |
| `css/layout.css` | section shells, grid, pin containers | base |
| `css/components.css` | cards, buttons, rail, marquee, cursor, code block | base |
| `js/i18n.js` | copy dictionary, key binding, `<html lang>`, persistence | — |
| `js/media.js` | poster→video swap, IntersectionObserver play/pause, source select | — |
| `js/scroll.js` | all ScrollTrigger timelines, accent tween, progress rail | GSAP |
| `js/cursor.js` | magnetic cursor; `pointer: fine` only | — |
| `js/main.js` | loader, boot order, reduced-motion gate, module wiring | all above |

Each JS module exports a single `init()` and holds no cross-module state. `main.js` is
the only file that knows the boot order.

GSAP, ScrollTrigger and SplitText load from the official CDN with `defer`. All GSAP
plugins are free as of the Webflow acquisition; no licence key is required.

### Copy and i18n

English copy lives in the markup as the element's default text content, and **also** in a
dictionary in `js/i18n.js` alongside the Portuguese:

```js
export const copy = {
  en: { 'hero.role': 'Gameplay Programmer', /* ... */ },
  pt: { 'hero.role': 'Programador de Gameplay', /* ... */ },
};
```

Markup carries `data-i18n="hero.role"` with the English text inline. A missing key logs a
console warning and leaves the existing text intact — it never renders `"null"`, which is
the current failure mode.

This duplicates the English strings in two places, which is a deliberate trade: it is what
lets the page read correctly with JavaScript disabled or still loading, rather than
flashing empty. `scripts/check-assets.sh` guards the duplication by asserting that every
`data-i18n` element's inline text matches its `copy.en` entry, and that every key present
in `en` is also present in `pt`. Drift fails the check rather than shipping silently.

Sections replaced wholesale by animation (the marquee, section numerals) are generated in
JS and carry no i18n keys — they are language-neutral technology names.

Language resolves as: stored `localStorage` choice → browser locale starting with `pt`
→ English. Switching updates `<html lang>` so screen readers and hyphenation follow.

The dictionary is also where `[TODO: ...]` markers live, so both languages stay in sync
and there is one file to edit when filling gaps.

### Copy rewrite rules

Every fact in the current site is preserved. English is rewritten to lead with what was
built and shipped rather than generic responsibility bullets. Where a claim would be
materially stronger with a detail not present in the repository — team size, development
duration, engine version, player counts, release date — a `[TODO: ...]` marker is left
in the dictionary. **No detail about shipped work is invented.**

The project count is corrected from 4 to 5.

## Degradation and accessibility

`prefers-reduced-motion: reduce` is a hard gate evaluated in `main.js` before any
timeline is built: no loader, no pinning, no custom cursor, no parallax, no marquee
movement. Sections resolve to their final state immediately. Videos display posters
with a visible play control rather than autoplaying.

Below 1024 px, pins release and panels stack vertically; scroll reveals and accent
transitions are retained. The 720 px video sources are used.

With JavaScript disabled the document remains readable and styled: semantic HTML, English
copy authored directly into the markup, posters visible via `<noscript>` fallback images.
The language toggle is hidden without JS, since it cannot function.

Keyboard: full tab order through nav, language toggle, project links, and CV download,
with a visible focus ring in the active accent. All media carries alt text or an
`aria-label`. The progress rail is `aria-hidden`.

## Verification

No test framework exists in this repository and a static site does not warrant adding
one. Verification is two parts.

**Automated —** `scripts/check-assets.sh` fails with a non-zero exit on any of:

1. A `src` or `href` in `index.html` pointing at a local path that does not exist on disk
   — the "works locally, 404s on Pages" failure, most likely for a media-heavy static site.
2. A `data-i18n` element whose inline English text has drifted from its `copy.en` entry.
3. A key present in `copy.en` but missing from `copy.pt`, or the reverse.
4. A `data-i18n` attribute referencing a key that exists in neither.

**Manual QA checklist —** run before declaring the work complete:

- [ ] Cold load on throttled Fast 3G; total transfer for a full scroll under 4 MB
- [ ] Every project video plays, loops, and pauses when off-screen
- [ ] Language toggle switches all copy in both directions; no `"null"` renders
- [ ] Language choice survives reload
- [ ] `prefers-reduced-motion: reduce` — no pinning, no loader, page fully readable
- [ ] Keyboard-only traversal reaches every link and control with visible focus
- [ ] 375 px and 1440 px viewports both render without horizontal overflow
- [ ] CV PDF downloads
- [ ] All external links resolve (Steam ×2, GitHub, LinkedIn, Drive ×2)
- [ ] `scripts/check-assets.sh` exits 0

**Budget: under 4 MB for a complete cold scroll**, from 349 MB today.

## Out of scope

- Git history rewrite to reclaim the 349 MB already committed
- A build step, bundler, or npm dependency
- A CMS or any dynamic content source
- Analytics
- Per-project detail pages
- New media capture — this work reuses what exists
