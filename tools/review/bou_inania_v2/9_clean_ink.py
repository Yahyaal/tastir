#!/usr/bin/env python3
"""Cleans the chosen ink before the tutorial is built:
  - fills a gap shorter than 0.05 between two inked stretches of one line
    (the line runs straight on; a detour round the gap is not drawn);
  - removes a run of ink along one line shorter than 0.05 (a stub of a
    nearly coincident line, such as the bar across the crossings at r 1.8);
  - removes stretches that dangle (loose ends inside the frame), to a fixpoint;
  - where two nearly equal lines leave a tiny triangle (area below 2e-3),
    drops the triangle's shortest side, if no loose end follows.

Usage: 9_clean_ink.py ink.json   (rewritten in place)
"""
import json, math, sys
ink_path = sys.argv[1]
sets = json.load(open(__file__.rsplit('/', 1)[0] + '/sets.json'))
F = [s for s in sets if s['label'] == 'F'][0]['d']
E = 2 * math.cos(math.radians(15)) ** 2


def key(p):
    return (round(p[0], 4) + 0.0, round(p[1], 4) + 0.0)


raw = json.load(open(ink_path))
exact = {}
for a, b in raw:
    exact[key(a)] = a; exact[key(b)] = b
ink = {tuple(sorted((key(a), key(b)))) for a, b in raw}


def images(m):
    a, b = exact[m[0]], exact[m[1]]
    out = set()
    if max(math.hypot(*a), math.hypot(*b)) < E - 1e-6:
        for k in range(12):
            for s in (1, -1):
                t = math.radians(30 * k)
                f = lambda p: (p[0] * math.cos(t) - s * p[1] * math.sin(t), p[0] * math.sin(t) + s * p[1] * math.cos(t))
                out.add(tuple(sorted((key(f(a)), key(f(b))))))
    for sx in (1, -1):
        for sy in (1, -1):
            for sw in (0, 1):
                f = lambda p: ((p[1] if sw else p[0]) * sx, (p[0] if sw else p[1]) * sy)
                out.add(tuple(sorted((key(f(a)), key(f(b))))))
    return out & ink


def on_frame(z):
    return abs(abs(z[0]) - F) < 1e-3 or abs(abs(z[1]) - F) < 1e-3


def degrees(ink):
    deg = {}
    for m in ink:
        for z in m:
            deg[z] = deg.get(z, 0) + 1
    return deg


def drop_loose(ink):
    while True:
        deg = degrees(ink)
        loose = {m for m in ink if any(deg[z] == 1 and not on_frame(z) for z in m)}
        if not loose:
            return ink
        ink = ink - loose


c15 = math.cos(math.radians(15)); rho = math.tan(math.radians(37.5))
fams = [(15, rho * math.cos(math.radians(75)), 12, False), (0, E, 12, False)] + [(t['normal'], t['d'], t['turns'], t['mirror']) for t in sets]
lines = []
for phi, d, n, mir in fams:
    for sg in ((1, -1) if mir else (1,)):
        for k in range(n):
            t = math.radians(sg * phi + 360 / n * k)
            lines.append((math.cos(t), math.sin(t), d))


def runs(ink):
    """For each line: its inked stretches as (t1, t2, stretch), sorted."""
    out = []
    for nx, ny, d in lines:
        on = []
        for m in ink:
            a, b = exact[m[0]], exact[m[1]]
            if abs(a[0] * nx + a[1] * ny - d) < 1e-7 and abs(b[0] * nx + b[1] * ny - d) < 1e-7:
                ta, tb = -a[0] * ny + a[1] * nx, -b[0] * ny + b[1] * nx
                on.append((min(ta, tb), max(ta, tb), m, a if ta < tb else b, b if ta < tb else a))
        out.append(sorted(on))
    return out


for on in runs(ink):
    for (s1, e1, m1, _, end1), (s2, e2, m2, start2, _) in zip(on, on[1:]):
        if 1e-9 < s2 - e1 < 0.05:
            ink.add(tuple(sorted((key(end1), key(start2)))))
for on in runs(ink):
    chain = []
    for item in on + [None]:
        if item and chain and item[0] - chain[-1][1] < 1e-9:
            chain.append(item); continue
        if chain and chain[-1][1] - chain[0][0] < 0.05:
            ink -= {c[2] for c in chain}
        chain = [item] if item else []
ink = drop_loose(ink)
for _ in range(10):
    nb = {}
    for m in ink:
        nb.setdefault(m[0], set()).add(m[1]); nb.setdefault(m[1], set()).add(m[0])
    tris = set()
    for a in nb:
        for b in nb[a]:
            for c in nb[a] & nb[b]:
                A, B, C = exact[a], exact[b], exact[c]
                area = abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2
                if area < 2e-3:
                    tris.add(tuple(sorted((a, b, c))))
    changed = False
    for t in sorted(tris):
        sides = sorted((tuple(sorted(p)) for p in ((t[0], t[1]), (t[1], t[2]), (t[0], t[2]))), key=lambda m: math.dist(exact[m[0]], exact[m[1]]))
        if not all(s in ink for s in sides):
            continue
        for s in sides:
            orb = images(s)
            trial = ink - orb
            if drop_loose(trial) == trial:
                ink = trial; changed = True
                break
    if not changed:
        break
ink = drop_loose(ink)
json.dump([[list(exact[a]), list(exact[b])] for a, b in sorted(ink)], open(ink_path, 'w'))
print(len(raw), '->', len(ink), 'stretches')

# With a dump of the built tutorial (dump.ts), also open up the tiny pieces
# the engine still finds: drop the shortest inked side of each, and whatever
# then dangles.
if len(sys.argv) > 2:
    dump = json.load(open(sys.argv[2]))
    for p in dump['pieces']:
        if dump['types'][p['type']]['area'] > 1e-3:
            continue
        poly = p['polygon']
        sides = []
        for u, w in zip(poly, poly[1:] + poly[:1]):
            for m in ink:
                a, b = exact[m[0]], exact[m[1]]
                d = (b[0] - a[0], b[1] - a[1]); L = math.hypot(*d)
                on = lambda q: abs((q[0] - a[0]) * d[1] - (q[1] - a[1]) * d[0]) / L < 1e-6 and -1e-6 <= ((q[0] - a[0]) * d[0] + (q[1] - a[1]) * d[1]) / L ** 2 <= 1 + 1e-6
                if on(((u[0] + w[0]) / 2, (u[1] + w[1]) / 2)):
                    sides.append(m)
        for m in sorted(set(sides), key=lambda m: math.dist(exact[m[0]], exact[m[1]])):
            trial = drop_loose(ink - images(m))
            if sum(math.dist(exact[x[0]], exact[x[1]]) for x in ink - trial) < 0.15:
                ink = trial
                break
    json.dump([[list(exact[a]), list(exact[b])] for a, b in sorted(ink)], open(ink_path, 'w'))
    print('after the tiny pieces:', len(ink), 'stretches')
