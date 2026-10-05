import json, math
D = json.load(open('ideal12f.json')); P = {int(k): tuple(2*x for x in v) for k, v in D['P'].items()}
x2, y2 = P[2]; P[0] = (x2 - y2, 0.0)
EDGES = [(2,3,0,1),(2,3,1,1),(3,4,0,1),(4,5,0,1),(5,6,0,1),(6,7,0,1),(7,8,0,1),(8,9,0,1),(9,10,0,1),(9,11,0,1),(11,12,0,1),(12,13,0,1),(6,6,1,-1),(8,8,0,-1),(9,10,1,-1),(5,4,0,-1),(12,13,0,-1),(2,0,0,1),(2,0,1,1)]
def inst(c, k, sg):
    x, y = P[c]; r = math.hypot(x, y); t = math.atan2(y, x); a = math.radians(30*k) + sg*t
    return (r*math.cos(a), r*math.sin(a))
def allinst(c): return [inst(c, k, s) for k in range(12) for s in (1, -1)]
# families: key (phi, d) -> member classes
fam = {}
for a, b, k, sg in EDGES:
    p, q = inst(a, 0, 1), inst(b, k, sg)
    dx, dy = q[0]-p[0], q[1]-p[1]; L = math.hypot(dx, dy); n = (-dy/L, dx/L); d = p[0]*n[0] + p[1]*n[1]
    if d < 0: n = (-n[0], -n[1]); d = -d
    ang = math.degrees(math.atan2(n[1], n[0])) % 30; phi = 0 if min(ang, 30-ang) < 7.5 else 15
    key = (phi, round(d, 5)); fam.setdefault(key, set()).update((a, b))
fams = sorted(fam)
on = lambda c, f: any(abs(abs(px*math.cos(math.radians(f[0] + 30*k)) + py*math.sin(math.radians(f[0] + 30*k))) - f[1]) < 1e-4 for (px, py) in allinst(c) for k in range(12))
member = {f: {c for c in P if on(c, f)} for f in fams}
radial = [f for f in fams if f[1] < 1e-6]
known = {9, 13}; drawn = []; order = []
# a vertex is known once two drawn families (different directions at it) pass through it; rays count
def lines_at(c):
    return [f for f in drawn if c in member[f]] + (['axis'] if abs(P[c][1]) < 1e-9 or abs(math.degrees(math.atan2(P[c][1], P[c][0])) - 15) < 1e-6 else [])
changed = True
while changed:
    changed = False
    for f in fams:
        if f in drawn or f[1] < 1e-6: continue
        if len(order) and False: pass
        thru = member[f] & known
        if thru:
            drawn.append(f); order.append((f, min(thru))); changed = True
            for c in P:
                if c not in known and len(set(map(str, lines_at(c)))) >= 2: known.add(c)
            break
    if not changed:
        # helper: a family through a known corner that also passes through an unknown one
        best = None
        for c in sorted(known):
            for (px, py) in allinst(c):
                for phi in (0, 15):
                    for k in range(12):
                        a = math.radians(phi + 30*k); d = abs(px*math.cos(a) + py*math.sin(a))
                        f = (phi, round(d, 5))
                        if f in drawn or d < 1e-6: continue
                        if f not in member: member[f] = {cc for cc in P if on(cc, f)}
                        gain = [u for u in member[f] - known if len(set(map(str, lines_at(u)))) >= 1]
                        if gain and (best is None or len(gain) > best[0]): best = (len(gain), f, c)
        if best:
            _, f, c = best; drawn.append(f); order.append((f, c, 'helper')); changed = True
            for cc in P:
                if cc not in known and len(set(map(str, lines_at(cc)))) >= 2: known.add(cc)
print('families', len(fams), '(radial', len(radial), ')')
for o in order: print(f'normal {o[0][0]:2d}°, touches r={o[0][1]:.4f}: through corner class {o[1]}; members {sorted(member[o[0]])}', *o[2:])
print('known corners', sorted(known), 'missing', sorted(set(P) - known), 'undrawn', [f for f in fams if f not in drawn and f[1] > 1e-6]); print('steps', len(order))
