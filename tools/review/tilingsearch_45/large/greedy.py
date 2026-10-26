"""The batch 17 search for large panels: which lines the drawing needs, which
the construction lacks, and a greedy plan that draws every missing line as a
parallel through a crossing of earlier lines (rot4, or rot8 when an axis line
and a diagonal share their distance), for parallels.emit to write as steps.

Use from a scratch script: build the opening with the generator's helpers,
then `nd = need(polys, L)`, `report(polys, L)`, `plan(polys, L, reach=1.1 * L)`;
`compass_marks(d)` lists one-circle ways to mark distance d on a line when
the plan gets stuck. polys are the drawing's pieces in the frame
(common.frame_pieces). Lines are told apart by direction and distance from O
snapped to a + bH. See the batch 17 generators for the plans it gave."""
import math, sys
sys.path.insert(0, __import__('os').path.join(__import__('os').path.dirname(__file__), '..'))
import common as cm
from common import g
H = math.sqrt(.5)
R = '/home/yahya/Documents/projects/Tastir/docs/research/tilingsearch-45/'   # the main checkout's research
DEN = 1


def nrm(ang):
    th = math.radians(ang)
    return (-math.sin(th), math.cos(th))


def lkey(p, d):
    ang = math.degrees(math.atan2(d[1], d[0])) % 180
    a = round(ang / 22.5) * 22.5 % 180
    n = nrm(a)
    return a, p[0] * n[0] + p[1] * n[1]


def snapx(v):
    r, a, b = min(((abs(v - a / DEN - b * H), a, b) for b in range(-24, 25) for a in [round((v - b * H) * DEN)]))
    return round(a / DEN + b * H, 6) + 0.0


def need(polys, L):
    out = {}
    for Q in polys:
        if max(abs(v) for q in Q for v in q) > 3 * L:
            continue
        for i in range(len(Q)):
            for a, b in cm.clip([(Q[i], Q[(i + 1) % len(Q)])], L, L):
                if math.dist(a, b) < 0.01:
                    continue
                k = lkey(a, (b[0] - a[0], b[1] - a[1]))
                kk = (k[0], snapx(k[1]))
                out[kk] = out.get(kk, 0) + math.dist(a, b)
    return out


def have(k, tol=2e-3):
    for nm in cm.lines():
        (q, u) = cm.el[nm][1]
        a, o = lkey(q, u)
        if a == k[0] and abs(o - k[1]) < tol:
            return nm
    return None


def fit(v, den=None):
    den = den or DEN
    r, a, b = min(((abs(v - a / den - b * H), a, b) for b in range(-20, 21) for a in [round((v - b * H) * den)]))
    return '%s%+dH' % (a if den == 1 else f'{a}/{den}', b)


def missing_keys(polys, L, nd=None):
    nd = nd or need(polys, L)
    return [k for k in sorted(nd) if not have(k) and k[0] in (0.0, 45.0) and k[1] >= 0]


def all_crossings(reach, circles=True):
    names = [n for n, (k, _) in cm.el.items() if k == 'line' or (circles and k == 'circle')]
    out = []
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            try:
                xs = cm.crossings(a, b)
            except (ZeroDivisionError, ValueError):
                xs = []
            if cm.el[a][0] == 'circle' and cm.el[b][0] == 'circle':
                (c1, r1), (c2, r2) = cm.el[a][1], cm.el[b][1]
                dd = math.dist(c1, c2)
                if dd < 1e-9 or dd > r1 + r2 + 1e-9 or dd < abs(r1 - r2) - 1e-9:
                    xs = []
            for p in xs:
                if abs(p[0]) <= reach and abs(p[1]) <= reach:
                    score = sum(3 * n.count('@') + (n.startswith('_g')) + 2 * (cm.el[n][0] == 'circle') for n in (a, b))
                    out.append((score, a, b, p))
    out.sort(key=lambda t: t[0])
    return out


def report(polys, L, reach=None, maxhits=6):
    reach = reach or L * 1.01
    nd = need(polys, L)
    xs = all_crossings(reach)
    mk = missing_keys(polys, L, nd)
    for k in mk:
        n = nrm(k[0])
        hits = [(a, b, (round(p[0], 3), round(p[1], 3))) for _, a, b, p in xs if abs(p[0] * n[0] + p[1] * n[1] - k[1]) < 1e-6]
        print('missing', k, fit(k[1]), 'len %.2f' % nd[k], hits[:maxhits])
    print('missing count', len(mk), 'of', len([k for k in nd if k[0] in (0.0, 45.0) and k[1] >= 0]))
    used = set()
    for k in nd:
        h = have(k)
        if h:
            used.add(h)
    print('lines not needed:', [n for n in cm.lines() if n not in used and '@' not in n])


def greedy(polys, L, reach=None, verbose=True, circles=False):
    """Adds every missing line that runs through a crossing (of two lines, or
    with circles=True also circles), as a parallel turned by rot4."""
    reach = reach or L * 1.01
    added = []
    nd = need(polys, L)
    while True:
        mk = missing_keys(polys, L, nd)
        xs = all_crossings(reach, circles)
        done = False
        for k in mk:
            n = nrm(k[0])
            hits = [(s, a, b, p) for s, a, b, p in xs if abs(p[0] * n[0] + p[1] * n[1] - k[1]) < 1e-6]
            if not hits:
                continue
            s, a, b, p = hits[0]
            added.append((k, a, b, p))
            if verbose:
                print('add', k, fit(k[1]), 'through', a, b, (round(p[0], 3), round(p[1], 3)), 'alts', [(h[1], h[2]) for h in hits[1:4]])
            nm = f'_g{len(added)}'
            ref = {0.0: 'h', 45.0: 'd45'}[k[0]]
            d = cm.el[ref][1][1]
            cm.el[nm] = ('line', (p, d))
            for j in range(1, 4):
                t = math.pi / 2 * j
                q = (p[0] * math.cos(t) - p[1] * math.sin(t), p[0] * math.sin(t) + p[1] * math.cos(t))
                dd = (d[0] * math.cos(t) - d[1] * math.sin(t), d[0] * math.sin(t) + d[1] * math.cos(t))
                cm.el[f'{nm}@{j}'] = ('line', (q, dd))
            done = True
            break
        if not done:
            break
    print('still missing:', [(k, fit(k[1])) for k in missing_keys(polys, L, nd)])
    return added


def compass_marks(target, line='h', reach=30, maxr=4):
    """Ways to mark the point of `line` at distance `target` from O with one
    circle: centre a crossing on the line, radius the distance between two
    named points (or a circle's radius)."""
    (q, u) = cm.el[line][1]
    pts = [n for n, (k, _) in cm.el.items() if k == 'point']
    xs = [p for s, a, b, p in all_crossings(reach, circles=False) if line in (a, b)]
    xs += [cm.el[n][1] for n in pts if cm.on_line(cm.el[n][1], line)]
    centres = sorted(set((round((p[0] - q[0]) * u[0] + (p[1] - q[1]) * u[1], 6)) for p in xs))
    radii = {}
    for i, a in enumerate(pts):
        for b in pts[i + 1:]:
            r = round(math.dist(cm.el[a][1], cm.el[b][1]), 6)
            if 1e-6 < r <= maxr and r not in radii:
                radii[r] = (a, b)
    out = []
    for c0 in centres:
        for r, ab in radii.items():
            for sg in (1, -1):
                if abs(abs(c0 + sg * r) - target) < 1e-6:
                    out.append((c0, r, ab))
    return out


ORDER = {}
CYCLES = [['h', 'v'], ['d45', 'd135'], ['gx', 'gy', 'gxw', 'gys']]


def rot_name(n, j):
    j %= 4
    if j == 0:
        return n
    if '@' in n:
        b, i = n.split('@')
        k = ORDER.get(b, 4)
        i = (int(i) + j * k // 4) % k
        return b if i == 0 else f'{b}@{i}'
    if len(n) == 3 and n[0] == 'q' and n[1] in '01' and n[2] in '1234':
        return f'q{n[1]}{(int(n[2]) - 1 + j) % 4 + 1}'
    for cyc in CYCLES:
        if n in cyc:
            return cyc[(cyc.index(n) + j) % len(cyc)]
    if n + '@1' in cm.el:
        return f'{n}@{j * ORDER.get(n, 4) // 4}'
    return None


PREFIX = 'm'
ROT8 = True


def score_names(a, b, p):
    s = 0
    for n in (a, b):
        s += 3 * n.count('@') + 2 * (cm.el[n][0] == 'circle') + (n[:1] == PREFIX[:1] and n[1:2].isdigit())
    s += 0.5 * (p[0] < -1e-9) + 0.5 * (p[1] < -1e-9)
    return s


def plan(polys, L, reach=None, circles=False, start=1, verbose=True, pletter='P'):
    """Greedy: every missing line through an existing crossing, as a parallel
    through a new point P<n> (line m<n>, copies by rot4). Returns the plan."""
    reach = reach or L * 1.01
    nd = need(polys, L)
    out = []
    n = start
    while True:
        mk = missing_keys(polys, L, nd)
        xs = all_crossings(reach, circles)
        best = None
        for k in mk:
            nv = nrm(k[0])
            for s, a, b, p in xs:
                if abs(p[0] * nv[0] + p[1] * nv[1] - k[1]) > 1e-6:
                    continue
                for j in range(4):
                    ra, rb = rot_name(a, -j), rot_name(b, -j)
                    if ra is None or rb is None:
                        if j:
                            continue
                        ra, rb = a, b
                    t = -math.pi / 2 * j
                    q = (p[0] * math.cos(t) - p[1] * math.sin(t), p[0] * math.sin(t) + p[1] * math.cos(t))
                    ref = rot_name({0.0: 'h', 45.0: 'd45'}[k[0]], -j)
                    sc = score_names(ra, rb, q)
                    if best is None or sc < best[0]:
                        best = (sc, k, ra, rb, q, ref)
            if best is not None:
                break
        if best is None:
            break
        sc, k, a, b, q, ref = best
        lname = f'{PREFIX}{n}'
        old = g.named_at(q)
        if old:
            pname = old
        else:
            pname = f'{pletter}{len([e for e in out if e[0].startswith(pletter) and not e[6]]) + start}'
            g.meet(pname, a, b, q)
        g.line_par(lname, pname, ref)
        other = (45.0 if k[0] == 0.0 else 0.0, k[1])
        by = 'rot8' if ROT8 and other in nd and not have(other) else 'rot4'
        ORDER[lname] = int(by[3:])
        g.repeat(lname + 'r', [lname], by)
        out.append((pname, a, b, (round(q[0], 6), round(q[1], 6)), ref, fit(k[1]), bool(old), by))
        if verbose:
            print(out[-1], 'score', sc)
        n += 1
    print('still missing:', [(k, fit(k[1])) for k in missing_keys(polys, L, nd)])
    return out
