#!/usr/bin/env python3
"""Builds the two twelve-fold rosette tutorials (owner, 2026-10-05):

  mian  follows Samira Mian's construction: the twelve star lines join the
        points of an inner circle found from one chord (credited).
  open  our own, shorter variant: the star lines join the points of the
        first circle itself, so the petals are wider and the centre opener.

Both: the rosette fills a twelve-sided outline whose corners touch the
square tile at the middle of each side, so rosettes meet corner to corner.

The outline is drawn as twelve full lines: they run on past the outline's
corners to the tile edge, and are inked there but not between the two star
lines that meet each side (owner, 2026-10-05, from her square and hexagonal
tiles). The tile is a square (side two radii) or a hexagon (apothem one
radius) touching the first circle; both repeat.

Usage: gen_twelve_rosette.py mian|open square|hex tutorials/<id>.json
"""
import json
import math
import sys

variant, tile_kind, out = sys.argv[1], sys.argv[2], sys.argv[3]
steps = []


def step(text, create, animate='ruler', highlight=None):
    s = {'id': len(steps) + 1, 'text': text, 'create': create, 'animate': animate}
    if highlight:
        s['highlight'] = highlight
    steps.append(s)


def P(a):
    """Name of the point on the first circle at angle a (degrees)."""
    return f'P{a % 360}'


step('Rule a horizontal line and draw a circle on it about the centre O, through A. Keep this opening for the next steps.',
     {'h': {'line': {'through': ['O', 'A']}}, 'c': {'circle': {'centre': 'O', 'through': 'A'}}}, 'compass')

step('Put the compass point where the circle crosses the line on the right, and draw a circle through O; do the same on the left.',
     {'P0': {'point': {'meet': ['c', 'h'], 'pick': {'angle': 0}}},
      'P180': {'point': {'meet': ['c', 'h'], 'pick': {'angle': 180}}},
      'cE': {'circle': {'centre': 'P0', 'radiusOf': 'c'}},
      'cW': {'circle': {'centre': 'P180', 'radiusOf': 'c'}}}, 'compass', ['c', 'h'])

step('Rule the vertical through O, at right angles to the horizontal, and draw the same circle about its top and bottom points.',
     {'v': {'line': {'through': 'O', 'perpendicularTo': 'h'}},
      'P90': {'point': {'meet': ['c', 'v'], 'pick': {'angle': 90}}},
      'P270': {'point': {'meet': ['c', 'v'], 'pick': {'angle': 270}}},
      'cN': {'circle': {'centre': 'P90', 'radiusOf': 'c'}},
      'cS': {'circle': {'centre': 'P270', 'radiusOf': 'c'}}}, 'compass')

create = {}
for a, other in ((60, 'cE'), (300, 'cE'), (120, 'cW'), (240, 'cW'), (30, 'cN'), (150, 'cN'), (210, 'cS'), (330, 'cS')):
    create[P(a)] = {'point': {'meet': ['c', other], 'pick': {'angle': a}}}
for a in (30, 60, 120, 150):
    create[f'r{a}'] = {'line': {'through': [P(a), P(a + 180)]}}
step('The four new circles cut the first one at eight more points, so it is divided into twelve. Rule the lines joining opposite points through O.',
     create, highlight=['cE', 'cW', 'cN', 'cS'])

step('Rule a line through each pair of neighbouring points. The twelve lines outline the rosette, and they run on past its corners.',
     {f'o{j}': {'line': {'through': [P(30 * j), P(30 * j + 30)]}} for j in range(12)})

create = {}
rays = {0: 'h', 30: 'r30', 60: 'r60', 90: 'v', 120: 'r120', 150: 'r150'}
for a in range(15, 180, 30):
    create[f'r{a}'] = {'line': {'through': 'O', 'bisects': [P(a - 15), 'O', P(a + 15)]}}
    rays[a] = f'r{a}'
step('Halve each of the twelve angles at O with a line, so there is a line through O every 15°.', create)

if variant == 'mian':
    step('Mark where the 75° line cuts the circle, and join that point to the point on the left of the horizontal. Where this line crosses the vertical, draw a circle about O: it is the inner circle the rosette is built on.',
         {'P75': {'point': {'meet': ['c', 'r75'], 'pick': {'angle': 75}}},
          'ch': {'line': {'through': ['P180', 'P75']}},
          'T': {'point': {'meet': ['ch', 'v']}},
          'ci': {'circle': {'centre': 'O', 'through': 'T'}}}, 'compass', ['P180'])
    ring, rname = 'ci', 'Q'
    text = 'Mark the twelve points where the inner circle meets the lines at 15°, 45°, 75° and so on.'
else:
    ring, rname = 'c', 'Q'
    text = 'Mark the twelve points where the first circle meets the lines at 15°, 45°, 75° and so on, halfway between the corners of the outline.'
create = {}
for a in range(15, 360, 30):
    create[f'{rname}{a}'] = {'point': {'meet': [ring, rays[a % 180]], 'pick': {'angle': a}}}
step(text, create)

create = {}
for k in range(12):
    a = 15 + 30 * k
    create[f's{k}'] = {'line': {'through': [f'{rname}{a}', f'{rname}{(a + 150) % 360}']}}
step('Join each of these points to the one five places round, 150° away. The twelve lines make a twelve-pointed star.', create)


# ---- geometry, to name the ink corners ---------------------------------------
rho = math.tan(math.radians(37.5)) if variant == 'mian' else 1.0
d = rho * math.cos(math.radians(75))


def normal(k):
    # line s_k joins 15+30k and 165+30k: its normal points at 90 + 30k
    a = math.radians(90 + 30 * k)
    return (math.cos(a), math.sin(a))


def meet(k, j):
    a, b = normal(k), normal(j)
    det = a[0] * b[1] - a[1] * b[0]
    return ((d * b[1] - d * a[1]) / det, (a[0] * d - b[0] * d) / det)


ap = math.cos(math.radians(15))


def side_normal(j):
    a = math.radians(15 + 30 * j)
    return (math.cos(a), math.sin(a))


def meet_lines(n, c, m, e):
    det = n[0] * m[1] - n[1] * m[0]
    return ((c * m[1] - e * n[1]) / det, (n[0] * e - m[0] * c) / det)


def tpar(n, p):
    return -n[1] * p[0] + n[0] * p[1]


if tile_kind == 'square':
    edges = [(0, 'gE', 'P0', 'h'), (90, 'gN', 'P90', 'v'), (180, 'gW', 'P180', 'h'), (270, 'gS', 'P270', 'v')]
else:
    edges = [(60 * k, f'g{60 * k}', P(60 * k), rays[(60 * k) % 180]) for k in range(6)]
tile_edges = [((math.cos(math.radians(a)), math.sin(math.radians(a))), name) for a, name, _, _ in edges]

create = {}
paths = []
for k in range(12):
    n = normal(k)
    for other in ((k + 3) % 12, (k - 3) % 12):
        X = meet(k, other)
        t0 = tpar(n, X)
        sgn = 1 if t0 > 0 else -1
        best = None
        for j in range(12):
            m = side_normal(j)
            if abs(n[0] * m[1] - n[1] * m[0]) < 1e-9:
                continue
            q = meet_lines(n, d, m, ap)
            tq = tpar(n, q)
            if (tq - t0) * sgn > 1e-9 and math.hypot(*q) <= 1 + 1e-9 and (best is None or abs(tq - t0) < abs(best[0] - t0)):
                best = (tq, j)
        j = best[1]
        hn = f'H{k}_{j}'
        create.setdefault(hn, {'point': {'meet': [f's{k}', f'o{j}']}})
        cn = f'X{min(k, other)}_{max(k, other)}'
        create.setdefault(cn, {'point': {'meet': [f's{k}', f's{other}']}})
        paths.append({'through': [hn, cn]})
for j in range(12):
    m = side_normal(j)
    hits = []
    for k in range(12):
        n = normal(k)
        if abs(n[0] * m[1] - n[1] * m[0]) < 1e-9:
            continue
        q = meet_lines(m, ap, n, d)
        if math.hypot(*q) <= 1 + 1e-9:
            hits.append((tpar(m, q), f'H{k}_{j}'))
    hits.sort()
    # where the side leaves the tile, either way
    ends = []
    for sgn in (-1, 1):
        best = None
        for (e, ename) in tile_edges:
            den = -m[1] * e[0] + m[0] * e[1]
            if den * sgn <= 1e-12:
                continue
            q = meet_lines(m, ap, e, 1.0)
            tq = tpar(m, q)
            if best is None or abs(tq) < abs(best[0]):
                best = (tq, ename)
        en = f'E{j}{"a" if sgn < 0 else "b"}'
        q = meet_lines(m, ap, [e for e, nm in tile_edges if nm == best[1]][0], 1.0)
        corner = [nm for nm in (P(30 * j), P(30 * j + 30)) if math.dist(q, (math.cos(math.radians(int(nm[1:]))), math.sin(math.radians(int(nm[1:]))))) < 1e-9]
        if corner:
            ends.append(None)   # the outline's corner is on the tile edge
        else:
            create[en] = {'point': {'meet': [f'o{j}', best[1]]}}
            ends.append(en)
    # corners of the outline on this side: P(30j) and P(30j+30), in t order
    c0, c1 = sorted([P(30 * j), P(30 * j + 30)], key=lambda nm: tpar(m, (math.cos(math.radians(int(nm[1:]))), math.sin(math.radians(int(nm[1:]))))))
    paths.append({'through': [x for x in (ends[0], c0, hits[0][1]) if x]})
    paths.append({'through': [x for x in (hits[-1][1], c1, ends[1]) if x]})
tcreate = {}
for a, name, pt, ray in edges:
    tcreate[name] = {'line': {'through': pt, 'perpendicularTo': ray}}
corner_names = []
for i in range(len(edges)):
    a, b = edges[i][1], edges[(i + 1) % len(edges)][1]
    cn = f'K{i + 1}'
    tcreate[cn] = {'point': {'meet': [a, b]}}
    corner_names.append(cn)
tcreate['tile'] = {'polygon': corner_names}
if tile_kind == 'square':
    tile_text = 'Draw the square that touches the first circle at its top, bottom and sides: it is the tile.'
else:
    tile_text = 'Draw the hexagon whose sides touch the first circle at 0°, 60°, 120° and so on: it is the tile.'
step(tile_text, tcreate)
step('Mark where each star line meets the outline, where it crosses the line at right angles to it, and where the outline lines reach the edge of the tile.',
     create, 'fade')

common = {
    'format': 0, 'fold': 12 if tile_kind == 'hex' else 4, 'style': 'Mamluk', 'level': 'beginner',
    'given': {'O': 'The centre of the rosette.', 'A': 'Any point to the right of O. OA is the radius of the first circle.'},
    'steps': steps,
    'ink': {'text': 'Ink each star line from the outline inwards, stopping where it meets the line at right angles to it. Ink the outline lines from where a star line meets them, out through the outline’s corner to the edge of the tile, but not between the two star lines on each side.', 'paths': paths},
    'pattern': {'cell': 'tile', 'text': ('Repeat the square side to side.' if tile_kind == 'square' else 'Repeat the hexagon side to side.') + ' The outline lines run on into the neighbouring tiles and close the shapes between the rosettes.', 'palette': 'Fès tile', 'colors': {}},
    'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
}
if variant == 'mian':
    tut = {'id': 'twelve-fold-rosette-mian' + ('' if tile_kind == 'square' else '-hex'), 'title': 'Twelve-fold rosette (Samira Mian’s construction)' + ('' if tile_kind == 'square' else ', hexagonal tile'),
           'credits': [{'source': 'Twelvefold Islamic Geometric Rosette (online tutorial)', 'creator': 'Samira Mian',
                        'url': 'https://www.samiramian.uk/twelvefoldrosette',
                        'note': 'The construction (the inner circle from one chord, the star lines joining its points 150° apart, the inking, and the square and hexagonal tiles) follows her tutorial; the wording is ours. She names the source as the minbar of the al-Maridani mosque, Cairo.',
                        'steps': list(range(1, len(steps) + 1))}]}
else:
    tut = {'id': 'twelve-fold-rosette-open', 'title': 'Twelve-fold rosette, open petals', 'credits': []}
tut.update(common)
tut = {k: tut[k] for k in ['format', 'id', 'title', 'fold', 'style', 'level', 'credits', 'given', 'steps', 'ink', 'pattern', 'expect']}
json.dump(tut, open(out, 'w'), ensure_ascii=False)
print(len(steps), 'steps,', len(paths), 'ink paths')
