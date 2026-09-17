# Lucas Antonino — Portfolio

Static site. No build step: what is committed is what is served.

## Editing copy

All text lives in `js/i18n.js` as `copy.en` and `copy.pt`.
English is *also* inline in `index.html`; the two must match exactly.
Run `node scripts/check.mjs` after editing — it fails on drift.

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

## Payload

Two budgets, because the phone is the path that matters: the site is opened
from a QR code at the BGS booth.

- Phone (≤1023 px, 720 set): a cold full scroll transfers about 2.8 MB of local
  assets. Budget 4 MB.
- Desktop (1280 set): about 6.3 MB. Budget 6.5 MB.

Plus roughly 125 KB of GSAP from the CDN. Videos are the bulk of it, and none
load until their section approaches the viewport. When autoplay is refused
(iOS Low Power Mode, Data Saver) each clip shows a play badge and a tap starts
it, so the page never degrades to a wall of still posters.

## Contact card

`media/lucas-antonino.vcf` is the "Save contact" target. Edit it by hand when
the email, title or links change; it is plain text with CRLF line endings.
