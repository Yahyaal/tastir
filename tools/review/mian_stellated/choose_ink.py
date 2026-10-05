#!/usr/bin/env python3
"""Chooses the ink of the stellated-rosette tutorial: every stretch of the
construction's lines between neighbouring crossings inside the tile, kept
when her drawing has ink along it. Near the tile's corners her finished
centre (frame 24) decides; elsewhere her rosette stage (frame 20). Each
family of stretches under the tile's symmetry is kept or dropped together.

Usage: choose_ink.py <frame20.png> <frame20.json> <frame24.png> <frame24.json> ink.json [preview.png]
  (the .json files give the registration: pixel position of the rosette
   centre (0, 0) and pixels per unit, from 1_fit.py and 4_register.py)
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_mian_stellated as gm  # noqa: E402

f20, j20, f24, j24, out = sys.argv[1:6]


def load(png, js):
    im = np.asarray(Image.open(png).convert('RGB')).astype(int)
    blue = (im[..., 2] > 150) & (im[..., 0] < 170) & (im[..., 1] < 140)
    return ndi.distance_transform_edt(~blue), json.load(open(js))


D20, R20 = load(f20, j20)
D24, R24 = load(f24, j24)
gm.build()
lines = []
for n, (k, geo) in gm.el.items():
    if k != 'line':
        continue
    p, d = geo
    nx, ny = -d[1], d[0]
    c = p[0] * nx + p[1] * ny
    if not any(abs(nx * q[0] + ny * q[1]) > 1 - 1e-9 and abs(c * (1 if nx * q[0] + ny * q[1] > 0 else -1) - q[2]) < 1e-9 for q in lines):
        lines.append((nx, ny, c))
# only lines that carry pattern: hexagon sides, star lines, the corner lines
# (rays and cell sides are helpers, not ink)
H = 1.0


def covered(A, B):
    """Share of the stretch with ink beside it in the right frame."""
    mid = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2)
    near_corner = abs(abs(mid[0]) - 1) < 0.6 and abs(abs(mid[1]) - 1) < 0.6
    D, Rg = (D24, R24) if near_corner else (D20, R20)
    sx = 1
    # frame 24 shows the corner (1, 1); fold other corners onto it
    if near_corner:
        mid_sign = (1 if mid[0] > 0 else -1, 1 if mid[1] > 0 else -1)
    else:
        mid_sign = (1, 1)
    ok = n = 0
    for u in np.linspace(0.1, 0.9, max(4, int(math.dist(A, B) * 60))):
        x = (A[0] + u * (B[0] - A[0])) * mid_sign[0]
        y = (A[1] + u * (B[1] - A[1])) * mid_sign[1]
        px, py = Rg['cx'] + x * Rg['S'], Rg['cy'] - y * Rg['S']
        if 0 <= int(py) < D.shape[0] and 0 <= int(px) < D.shape[1]:
            n += 1
            ok += D[int(round(py)), int(round(px))] < 2.5 + sx
    return ok / n if n else 0


helpers = set()
for n, (k, geo) in gm.el.items():
    if k == 'line' and (n in ('h', 'v', 'gx', 'gxw', 'gy', 'gys', 'chord') or n.startswith('r')):
        p, d = geo
        helpers.add((round(-d[1], 6), round(d[0], 6), round(p[0] * -d[1] + p[1] * d[0], 6)))
segs = []
for (nx, ny, c) in lines:
    if (round(nx, 6), round(ny, 6), round(c, 6)) in helpers or (round(-nx, 6), round(-ny, 6), round(-c, 6)) in helpers:
        continue
    tx, ty = -ny, nx
    p0 = (nx * c, ny * c)
    ts = []
    for (mx, my, e) in lines:
        det = nx * my - ny * mx
        if abs(det) < 1e-9:
            continue
        x = (c * my - e * ny) / det
        y = (nx * e - mx * c) / det
        if max(abs(x), abs(y)) <= H + 1e-9:
            ts.append((x - p0[0]) * tx + (y - p0[1]) * ty)
    ts = sorted(set(round(t, 9) for t in ts))
    for t1, t2 in zip(ts, ts[1:]):
        if t2 - t1 < 1e-6:
            continue
        segs.append(((p0[0] + t1 * tx, p0[1] + t1 * ty), (p0[0] + t2 * tx, p0[1] + t2 * ty)))


def key(p):
    return (round(p[0], 5) + 0.0, round(p[1], 5) + 0.0)


exact = {}
for A, B in segs:
    exact[key(A)] = A
    exact[key(B)] = B
score = {tuple(sorted((key(A), key(B)))): covered(A, B) for A, B in segs}


RO = (math.sqrt(3) / 2) / math.cos(math.radians(15))


def images(A, B):
    """The stretch's copies: twelve-fold inside the rosette (her rosette is
    twelve-fold), four-fold with mirrors elsewhere (the tile)."""
    out = set()
    if max(math.hypot(*A), math.hypot(*B)) < 1.0 + 1e-6:
        for k in range(12):
            for m in (1, -1):
                def f(p, k=k, m=m):
                    x, y = p[0], m * p[1]
                    a = math.radians(30 * k)
                    return (x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a))
                out.add(tuple(sorted((key(f(A)), key(f(B))))))
        return out
    for sx in (1, -1):
        for sy in (1, -1):
            for sw in (0, 1):
                f = (lambda p, sx=sx, sy=sy, sw=sw: ((p[1] if sw else p[0]) * sx, (p[0] if sw else p[1]) * sy))
                out.add(tuple(sorted((key(f(A)), key(f(B))))))
    return out


orbits, seen = [], set()
for A, B in segs:
    k = tuple(sorted((key(A), key(B))))
    if k in seen:
        continue
    ms = [m for m in images(A, B) if m in score]
    seen |= set(ms)
    orbits.append(ms)
# Inside the rosette circle her drawing shows the full ring only on the
# axes (the screenshot is cut by later steps elsewhere); the owner confirmed
# the ring is twelve-fold, so a twelve-fold family is kept when a third of
# it (the axis copies) is inked.
keep = [ms for ms in orbits if np.mean([score[m] > 0.8 for m in ms]) >= (0.3 if len(ms) > 8 else 0.5)]
ink = sorted({m for ms in keep for m in ms})
# The corner motif is known exactly from her steps (four hexagons and an
# octagon round each corner K): ink it as drawn there, replacing whatever
# the low-resolution screenshot suggested within 0.3 of a corner.
S3 = math.sqrt(3)
hexagon = [((S3 / 2 - 0.5) / (S3 / 2), 1.0), (0.5, S3 / 2), (S3 - 1 - (1 - S3 / 2) / S3, S3 / 2), (S3 - 1, 1.0)]
octa = [(S3 - 1, 1.0), (1 - (2 - S3) / (1 + 1 / S3) * 1, 1 - (2 - S3) / (1 + 1 / S3) * 1), (1.0, S3 - 1)]
motif = list(zip(hexagon, hexagon[1:])) + list(zip(octa, octa[1:]))
motif += [((a[1], a[0]), (b[1], b[0])) for a, b in zip(hexagon, hexagon[1:])]
full = set()
for a, b in motif:
    for sx in (1, -1):
        for sy in (1, -1):
            A = (a[0] * sx, a[1] * sy); B = (b[0] * sx, b[1] * sy)
            full.add(tuple(sorted((key(A), key(B)))))
            exact[key(A)] = A; exact[key(B)] = B
def near_corner(m):
    mid = ((m[0][0] + m[1][0]) / 2, (m[0][1] + m[1][1]) / 2)
    u, w = abs(mid[0]), abs(mid[1])
    return (math.hypot(u - 1, w - 1) < 0.32 or math.hypot(u - 1 / S3, w - 1) < 0.17
            or math.hypot(u - 1, w - 1 / S3) < 0.17)
ink = sorted({m for m in ink if not near_corner(m)} | full)
# no loose ends inside the tile
edge = lambda z: max(abs(z[0]), abs(z[1])) > H - 1e-4
while True:
    deg = {}
    for a, b in ink:
        for z in (a, b):
            deg[z] = deg.get(z, 0) + 1
    loose = {m for m in ink if any(deg[z] == 1 and not edge(z) for z in m)}
    if not loose:
        break
    ink = [m for m in ink if m not in loose]
# Where two crossings fall a hair apart (a star tip), the short stretches
# form a tiny diamond; drop short stretches whose removal leaves no loose end.
touch = {}
for m in ink:
    for z in m:
        touch.setdefault(z, []).append(m)
# of two all-short nodes facing each other, keep the one nearer O (where
# the long star lines actually cross) and drop the other's stretches
shorty = [z for z, ms in touch.items() if not edge(z) and all(math.dist(*m) < 0.015 for m in ms)]
drop = set()
for z in shorty:
    twin = [w for w in shorty if w != z and math.dist(w, z) < 0.03]
    if twin and math.hypot(*z) > math.hypot(*twin[0]):
        drop |= set(touch[z])
ink = [m for m in ink if m not in drop]
json.dump([[list(exact[a]), list(exact[b])] for a, b in ink], open(out, 'w'))
print(len(segs), 'stretches,', len(orbits), 'families,', len(ink), 'inked')
if len(sys.argv) > 6:
    W = 900
    img = Image.new('RGB', (W, W), 'white')
    d = ImageDraw.Draw(img)
    s = W / 2.2
    for a, b in ink:
        A, B = exact[a], exact[b]
        d.line((W / 2 + A[0] * s, W / 2 - A[1] * s, W / 2 + B[0] * s, W / 2 - B[1] * s), fill=(40, 40, 200), width=3)
    img.save(sys.argv[6])
