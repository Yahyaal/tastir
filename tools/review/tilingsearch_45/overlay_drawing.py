#!/usr/bin/env python3
"""Draws a tutorial's ink, repeated over the page, in red on a render of
Wichmann's PDF, to check the reading by eye.

Usage: overlay_drawing.py <dump.json> <page.png> <dpi> <ox> <oy> <period> <out.png> [rot45]
  (ox, oy): O in PDF points; period: twice OA in PDF points (the square
  cell's side). The ink repeats by the dump's cell vectors.
  rot45: the tutorial's frame is the drawing's turned by 45° (x' = (x + y)/2,
  y' = (y - x)/2, as in gen_leones_door_stars.py); period is then twice the
  drawing's unit."""
import json
import sys

from PIL import Image, ImageDraw

dump, png, dpi, ox, oy, per, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), *map(float, sys.argv[4:7]), sys.argv[7]
d = json.load(open(dump))
im = Image.open(png).convert('RGB')
im = Image.blend(im, Image.new('RGB', im.size, 'white'), 0.45)
dr = ImageDraw.Draw(im)
k = dpi / 72
unit = per / 2
W, H = im.size
rot = len(sys.argv) > 8 and sys.argv[8] == 'rot45'
tf = (lambda x, y: (x - y, x + y)) if rot else (lambda x, y: (x, y))
cu, cv = d['cell']['u'], d['cell']['v']
nx = int(W / k / per) + 2
ny = int(H / k / per) + 2
for i in range(-nx, nx + 1):
    for j in range(-ny, ny + 1):
        for (a, b) in d['ink']:
            sx, sy = i * cu[0] + j * cv[0], i * cu[1] + j * cv[1]
            qa, qb = tf(a[0] + sx, a[1] + sy), tf(b[0] + sx, b[1] + sy)
            pa = ((ox + qa[0] * unit) * k, (oy - qa[1] * unit) * k)
            pb = ((ox + qb[0] * unit) * k, (oy - qb[1] * unit) * k)
            dr.line([pa, pb], fill=(220, 0, 0), width=2)
im.save(out)
print('wrote', out)
