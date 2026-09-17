#!/usr/bin/env bash
# Converts source clips in Gifs/ (GIF or MP4 screen captures) to web video in media/.
# Run manually after adding or replacing a clip:  bash scripts/build-media.sh
set -euo pipefail

SRC_DIR="Gifs"
OUT_VIDEO="media/video"
OUT_POSTER="media/poster"

mkdir -p "$OUT_VIDEO" "$OUT_POSTER"

# slug|source filename|pre-filter (crop/denoise; empty = none)|width|fps|crf|start|duration
#
# start/duration (seconds) cut a window out of a long capture; leave both empty
# to use the whole source (the GIFs are already trimmed). Windows were picked
# from contact sheets so each clip opens on the beat that explains the project:
# the visor in midnight-street, the wraith in midnight-boss, the garage and score
# in framed-drift, the boss wave and map expansion in hells-kitchen, the branching
# menu in kuroneko.
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
# The 1080p60 MP4 captures are encoded at 960/30 with a light hqdn3d denoise and
# crf 28: 30 fps is enough for a muted loop, and the captures carry grain (cel
# grass, dithered fog) that H.264 otherwise spends most of its bits on. Measured
# on framed-drift at 720: crf 26 plain 3.5 MB, crf 30 + denoise 0.50 MB, with no
# visible difference on a phone. The phone path (720 set) is what the QR code at
# the booth serves, so every clip is sized against that budget first.
#
# RULE: never let the width exceed the clip's post-crop width. Upscaling before
# encoding costs bitrate and buys nothing.
CLIPS=(
  "steam-veins-title|1SteamVeinsGif2.gif||1280|50|24||"
  "steam-veins-chapel|2SteamVeinsGif3.gif||1280|50|24||"
  "steam-veins-combat|3SteamVeinsGif4.gif||1280|50|24||"
  "midnight-street|MidnightMemoriesDemo.mp4|hqdn3d=3:2:6:4|960|30|28|9|12"
  "midnight-boss|MidnightMemoriesDemo1.mp4|hqdn3d=3:2:6:4|960|30|28|2|12"
  # Editor capture: crop to the game window, dropping the Unity chrome around it.
  "framed-drift|FramedDriftDemo.mp4|crop=1278:718:330:218,hqdn3d=3:2:6:4|960|30|28|18|12"
  "hells-kitchen|TowerDefenceDemo.mp4|hqdn3d=3:2:6:4|960|30|28|100|13"
  "kuroneko|KuroNekoDemo.mp4|hqdn3d=3:2:6:4|960|30|28|31|14"
)

for entry in "${CLIPS[@]}"; do
  IFS='|' read -r slug src crop width fps crf start dur <<< "$entry"
  in="$SRC_DIR/$src"

  # -ss before -i seeks on keyframes and is fast; the tiny start inaccuracy is
  # irrelevant for a loop. Kept as an array so empty values expand to nothing.
  window=()
  [[ -n "$start" ]] && window+=(-ss "$start")
  [[ -n "$dur" ]] && window+=(-t "$dur")

  if [[ ! -f "$in" ]]; then
    echo "MISSING SOURCE: $in" >&2
    exit 1
  fi

  # the pre-filter must precede scale in the filter chain (crop is in source pixels)
  pre="${crop:+$crop,}"

  echo "==> $slug"

  ffmpeg -y -v error "${window[@]}" -i "$in" \
    -vf "${pre}fps=$fps,scale=$width:-2:flags=lanczos" \
    -c:v libx264 -preset slower -profile:v high -pix_fmt yuv420p -crf "$crf" \
    -movflags +faststart -an "$OUT_VIDEO/$slug-1280.mp4"

  ffmpeg -y -v error "${window[@]}" -i "$in" \
    -vf "${pre}fps=$fps,scale=720:-2:flags=lanczos" \
    -c:v libx264 -preset slower -profile:v high -pix_fmt yuv420p -crf $((crf + 2)) \
    -movflags +faststart -an "$OUT_VIDEO/$slug-720.mp4"

  # No WebM. VP9 at crf+10 measured LARGER than H.264 for every one of these
  # clips (4.16 MB across the set against 2.93 MB of MP4), and since <source>
  # order put WebM first, Chrome and Firefox downloaded the bigger file and blew
  # the 4 MB budget while Safari stayed inside it. A format that exists to be
  # smaller and is not has no reason to ship. H.264 High/yuv420p plays in every
  # target browser, so MP4 alone serves everyone at the measured 2.93 MB.

  ffmpeg -y -v error "${window[@]}" -i "$in" \
    -vf "${pre}scale=$width:-2:flags=lanczos" \
    -frames:v 1 -c:v libwebp -quality 82 "$OUT_POSTER/$slug.webp"
done

echo
echo "Per-visitor payload, phone (the 720 MP4 set; this is the QR-code path):"
du -ch "$OUT_VIDEO"/*-720.mp4 | tail -1
echo "Per-visitor payload, desktop (the 1280 set — a visitor downloads one variant, not both):"
du -ch "$OUT_VIDEO"/*-1280.mp4 | tail -1
echo "All generated files (repo weight, not transfer weight):"
du -ch "$OUT_VIDEO" "$OUT_POSTER" | tail -1
