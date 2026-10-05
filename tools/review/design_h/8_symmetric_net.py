import json, math, numpy as np
from scipy.optimize import least_squares
from PIL import Image, ImageDraw
segs = json.load(open('raw-segs.json'))
def fold(p):
    x, y = abs(p[0]), abs(p[1]); return (x, y) if x >= y else (y, x)
pts = [fold(p) for s in segs for p in s if max(abs(p[0]), abs(p[1])) < 1.06]
cl = []
for p in sorted(pts):
    for c in cl:
        if math.dist((c[0]/c[2], c[1]/c[2]), p) < 0.025: c[0] += p[0]; c[1] += p[1]; c[2] += 1; break
    else: cl.append([p[0], p[1], 1])
cl = [[c[0]/c[2], c[1]/c[2]] for c in cl if c[2] >= 3]
# snap onto mirror lines
kind = []
for c in cl:
    if c[1] < 0.02: kind.append('x'); c[1] = 0.0
    elif c[0] - c[1] < 0.025: kind.append('d'); m = (c[0] + c[1])/2; c[0] = c[1] = m
    elif abs(c[0] - 1) < 0.02: kind.append('e'); c[0] = 1.0
    else: kind.append('f')
def images(x, y):
    out = []
    for (a, b) in ((x, y), (y, x)):
        for sx in (1, -1):
            for sy in (1, -1): out.append((sx, sy, a is y, (sx*a, sy*b)))
    return out
inst = []
for i, (x, y) in enumerate(cl):
    for sx, sy, sw, p in images(x, y): inst.append((i, sx, sy, sw, p))
def snap(p):
    best = min(inst, key=lambda q: math.dist(q[4], p))
    return best if math.dist(best[4], p) < 0.03 else None
E = {}
for p, q in segs:
    a, b = snap(p), snap(q)
    if not a or not b or a[:4] == b[:4]: continue
    # canonical: express b relative to a's frame (undo a's symmetry)
    def undo(s, t):
        sx, sy, sw = s[1], s[2], s[3]
        x, y = t[4]; x *= sx; y *= sy
        if sw: x, y = y, x
        return (round(x, 6), round(y, 6))
    ka = (a[0], b[0], undo(a, b)); kb = (b[0], a[0], undo(b, a))
    k = min(ka, kb)
    E.setdefault(k, 0); E[k] += 1
edges = [(k, v) for k, v in E.items() if v >= 2]
print(len(cl), 'classes,', len(edges), 'edge orbits')
for i, c in enumerate(cl): print(i, kind[i], [round(v, 3) for v in c])
json.dump({'classes': cl, 'kind': kind, 'edges': [[k[0], k[1], k[2], v] for k, v in edges]}, open('fit4-in.json', 'w'))
im = Image.open('tile-composite.png').convert('RGB'); N = im.width; S = N/2.4; d = ImageDraw.Draw(im)
for (i, j, pj), v in edges:
    p = cl[i]
    for sx, sy, sw, P in images(*p):
        x, y = pj
        if sw: x, y = y, x
        Q = (sx*x, sy*y)
        d.line((N/2 + P[0]*S, N/2 - P[1]*S, N/2 + Q[0]*S, N/2 - Q[1]*S), fill=(255, 0, 0), width=2)
im.save('fit4-in.png')
