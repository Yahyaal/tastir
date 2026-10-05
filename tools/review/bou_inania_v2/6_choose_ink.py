#!/usr/bin/env python3
"""Chooses the ink of the simpler Bou Inania tutorial: every stretch of the
line sets (sets.json, helpers left out) between neighbouring crossings, kept
when it lies on a band centre of the owner's drawing and most of its copies
under the pattern's symmetry do too (twelve-fold inside the big figure,
four-fold outside). Writes ink.json in OA units, inside the tile.

Usage: 6_choose_ink.py <drawing.jpg> ink.json [preview.png]"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage.morphology import remove_small_holes
HERE = os.path.dirname(os.path.abspath(__file__))
img = np.asarray(Image.open(sys.argv[1]).convert('RGB')).astype(float)
mx = img.max(2); mn = img.min(2); sat = (mx - mn)/(mx + 1)
pieces = (mx < 75) | ((sat > 0.35) & (mx > 50))
band = ~remove_small_holes(ndi.binary_opening(pieces, iterations=2), max_size=200)
dt = ndi.distance_transform_edt(band)
cx, cy, R = 1027.0, 1027.5, 369.6
c15 = math.cos(math.radians(15)); rho = math.tan(math.radians(37.5))
def N(a): return (math.cos(math.radians(a)), math.sin(math.radians(a)))
L = [(*N(15 + 30*k), rho*math.cos(math.radians(75))) for k in range(12)] + [(*N(30*k), 2*c15*c15) for k in range(12)]
SETS = json.load(open(os.path.join(HERE, 'sets.json')))
F = [s for s in SETS if s['label'] == 'F'][0]['d']
for s in SETS:
    if s['helper']: continue
    normals = [s['normal'] + 360/s['turns']*k for k in range(s['turns'])]
    if s['mirror']: normals += [-s['normal'] + 360/s['turns']*k for k in range(s['turns'])]
    L += [(*N(a), s['d']) for a in normals]
U = []
for l in L:
    if not any(abs(l[0]-q[0]) < 1e-9 and abs(l[1]-q[1]) < 1e-9 and abs(l[2]-q[2]) < 1e-9 for q in U): U.append(l)
L = U
def on_band(A, B):
    n = max(4, int(math.dist(A, B)*R/3)); ok = 0
    for u in np.linspace(0.1, 0.9, n):
        x = A[0] + u*(B[0]-A[0]); y = A[1] + u*(B[1]-A[1])
        ok += dt[int(round(cy - y*R)), int(round(cx + x*R))] >= 8
    return ok/n
def centred(A, B):
    v = []
    for u in np.linspace(0.1, 0.9, max(4, int(math.dist(A, B)*R/3))):
        x = A[0] + u*(B[0]-A[0]); y = A[1] + u*(B[1]-A[1]); v.append(dt[int(round(cy - y*R)), int(round(cx + x*R))])
    return float(np.mean(v))
segs = []
for (nx, ny, c) in L:
    tx, ty = -ny, nx; p0 = (nx*c, ny*c); ts = []
    for (mx_, my, e) in L:
        det = nx*my - ny*mx_
        if abs(det) < 1e-9: continue
        x = (c*my - e*ny)/det; y = (nx*e - mx_*c)/det
        if max(abs(x), abs(y)) <= F + 1e-9: ts.append((x - p0[0])*tx + (y - p0[1])*ty)
    ts = sorted(set(round(t, 9) for t in ts))
    for t1, t2 in zip(ts, ts[1:]):
        if t2 - t1 < 1e-6: continue
        A = (p0[0] + t1*tx, p0[1] + t1*ty); B = (p0[0] + t2*tx, p0[1] + t2*ty)
        segs.append((A, B, centred(A, B)))
def key(p): return (round(p[0], 4) + 0.0, round(p[1], 4) + 0.0)
score = {tuple(sorted((key(A), key(B)))): s for A, B, s in segs}
exact = {}
for A, B, _ in segs:
    exact[key(A)] = A; exact[key(B)] = B
def images(A, B):
    inner = max(math.hypot(*A), math.hypot(*B)) < 2*c15*c15 + 1e-6
    out = []
    if inner:
        for k in range(12):
            for m in (1, -1):
                def f(p):
                    x, y = p[0], m*p[1]; a = math.radians(30*k)
                    return (x*math.cos(a) - y*math.sin(a), x*math.sin(a) + y*math.cos(a))
                out.append(tuple(sorted((key(f(A)), key(f(B))))))
    else:
        for sx in (1, -1):
            for sy in (1, -1):
                for sw in (0, 1):
                    f = lambda p: ((p[1] if sw else p[0])*sx, (p[0] if sw else p[1])*sy)
                    out.append(tuple(sorted((key(f(A)), key(f(B))))))
    return out
# The network of band centres from the coloured pieces (6a_piece_network.py),
# in OA units: each of its edges lies on one of the drawn lines; ink the
# stretches of that line it covers.
NET = json.load(open(os.path.join(HERE, 'network.json')))
scale = 367.0/R      # network.json was made with R = 367 px
net_edges = []
for P in NET:
    P = [(x*scale, y*scale) for x, y in P]
    for a, b in zip(P, P[1:] + P[:1]):
        if math.dist(a, b) > 0.03: net_edges.append((a, b))
covered = {}
for (nx, ny, c) in L:
    tx, ty = -ny, nx
    spans = []
    for a, b in net_edges:
        u = (b[0]-a[0], b[1]-a[1]); lu = math.hypot(*u)
        if abs(u[0]*nx + u[1]*ny)/lu > 0.06: continue           # not along the line (about 3.5 degrees)
        if max(abs(a[0]*nx + a[1]*ny - c), abs(b[0]*nx + b[1]*ny - c)) > 0.035: continue
        ta, tb = a[0]*tx + a[1]*ty, b[0]*tx + b[1]*ty
        spans.append((min(ta, tb), max(ta, tb)))
    covered[(nx, ny, c)] = spans
cand = {}
for A, B, _ in segs:
    k = tuple(sorted((key(A), key(B))))
    # which line is it on
    best = None
    for l, spans in covered.items():
        nx, ny, c = l
        if abs(A[0]*nx + A[1]*ny - c) < 1e-6 and abs(B[0]*nx + B[1]*ny - c) < 1e-6:
            tx, ty = -ny, nx; t1, t2 = sorted((A[0]*tx + A[1]*ty, B[0]*tx + B[1]*ty))
            cov = sum(max(0, min(t2, s2) - max(t1, s1)) for s1, s2 in spans)
            best = cov/(t2 - t1)
            break
    cand[k] = min(best or 0, 1.0)
orbits = []; seen = set()
for A, B, _ in segs:
    k = tuple(sorted((key(A), key(B))))
    if k in seen: continue
    members = [m for m in set(images(A, B)) if m in cand]
    seen |= set(members); orbits.append(members)
keep = [ms for ms in orbits if ms and np.mean([cand[m] >= 0.5 for m in ms]) >= 0.5]
ink = sorted({m for ms in keep for m in ms})
print('orbits', len(orbits), 'kept', len(keep))
# Close tiny gaps: where an end is left loose, add the short stretches (by
# orbit) that join it back to the ink along a drawn line.
def loose_ends(ink):
    deg = {}
    for a, b in ink:
        for z in (a, b): deg[z] = deg.get(z, 0) + 1
    return {z for z, n in deg.items() if n == 1 and max(abs(z[0]), abs(z[1])) < F - 1e-4}
orbit_index = {}
for i, ms in enumerate(orbits):
    for m in ms: orbit_index[m] = i
added = set()
for _ in range(3):
    ends = loose_ends(ink); have = set(ink)
    new = {orbit_index[m] for m in cand if m not in have and math.dist(*m) <= 0.05 and (m[0] in ends or m[1] in ends)}
    if not new: break
    for i in new: added |= set(orbits[i])
    ink = sorted(have | {m for i in new for m in orbits[i]})
# fillers that still dangle are removed again (whole orbits)
while True:
    ends = loose_ends(ink)
    bad = {orbit_index[m] for m in ink if m in added and (m[0] in ends or m[1] in ends)}
    if not bad: break
    drop = {m for i in bad for m in orbits[i]}
    ink = [m for m in ink if m not in drop]; added -= drop
print('loose ends left', len(loose_ends(ink)))
json.dump([[list(exact[a]), list(exact[b])] for a, b in ink], open(sys.argv[2], 'w'))
print(len(segs), 'stretches;', len(ink), 'inked')
if len(sys.argv) > 3:
    im = Image.fromarray(img.astype(np.uint8)); im = Image.blend(im, Image.new('RGB', im.size, 'white'), 0.55); d = ImageDraw.Draw(im)
    for a, b in ink: d.line((cx + a[0]*R, cy - a[1]*R, cx + b[0]*R, cy - b[1]*R), fill=(220, 0, 0), width=6)
    im.resize((1000, 1000)).save(sys.argv[3])
