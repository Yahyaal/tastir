import math, json, itertools
trace = json.load(open('trace12.json'))
targets = [(t[0], t[1]) for t in trace]
def fold(x, y):
    r = math.hypot(x, y); t = math.degrees(math.atan2(y, x)) % 30
    if t > 15: t = 30 - t
    return (r, t)
def ds_through(p, phi):
    r, t = p; out = []
    for k in range(-6, 7):
        d = r*math.cos(math.radians(t - phi - 30*k))
        if 0.0 < d < 0.52: out.append(d)
    return out
def line(phi, d, k, m=1):
    a = math.radians(m*(phi + 30*k)); return (math.cos(a), math.sin(a), d)
def meet(L1, L2):
    a1, b1, c1 = L1; a2, b2, c2 = L2; det = a1*b2 - a2*b1
    if abs(det) < 1e-9: return None
    return ((c1*b2 - c2*b1)/det, (a1*c2 - a2*c1)/det)
def points(fams):
    pts = {(0.0, 0.0): 'O', fold(0.5, 0): 'M', fold(0.5, 0.5): 'C'}
    lines = []
    for (phi, d) in fams:
        for k in range(12):
            for m in (1, -1): lines.append(line(phi, d, k, m))
    base = [line(phi, d, 0) for (phi, d) in fams]
    for L1 in base:
        for L2 in lines:
            p = meet(L1, L2)
            if p and math.hypot(*p) < 0.56:
                f = fold(*p); pts.setdefault((round(f[0], 6), round(f[1], 6)), 'x')
    return pts
fams = []; used = set(); log = []
tol = float(__import__('sys').argv[1]) if len(__import__('sys').argv) > 1 else 0.006
while True:
    pts = points(fams)
    # circle-through-point to axes: points on axes at radius r (t = 0 or 15)
    ext = list(pts) + [(p[0], 0.0) for p in pts] + [(p[0], 15.0) for p in pts]
    best = None
    for i, (phi, d) in enumerate(targets):
        if i in used: continue
        for p in ext:
            for c in ds_through(p, phi):
                e = abs(c - d)
                if e < tol and (best is None or e < best[0]): best = (e, i, phi, c, p)
    if not best: break
    e, i, phi, c, p = best; used.add(i); fams.append((phi, c))
    log.append((phi, round(targets[i][1], 4), round(c, 5), round(e, 4), (round(p[0], 4), round(p[1], 2))))
for l in log: print('phi', l[0], 'measured', l[1], 'built', l[2], 'err', l[3], 'through (r, deg)', l[4])
print('unexplained:', [targets[i] for i in range(len(targets)) if i not in used])
json.dump(fams, open('fams12.json', 'w'))
