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

A cold full scroll transfers about 3.3 MB of local assets, plus roughly
125 KB of GSAP from the CDN. The budget is 4 MB. Videos are the bulk of it,
and none load until their section approaches the viewport.
