import json, math
from PIL import Image, ImageDraw
segs = json.load(open('raw-segsT.json'))
# D4 fold: x >= y >= 0
def fold(p):
    x, y = abs(p[0]), abs(p[1])
    return (x, y) if x >= y else (y, x)
pts = [fold(p) for s in segs for p in s if max(abs(p[0]), abs(p[1])) < 0.57 and math.hypot(*p) > 0.40]
cl = []
for p in sorted(pts):
    for c in cl:
        if math.dist((c[0]/c[2], c[1]/c[2]), p) < 0.012: c[0] += p[0]; c[1] += p[1]; c[2] += 1; break
    else: cl.append([p[0], p[1], 1])
cl = [(c[0]/c[2], c[1]/c[2], c[2]) for c in cl if c[2] >= 4]
# snap points on the mirror lines
cl = [((x, 0.0) if y < 0.006 else (x, x) if x - y < 0.006 else (x, y)) + (n,) for x, y, n in cl]
for i, c in enumerate(cl): print(i, round(c[0], 4), round(c[1], 4), c[2])
json.dump(cl, open('vertsT.json', 'w'))
def images(x, y):
    out = set()
    for a, b in ((x, y), (y, x)):
        for sx in (1, -1):
            for sy in (1, -1): out.add((round(sx*a, 6) + 0.0, round(sy*b, 6) + 0.0))
    return out
I = {}
for i, (x, y, n) in enumerate(cl):
    for q in images(x, y): I[q] = i
def snap(p):
    q = min(I, key=lambda k: math.dist(k, p)); return q if math.dist(q, p) < 0.014 else None
E = set()
for p, q in segs:
    a, b = snap(p), snap(q)
    if a and b and a != b: E.add(tuple(sorted((a, b))))
# orbit under D4: canonical by images
def img_seg(a, b, sx, sy, sw):
    f = lambda p: (round((p[1] if sw else p[0])*sx, 6) + 0.0, round((p[0] if sw else p[1])*sy, 6) + 0.0)
    return tuple(sorted((f(a), f(b))))
orb = {}
for a, b in E:
    key = min(img_seg(a, b, sx, sy, sw) for sx in (1, -1) for sy in (1, -1) for sw in (0, 1))
    orb.setdefault(key, set()).add((a, b))
keep = {k: v for k, v in orb.items() if len(v) >= 3}
print('edge orbits kept', len(keep), 'of', len(orb))
full = set()
for (a, b) in keep:
    for sx in (1, -1):
        for sy in (1, -1):
            for sw in (0, 1): full.add(img_seg(a, b, sx, sy, sw))
json.dump(sorted(full), open('graphT.json', 'w'))
im = Image.open('tile-composite.png').convert('RGB'); M = im.width; S = M/1.2; d = ImageDraw.Draw(im)
for a, b in full: d.line((M/2 + a[0]*S, M/2 - a[1]*S, M/2 + b[0]*S, M/2 - b[1]*S), fill=(255, 0, 0), width=2)
im.save('graphT.png')
