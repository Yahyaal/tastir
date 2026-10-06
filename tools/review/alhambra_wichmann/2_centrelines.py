"""Band centre lines of a Tiling Search drawing: measures the band width (the
gap between parallel facing edges of neighbouring pieces) and moves every
piece's edges out by half of it. Prints the lattice of the large stars and the
corners of the offset pieces in units of the star spacing / n.
Usage: 2_centrelines.py <name> <n>   (from docs/research/alhambra-wichmann/)"""
import json, math, sys
from collections import Counter
name, n = sys.argv[1], int(sys.argv[2])
ps = json.load(open(f'{name}-pieces.json'))
def edges(P):
    for i in range(len(P)):
        yield P[i], P[(i+1) % len(P)]
gaps = []
for i, p in enumerate(ps):
    for a, b in edges(p['poly']):
        L = math.dist(a, b); u = ((b[0]-a[0])/L, (b[1]-a[1])/L); nv = (u[1], -u[0])
        m = ((a[0]+b[0])/2, (a[1]+b[1])/2)
        best = None
        for j, q in enumerate(ps):
            if j == i: continue
            for c, d in edges(q['poly']):
                L2 = math.dist(c, d); u2 = ((d[0]-c[0])/L2, (d[1]-c[1])/L2)
                if abs(u[0]*u2[1] - u[1]*u2[0]) > 1e-3: continue
                g = (c[0]-m[0])*nv[0] + (c[1]-m[1])*nv[1]
                # the facing edge must overlap along the line
                t1 = (c[0]-m[0])*u[0] + (c[1]-m[1])*u[1]; t2 = (d[0]-m[0])*u[0] + (d[1]-m[1])*u[1]
                if min(t1, t2) > L/2 or max(t1, t2) < -L/2: continue
                if abs(g) > 0.5 and (best is None or abs(g) < abs(best)): best = g
        if best is not None: gaps.append(round(abs(best), 1))
print('gaps between facing edges:', Counter(gaps).most_common(6))
w = Counter(gaps).most_common(1)[0][0]
def offset(P, h):
    # orientation: make counter-clockwise in y-down coords -> outward normal
    A = 0.5*sum(P[i-1][0]*P[i][1] - P[i][0]*P[i-1][1] for i in range(len(P)))
    s = 1 if A > 0 else -1
    lines = []
    for a, b in edges(P):
        L = math.dist(a, b); u = ((b[0]-a[0])/L, (b[1]-a[1])/L); nv = (s*u[1], -s*u[0])
        lines.append(((a[0]+h*nv[0], a[1]+h*nv[1]), u))
    out = []
    for i in range(len(lines)):
        (p1, u1), (p2, u2) = lines[i-1], lines[i]
        det = u1[0]*(-u2[1]) - u1[1]*(-u2[0])
        t = ((p2[0]-p1[0])*(-u2[1]) - (p2[1]-p1[1])*(-u2[0]))/det
        out.append((p1[0]+t*u1[0], p1[1]+t*u1[1]))
    return out
big = max(ps, key=lambda p: p['area'])['area']
stars = [p['c'] for p in ps if abs(p['area'] - big) < 0.01*big]
c0 = min(stars, key=lambda c: math.dist(c, (306, 396)))
sp = sorted(math.dist(c0, c) for c in stars if c != c0)[0]
print('band width', w, 'star spacing', round(sp, 2), 'stars', len(stars))
unit = sp/n
cent = []
for p in ps:
    Q = offset(p['poly'], w/2)
    cent.append([((x-c0[0])/unit, -(y-c0[1])/unit) for x, y in Q])
off = Counter()
for Q in cent:
    for x, y in Q: off[(round(x - round(x), 2), round(y - round(y), 2))] += 1
print('corner offsets from the grid (x, y), most common:', off.most_common(8))
json.dump({'unit': unit, 'band': w, 'origin': c0, 'pieces': cent}, open(f'{name}-centre.json', 'w'))
