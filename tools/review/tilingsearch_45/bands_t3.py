"""Turns a band drawing back into tiles (ten-fold batch T3, MIR17 and MIR26):
keeps the pieces whose fill is not a band colour, measures the band width
(the commonest gap between parallel facing edges of neighbouring kept
pieces) and moves every kept piece out by half of it. Writes
<name>-tiles.json in the pieces format.
Usage: bands_t3.py <research dir>/<name> [r,g,b ...]   (band fills to drop)"""
import json
import math
import os
import sys
from collections import Counter

d = sys.argv[1].rstrip('/')
name = os.path.basename(d)
drop = [tuple(float(v) for v in s.split(',')) for s in sys.argv[2:]]
ps = json.load(open(f'{d}/{name}-pieces.json'))
ps = [p for p in ps if p.get('fill') and not any(max(abs(a - b) for a, b in zip(p['fill'], f)) < 0.02 for f in drop)]


def edges(P):
    for i in range(len(P)):
        yield P[i], P[(i + 1) % len(P)]


gaps = []
cs = [p['c'] for p in ps]
for i, p in enumerate(ps):
    for a, b in edges(p['poly']):
        L = math.dist(a, b)
        if L < 3:
            continue
        u = ((b[0] - a[0]) / L, (b[1] - a[1]) / L)
        nv = (u[1], -u[0])
        m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        best = None
        for j, q in enumerate(ps):
            if j == i or math.dist(cs[i], cs[j]) > 200:
                continue
            for c, e in edges(q['poly']):
                L2 = math.dist(c, e)
                if L2 < 1e-6:
                    continue
                u2 = ((e[0] - c[0]) / L2, (e[1] - c[1]) / L2)
                if abs(u[0] * u2[1] - u[1] * u2[0]) > 1e-3:
                    continue
                gp = (c[0] - m[0]) * nv[0] + (c[1] - m[1]) * nv[1]
                t1 = (c[0] - m[0]) * u[0] + (c[1] - m[1]) * u[1]
                t2 = (e[0] - m[0]) * u[0] + (e[1] - m[1]) * u[1]
                if min(t1, t2) > L / 2 or max(t1, t2) < -L / 2:
                    continue
                if abs(gp) > 0.5 and (best is None or abs(gp) < abs(best)):
                    best = gp
        if best is not None:
            gaps.append(round(abs(best), 2))
print('gaps:', Counter(gaps).most_common(6))
w = Counter(gaps).most_common(1)[0][0]


def offset(P, h):
    A = 0.5 * sum(P[i - 1][0] * P[i][1] - P[i][0] * P[i - 1][1] for i in range(len(P)))
    s = 1 if A > 0 else -1
    lines = []
    for a, b in edges(P):
        L = math.dist(a, b)
        u = ((b[0] - a[0]) / L, (b[1] - a[1]) / L)
        nv = (s * u[1], -s * u[0])
        lines.append(((a[0] + h * nv[0], a[1] + h * nv[1]), u))
    out = []
    for i in range(len(lines)):
        (p1, u1), (p2, u2) = lines[i - 1], lines[i]
        det = u1[0] * (-u2[1]) - u1[1] * (-u2[0])
        if abs(det) < 1e-9:
            continue
        t = ((p2[0] - p1[0]) * (-u2[1]) - (p2[1] - p1[1]) * (-u2[0])) / det
        out.append((p1[0] + t * u1[0], p1[1] + t * u1[1]))
    return out


out = []
for p in ps:
    Q = offset(p['poly'], w / 2)
    A = abs(0.5 * sum(Q[i - 1][0] * Q[i][1] - Q[i][0] * Q[i - 1][1] for i in range(len(Q))))
    out.append({'fill': p['fill'], 'poly': Q, 'area': A, 'c': p['c']})
json.dump(out, open(f'{d}/{name}-tiles.json', 'w'))
print('band width', w, len(out), 'tiles;', Counter((len(p['poly']), round(p['area'])) for p in out).most_common(20))
