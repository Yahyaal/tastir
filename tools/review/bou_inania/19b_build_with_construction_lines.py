import json, math
D = json.load(open('ideal12c.json')); P = {int(k): tuple(v) for k, v in D['P'].items()}
def insts(c):
    x, y = P[c]; r = math.hypot(x, y); t = math.atan2(y, x)
    return [(r*math.cos(math.radians(30*k) + sg*t), r*math.sin(math.radians(30*k) + sg*t)) for k in range(12) for sg in (1, -1)]
known = [(0.0, 0.0), (0.5, 0), (0, 0.5), (-0.5, 0), (0, -0.5), (0.5, 0.5), (-0.5, 0.5), (0.5, -0.5), (-0.5, -0.5), (1, 0), (0, 1)] + insts(9)
kc = {9}; log = []
tol = 2e-6
changed = True
while changed:
    changed = False
    for c in sorted(P):
        if c in kc: continue
        v = P[c]; dirs = {}
        for d in range(0, 180, 15):
            a = math.radians(d)
            for q in known:
                if math.dist(q, v) < 1e-9: continue
                if abs((q[0]-v[0])*math.sin(a) - (q[1]-v[1])*math.cos(a)) < tol:
                    dirs.setdefault(d, (round(q[0],4), round(q[1],4))); break
        if len(dirs) >= 2:
            kc.add(c); changed = True; known += insts(c)
            log.append((c, list(dirs.items())[:3]))
for l in log: print(l)
print('reached', sorted(kc), 'missing', sorted(set(P) - kc))
