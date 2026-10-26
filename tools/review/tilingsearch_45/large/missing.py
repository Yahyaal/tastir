"""missing(polys, L): lines the drawing needs inside the cell |x|,|y| <= L that the
construction lacks, with crossings of existing elements lying on each (simplest first)."""
import math, sys
sys.path.insert(0, '/home/yahya/Documents/projects/Tastir/.claude/worktrees/agent-a0638ace160955a10/tools/review/tilingsearch_45')
import common as cm
H = math.sqrt(.5)
DIRS = {0: (0.0, 1.0), 45: (-H, H), 90: (-1.0, 0.0), 135: (-H, -H)}


def snapv(v):
    return min(((abs(v - k - j * H), k + j * H, (k, j)) for j in range(-30, 31) for k in [round(v - j * H)]))


def key(a, b):
    d = (b[0] - a[0], b[1] - a[1])
    ang = round(math.degrees(math.atan2(d[1], d[0])) / 45) * 45 % 180
    n = DIRS[ang]
    c = a[0] * n[0] + a[1] * n[1]
    r, v, kj = snapv(c)
    return ang, round(v, 7)


def have(k):
    ang, c = k
    n = DIRS[ang]
    for nm in cm.lines():
        (q, u) = cm.el[nm][1]
        uang = round(math.degrees(math.atan2(u[1], u[0])) / 45) * 45 % 180
        if uang == ang and abs(q[0] * n[0] + q[1] * n[1] - c) < 1e-4:
            return nm
    return None


def report(polys, L, reach=None, only_first_octant=True):
    reach = reach or L
    need = set()
    for Q in polys:
        if max(abs(v) for q in Q for v in q) > 3 * L:
            continue
        for i in range(len(Q)):
            for a, b in cm.clip([(Q[i], Q[(i + 1) % len(Q)])], L, L):
                if math.dist(a, b) > 0.01:
                    need.add(key(a, b))
    names = [n for n, (k, _) in cm.el.items() if k in ('line', 'circle')]
    pts = []
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            try:
                xs = cm.crossings(a, b)
            except ZeroDivisionError:
                xs = []
            for p in xs:
                if abs(p[0]) <= reach + 1e-6 and abs(p[1]) <= reach + 1e-6:
                    pts.append((a.count('@') + b.count('@'), a, b, p))
    pts.sort(key=lambda t: t[0])
    out = []
    for k in sorted(need):
        if have(k):
            continue
        ang, c = k
        if only_first_octant and (ang not in (90, 135) or c < 0) and not (ang == 0 and c > 0):
            pass
        n = DIRS[ang]
        hits = [(a, b, (round(p[0], 4), round(p[1], 4))) for _, a, b, p in pts
                if abs(p[0] * n[0] + p[1] * n[1] - c) < 1e-6]
        out.append((k, hits[:5]))
        print('missing', k, 'c=%s' % (snapv(c)[2],), 'through', hits[:5])
    return out
