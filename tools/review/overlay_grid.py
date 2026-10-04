#!/usr/bin/env python3
"""Draws a tutorial's tiled ink in red over a source grid drawing.

usage: overlay_grid.py <id> <source.png> x0 y0 step cx cy [half]
x0, y0, step: the source's grid origin and square size in pixels; cx, cy:
the grid point (x right, y down) where the tutorial's O sits. With `half`,
the source grid is read in half squares. Writes docs/review/<id>/overlay-ink.png.
"""
import json
import sys

from PIL import Image, ImageDraw

tid, src = sys.argv[1], sys.argv[2]
x0, y0, st, cx, cy = map(float, sys.argv[3:8])
d = json.load(open(f"docs/review/{tid}/dump.json"))
u, v = d["cell"]["u"], d["cell"]["v"]
im = Image.open(src).convert("RGB")
dr = ImageDraw.Draw(im)
for i in range(-8, 9):
    for j in range(-8, 9):
        sx, sy = i * u[0] + j * v[0], i * u[1] + j * v[1]
        for a, b in d["ink"]:
            f = lambda p: (x0 + (p[0] + sx + cx) * st, y0 + (cy - (p[1] + sy)) * st)
            dr.line([f(a), f(b)], fill=(255, 0, 0), width=3)
im.save(f"docs/review/{tid}/overlay-ink.png")
