#!/usr/bin/env python3
"""Builds the two twelve-fold rosette tutorials (owner, 2026-10-05):

  mian  follows Samira Mian's construction: the twelve star lines join the
        points of an inner circle found from one chord (credited).
  open  our own, shorter variant: the star lines join the points of the
        first circle itself, so the petals are wider and the centre opener.

Both: the rosette fills a twelve-sided outline whose corners touch the
square tile at the middle of each side, so rosettes meet corner to corner.

Usage: gen_twelve_rosette.py mian|open tutorials/<id>.json
"""
import json
import math
import sys

variant, out = sys.argv[1], sys.argv[2]
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

step('Join the twelve points in turn: this twelve-sided figure is the outline of the rosette.',
     {'out': {'polygon': [P(30 * k) for k in range(12)]}})

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


def outline_hit(k, sg):
    n = normal(k)
    t_ = (-n[1] * sg, n[0] * sg)
    p0 = (n[0] * d, n[1] * d)
    best = None
    for j in range(12):
        a = math.radians(15 + 30 * j)
        m = (math.cos(a), math.sin(a))
        den = t_[0] * m[0] + t_[1] * m[1]
        if den > 1e-9:
            t = (ap - (p0[0] * m[0] + p0[1] * m[1])) / den
            if best is None or t < best[0]:
                best = (t, j)
    t, j = best
    return (p0[0] + t * t_[0], p0[1] + t * t_[1]), j


create = {}
paths = []
side_hits = {j: [] for j in range(12)}
for k in range(12):
    for sg, other in ((1, (k + 3) % 12), (-1, (k - 3) % 12)):
        p, j = outline_hit(k, sg)
        hn = f'H{k}{"a" if sg > 0 else "b"}'
        ang = math.degrees(math.atan2(p[1], p[0])) % 360
        create[hn] = {'point': {'meet': [f's{k}', 'out'], 'pick': {'angle': round(ang, 3)}}}
        side_hits[j].append((ang, hn))
        cn = f'X{min(k, other)}_{max(k, other)}'
        if cn not in create:
            create[cn] = {'point': {'meet': [f's{k}', f's{other}']}}
        paths.append({'through': [hn, cn]})
for j in range(12):
    a0, a1 = 30 * j, 30 * j + 30
    hits = sorted(side_hits[j], key=lambda h: (h[0] - a0) % 360)
    paths.append({'through': [P(a0)] + [h[1] for h in hits] + [P(a1)]})
create['gE'] = {'line': {'through': 'P0', 'perpendicularTo': 'h'}}
create['gW'] = {'line': {'through': 'P180', 'perpendicularTo': 'h'}}
create['gN'] = {'line': {'through': 'P90', 'perpendicularTo': 'v'}}
create['gS'] = {'line': {'through': 'P270', 'perpendicularTo': 'v'}}
create['K1'] = {'point': {'meet': ['gE', 'gN']}}
create['K2'] = {'point': {'meet': ['gW', 'gN']}}
create['K3'] = {'point': {'meet': ['gW', 'gS']}}
create['K4'] = {'point': {'meet': ['gE', 'gS']}}
create['tile'] = {'polygon': ['K1', 'K2', 'K3', 'K4']}
step('Mark where each star line meets the outline, and where it crosses the line at right angles to it. Then draw the square that touches the outline at its top, bottom and sides: it is the tile.',
     create, 'fade')

common = {
    'format': 0, 'fold': 12, 'style': 'Mamluk', 'level': 'beginner',
    'given': {'O': 'The centre of the rosette.', 'A': 'Any point to the right of O. OA is the radius of the first circle.'},
    'steps': steps,
    'ink': {'text': 'Ink each star line from the outline inwards, stopping where it meets the line at right angles to it, and ink the outline. Twelve petals ring a twelve-pointed star.', 'paths': paths},
    'pattern': {'cell': 'tile', 'text': 'Repeat the square side to side: neighbouring rosettes meet corner to corner, and a four-pointed space opens between four of them.', 'palette': 'Fès tile', 'colors': {}},
    'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
}
if variant == 'mian':
    tut = {'id': 'twelve-fold-rosette-mian', 'title': 'Twelve-fold rosette (Samira Mian’s construction)',
           'credits': [{'source': 'Twelvefold Islamic Geometric Rosette (online tutorial)', 'creator': 'Samira Mian',
                        'url': 'https://www.samiramian.uk/twelvefoldrosette',
                        'note': 'The construction (the inner circle from one chord, the star lines joining its points 150° apart, and the inking) follows her tutorial; the wording is ours. She names the source as the minbar of the al-Maridani mosque, Cairo.',
                        'steps': list(range(1, len(steps) + 1))}]}
else:
    tut = {'id': 'twelve-fold-rosette-open', 'title': 'Twelve-fold rosette, open petals', 'credits': []}
tut.update(common)
tut = {k: tut[k] for k in ['format', 'id', 'title', 'fold', 'style', 'level', 'credits', 'given', 'steps', 'ink', 'pattern', 'expect']}
json.dump(tut, open(out, 'w'), ensure_ascii=False)
print(len(steps), 'steps,', len(paths), 'ink paths')
