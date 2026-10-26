"""Helps devise a construction: for each line the drawing needs and the
construction does not have yet, lists the crossings of the construction's
lines and circles that lie on it, so that one ruler step (a horizontal,
vertical or diagonal line through that crossing) adds it.

Use from a generator after building the known steps:
    import find_crossings; find_crossings.report(polys)
where polys are the drawing's pieces in the tutorial's frame (common.frame_pieces).
Prints each missing line as (direction, x·n) and the named element pairs
crossing on it inside the cell, simplest (fewest @-copies) first.
"""
import math

import common as cm

SCALE = 1   # set to 3 when the drawing's unit is a third of OA
DIRS = {0: (0.0, 1.0), 45: (-math.sqrt(0.5), math.sqrt(0.5)), 90: (-1.0, 0.0), 135: (-math.sqrt(0.5), -math.sqrt(0.5))}


def line_key(a, b):
    d = (b[0] - a[0], b[1] - a[1])
    ang = round(math.degrees(math.atan2(d[1], d[0])) / 45) * 45 % 180
    n = DIRS[ang]
    c = a[0] * n[0] + a[1] * n[1]
    # snap 2c·SCALE to a + b·√2/2
    H = math.sqrt(0.5)
    m = 2 * SCALE
    best = min(((abs(m * c - k - j * H), k + j * H) for j in range(-16, 17) for k in [round(m * c - j * H)]))
    return ang, round(best[1] / m, 9)


def have(key):
    ang, c = key
    n = DIRS[ang]
    for nm in cm.lines():
        (q, u) = cm.el[nm][1]
        uang = round(math.degrees(math.atan2(u[1], u[0])) / 45) * 45 % 180
        if uang == ang and abs(q[0] * n[0] + q[1] * n[1] - c) < 1e-4:
            return nm
    return None


def report(polys, hcell=1.0, vcell=None, reach=1.6):
    vcell = hcell if vcell is None else vcell
    need = set()
    for Q in polys:
        if max(abs(v) for q in Q for v in q) > 3:
            continue
        for i in range(len(Q)):
            for a, b in cm.clip([(Q[i], Q[(i + 1) % len(Q)])], hcell, vcell):
                if math.dist(a, b) > 0.01:
                    need.add(line_key(a, b))
    names = [n for n, (k, _) in cm.el.items() if k in ('line', 'circle')]
    pts = []
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            try:
                xs = cm.crossings(a, b)
            except ZeroDivisionError:
                xs = []
            for p in xs:
                if abs(p[0]) <= reach and abs(p[1]) <= reach:
                    pts.append((a.count('@') + b.count('@'), a, b, p))
    pts.sort(key=lambda t: t[0])
    for key in sorted(need):
        if have(key):
            continue
        ang, c = key
        n = DIRS[ang]
        hits = [(a, b, (round(p[0], 4), round(p[1], 4))) for _, a, b, p in pts
                if abs(p[0] * n[0] + p[1] * n[1] - c) < 1e-6]
        print('missing', key, 'through', hits[:6])
