#!/usr/bin/env python3
"""Builds the Córdoba Synagogue tutorial (12-, 8- and 6-pointed stars) from
the classified ink in docs/research/cordoba-synagogue/cordoba-ink.json
(made with cordoba_model.py there; see docs/patterns/cordoba-synagogue.md).

Frame: O at a 12-star, A at the next grid point, so OA is the grid spacing;
the grid points around O are the six corners of the hexagonal tile, and
every pattern line runs at distance 0, or d = tan 15° / 2, from a line
through a grid point, an 8-star centre or O.

Usage: gen_cordoba.py <out.json>
"""
import json
import math
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
INK = json.load(open(os.path.join(ROOT, 'docs/research/cordoba-synagogue/cordoba-ink.json')))
snow = json.load(open(os.path.join(ROOT, 'tutorials/six-fold-snowflake.json')))

S3 = math.sqrt(3)
D = math.tan(math.radians(15)) / 2
EPS = 1e-7


def dirn(th):
    t = math.radians(th)
    return (math.cos(t), math.sin(t))


def normal(th):
    t = math.radians(th)
    return (-math.sin(t), math.cos(t))


# Geometry of every element, to check picks and find crossings.
geo = {}       # name -> ('p', (x, y)) | ('l', (nx, ny, c)) | ('c', ((x, y), r))
order = ['O', 'A']
geo['O'] = ('p', (0.0, 0.0))
geo['A'] = ('p', (1.0, 0.0))


def line_pp(p, q):
    dx, dy = q[0] - p[0], q[1] - p[1]
    L = math.hypot(dx, dy)
    n = (-dy / L, dx / L)
    return (n[0], n[1], n[0] * p[0] + n[1] * p[1])


def line_dir(p, th):
    n = normal(th)
    return (n[0], n[1], n[0] * p[0] + n[1] * p[1])


def meet(a, b):
    ka, ga = geo[a]
    kb, gb = geo[b]
    if ka == 'c' and kb == 'l':
        a, b, ka, kb, ga, gb = b, a, kb, ka, gb, ga
    if ka == 'l' and kb == 'l':
        den = ga[0] * gb[1] - ga[1] * gb[0]
        if abs(den) < 1e-12:
            return []
        return [((ga[2] * gb[1] - gb[2] * ga[1]) / den, (ga[0] * gb[2] - gb[0] * ga[2]) / den)]
    if ka == 'l' and kb == 'c':
        (cx, cy), r = gb
        off = ga[2] - (ga[0] * cx + ga[1] * cy)
        h2 = r * r - off * off
        if h2 < -1e-12:
            return []
        f = (cx + ga[0] * off, cy + ga[1] * off)
        t = (-ga[1], ga[0])
        h = math.sqrt(max(h2, 0))
        return [(f[0] + t[0] * h, f[1] + t[1] * h), (f[0] - t[0] * h, f[1] - t[1] * h)]
    (c1, r1), (c2, r2) = ga, gb
    dd = math.dist(c1, c2)
    a_ = (r1 * r1 - r2 * r2 + dd * dd) / (2 * dd)
    h = math.sqrt(max(r1 * r1 - a_ * a_, 0))
    m = (c1[0] + a_ * (c2[0] - c1[0]) / dd, c1[1] + a_ * (c2[1] - c1[1]) / dd)
    o = (-(c2[1] - c1[1]) / dd * h, (c2[0] - c1[0]) / dd * h)
    return [(m[0] + o[0], m[1] + o[1]), (m[0] - o[0], m[1] - o[1])]


def ang(p):
    return math.degrees(math.atan2(p[1], p[0])) % 360


def pick(target, cands, before):
    best = None
    rules = [('angle', None)] + [(k, n) for n in before if geo[n][0] == 'p' for k in ('nearest', 'farthest')]
    for kind, ref in rules:
        if kind == 'angle':
            if math.hypot(*target) < 1e-6:
                continue
            want = round(ang(target) * 2) / 2
            sc = lambda q: abs(((ang(q) - want + 180) % 360) - 180) / 360 if math.hypot(*q) > 1e-6 else 9
            spec = {'angle': want if want % 1 else int(want)}
        else:
            r = geo[ref][1]
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


steps = []


class Step:
    def __init__(self, text, animate, highlight=None):
        self.s = {'id': len(steps) + 1, 'text': text, 'create': {}, 'animate': animate}
        if highlight:
            self.s['highlight'] = highlight
        self.before = list(order)
        steps.append(self.s)

    def put(self, name, spec, g):
        assert name not in geo, name
        self.s['create'][name] = spec
        geo[name] = g
        order.append(name)
        return name

    def point(self, name, a, b, target):
        cands = meet(a, b)
        hit = [q for q in cands if math.dist(q, target) < 1e-6]
        assert hit, (name, a, b, target, cands)
        spec = {'meet': [a, b]}
        if len(cands) > 1:
            spec['pick'] = pick(hit[0], cands, self.before)
        return self.put(name, {'point': spec}, ('p', hit[0]))

    def line(self, name, spec, g):
        return self.put(name, {'line': spec}, ('l', g))


def P(n):
    return geo[n][1]


# Steps 1-4: the six-fold opening of the snowflake (grid points and
# the mirror lines at 30°, 90° and 150°).
for s in snow['steps'][:4]:
    s = json.loads(json.dumps(s))
    s['id'] = len(steps) + 1
    steps.append(s)
    for n, spec in s['create'].items():
        order.append(n)
geo['h'] = ('l', (0.0, 1.0, 0.0))
geo['c'] = ('c', ((0.0, 0.0), 1.0))
for n, th in (('E', 0), ('W', 180), ('P60', 60), ('P300', 300), ('P120', 120), ('P240', 240)):
    geo[n] = ('p', dirn(th))
for n, th in (('cE', 0), ('cW', 180), ('c60', 60), ('c120', 120), ('c240', 240), ('c300', 300)):
    geo[n] = ('c', (dirn(th), 1.0))
for n, th in (('X30', 30), ('X90', 90), ('X150', 150)):
    geo[n] = ('p', tuple(v * S3 for v in dirn(th)))
for n, th in (('m30', 30), ('m90', 90), ('m150', 150)):
    geo[n] = ('l', line_dir((0, 0), th))
steps[0]['text'] = 'Draw a horizontal line through the centre and a circle around it. Its radius is the spacing of the grid that the whole pattern stands on, and the compass keeps this opening until told otherwise.'
steps[3]['text'] = 'Outside the first circle, each pair of neighbouring circles makes a large petal. Rule a line through the centre and the tips of two opposite petals, three times: one vertical line and two leaning 30° either side of it. The six grid points around the centre are the corners of the tile, and twelve-pointed stars will sit where these lines meet the next ring of petals.'

# Step 5: the tile and the lines through the centre at 60° and 120°.
st = Step('Join the six grid points around the centre into a hexagon: this is the tile that repeats. Rule the lines from the centre through the grid points at 60° and 120°.', 'ruler', ['E', 'P60', 'P120', 'W', 'P240', 'P300'])
st.put('tile', {'polygon': ['E', 'P60', 'P120', 'W', 'P240', 'P300']}, ('poly', None))
st.line('l60', {'through': ['O', 'P60']}, line_dir((0, 0), 60))
st.line('l120', {'through': ['O', 'P120']}, line_dir((0, 0), 120))
for a, b, th in (('E', 'P60', 120), ('P60', 'P120', 0), ('P120', 'W', 60), ('W', 'P240', 120), ('P240', 'P300', 0), ('P300', 'E', 60)):
    st.line(f'e_{a}_{b}', {'through': [a, b]}, line_pp(P(a), P(b)))

# Step 6: the dodecagon around the centre.
st = Step('Halve the angle between the horizontal and the line at 30° to get a line at 15°. Where it crosses the line joining the grid points at 60° and 300° is a corner of a dodecagon around the centre; draw the circle through it, then the lines through the centre halfway between all the others, and mark the twelve corners.', 'compass', ['h', 'm30'])
st.line('b15', {'through': 'O', 'bisects': ['E', 'O', 'X30']}, line_dir((0, 0), 15))
st.line('half', {'through': ['P60', 'P300']}, (1.0, 0.0, 0.5))
st.point('V15', 'b15', 'half', (0.5, D))
R = math.hypot(0.5, D)
st.put('cR', {'circle': {'centre': 'O', 'through': 'V15'}}, ('c', ((0, 0), R)))
bis = {15: 'b15'}
pairs = {45: ('X30', 'P60'), 75: ('P60', 'X90'), 105: ('X90', 'P120'), 135: ('P120', 'X150'), 165: ('X150', 'W')}
for th, (p, q) in pairs.items():
    bis[th] = st.line(f'b{th}', {'through': 'O', 'bisects': [p, 'O', q]}, line_dir((0, 0), th))
V = {15: 'V15'}
for th in range(15, 360, 30):
    if th == 15:
        continue
    st.point(f'V{th}', bis[th % 180], 'cR', tuple(R * v for v in dirn(th)))
    V[th] = f'V{th}'
st.put('dodec', {'polygon': [V[th] for th in range(15, 360, 30)]}, ('poly', None))

# The pattern lines, from the classified ink.
lines_used = sorted({n for _, _, n in INK})
made = {}      # classification name -> element name
GEOM = {}


def cls_geom(n):
    kind, rest = n.split('_', 1) if not n.startswith('D') else (n, None)
    return None


sys.path.insert(0, os.path.join(ROOT, 'docs/research/cordoba-synagogue'))
from cordoba_model import lines as MODEL  # noqa: E402

# Also build every model line through an ink endpoint, so each end of the
# ink is a crossing of two lines the learner has drawn.
_ends = [tuple(p) for p, q, _ in INK] + [tuple(q) for p, q, _ in INK]
for _nm, _g in MODEL.items():
    if any(abs(_g[0] * e[0] + _g[1] * e[1] - _g[2]) < 1e-7 for e in _ends):
        if _nm not in lines_used:
            lines_used.append(_nm)
lines_used.sort()

def same(g, h):
    return all(abs(x - y) < 1e-7 for x, y in zip(g, h)) or all(abs(x + y) < 1e-7 for x, y in zip(g, h))


def existing(g):
    for n in order:
        if n in geo and geo[n][0] == 'l' and same(geo[n][1], g):
            return n
    return None


# Step 7: the twelve-pointed star: chords of the dodecagon, two corners apart
# from the middle, give lines at d from the centre in six directions.
st = Step('Join the dodecagon corners in pairs with lines that run parallel to the horizontal, the vertical and the four lines at 30° and 60°, each pair as close to the centre as it can be. Carry the twelve lines across the tile: around the centre they draw a twelve-pointed star.', 'ruler', ['dodec'])
for th in range(0, 180, 30):
    for sgn in (1, -1):
        # chord through corners at th+90±75 (the pair nearest the centre on that side)
        a = (th + 90 * sgn + 75) % 360 if sgn > 0 else (th - 90 + 75) % 360
        b = (th + 90 * sgn - 75) % 360 if sgn > 0 else (th - 90 - 75) % 360
        g = line_pp(P(V[a]), P(V[b]))
        st.line(f's{th}{"p" if sgn > 0 else "n"}', {'through': [V[a], V[b]]}, g)

# Step 8: the same distance d carried to the grid points around the tile.
st = Step('Open the compass to the distance between the centre and the nearest of those lines. At each corner of the tile, rule the lines through it parallel to the sides of the tile, and on each draw the lines that distance either side, using the compass to mark the distance on a line at right angles.', 'compass')
dpt = st.point('Dv', 'm90', 's0p', (0, D))
for nm in lines_used:
    if nm.startswith('D'):
        continue
    g = MODEL[nm]
    if existing(g):
        made[nm] = existing(g)
        continue
    th = int(nm[1:].split('_')[0])
    # a corner of the tile with n·S = c ± d for this direction
    n = normal(th)
    site = None
    for sn in ('E', 'P60', 'P120', 'W', 'P240', 'P300'):
        c = n[0] * P(sn)[0] + n[1] * P(sn)[1]
        for s_ in (0, D, -D):
            if abs((g[2] if same(g, (n[0], n[1], g[2])) else -g[2]) - (c + s_)) < 1e-6 or abs(abs(g[2]) - abs(c + s_)) < 1e-6 and same((n[0], n[1], c + s_), g):
                site = (sn, s_)
                break
        if site:
            break
    assert site, nm
    sn, s_ = site
    base = existing(line_dir(P(sn), th)) or st.line(f'thr_{sn}_{th}', {'through': sn, 'parallelTo': {0: 'h', 60: 'l60', 120: 'l120'}[th]}, line_dir(P(sn), th))
    if s_ == 0:
        made[nm] = base
        continue
    perp = existing(line_dir(P(sn), th + 90)) or st.line(f'prp_{sn}_{th}', {'through': sn, 'perpendicularTo': base}, line_dir(P(sn), th + 90))
    cn = f'cd_{sn}'
    if cn not in geo:
        st.put(cn, {'circle': {'centre': sn, 'radiusFrom': ['O', dpt]}}, ('c', (P(sn), D)))
    tgt = (P(sn)[0] + n[0] * s_, P(sn)[1] + n[1] * s_)
    pn = f'q_{sn}_{th}_{"p" if s_ > 0 else "n"}'
    st.point(pn, perp, cn, tgt)
    made[nm] = st.line(f'L_{sn}_{th}_{"p" if s_ > 0 else "n"}', {'through': pn, 'parallelTo': base}, line_dir(tgt, th))

# Step 9: the eight-pointed stars on the tile edges.
st = Step('Halfway along each side of the tile, the lines you have drawn make a small square. Draw the circle around it, centred where the side crosses the line from the centre, and mark where the circle crosses those two lines. Join the four marks into a second square standing on its corner: with the first square it makes an eight-pointed star.', 'compass')
for nm in lines_used:
    if not nm.startswith('D'):
        continue
    k = int(nm[1:].split('_')[0])
    ax = 30 + 60 * k
    e = tuple(v * S3 / 2 for v in dirn(ax))
    en = f'M{k}'
    edge = ['e_E_P60', 'e_P60_P120', 'e_P120_W', 'e_W_P240', 'e_P240_P300', 'e_P300_E'][k]
    radial = {0: 'm30', 1: 'm90', 2: 'm150', 3: 'm30', 4: 'm90', 5: 'm150'}[k]
    if en not in geo:
        st.point(en, edge, radial, e)
        # a corner of the square: the d-lines either side of the radial and of the edge
        corner = None
        for a in order:
            if geo[a][0] != 'l':
                continue
            for b in order:
                if b <= a or geo[b][0] != 'l':
                    continue
                for q in meet(a, b):
                    if abs(math.dist(q, e) - D * math.sqrt(2)) < 1e-7:
                        corner = (a, b, q)
                        break
                if corner:
                    break
            if corner:
                break
        assert corner, k
        st.point(f'K{k}', corner[0], corner[1], corner[2])
        st.put(f'c8_{k}', {'circle': {'centre': en, 'through': f'K{k}'}}, ('c', (e, D * math.sqrt(2))))
        for j, (ln, th) in enumerate(((radial, ax), (radial, ax + 180), (edge, ax + 90), (edge, ax - 90))):
            q = (e[0] + D * math.sqrt(2) * dirn(th)[0], e[1] + D * math.sqrt(2) * dirn(th)[1])
            st.point(f'T{k}_{j}', ln, f'c8_{k}', q)
    g = MODEL[nm]
    ends = [f'T{k}_{j}' for j in range(4) if abs(g[0] * P(f'T{k}_{j}')[0] + g[1] * P(f'T{k}_{j}')[1] - g[2]) < 1e-7]
    assert len(ends) == 2, (nm, ends)
    made[nm] = existing(g) or st.line(f'dm_{nm[1:]}'.replace('-', 'm'), {'through': ends}, g)

# Ink: every classified piece, between crossings of two named lines.
names = {}
ink_step = Step('Mark the crossings where the pattern turns.', 'fade')
for n in order:
    if geo.get(n, ('x',))[0] == 'p':
        names[(round(P(n)[0], 6), round(P(n)[1], 6))] = n


def name_at(p, own):
    key = (round(p[0], 6), round(p[1], 6))
    if key in names:
        return names[key]
    for m in order:
        if m == own or geo[m][0] != 'l':
            continue
        for q in meet(own, m):
            if math.dist(q, p) < 1e-6:
                nm = f'x{len(names)}'
                ink_step.point(nm, own, m, q)
                names[key] = nm
                return nm
    raise SystemExit(f'no crossing at {p}')


paths = []
for p, q, nm in INK:
    own = made[nm]
    paths.append({'through': [name_at(p, own), name_at(q, own)]})

t = {
    'format': 0, 'id': 'cordoba-synagogue', 'title': 'Córdoba Synagogue stars', 'fold': 6,
    'style': 'Mudéjar', 'level': 'advanced',
    'credits': [{'source': 'Geometric Design: Create a Pattern from the Cordoba Synagogue', 'creator': 'Joumana Medlej, Envato Tuts+',
                 'url': 'https://design.tutsplus.com/tutorials/geometric-design-create-a-pattern-from-the-cordoba-synagogue--cms-24548',
                 'note': 'The construction (dodecagons on the circle grid, pairs of nearest parallels, the square, cross and circle of each eight-pointed star) follows this tutorial; the step text is our own.'}],
    'given': {'O': 'The centre of a twelve-pointed star.', 'A': 'Any point to the right of O. The distance OA is the spacing of the grid.'},
    'steps': steps,
    'ink': {'text': 'Go over the lines of the pattern: the twelve-pointed star in the middle, the six-pointed stars at the corners of the tile, the eight-pointed stars on its sides, and the bands that join them.', 'paths': paths},
    'pattern': {'cell': 'tile', 'text': 'Repeat the hexagon side to side. Twelve-pointed stars sit on a wide grid, an eight-pointed star halfway between each pair, and a six-pointed star in each triangle between three of them, as on the plaster wall of the synagogue in Córdoba.', 'palette': 'Fès tile', 'colors': {}},
    'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
}
json.dump(t, open(sys.argv[1], 'w'))
print(len(steps), 'steps,', len(paths), 'ink paths,', len(ink_step.s['create']), 'marks')
