#!/usr/bin/env python3
"""Builds the tutorial for Design E: the twelve-fold rosette wall of the Bou
Inania madrasa in Fès, read from the photo (see README.md, steps 1-20).

Units: OA = 1, with A the midpoint between two rosettes, so the rosettes sit
two apart on a square grid and the tile's corners (the eight-fold stars) are
at (±1, ±1). Every point comes from crossings of earlier lines and circles.

Usage: gen_design_e.py <research dir> <out.json>
"""
import json
import math
import sys

EPS = 1e-7
el = {}        # name -> ('point', p) | ('line', (p, d)) | ('circle', (c, r))
steps = []
cur = None


def step(text, animate='ruler', highlight=None):
    global cur
    cur = {'id': len(steps) + 1, 'text': text, 'create': {}}
    if highlight:
        cur['highlight'] = highlight
    cur['animate'] = animate
    steps.append(cur)


def put(name, kind, geom, spec):
    assert name not in el, name
    el[name] = (kind, geom)
    cur['create'][name] = spec


def unit(d):
    n = math.hypot(*d)
    return (d[0] / n, d[1] / n)


def dirdeg(a):
    return (math.cos(math.radians(a)), math.sin(math.radians(a)))


def P(n):
    k, g = el[n]
    assert k == 'point', n
    return g


# ---- elements -------------------------------------------------------------

def given():
    el['O'] = ('point', (0.0, 0.0))
    el['A'] = ('point', (1.0, 0.0))


def line_through(name, a, b):
    put(name, 'line', (P(a), unit((P(b)[0] - P(a)[0], P(b)[1] - P(a)[1]))), {'line': {'through': [a, b]}})


def line_par(name, p, ref):
    put(name, 'line', (P(p), el[ref][1][1]), {'line': {'through': p, 'parallelTo': ref}})


def line_perp(name, p, ref):
    d = el[ref][1][1]
    put(name, 'line', (P(p), (-d[1], d[0])), {'line': {'through': p, 'perpendicularTo': ref}})


def line_bisect(name, p, q, r):
    a = unit((P(p)[0] - P(q)[0], P(p)[1] - P(q)[1]))
    b = unit((P(r)[0] - P(q)[0], P(r)[1] - P(q)[1]))
    put(name, 'line', (P(q), unit((a[0] + b[0], a[1] + b[1]))), {'line': {'through': q, 'bisects': [p, q, r]}})


def circle_through(name, c, p):
    put(name, 'circle', (P(c), math.dist(P(c), P(p))), {'circle': {'centre': c, 'through': p}})


def circle_from(name, c, p, q):
    put(name, 'circle', (P(c), math.dist(P(p), P(q))), {'circle': {'centre': c, 'radiusFrom': [p, q]}})


def crossings(a, b):
    ka, ga = el[a]
    kb, gb = el[b]
    if ka == 'circle' and kb == 'line':
        a, b, ka, kb, ga, gb = b, a, kb, ka, gb, ga
    if ka == 'line' and kb == 'line':
        (p, d), (q, e) = ga, gb
        det = d[0] * (-e[1]) - d[1] * (-e[0])
        if abs(det) < 1e-12:
            return []
        t = ((q[0] - p[0]) * (-e[1]) - (q[1] - p[1]) * (-e[0])) / det
        return [(p[0] + t * d[0], p[1] + t * d[1])]
    if ka == 'line' and kb == 'circle':
        (p, d), (c, r) = ga, gb
        f = ((c[0] - p[0]) * d[0] + (c[1] - p[1]) * d[1])
        foot = (p[0] + f * d[0], p[1] + f * d[1])
        h2 = r * r - math.dist(foot, c) ** 2
        if h2 < -1e-12:
            return []
        h = math.sqrt(max(h2, 0))
        return [(foot[0] + h * d[0], foot[1] + h * d[1]), (foot[0] - h * d[0], foot[1] - h * d[1])]
    (c1, r1), (c2, r2) = ga, gb
    dd = math.dist(c1, c2)
    a_ = (r1 * r1 - r2 * r2 + dd * dd) / (2 * dd)
    h = math.sqrt(max(r1 * r1 - a_ * a_, 0))
    m = (c1[0] + a_ * (c2[0] - c1[0]) / dd, c1[1] + a_ * (c2[1] - c1[1]) / dd)
    o = (-(c2[1] - c1[1]) / dd * h, (c2[0] - c1[0]) / dd * h)
    return [(m[0] + o[0], m[1] + o[1]), (m[0] - o[0], m[1] - o[1])]


def ang(p):
    return math.degrees(math.atan2(p[1], p[0])) % 360


def meet(name, a, b, want):
    """The crossing of a and b closest to `want`, with a pick rule that
    chooses it when they cross more than once."""
    cs = crossings(a, b)
    assert cs, (name, a, b)
    best = min(cs, key=lambda c: math.dist(c, want))
    assert math.dist(best, want) < 1e-6, (name, best, want)
    spec = {'point': {'meet': [a, b]}}
    if len(cs) > 1 and math.dist(cs[0], cs[1]) > 1e-9:
        other = [c for c in cs if c is not best][0]
        if math.hypot(*best) > 1e-6 and abs(((ang(best) - ang(other) + 180) % 360) - 180) > 1:
            spec['point']['pick'] = {'angle': round(ang(best), 3)}
            # the angle pick must be unambiguous
        elif abs(math.hypot(*best) - math.hypot(*other)) > 1e-6:
            spec['point']['pick'] = {'nearest' if math.hypot(*best) < math.hypot(*other) else 'farthest': 'O'}
        else:
            ref = min((n for n, (k, g) in el.items() if k == 'point'),
                      key=lambda n: math.dist(P(n), best) - math.dist(P(n), other))
            assert math.dist(P(ref), best) < math.dist(P(ref), other) - 1e-6, name
            spec['point']['pick'] = {'nearest': ref}
    put(name, 'point', best, spec)
    return name


def repeat(name, of, by):
    """Copies under rot<n> about O or a mirror across a line."""
    copies = []
    if by.startswith('mirror:'):
        p, d = el[by[7:]][1]
        def T(x):
            f = (x[0] - p[0]) * d[0] + (x[1] - p[1]) * d[1]
            foot = (p[0] + f * d[0], p[1] + f * d[1])
            return (2 * foot[0] - x[0], 2 * foot[1] - x[1])
        ts = [T]
    else:
        n = int(by[3:])
        ts = [(lambda x, t=2 * math.pi * (i + 1) / n: (x[0] * math.cos(t) - x[1] * math.sin(t), x[0] * math.sin(t) + x[1] * math.cos(t))) for i in range(n - 1)]
    for o in of:
        k, g = el[o]
        for i, T in enumerate(ts):
            nm = f'{o}@{i + 1}'
            assert nm not in el, ('name clash', nm)
            if k == 'point':
                el[nm] = ('point', T(g))
            elif k == 'line':
                p, d = g
                q = T(p)
                r = T((p[0] + d[0], p[1] + d[1]))
                el[nm] = ('line', (q, unit((r[0] - q[0], r[1] - q[1]))))
            else:
                el[nm] = ('circle', (T(g[0]), g[1]))
            copies.append(nm)
    cur['create'][name] = {'repeat': {'of': of, 'by': by}}
    return copies


def named_at(p, tol=1e-6):
    for n, (k, g) in el.items():
        if k == 'point' and math.dist(g, p) < tol:
            return n
    return None


def lines_through(p, tol=1e-7):
    out = []
    for n, (k, g) in el.items():
        if k == 'line':
            q, d = g
            if abs((p[0] - q[0]) * d[1] - (p[1] - q[1]) * d[0]) < tol:
                out.append(n)
        elif k == 'circle':
            if abs(math.dist(p, g[0]) - g[1]) < tol:
                out.append(n)
    return out


def ensure_point(p, prefix):
    """A name for the point at p, marking a crossing of two drawn lines."""
    n = named_at(p)
    if n:
        return n
    ls = [n for n in lines_through(p) if el[n][0] == 'line']
    pairs = [(a, b) for i, a in enumerate(ls) for b in ls[i + 1:]
             if abs(el[a][1][1][0] * el[b][1][1][1] - el[a][1][1][1] * el[b][1][1][0]) > 1e-6]
    assert pairs, ('no two lines cross at', p, lines_through(p))
    name = f'{prefix}{len([x for x in el if x.startswith(prefix)]) + 1}'
    meet(name, pairs[0][0], pairs[0][1], p)
    return name


# ---- the construction -------------------------------------------------------

def build(research):
    D = json.load(open(f'{research}/ideal12f.json'))
    ideal = {int(k): (2 * v[0], 2 * v[1]) for k, v in D['P'].items()}
    given()

    step('Draw a circle about the centre O through A, and the horizontal line through both. A is halfway to the next rosette: the rosettes of this wall sit on a square grid, two radii apart.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Draw the vertical through O. Through A and through the top of the circle draw lines at right angles to these: they are lines of the grid, and where they cross is the corner K of the tile, where an eight-pointed star will sit.', highlight=['h', 'c'])
    line_perp('v', 'O', 'h')
    meet('N', 'c', 'v', (0, 1))
    line_perp('gx', 'A', 'h')
    line_perp('gy', 'N', 'v')
    meet('K', 'gx', 'gy', (1, 1))

    step('Divide the circle into twelve: with the compass still open to OA, put its point on A and mark where it cuts the circle at 60°. Join O to that mark, and halve the angles between the lines through O, so you have a line through O every 15°.', 'compass', ['c', 'A'])
    circle_through('cA', 'A', 'O')
    meet('P60', 'c', 'cA', dirdeg(60))
    line_through('r60', 'O', 'P60')
    line_through('r45', 'O', 'K')
    line_bisect('r30', 'A', 'O', 'P60')
    meet('P30', 'c', 'r30', dirdeg(30))
    line_bisect('r15', 'A', 'O', 'P30')
    line_bisect('r75', 'P60', 'O', 'N')
    for nm, ref in (('r105', 'r15'), ('r120', 'r30'), ('r135', 'r45'), ('r150', 'r60'), ('r165', 'r75')):
        line_perp(nm, 'O', ref)
    refs = {0: 'h', 15: 'r15', 30: 'r30', 45: 'r45', 60: 'r60', 75: 'r75', 90: 'v', 105: 'r105', 120: 'r120', 135: 'r135', 150: 'r150', 165: 'r165'}

    ideal[0] = (ideal[2][0] - ideal[2][1], 0.0)   # the 45° line through class 2 meets the axis
    WHERE = {0: 'the tip of a small kite between two petals', 2: 'the inner end of a petal',
             3: 'the point between two petals', 4: 'the outer end of a small kite',
             5: 'the shoulder of a petal', 6: 'the outer corner of a petal',
             7: 'the inner point of a small star', 8: 'the point of a small star',
             9: 'the first corner', 10: 'the point of a shield', 11: 'the corner of a pentagon',
             12: 'the corner beside the outer tip', 13: 'the outer tip'}

    def instances(c):
        x, y = ideal[c]
        r = math.hypot(x, y)
        t = math.atan2(y, x)
        out = []
        for k in range(12):
            for sg in (1, -1):
                a = math.radians(30 * k) + sg * t
                out.append((r * math.cos(a), r * math.sin(a)))
        return out

    def corner(c):
        """A named point at a corner of class c already fixed by two lines."""
        for p in sorted(instances(c), key=lambda p: (ang(p) - 1e-9) % 360):
            n = named_at(p, 1e-7)
            if n:
                return n
            ls = [l for l in lines_through(p) if el[l][0] == 'line']
            pairs = [(a, b) for i, a in enumerate(ls) for b in ls[i + 1:]
                     if abs(el[a][1][1][0] * el[b][1][1][1] - el[a][1][1][1] * el[b][1][1][0]) > 1e-6]
            if pairs:
                name = f'C{c}'
                meet(name, pairs[0][0], pairs[0][1], p)
                return name
        raise AssertionError(f'no corner of class {c} is fixed yet')

    count = [0]

    def line_set(phi, d, c, text):
        """Twelve lines touching the circle of radius d about O, normals at
        phi + 30k, drawn through a corner of class c and turned round."""
        X = corner(c)
        p = P(X)
        best = None
        for k in range(12):
            a = phi + 30 * k
            n = dirdeg(a)
            if abs(p[0] * n[0] + p[1] * n[1] - d) < 1e-6:
                best = a
                break
        assert best is not None, (phi, d, c)
        count[0] += 1
        name = f'F{count[0]}'
        line_par(name, X, refs[(best + 90) % 180])
        repeat(f'{name}s', [name], 'rot12')
        return name

    step('Join A to the top of the circle. Through the point of the circle at 45°, draw a line at 60°. Where the two lines cross is the first corner of the rosette.', highlight=['A', 'N'])
    line_through('an', 'A', 'N')
    meet('c45', 'c', 'r45', dirdeg(45))
    line_par('l9', 'c45', 'r60')
    meet('V9', 'an', 'l9', crossings('an', 'l9')[0])

    # The rest of the rosette is thirteen sets of twelve lines (and two
    # helper sets), each drawn through a corner already on the paper and
    # turned round: every set touches one circle about O.
    def sets_step(group, text):
        step(text)
        for (phi, d), c in group:
            line_set(phi, d, c, text)

    sets_step([((0, 0.107206), 9), ((0, 0.258819), 9)],
              'Through the first corner, draw two lines: one at right angles to the 0° direction, one at right angles to the 30° direction. Turn each round the rosette: two sets of twelve lines, each set touching one circle about O. The second set joins points of the first circle 150° apart, like the star lines of a simple rosette.')

    q = min((n for n in el if el[n][0] == 'point' and n != 'V9' and abs(math.hypot(*P(n)) - math.hypot(*ideal[9])) < 1e-7), key=lambda n: abs(ang(P(n)) - 231.42), default=None)
    if q is None:
        target = min(instances(9), key=lambda p: abs(ang(p) - 231.42))
        ls = [l for l in lines_through(target) if el[l][0] == 'line']
        meet('V9b', ls[0], ls[1], target)
        q = 'V9b'
    step('Open the compass from O to the corner K. Put its point on the copy of the first corner down and to the left of O, and mark where the arc crosses the horizontal on the right: this is the outer tip of the rosette.', 'compass', ['O', 'K', q])
    circle_from('ck', q, 'O', 'K')
    meet('V13', 'ck', 'h', ideal[13])

    sets_step([((15, 0.605313), 13)],
              'Through the outer tip, draw a line at 105° and turn it round: the set that will close the shields.')
    sets_step([((0, 0.074468), 8), ((0, 0.64662), 8)],
              'Through the point of a small star, where the last lines cross, draw the two sets that cross there, at right angles to the 0° and the 30° directions.')
    sets_step([((15, 0.651613), 9), ((0, 0.444506), 9)],
              'Through the first corner again, draw two more sets: one that closes the shields, and a helper that fixes the corner beside the outer tip.')
    sets_step([((15, 0.795028), 12), ((15, 0.166401), 12)],
              'Through the corner beside the outer tip, draw two sets: one that closes the pentagons, and a helper reaching in towards the centre.')
    sets_step([((0, 0.135866), 2)],
              'Through the inner end of a petal, draw the set that makes the sides of the petals.')
    sets_step([((0, 0.209179), 5), ((0, 0.403407), 5)],
              'Through the shoulder of a petal, draw two sets: one closes the small kites between the petals, the other runs along the petals’ outer sides.')
    sets_step([((0, 0.356698), 6), ((15, 0.537476), 6)],
              'Through the outer corner of a petal, draw the two sets that make the small stars.')
    sets_step([((15, 0.096072), 0)],
              'Through the tip of a small kite between two petals, draw the last set: it makes the twelve-pointed star at the centre.')

    # the rim: twelve-gon sides at the distance A to the class-3 copy at 60°
    p60 = (ideal[3][0] * 0.5, ideal[3][0] * math.sqrt(3) / 2)
    v3_60 = named_at(p60, 1e-7)
    if not v3_60:
        ls = [l for l in lines_through(p60) if el[l][0] == 'line']
        pairs = [(a, b) for i, a in enumerate(ls) for b in ls[i + 1:]
                 if abs(el[a][1][1][0] * el[b][1][1][1] - el[a][1][1][1] * el[b][1][1][0]) > 1e-6]
        meet('V3', pairs[0][0], pairs[0][1], p60)
        v3_60 = 'V3'
    step('Open the compass from A to the point between two petals at 60°, and draw that circle about O. Where it crosses the horizontal, draw a line at right angles: one side of the twelve-sided rim around the rosette. Copy it round.', 'compass', ['A', v3_60])
    circle_from('cr', 'O', 'A', v3_60)
    meet('RA', 'cr', 'h', crossings('cr', 'h')[0] if crossings('cr', 'h')[0][0] > 0 else crossings('cr', 'h')[1])
    line_perp('rim', 'RA', 'h')
    repeat('rims', ['rim'], 'rot12')

    step('Mark the corners of the rim at 15° and 45°, and draw the level line through the 45° corner.', highlight=['rim', 'rim@1'])
    meet('R15', 'rim', 'rim@1', crossings('rim', 'rim@1')[0])
    meet('R45', 'rim@1', 'rim@2', crossings('rim@1', 'rim@2')[0])
    line_par('oh', 'R45', 'h')

    step('Through K draw the other diagonal. The eight-pointed star at K is two squares: one square\u2019s sides are the rims of the four rosettes around it; the other, turned square has its sides as far from K. Set the compass to that distance (from the rim side to A), draw it about K, and draw the turned square\u2019s sides across the diagonals where the circle cuts them.', 'compass', ['K', 'RA', 'A'])
    line_perp('ad', 'K', 'r45')
    circle_from('cs', 'K', 'RA', 'A')
    corner_lines = []

    def sides_on(circle, axes, prefix):
        """Lines across each axis through K where the circle cuts it."""
        for ax in axes:
            for i, z in enumerate(sorted(crossings(circle, ax), key=lambda z: (round(z[0], 9), round(z[1], 9)))):
                pt = f'{prefix}{ax}{i}'
                meet(pt, circle, ax, z)
                ln = f'{prefix}L{ax}{i}'
                line_perp(ln, pt, ax)
                corner_lines.append(ln)
    sides_on('cs', ['r45', 'ad'], 'S')

    step('The ring around the star is two octagons. The inner one has its square sides through the rim\u2019s 45° corner, the outer one its diagonal side: draw a circle about K through each, and the octagon sides across the grid lines and the diagonals where the circles cut them.', 'compass', ['K', 'R45'])
    meet('Oi', 'oh', 'gx', (1, P('R45')[1]))
    circle_through('ci', 'K', 'Oi')
    circle_through('co', 'K', 'R45')
    sides_on('ci', ['gx', 'gy', 'r45', 'ad'], 'I')
    sides_on('co', ['gx', 'gy', 'r45', 'ad'], 'U')

    step('Copy the star and its ring to the other three corners of the tile by turning them a quarter turn at a time about O, together with the grid lines.')
    repeat('Ks', ['K'], 'rot4')
    repeat('corners', corner_lines + ['gx', 'gy', 'ad'], 'rot4')
    return ideal


EDGES = [(2, 3, 0, 1), (2, 3, 1, 1), (3, 4, 0, 1), (4, 5, 0, 1), (5, 6, 0, 1), (6, 7, 0, 1),
         (7, 8, 0, 1), (8, 9, 0, 1), (9, 10, 0, 1), (9, 11, 0, 1), (11, 12, 0, 1), (12, 13, 0, 1),
         (6, 6, 1, -1), (8, 8, 0, -1), (9, 10, 1, -1), (5, 4, 0, -1), (12, 13, 0, -1), (2, 0, 0, 1), (2, 0, 1, 1)]


def rot(p, deg, m=1):
    x, y = p[0], m * p[1]
    t = math.radians(deg)
    return (x * math.cos(t) - y * math.sin(t), x * math.sin(t) + y * math.cos(t))


def design_segments(ideal):
    """Every ink segment of the wall near the tile, in the frame (OA = 1)."""
    V = dict(ideal)
    def inst(c, k, sg):
        x, y = V[c]
        r = math.hypot(x, y)
        t = math.atan2(y, x)
        a = math.radians(30 * k) + sg * t
        return (r * math.cos(a), r * math.sin(a))
    segs = []
    # the rosette, at O only (its neighbours' parts come from the tile copies)
    for a, b, k, sg in EDGES:
        p, q = inst(a, 0, 1), inst(b, k, sg)
        for r in range(12):
            for m in (1, -1):
                segs.append((rot(p, 30 * r, m), rot(q, 30 * r, m)))
    a = P('RA')[0]
    # spokes from each shield tip out to the middle of its rim side
    for r in range(12):
        segs.append((rot(P('V13'), 30 * r), rot((a, 0.0), 30 * r)))
    R15, R45, K = P('R15'), P('R45'), (1.0, 1.0)
    din = 1 - R45[1]
    dout = math.dist(K, R45)
    d1 = 1 - a
    wedge = []
    wedge.append(((a, 0), R15))                       # rim: vertical side
    wedge.append((R15, R45))                          # rim: side at 30°
    wedge.append((R15, (a, 1 - dout)))                # strip: the rim side carried on
    vy = R15[1] - (1 - R15[0]) * math.tan(math.radians(60))
    wedge.append((R15, (1.0, vy)))                    # the V
    # corner star (two squares at d1 from K), clipped to the inner octagon,
    # without the stretches inside the other square
    def dv(deg):
        return (math.cos(math.radians(deg)), math.sin(math.radians(deg)))
    for n_deg in range(0, 360, 45):
        n = dv(n_deg)
        p0 = (K[0] + d1 * n[0], K[1] + d1 * n[1])
        tv = (-n[1], n[0])
        ts = []
        for k in range(8):
            mm = dv(45 * k)
            den = tv[0] * mm[0] + tv[1] * mm[1]
            if abs(den) > 1e-9:
                ts.append(((din - ((p0[0] - K[0]) * mm[0] + (p0[1] - K[1]) * mm[1])) / den, den))
        lo = max(t for t, den in ts if den < 0)
        hi = min(t for t, den in ts if den > 0)
        other = 45 if n_deg % 90 == 0 else 0
        cuts = []
        for j in range(4):
            mm = dv(other + 90 * j)
            den = tv[0] * mm[0] + tv[1] * mm[1]
            if abs(den) > 1e-9:
                cuts.append((d1 - ((p0[0] - K[0]) * mm[0] + (p0[1] - K[1]) * mm[1])) / den)
        tt = sorted([lo, hi] + [t for t in cuts if lo < t < hi])
        for t1, t2 in zip(tt, tt[1:]):
            mid = (p0[0] + (t1 + t2) / 2 * tv[0] - K[0], p0[1] + (t1 + t2) / 2 * tv[1] - K[1])
            inside = all(abs(mid[0] * dv(other + 90 * j)[0] + mid[1] * dv(other + 90 * j)[1]) < d1 - 1e-9 for j in range(2))
            if not inside:
                wedge.append(((p0[0] + t1 * tv[0], p0[1] + t1 * tv[1]), (p0[0] + t2 * tv[0], p0[1] + t2 * tv[1])))
    for d in (din, dout):
        r = d / math.cos(math.radians(22.5))
        vs = [(K[0] + r * math.cos(math.radians(22.5 + 45 * k)), K[1] + r * math.sin(math.radians(22.5 + 45 * k))) for k in range(8)]
        for k in range(8):
            wedge.append((vs[k], vs[(k + 1) % 8]))
    for k in range(8):
        mm = dv(45 * k)
        wedge.append(((K[0] + din * mm[0], K[1] + din * mm[1]), (K[0] + dout * mm[0], K[1] + dout * mm[1])))
    # the tile's symmetry: mirror in both axes and the diagonal
    def d4(p):
        x, y = p
        return [(sx * u, sy * w) for (u, w) in ((x, y), (y, x)) for sx in (1, -1) for sy in (1, -1)]
    for p, q in wedge:
        for pp, qq in zip(d4(p), d4(q)):
            segs.append((pp, qq))
    return segs


def clip_to_cell(segs, h=1.0):
    out = []
    for p, q in segs:
        t0, t1 = 0.0, 1.0
        dx, dy = q[0] - p[0], q[1] - p[1]
        ok = True
        for pv, qv in ((-dx, p[0] + h), (dx, h - p[0]), (-dy, p[1] + h), (dy, h - p[1])):
            if abs(pv) < 1e-12:
                if qv < -1e-9:
                    ok = False
            else:
                t = qv / pv
                if pv < 0:
                    t0 = max(t0, t)
                else:
                    t1 = min(t1, t)
        if ok and t1 - t0 > 1e-6:
            a = (p[0] + t0 * dx, p[1] + t0 * dy)
            b = (p[0] + t1 * dx, p[1] + t1 * dy)
            key = tuple(sorted((tuple(round(c, 7) for c in a), tuple(round(c, 7) for c in b))))
            out.append(key)
    return sorted(set(out))


def main():
    research, out = sys.argv[1], sys.argv[2]
    ideal = build(research)
    segs = clip_to_cell(design_segments(ideal))
    step('Mark the corners of the pattern: every point where two of the lines meet and the pattern turns.', 'fade')
    names = {}
    for p, q in segs:
        for z in (p, q):
            if z not in names:
                names[z] = ensure_point(z, 'M')
    mark_step = cur
    step('Join the corners of the rosette that are not yet on one line.', 'ruler')
    paths = []
    joins = 0
    for p, q in segs:
        a, b = names[p], names[q]
        on = [n for n in el if el[n][0] == 'line' and n in lines_through(P(a)) and n in lines_through(P(b))]
        if not on:
            joins += 1
            line_through(f'J{joins}', a, b)
        paths.append({'through': [a, b]})
    if not steps[-1]['create']:
        steps.pop()
    step('The tile is the square between the four eight-pointed stars.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K', 'K@1', 'K@2', 'K@3'] if 'K@1' in el else ['K']})
    print('marks', len(mark_step['create']), 'joins', joins)
    tut = {
        'format': 0, 'id': 'bou-inania-twelve-fold-wall', 'title': 'Bou Inania twelve-fold wall',
        'fold': 4, 'style': 'Marinid zellige (Fès)', 'level': 'advanced',
        'credits': [{'source': 'Photograph of the zellige dado of the Bou Inania madrasa, Fès (Wikimedia Commons, File:Bou_inania_DSCF2978.jpg)', 'url': 'https://commons.wikimedia.org/wiki/File:Bou_inania_DSCF2978.jpg', 'note': 'The design was read from this photo; the construction is our own reconstruction, not a published one, drawn the way Samira Mian builds her rosettes: each set of twelve lines through a corner already drawn, touching one circle about O.'}],
        'given': {'O': 'centre of a rosette', 'A': 'halfway to the next rosette'},
        'steps': steps,
        'ink': {'text': 'Ink the rosette, its twelve-sided rim, the bands between the rosettes and the eight-pointed stars with their rings.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square tile edge to edge: rosettes on a square grid, stars at the corners.', 'palette': 'Fès tile', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(segs), 'ink segments in the tile')


if __name__ == '__main__':
    main()
