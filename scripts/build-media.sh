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
