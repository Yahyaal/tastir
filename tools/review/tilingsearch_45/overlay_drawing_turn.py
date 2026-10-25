#!/usr/bin/env python3
"""Batch 5 variant of overlay_drawing.py, kept for its --turn convention.
Draws a tutorial's ink, repeated over the page, in red on a render of
Wichmann's PDF, to check the reading by eye.

Usage: overlay_drawing.py <dump.json> <page.png> <dpi> <ox> <oy> <period> <out.png> [--turn]
  (ox, oy): O in PDF points; period: the cell's side in PDF points.
  --turn: the tutorial turned Wichmann’s drawing by 45° ((x, y) -> ((x + y)/√2, (y - x)/√2)).
  The ink repeats by the dump’s cell vectors (a diamond tile works too)."""
import json
import math
import sys

from PIL import Image, ImageDraw

dump, png, dpi, ox, oy, per, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), *map(float, sys.argv[4:7]), sys.argv[7]
turn = '--turn' in sys.argv[8:]
S = math.sqrt(2) / 2


def back(x, y):
    return ((x - y) * S, (x + y) * S) if turn else (x, y)


d = json.load(open(dump)); cu, cv = d['cell']['u'], d['cell']['v']
im = Image.open(png).convert('RGB')
im = Image.blend(im, Image.new('RGB', im.size, 'white'), 0.45)
dr = ImageDraw.Draw(im)
k = dpi / 72
unit = per / 2
W, H = im.size
nx = int(W / k / per) + 2
ny = int(H / k / per) + 2
for i in range(-nx, nx + 1):
    for j in range(-ny, ny + 1):
        for (a, b) in d['ink']:
            qa, qb = back(a[0] + i * cu[0] + j * cv[0], a[1] + i * cu[1] + j * cv[1]), back(b[0] + i * cu[0] + j * cv[0], b[1] + i * cu[1] + j * cv[1])
            pa = ((ox + qa[0] * unit) * k, (oy - qa[1] * unit) * k)
            pb = ((ox + qb[0] * unit) * k, (oy - qb[1] * unit) * k)
            dr.line([pa, pb], fill=(220, 0, 0), width=2)
im.save(out)
print('wrote', out)
