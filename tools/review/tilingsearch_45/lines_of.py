#!/usr/bin/env python3
"""Lists the distinct lines of a Tiling Search drawing inside the square cell,
in the tutorial's frame, each with its distance from O snapped to a + b·√2/2,
and the piece types (corners, area) whose centres lie in the cell.

The frame: `origin` (PDF points) at O, `unit` points to OA, y up; with --turn
the drawing is turned by 45° first (Wichmann's diagonal neighbour goes to an
axis). `band` moves band drawings out by half a band (0 for plain tiles).

Usage: lines_of.py <pieces.json> <ox> <oy> <unit> [--turn] [--band b] [--cell h] [--show] [--brief]
--show prints the corners of each piece centred in the wedge 0 <= y <= x;
--brief only the distances |c| of the lines in each direction.
"""
import json
import math
import sys
from collections import Counter

sys.path.insert(0, __import__('os').path.dirname(__file__))
from common import clip  # noqa: E402

args = sys.argv[1:]
turn = '--turn' in args
band = float(args[args.index('--band') + 1]) if '--band' in args else 0.0
hc = float(args[args.index('--cell') + 1]) if '--cell' in args else 1.0
f, ox, oy, unit = args[0], float(args[1]), float(args[2]), float(args[3])
H = math.sqrt(2) / 2


def snap1(v):
    best = None
    for b in range(-16, 17):
        a = round(v - b * H)
        r = abs(v - a - b * H)
        if best is None or r < best[0] - 1e-9:
            best = (r, a, b)
    return best


def offset(Q, hh):
    A = 0.5 * sum(Q[i - 1][0] * Q[i][1] - Q[i][0] * Q[i - 1][1] for i in range(len(Q)))
    sg = 1 if A > 0 else -1
    ls = []
    for i in range(len(Q)):
        a, b = Q[i], Q[(i + 1) % len(Q)]
        L = math.dist(a, b)
        u = ((b[0] - a[0]) / L, (b[1] - a[1]) / L)
        nv = (sg * u[1], -sg * u[0])
        ls.append(((a[0] + hh * nv[0], a[1] + hh * nv[1]), u))
    out = []
    for i in range(len(ls)):
        (p1, u1), (p2, u2) = ls[i - 1], ls[i]
        det = u1[0] * (-u2[1]) - u1[1] * (-u2[0])
        if abs(det) < 1e-9:
            continue
        t = ((p2[0] - p1[0]) * (-u2[1]) - (p2[1] - p1[1]) * (-u2[0])) / det
        out.append((p1[0] + t * u1[0], p1[1] + t * u1[1]))
    return out


ps = json.load(open(f))
polys = []
for p in ps:
    Q = offset(p['poly'], band / 2) if band else p['poly']
    Q = [((x - ox) / unit, -(y - oy) / unit) for x, y in Q]
    if turn:
        Q = [((x + y) * H, (y - x) * H) for x, y in Q]
    polys.append((p, Q))

lines = Counter()
worst = 0
for p, Q in polys:
    if max(abs(v) for q in Q for v in q) > 3 * hc:
        continue
    for i in range(len(Q)):
        for a, b in clip([(Q[i], Q[(i + 1) % len(Q)])], hc):
            d = (b[0] - a[0], b[1] - a[1])
            ang = round(math.degrees(math.atan2(d[1], d[0])) / 22.5) * 22.5 % 180
            th = math.radians(ang)
            c = -a[0] * math.sin(th) + a[1] * math.cos(th)
            r, A, B = snap1(c * 2)
            worst = max(worst, r)
            lines[(ang, A, B)] += math.dist(a, b)
print('worst line residual (half units):', round(worst, 4))
if '--brief' in args:
    for ang in (0, 45, 90, 135):
        cs = sorted({round(abs(A + B * H) / 2, 4) for (a, A, B) in lines if a == ang})
        print(f'{ang:4}°  |c| =', ', '.join(f'{c:.4f}' for c in cs))
    sys.exit()
for (ang, A, B), L in sorted(lines.items()):
    print(f'{ang:6.1f}°  2c = {A} + {B}·√2/2  (c = {(A + B * H) / 2:.4f})  length {L:.3f}')
cnt = Counter()
for p, Q in polys:
    cx = sum(q[0] for q in Q) / len(Q)
    cy = sum(q[1] for q in Q) / len(Q)
    if -hc < cx <= hc and -hc < cy <= hc:
        A = abs(0.5 * sum(Q[i - 1][0] * Q[i][1] - Q[i][0] * Q[i - 1][1] for i in range(len(Q))))
        cnt[(len(Q), round(A, 3), tuple(round(v, 2) for v in p['fill'] or ()))] += 1
tot = 0
for k, n in sorted(cnt.items()):
    print('piece', k, 'x', n)
    tot += k[1] * n
print('area in cell', round(tot, 4), 'cell', 4 * hc * hc)
if '--show' in args:
    for p, Q in polys:
        cx = sum(q[0] for q in Q) / len(Q)
        cy = sum(q[1] for q in Q) / len(Q)
        if -0.01 <= cx <= hc and -0.01 <= cy <= cx + 0.01:
            print(len(Q), [(round(x, 4), round(y, 4)) for x, y in Q])
