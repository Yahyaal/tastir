#!/usr/bin/env python3
"""Builds the tutorial of Sandy Kurt's eight-fold zellige (Design C) from
her construction (kurt_geom.py) and the traced ink of her final drawing
(kurt-model.json, made by kurt_model.py in docs/research/eight-fold-zellige).

Usage: gen_kurt_zellige.py <research dir> <out.json>
"""
import json
import math
import sys

sys.path.insert(0, sys.argv[1])
from kurt_geom import K, R2, S, circle_line, line_through, r9, r_small, rho  # noqa: E402

EPS = 1e-6
el = {}       # name -> ('point', p) | ('line', (a, b, c)) | ('circle', (c, r)) | ('poly', [p])
order = []    # names in creation order, for "earlier" checks
steps = []


def ang(p):
    return math.degrees(math.atan2(p[1], p[0])) % 360


def put(name, kind, geom):
    assert name not in el, name
    el[name] = (kind, geom)
    order.append(name)


def L(a, b, c):
    n = math.hypot(a, b)
    return (a / n, b / n, c / n)


def line_pts(p, q):
    return line_through(p, q)


def meet_line_line(A, B):
    a1, b1, c1 = A; a2, b2, c2 = B
    d = a1 * b2 - a2 * b1
    if abs(d) < 1e-12:
        return []
    return [((c1 * b2 - c2 * b1) / d, (a1 * c2 - a2 * c1) / d)]


def meet_circle_circle(c1, r1, c2, r2):
    d = math.dist(c1, c2)
    if d < 1e-12 or d > r1 + r2 + 1e-9 or d < abs(r1 - r2) - 1e-9:
        return []
    a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
    h = math.sqrt(max(r1 * r1 - a * a, 0))
    m = (c1[0] + a * (c2[0] - c1[0]) / d, c1[1] + a * (c2[1] - c1[1]) / d)
    o = (-(c2[1] - c1[1]) / d * h, (c2[0] - c1[0]) / d * h)
    return [(m[0] + o[0], m[1] + o[1]), (m[0] - o[0], m[1] - o[1])] if h > 1e-9 else [m]


def sides(poly):
    return list(zip(poly, poly[1:] + poly[:1]))


def on_seg(p, a, b):
    t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / math.dist(a, b) ** 2
    return -1e-9 <= t <= 1 + 1e-9


def crossings(n1, n2):
    k1, g1 = el[n1]; k2, g2 = el[n2]
    if k1 == 'circle' and k2 == 'line':
        n1, n2, k1, k2, g1, g2 = n2, n1, k2, k1, g2, g1
    if k1 == 'line' and k2 == 'line':
        out = meet_line_line(g1, g2)
    elif k1 == 'line' and k2 == 'circle':
        out = circle_line(g2[0], g2[1], g1)
    elif k1 == 'circle' and k2 == 'circle':
        out = meet_circle_circle(g1[0], g1[1], g2[0], g2[1])
    elif 'poly' in (k1, k2):
        P, Q, kq = (g1, g2, k2) if k1 == 'poly' else (g2, g1, k1)
        out = []
        for a, b in sides(P):
            sl = line_pts(a, b)
            cand = (meet_line_line(sl, Q) if kq == 'line'
                    else circle_line(Q[0], Q[1], sl) if kq == 'circle'
                    else [x for c, d in sides(Q) for x in meet_line_line(sl, line_pts(c, d)) if on_seg(x, c, d)])
            out += [x for x in cand if on_seg(x, a, b)]
    else:
        raise ValueError((k1, k2))
    uniq = []
    for p in out:
        if all(math.dist(p, q) > 1e-7 for q in uniq):
            uniq.append(p)
    return uniq


def pick_for(target, cands, before):
    """The rule with the widest margin that picks target among cands, using
    only points made before (names in `before`)."""
    best = None
    rules = [('angle', None)] + [(k, n) for n in before if el[n][0] == 'point' for k in ('nearest', 'farthest')]
    for kind, ref in rules:
        if kind == 'angle':
            if math.hypot(*target) < 1e-6:
                continue
            want = round(ang(target) * 2) / 2
            sc = lambda q: abs(((ang(q) - want + 180) % 360) - 180) / 360 if math.hypot(*q) > 1e-6 else 9
            spec = {'angle': want if want % 1 else int(want)}
        else:
            r = el[ref][1]
            sc = (lambda q, r=r: math.dist(q, r)) if kind == 'nearest' else (lambda q, r=r: -math.dist(q, r))
            spec = {kind: ref}
        others = [sc(q) for q in cands if math.dist(q, target) > 1e-6]
        if not others:
            return None
        m = min(others) - sc(target)
        if best is None or m > best[0]:
            best = (m, spec)
    assert best and best[0] > 0.004, (target, best)
    return best[1]


class Step:
    def __init__(self, text, animate, highlight=None):
        self.s = {'id': len(steps) + 1, 'text': text, 'create': {}, 'animate': animate}
        if highlight:
            self.s['highlight'] = highlight
        self.before = list(order)
        steps.append(self.s)

    def add(self, name, spec, kind, geom):
        self.s['create'][name] = spec
        put(name, kind, geom)

    def point(self, name, a, b, target):
        cands = crossings(a, b)
        hit = [q for q in cands if math.dist(q, target) < 1e-6]
        assert hit, (name, a, b, target, cands)
        spec = {'meet': [a, b]}
        if len(cands) > 1:
            spec['pick'] = pick_for(hit[0], cands, self.before)
        self.add(name, {'point': spec}, 'point', hit[0])
        return name


def P(name):
    return el[name][1]


# 1-5: the classic opening (as in the star and cross).
st = Step('Draw a circle around the centre. Its radius is the unit for the whole pattern.', 'compass')
st.add('c', {'circle': {'centre': 'O', 'through': 'A'}}, 'circle', ((0, 0), 1))
put('O', 'point', (0, 0)); put('A', 'point', (1, 0))
order.remove('O'); order.remove('A'); order[:0] = ['O', 'A']
st.before = ['O', 'A']
st = Step('Draw the horizontal through the centre and the vertical at right angles to it. They cut the circle at four points.', 'ruler')
st.add('h', {'line': {'through': ['O', 'A']}}, 'line', (0, 1, 0))
st.add('v', {'line': {'through': 'O', 'perpendicularTo': 'h'}}, 'line', (1, 0, 0))
for n, a, ln in (('E', 0, 'h'), ('N', 90, 'v'), ('W', 180, 'h'), ('Sp', 270, 'v')):
    st.add(n, {'point': {'meet': ['c', ln], 'pick': {'angle': a}}}, 'point', (math.cos(math.radians(a)), math.sin(math.radians(a))))
st = Step('Halve each right angle to get the two diagonals. The circle is now divided into eight.', 'ruler', ['h', 'v'])
st.add('d1', {'line': {'through': 'O', 'bisects': ['E', 'O', 'N']}}, 'line', L(1, -1, 0))
st.add('d2', {'line': {'through': 'O', 'bisects': ['N', 'O', 'W']}}, 'line', L(1, 1, 0))
for n, a, ln in (('NE', 45, 'd1'), ('NW', 135, 'd2'), ('SW', 225, 'd1'), ('SE', 315, 'd2')):
    st.add(n, {'point': {'meet': ['c', ln], 'pick': {'angle': a}}}, 'point', (math.cos(math.radians(a)), math.sin(math.radians(a))))
st = Step('Draw the two squares inside the circle: one standing on its corners at the ends of the horizontal and vertical, one lying flat with its corners on the diagonals. They cross at eight points.', 'ruler')
st.add('dyn', {'polygon': ['E', 'N', 'W', 'Sp']}, 'poly', [(1, 0), (0, 1), (-1, 0), (0, -1)])
r = 1 / R2
st.add('sta', {'polygon': ['NE', 'NW', 'SW', 'SE']}, 'poly', [(r, r), (-r, r), (-r, -r), (r, -r)])
for i, k in enumerate(K):
    st.point(f'k{i}', 'dyn', 'sta', k)
st = Step('Rule a line through the centre and each crossing of the squares. With the first lines, the circle is divided into sixteen.', 'ruler', [f'k{i}' for i in range(8)])
for i in range(4):
    st.add(f'r{i}', {'line': {'through': ['O', f'k{i}']}}, 'line', line_pts((0, 0), K[i]))

# 6-7 (Kurt 4-5): the ring of circles.
st = Step('Put the compass on the crossing just above the horizontal on the right and open it until the circle just touches the horizontal and the diagonal. Keep that opening and draw the same circle on the other seven crossings and on the centre.', 'compass', ['k0', 'h', 'd1'])
st.add('ring0', {'circle': {'centre': 'k0', 'tangentTo': ['h', 'd1']}}, 'circle', (K[0], rho))
for i in range(1, 8):
    st.add(f'ring{i}', {'circle': {'centre': f'k{i}', 'radiusOf': 'ring0'}}, 'circle', (K[i], rho))
st.add('ringO', {'circle': {'centre': 'O', 'radiusOf': 'ring0'}}, 'circle', ((0, 0), rho))

# 8-9 (Kurt 6-7): lines joining the circles' centres.
st = Step('Join the centres of the ring circles with two horizontal and two vertical lines, then with four diagonal lines. Each line runs through two centres.', 'ruler', [f'k{i}' for i in range(8)])
pairs = {'g6a': (0, 3), 'g6b': (4, 7), 'g6c': (1, 6), 'g6d': (2, 5), 'g7a': (0, 5), 'g7b': (1, 4), 'g7c': (2, 7), 'g7d': (3, 6)}
for n, (i, j) in pairs.items():
    st.add(n, {'line': {'through': [f'k{i}', f'k{j}']}}, 'line', line_pts(K[i], K[j]))

# 10-11 (Kurt 8-9): the small circle and the circle about the centre.
c8 = (rho * math.tan(math.radians(22.5)), rho)
st = Step('Where the upper horizontal line crosses the steep line through the centre, put the compass and draw the circle that just touches the vertical and the diagonal.', 'compass', ['g6a', 'r1'])
hor = [n for n in pairs if n.startswith('g6') and abs(el[n][1][0] * c8[0] + el[n][1][1] * c8[1] - el[n][1][2]) < 1e-6]
st.point('m8', hor[0], 'r1', c8)
st.add('c8', {'circle': {'centre': 'm8', 'tangentTo': ['v', 'd1']}}, 'circle', (c8, c8[0]))
st = Step('Put the compass on the centre and draw the circle that just touches that small circle on its near side. With the same opening, draw a circle around each of the eight crossings of the squares.', 'compass', ['c8'])
st.add('c9', {'circle': {'centre': 'O', 'tangentTo': ['c8'], 'touch': 'near'}}, 'circle', ((0, 0), r9))
for i in range(8):
    st.add(f'c10_{i}', {'circle': {'centre': f'k{i}', 'radiusOf': 'c9'}}, 'circle', (K[i], r9))

# 12 (Kurt 11-12): the small circles between the ring circles.
st = Step('Where two of the diagonal lines cross on the horizontal, draw the circle that just touches the ring circles around it. Draw the same circle at the seven other places where two of the joining lines cross on the vertical or the diagonals.', 'compass')
diag = {n: el[n][1] for n in pairs}
def diag_through(p):
    return [n for n, g in diag.items() if abs(g[0] * p[0] + g[1] * p[1] - g[2]) < 1e-6]
for i, s_ in enumerate(S):
    a, b = diag_through(s_)[:2] if len(diag_through(s_)) >= 2 else (None, None)
    if a is None:
        raise SystemExit(f'no two joining lines through S{i}')
    st.point(f's{i}', a, b, s_)
st.add('sm0', {'circle': {'centre': 's0', 'tangentTo': ['ring0'], 'touch': 'near'}}, 'circle', (S[0], r_small))
for i in range(1, 8):
    st.add(f'sm{i}', {'circle': {'centre': f's{i}', 'radiusOf': 'sm0'}}, 'circle', (S[i], r_small))

# 13 (Kurt 13): lines joining ring centres two apart.
st = Step('Join every ring-circle centre to the centre two places round. The eight lines make two more squares, turned a sixteenth of a turn from the first two.', 'ruler', [f'k{i}' for i in range(8)])
for i in range(8):
    n = f'q{i}'
    g = line_pts(K[i], K[(i + 2) % 8])
    if any(el[m][0] == 'line' and all(abs(x - y) < 1e-6 for x, y in zip(el[m][1], g)) for m in el):
        continue
    st.add(n, {'line': {'through': [f'k{i}', f'k{(i + 2) % 8}']}}, 'line', g)

model = json.load(open(sys.argv[1] + '/kurt-model.json'))
VALS = (0.2180, 0.3678, 0.6322, 0.7820)
q13 = [n for n in el if n.startswith('q')]


def needed_lines():
    out = set()
    for p, q, tags in model:
        if '14' in tags:
            g = line_pts(p, q)
            th = round(math.degrees(math.atan2(g[1], g[0])) % 180)
            out.add((th % 180, round(g[2] if g[0] > 1e-9 or (abs(g[0]) < 1e-9 and g[1] > 0) else -g[2], 4)))
    return out


need14 = needed_lines()
words = {0: 'vertical', 90: 'horizontal', 45: 'slanting up to the left', 135: 'slanting up to the right'}
ref = {0: 'h', 90: 'v', 45: 'd1', 135: 'd2'}   # lines are perpendicular to these (d1 runs at 45°)
for th in (0, 90, 45, 135):
    st = Step(f'Mark where the circles around the crossings of the squares cut the new lines, and through those points rule {words[th]} lines, in pairs.', 'ruler')
    n_ = (math.cos(math.radians(th)), math.sin(math.radians(th)))
    for (t, d) in sorted(x for x in need14 if x[0] == th):
        found = None
        for i in range(8):
            for qn in q13:
                for p in crossings(f'c10_{i}', qn):
                    if abs(n_[0] * p[0] + n_[1] * p[1] - d) < 1e-4:
                        found = (i, qn, p)
                        break
                if found: break
            if found: break
        assert found, (th, d)
        i, qn, p = found
        pn = f'x{th}_{"m" if d < 0 else ""}{abs(round(d * 1e4))}'
        st.point(pn, f'c10_{i}', qn, p)
        ln = f'l{th}_{"m" if d < 0 else ""}{abs(round(d * 1e4))}'
        st.add(ln, {'line': {'through': pn, 'perpendicularTo': ref[th]}}, 'line', (n_[0], n_[1], d))

# 17: octagons with a corner pointing away from the centre of each circle.
st = Step('Draw an octagon inside each ring circle, each small circle and the centre circle, with its corners where the circle meets lines through its centre parallel to the horizontal, the vertical and the diagonals.', 'ruler')
helpers = {}
def helper(c, th):
    key = (round(c[0], 6), round(c[1], 6), th)
    if key in helpers:
        return helpers[key]
    g = L(-math.sin(math.radians(th)), math.cos(math.radians(th)), -math.sin(math.radians(th)) * c[0] + math.cos(math.radians(th)) * c[1])
    for m in list(el):
        if el[m][0] == 'line' and all(abs(x - y) < 1e-6 for x, y in zip(el[m][1], g)):
            helpers[key] = m
            return m
        if el[m][0] == 'line' and all(abs(x + y) < 1e-6 for x, y in zip(el[m][1], g)):
            helpers[key] = m
            return m
    return None
oct_steps = []
for tag, centres, cname, rad in (('K', K, 'ring', rho), ('S', S, 'sm', r_small), ('O', [(0, 0)], 'ringO', rho)):
    for i, c in enumerate(centres):
        cn = {'K': f'k{i}', 'S': f's{i}', 'O': 'O'}[tag]
        circ_name = f'{cname}{i}' if tag != 'O' else 'ringO'
        verts = []
        for j in range(8):
            th = 45 * (j % 4)
            hl = helper(c, th)
            if hl is None:
                hl = f'p{tag}{i}_{th}'
                para = {0: 'h', 45: 'd2', 90: 'v', 135: 'd1'}[th]
                g = L(-math.sin(math.radians(th)), math.cos(math.radians(th)), -math.sin(math.radians(th)) * c[0] + math.cos(math.radians(th)) * c[1])
                st.add(hl, {'line': {'through': cn, 'parallelTo': para if th in (0, 90) else ('d1' if th == 45 else 'd2')}}, 'line', g)
                helpers[(round(c[0], 6), round(c[1], 6), th)] = hl
            v = (c[0] + rad * math.cos(math.radians(45 * j)), c[1] + rad * math.sin(math.radians(45 * j)))
            verts.append(st.point(f'o{tag}{i}_{j}', circ_name, hl, v))
        st.add(f'oct{tag}{i}', {'polygon': verts}, 'poly', [P(v) for v in verts])

# 19: the rosette at the centre.
st = Step('For the star in the middle, mark where the circle around the centre crosses the sixteen lines through the centre, and join the marks three places apart with lines in pairs.', 'ruler', ['c9'])
d19 = r9 * math.cos(math.radians(67.5))
radial = {i: f'r{i % 4}' if i < 4 else None for i in range(8)}
rad_line = {}
for j in range(16):
    a = 22.5 * j
    cand = [n for n in ('h', 'v', 'd1', 'd2', 'r0', 'r1', 'r2', 'r3') if abs(math.sin(math.radians(a)) * el[n][1][1] * 0 + 0) == 0 and abs(-math.sin(math.radians(a)) * el[n][1][1] * 0) == 0 and abs(el[n][1][0] * math.cos(math.radians(a)) + el[n][1][1] * math.sin(math.radians(a))) < 1e-6]
    p = (r9 * math.cos(math.radians(a)), r9 * math.sin(math.radians(a)))
    rad_line[j] = st.point(f'z{j}', 'c9', cand[0], p)
for th in range(0, 360, 45):
    j1 = (round(th / 22.5) + 3) % 16
    j2 = (round(th / 22.5) - 3) % 16
    n = f'rs{th}'
    st.add(n, {'line': {'through': [rad_line[j1], rad_line[j2]]}}, 'line', line_pts(P(rad_line[j1]), P(rad_line[j2])))

# Tile: the square that just touches the main circle.
st = Step('Draw the square that just touches the main circle: a line at right angles to the horizontal at each side, and at right angles to the vertical at the top and bottom. This square is the tile that repeats.', 'ruler', ['E', 'N', 'W', 'Sp'])
st.add('tE', {'line': {'through': 'E', 'perpendicularTo': 'h'}}, 'line', (1, 0, 1))
st.add('tW', {'line': {'through': 'W', 'perpendicularTo': 'h'}}, 'line', (1, 0, -1))
st.add('tN', {'line': {'through': 'N', 'perpendicularTo': 'v'}}, 'line', (0, 1, 1))
st.add('tS', {'line': {'through': 'Sp', 'perpendicularTo': 'v'}}, 'line', (0, 1, -1))
for n, a, b, p in (('t1', 'tE', 'tN', (1, 1)), ('t2', 'tN', 'tW', (-1, 1)), ('t3', 'tW', 'tS', (-1, -1)), ('t4', 'tS', 'tE', (1, -1))):
    st.add(n, {'point': {'meet': [a, b]}}, 'point', p)
st.add('tile', {'polygon': ['t1', 't2', 't3', 't4']}, 'poly', [(1, 1), (-1, 1), (-1, -1), (1, -1)])

# Ink: every traced run, snapped to crossings of the elements it lies on.
carriers = ([n for n in el if el[n][0] == 'line'] +
            [n for n in el if el[n][0] == 'poly' and n not in ('dyn', 'sta', 'tile')])


def on(n, p):
    k, g = el[n]
    if k == 'line':
        return abs(g[0] * p[0] + g[1] * p[1] - g[2]) < 2e-3
    return any(abs(line_pts(a, b)[0] * p[0] + line_pts(a, b)[1] * p[1] - line_pts(a, b)[2]) < 2e-3 and near_seg(p, a, b) for a, b in sides(g))


def near_seg(p, a, b):
    """On the side, allowing the trace to overshoot a corner slightly."""
    t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / math.dist(a, b) ** 2
    return -0.08 <= t <= 1.08


ends = Step('Mark the crossings where the pattern turns.', 'fade')
names = {}
for n, (k, g) in el.items():
    if k == 'point':
        names[(round(g[0], 5), round(g[1], 5))] = n


def carrier_of(p, q):
    m = ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
    return [n for n in carriers if on(n, p) and on(n, q) and on(n, m)]


def snap(p, carrier):
    best = None
    # Partners are lines: a polygon side may end exactly at the crossing,
    # where the engine does not count it as meeting.
    for m in carriers:
        if m == carrier:
            continue
        for x in crossings(carrier, m):
            if best is None or math.dist(x, p) < math.dist(best[0], p):
                best = (x, m)
    return best


paths = []
vertex_pts = [g for n, (k, g) in el.items() if k == 'point' and n.startswith('o')]


def split(p, q):
    """Pieces of a traced run, cut at octagon corners on it: two octagons'
    collinear sides meet at a shared corner."""
    if math.dist(p, q) < 0.02:
        return []   # the trace overshooting a corner
    cs = carrier_of(p, q)
    if cs:
        return [(p, q, cs[0])]
    d = math.dist(p, q)
    for v in vertex_pts:
        t = ((v[0] - p[0]) * (q[0] - p[0]) + (v[1] - p[1]) * (q[1] - p[1])) / d / d
        foot = (p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]))
        if 0.05 < t < 0.95 and math.dist(foot, v) < 2e-3:
            return split(p, v) + split(v, q)
    skipped.append((p, q))
    return []


skipped = []
import os
if os.environ.get('DBG'):
    p0, q0 = (0.3787, -0.2071), (0.2929, -0.1716)
    for p, q, tags in model:
        if math.dist(p, (0.3787, -0.2071)) < 0.01 or math.dist(q, (0.3787, -0.2071)) < 0.01:
            print('DBG run', p, q, tags, carrier_of(tuple(p), tuple(q)), on('octS7', p), on('octS7', q))
pieces_ = [x for p, q, tags in model for x in split(tuple(p), tuple(q))]
def snapped(e, cr):
    """The exact end for a traced end: an octagon corner, or the nearest
    crossing of the carrier with another element. Returns (point, other)."""
    corner = min(vertex_pts, key=lambda v: math.dist(v, e))
    if math.dist(corner, e) < 0.02:
        return corner, None
    x, other = snap(e, cr)
    corner = min(vertex_pts, key=lambda v: math.dist(v, x))
    if math.dist(corner, x) < 1e-6:
        return corner, None
    assert math.dist(x, e) < 0.04, (e, x, cr)
    return x, other


items = []   # [A, B, carrier, otherA, otherB]
for p, q, cr in pieces_:
    (A, oa), (B, ob) = snapped(p, cr), snapped(q, cr)
    if math.dist(A, B) > 1e-6:
        items.append([A, B, cr, oa, ob])


def touches(e, k):
    """Whether point e lies on ink item k."""
    A, B = items[k][0], items[k][1]
    L = math.dist(A, B)
    t = ((e[0] - A[0]) * (B[0] - A[0]) + (e[1] - A[1]) * (B[1] - A[1])) / L / L
    f = (A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1]))
    return -1e-9 <= t <= 1 + 1e-9 and math.dist(f, e) < 1e-6


def seg_cross(a, b, c, d):
    den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0])
    if abs(den) < 1e-12:
        return None
    t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den
    u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den
    if -1e-9 <= t <= 1 + 1e-9 and -1e-9 <= u <= 1 + 1e-9:
        return (a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])), t
    return None


# Dead ends: an end that touches no other ink. Drop items that are dead at
# both ends (stubs left by splitting at corners); trim the others back to
# their last crossing with other ink.
changed = True
while changed:
    changed = False
    for k in range(len(items) - 1, -1, -1):
        A, B, cr, oa, ob = items[k]
        dead = [not any(touches(e, m) for m in range(len(items)) if m != k) for e in (A, B)]
        if all(dead):
            del items[k]; changed = True
            continue
        for end, d_ in ((0, dead[0]), (1, dead[1])):
            if not d_:
                continue
            far = items[k][1 - end]; near = items[k][end]
            best = None
            for m in range(len(items)):
                if m == k:
                    continue
                hit = seg_cross(far, near, items[m][0], items[m][1])
                if hit and hit[1] > 1e-6 and (best is None or hit[1] > best[1]):
                    best = (hit[0], hit[1], items[m][2])
            if best is None or best[1] < 0.5:
                print('dead end kept', [round(v, 3) for v in near], cr)
                continue
            items[k][end] = best[0]
            items[k][3 + end] = best[2]
            changed = True

for A, B, cr, oa, ob in items:
    pts = []
    for x, other in ((A, oa), (B, ob)):
        key = (round(x[0], 5), round(x[1], 5))
        if key not in names:
            nm = f'e{len(names)}'
            ends.point(nm, cr, other, x)
            names[key] = nm
        pts.append(names[key])
    if pts[0] != pts[1]:
        paths.append({'through': pts})

t = {
    'format': 0, 'id': 'kurt-eight-fold-zellige', 'title': 'Eight-fold zellige wheel', 'fold': 8,
    'style': 'Moroccan', 'level': 'advanced',
    'credits': [{'source': '8fold Zellige (free PDF tutorial)', 'creator': 'Sandy Kurt',
                 'url': 'https://sandykurt.com/free-tutorials',
                 'note': 'The construction follows her nineteen steps, and the lines inked are those of her finished drawing; the step text is our own.'}],
    'given': {'O': 'The centre of the wheel.', 'A': 'Any point to the right of O. The distance OA is the radius of the main circle, and the unit for every length.'},
    'steps': steps,
    'ink': {'text': 'Go over the lines of the finished wheel: the octagons, the bands between them and the star in the middle.', 'paths': paths},
    'pattern': {'cell': 'tile', 'text': 'Repeat the tile edge to edge. Neighbouring wheels meet at the corners of their large octagons.', 'palette': 'Fès tile', 'colors': {}},
    'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
}
json.dump(t, open(sys.argv[2], 'w'))
print(len(steps), 'steps,', len(paths), 'ink paths,', len(ends.s['create']), 'marked turns,', len(skipped), 'runs skipped:', [[[round(v, 3) for v in p], [round(v, 3) for v in q]] for p, q in skipped])

