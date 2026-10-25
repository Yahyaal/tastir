"""Snaps the corners of a Tiling Search drawing to the grid a + b·√2/2.

Every corner of a 45° tiling, measured from a star or octagon centre in a
well-chosen unit u (PDF points), has x and y of the form a + b·√2/2 with a, b
whole numbers. This prints the worst rounding error over the tiles within
`radius` points of the centre (under 0.003 of u means the unit is right), then
each tile as (centre, corners, area in u², corners as ((a, b), (a, b))).

Input: <name>-pieces.json from alhambra_wichmann/1_pieces.py when the drawing's
pieces share their corners; for band drawings first move the pieces out by half
a band (offset_pieces.py) or join each tile to its bevels.
Try u = an edge length, a star's tip radius, or half the star spacing.

Usage: snap_grid.py <tiles.json> <u> <centre x> <centre y> <radius>
"""
import json, math, sys
from collections import Counter
f, u, ox, oy, rad = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5])
H = math.sqrt(2) / 2
ts = json.load(open(f))
def snap1(v):
    # best a + b*H with |b| <= 12
    best = None
    for b in range(-16, 17):
        a = round(v - b * H)
        r = abs(v - a - b * H)
        if best is None or r < best[0] - 1e-9 or (abs(r - best[0]) < 1e-9 and abs(b) < abs(best[2])):
            best = (r, a, b)
    return best
worst = 0; out = []
for t in ts:
    if math.dist(t['c'], (ox, oy)) > rad: continue
    Q = []
    for x, y in t['poly']:
        X, Y = (x - ox) / u, -(y - oy) / u
        sx, sy = snap1(X), snap1(Y)
        worst = max(worst, sx[0], sy[0])
        Q.append(((sx[1], sx[2]), (sy[1], sy[2])))
    cx, cy = (t['c'][0] - ox) / u, -(t['c'][1] - oy) / u
    out.append((round(cx, 2), round(cy, 2), len(t['poly']), round(t['area'] / u / u, 4), Q))
print('worst residual (units):', round(worst, 4), ' tiles:', len(out))
for o in sorted(out): print(o)
