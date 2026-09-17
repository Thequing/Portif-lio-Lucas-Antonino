"""Render docs/booth-card.pdf: an A6 card (105x148 mm) with 3 mm bleed, for print.

    python docs/canvas/booth-card.py <dir with Jersey20-Regular.ttf and AtkinsonHyperlegible-*.ttf>

Needs reportlab and qrcode (pip install reportlab qrcode). The QR is drawn as
black modules on a phosphor plate: the darkest-on-lightest pairing the palette
has, so any phone camera reads it under booth lighting.
"""
import sys
from pathlib import Path

import qrcode
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

FONTS = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('.')
OUT = Path(__file__).resolve().parents[2] / 'docs' / 'booth-card.pdf'
URL = 'https://thequing.github.io/Portif-lio-Lucas-Antonino/'

BLEED = 3 * mm
W, H = 105 * mm + 2 * BLEED, 148 * mm + 2 * BLEED
BLACK, PHOSPHOR, DIM, COIN = (0, 0, 0), (0.949, 0.918, 0.843), (0.608, 0.569, 0.486), (1.0, 0.824, 0.247)
STAGES = ['#e8452f', '#9fb4c4', '#b46cff', '#ff7a1a', '#17c3b2', '#4ade80']
GUTTER = BLEED + 11 * mm  # the strong left vertical


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


pdfmetrics.registerFont(TTFont('Jersey', str(FONTS / 'Jersey20-Regular.ttf')))
pdfmetrics.registerFont(TTFont('Atkinson', str(FONTS / 'AtkinsonHyperlegible-Regular.ttf')))
pdfmetrics.registerFont(TTFont('AtkinsonB', str(FONTS / 'AtkinsonHyperlegible-Bold.ttf')))

c = canvas.Canvas(str(OUT), pagesize=(W, H))
c.setTitle('Lucas Antonino — BGS 2026 booth card')

# Cabinet black to the bleed.
c.setFillColorRGB(*BLACK)
c.rect(0, 0, W, H, stroke=0, fill=1)

# Trim-line registration ticks, outside the trim, for the printer.
c.setStrokeColorRGB(*DIM)
c.setLineWidth(0.25)
for x in (BLEED, W - BLEED):
    for y in (0, H):
        c.line(x, y, x, y + (2 * mm if y == 0 else -2 * mm))
for y in (BLEED, H - BLEED):
    for x in (0, W):
        c.line(x, y, x + (2 * mm if x == 0 else -2 * mm), y)

top = H - BLEED - 19 * mm

# The name, bitmapped, on the strong vertical. Two lines so it can be large.
c.setFillColorRGB(*PHOSPHOR)
c.setFont('Jersey', 46)
c.drawString(GUTTER, top - 12 * mm, 'Lucas')
c.drawString(GUTTER, top - 25 * mm, 'Antonino')

c.setFont('AtkinsonB', 10.5)
c.drawString(GUTTER, top - 33 * mm, 'Gameplay & Systems Programmer')

# The ledger of stages.
seg_w, seg_h, gap = 10.5 * mm, 1.6 * mm, 1.2 * mm
y0 = top - 40 * mm
for i, col in enumerate(STAGES):
    c.setFillColorRGB(*hexrgb(col))
    c.rect(GUTTER + i * (seg_w + gap), y0, seg_w, seg_h, stroke=0, fill=1)

# The QR, the thing to be pressed: black modules on a phosphor plate.
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
qr.add_data(URL)
qr.make(fit=True)
matrix = qr.get_matrix()
n = len(matrix)
plate = 50 * mm
quiet = 4 * mm
module = (plate - 2 * quiet) / n
px = GUTTER
py = y0 - 8 * mm - plate
c.setFillColorRGB(*PHOSPHOR)
c.rect(px, py, plate, plate, stroke=0, fill=1)
c.setFillColorRGB(*BLACK)
# Runs of dark modules are drawn as one rectangle so no hairline seams appear
# between neighbours at any raster resolution.
for r, row in enumerate(matrix):
    k = 0
    while k < n:
        if row[k]:
            start = k
            while k < n and row[k]:
                k += 1
            c.rect(px + quiet + start * module, py + plate - quiet - (r + 1) * module, (k - start) * module, module, stroke=0, fill=1)
        else:
            k += 1

# Cursor and prompt beside the plate's top edge, in coin.
c.setFillColorRGB(*COIN)
cx, cy = px + plate + 6 * mm, py + plate - 4 * mm
p = c.beginPath()
p.moveTo(cx, cy - 1.6 * mm); p.lineTo(cx, cy + 1.6 * mm); p.lineTo(cx + 2.4 * mm, cy); p.close()
c.drawPath(p, stroke=0, fill=1)
c.setFont('Jersey', 15)
c.drawString(cx + 4 * mm, cy - 1.7 * mm, 'Scan')

# Secondary lines, dim, at reading size.
c.setFillColorRGB(*DIM)
c.setFont('Atkinson', 8)
c.drawString(GUTTER, py - 7 * mm, 'Find me at Brasil Game Show 2026')
c.setFont('Atkinson', 6.5)
c.drawString(GUTTER, py - 12 * mm, URL.replace('https://', ''))

# Version string in the gutter.
c.setFillColorRGB(0.27, 0.26, 0.23)
c.setFont('Atkinson', 5)
c.drawString(GUTTER, BLEED + 5 * mm, 'v2026.09')

c.showPage()
c.save()
print(OUT, OUT.stat().st_size, 'bytes; modules', n)
