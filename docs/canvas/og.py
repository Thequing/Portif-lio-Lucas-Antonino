"""Render media/og.png, the 1200x630 share card.

    python docs/canvas/og.py <dir with Jersey20-Regular.ttf and AtkinsonHyperlegible-*.ttf>

Needs Pillow. The TTFs are the Google Fonts builds (google/fonts on GitHub,
ofl/jersey20 and ofl/atkinsonhyperlegible); the site itself only ships woff2.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

FONTS = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
OUT = Path(__file__).resolve().parents[2] / 'media' / 'og.png'

W, H = 1200, 630
BLACK, PHOSPHOR, DIM, COIN = (0, 0, 0), (242, 234, 215), (155, 145, 124), (255, 210, 63)
STAGES = ['#e8452f', '#9fb4c4', '#b46cff', '#ff7a1a', '#17c3b2', '#4ade80']
GUTTER = 84  # the strong left vertical everything hangs from


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


im = Image.new('RGB', (W, H), BLACK)
d = ImageDraw.Draw(im)

# Registration apparatus: a hairline frame and corner ticks, dim and quiet.
frame = (36, 36, W - 37, H - 37)
d.rectangle(frame, outline=(38, 36, 33))
for x, y in [(frame[0], frame[1]), (frame[2], frame[1]), (frame[0], frame[3]), (frame[2], frame[3])]:
    dx = 1 if x == frame[0] else -1
    dy = 1 if y == frame[1] else -1
    d.line([(x, y), (x + 14 * dx, y)], fill=DIM)
    d.line([(x, y), (x, y + 14 * dy)], fill=DIM)

# The loud element: the name, bitmapped, on the strong vertical.
jersey = font('Jersey20-Regular.ttf', 168)
name = 'Lucas Antonino'
d.text((GUTTER - 4, 118), name, font=jersey, fill=PHOSPHOR)

# Role, humane and at reading size.
role = font('AtkinsonHyperlegible-Bold.ttf', 34)
d.text((GUTTER, 312), 'Gameplay & Systems Programmer', font=role, fill=PHOSPHOR)

# The ledger: six stage segments, read left to right, each one thing.
seg_w, seg_h, gap, y0 = 112, 14, 12, 404
small = font('AtkinsonHyperlegible-Regular.ttf', 16)
for i, c in enumerate(STAGES):
    x = GUTTER + i * (seg_w + gap)
    d.rectangle((x, y0, x + seg_w - 1, y0 + seg_h - 1), fill=hexrgb(c))
    d.text((x, y0 + seg_h + 10), f'{i + 1:02d}', font=small, fill=DIM)

# What can be pressed, in the one colour that means it.
# Jersey has no triangle glyph, so the cursor is drawn on the same grid.
start = font('Jersey20-Regular.ttf', 48)
cy = 520 + 30
d.polygon([(GUTTER, cy - 10), (GUTTER, cy + 10), (GUTTER + 14, cy)], fill=COIN)
d.text((GUTTER + 28, 520), 'Press start', font=start, fill=COIN)

# The tally, secondary, on the same baseline.
tally = font('AtkinsonHyperlegible-Regular.ttf', 20)
t = '1 shipped · 1 in production · 1 demo at BGS 2026'
tw = d.textlength(t, font=tally)
d.text((W - GUTTER - tw, 542), t, font=tally, fill=DIM)

# Version string in the gutter of the frame.
ver = font('AtkinsonHyperlegible-Regular.ttf', 13)
d.text((frame[0] + 22, frame[3] - 22), 'v2026.09', font=ver, fill=(70, 66, 58))

OUT.parent.mkdir(parents=True, exist_ok=True)
im.save(OUT, optimize=True)
print(OUT, im.size, OUT.stat().st_size, 'bytes')
