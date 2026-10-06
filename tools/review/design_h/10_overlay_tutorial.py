"""Draws a tutorial's ink, with its copies in the neighbouring cells, over the
photo's tile (`tile-composite.png`), whole and in close-ups.

Usage (from docs/research/design-h/):
  10_overlay_tutorial.py <dump.json> <out dir>
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

dump, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
ink = json.load(open(dump))['ink']
segs = [((p[0]+dx, p[1]+dy), (q[0]+dx, q[1]+dy)) for p, q in ink for dx in (-2, 0, 2) for dy in (-2, 0, 2)]
base = Image.open('tile-composite.png').convert('RGB'); N = base.width; S = N/2.4
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)

def view(x0, y0, x1, y1, size=800, lines=True):
    im = base.crop((round(N/2 + x0*S), round(N/2 - y1*S), round(N/2 + x1*S), round(N/2 - y0*S))).resize((size, size))
    if lines:
        d = ImageDraw.Draw(im); k = size/(x1 - x0)
        for p, q in segs:
            d.line(((p[0]-x0)*k, (y1-p[1])*k, (q[0]-x0)*k, (y1-q[1])*k), fill=(230, 0, 0), width=2)
    return im

def label(im, text):
    d = ImageDraw.Draw(im); d.rectangle((0, 0, im.width, 44), fill=(255, 255, 255)); d.text((10, 6), text, font=font, fill=(0, 0, 0))
    return im

def pair(a, b, name):
    out = Image.new('RGB', (a.width + b.width + 20, max(a.height, b.height)), 'white')
    out.paste(a, (0, 0)); out.paste(b, (a.width + 20, 0)); out.save(os.path.join(outdir, name))

pair(label(view(-1.2, -1.2, 1.2, 1.2, lines=False), 'Photo, one tile'), label(view(-1.2, -1.2, 1.2, 1.2), 'Photo with our lines (red)'), 'photo-overlay.png')
pair(label(view(0.0, 0.0, 1.2, 1.2, lines=False), 'Quarter tile'), label(view(0.0, 0.0, 1.2, 1.2), 'Quarter tile, our lines'), 'photo-overlay-quarter.png')

# The tip of a small kite, where the stellated design leaves the dodecagon open:
# circle A marks the spot, where the band runs on unbroken to the tiny white arrow.
def ring(im, x0, y1, k, x, y, r):
    d = ImageDraw.Draw(im); cx, cy = (x - x0)*k, (y1 - y)*k
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(0, 90, 255), width=4)
    d.text((cx + r - 6, cy - r - 30), 'A', font=font, fill=(0, 90, 255))
    return im
x0, y0, x1, y1 = 0.62, -0.2, 1.02, 0.2
k = 800/(x1 - x0)
pair(label(ring(view(x0, y0, x1, y1, lines=False), x0, y1, k, 0.866, 0, 70), 'Photo at a kite tip'),
     label(ring(view(x0, y0, x1, y1), x0, y1, k, 0.866, 0, 70), 'With our lines'), 'photo-kite-tip.png')
