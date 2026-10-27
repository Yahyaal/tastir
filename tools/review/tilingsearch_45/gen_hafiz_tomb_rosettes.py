#!/usr/bin/env python3
"""FIG8, the tomb of Hafiz at Shiraz (Tiling Search data169/FIG8), sixteen-fold
batch S3. Drawn as tiles edge to edge: a sixteen-pointed star ringed by
kites and pentagons, eight-pointed stars, octagons and a four-pointed star.

Reading the drawing (27 October 2026): the stars sit on a square grid turned
by 45°, so the pieces are turned by 45° about a large star first (DRAWING).
Every edge then runs at 11.25° + 22.5°k. OA is the radius of the large star's
points, R = 85.239 pt; its sixteen lines join points of the circle 90° apart
(point angle 90°), and carried on past the points they make the kites round it.
- Each black pentagon has three equal outer sides (drawing 0.2813 R each). Its
  corners on the kites' tips, 5 and 9, see the far corner at 33.75° to the
  star line, so 9 is where the line through the kite's tip E, parallel to the
  67.5° line through O, crosses a star line. Its outer side runs through 9 at
  90° to the line from O (drawing 1.50828 R from O; ours 1.50819).
- The eight-pointed star on the tile's side has a point G where that outer side
  meets a star line, and the point below it on the next star line, 45° down
  from G; the tile's side runs through it (half-side drawing 1.74064 R; ours
  1.74055, 0.008 pt less).
Every other line runs through a crossing of these, found by the greedy plan
(lab mode: gen_hafiz_tomb_rosettes.py lab <pieces.json>).

Use: gen_hafiz_tomb_rosettes.py <pieces.json> <tutorial.json>, then pnpm review,
then gen_hafiz_tomb_rosettes.py finish <dump.json> <tutorial.json>
(or cycle_s2.sh).
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import snap16_s2 as s16  # noqa: E402

ORIGIN, UNIT, TURN = (298.036875, 373.698125), 85.2394, 45.0
L = None   # set by seeds()


def drawing(pieces):
    """Wichmann's pieces turned by 45° about the large star, in the frame,
    copied by the eight turns and mirrors of the square about O."""
    ps = json.load(open(pieces))
    t = math.radians(TURN)
    out = []
    for p in ps:
        q = []
        for X, Y in p['poly']:
            x, y = (X - ORIGIN[0]) / UNIT, -(Y - ORIGIN[1]) / UNIT
            q.append((x * math.cos(t) - y * math.sin(t), x * math.sin(t) + y * math.cos(t)))
        for j in range(4):
            c, s = round(math.cos(j * math.pi / 2)), round(math.sin(j * math.pi / 2))
            rq = [(c * x - s * y, s * x + c * y) for x, y in q]
            out.append(rq)
            out.append([(x, -y) for x, y in rq])
    return out


def near(p, tol=2e-3):
    """The crossing of two lines nearest p: (point, line a, line b), the
    lines the earliest made."""
    order = {n: i for i, n in enumerate(cm.el)}
    best = None
    for a in cm.lines():
        if not cm.on_line(p, a, tol):
            continue
        for b in cm.lines():
            if order[b] <= order[a] or not cm.on_line(p, b, tol):
                continue
            try:
                xs = cm.crossings(a, b)
            except (ZeroDivisionError, ValueError):
                continue
            for x in xs:
                d = math.dist(x, p)
                if d < tol:
                    key = (round(d, 6) > 1e-9 and 1, order[a] + order[b])
                    key = (round(d / tol, 1), order[a] + order[b])
                    if best is None or key < best[0]:
                        best = (key, x, a, b)
    assert best, ('no crossing near', p)
    return best[1], best[2], best[3]


def meet_near(name, p):
    x, a, b = near(p)
    g.meet(name, a, b, x)
    return x, a, b


def seeds():
    global L
    s16.opening(odd=True)
    step('Draw a straight line through U1 and U5. Turn it round O by 22.5°, fifteen times. '
         'These sixteen lines make the star at O.')
    g.line_through('t', 'U1', 'U5')
    g.repeat('tr', ['t'], 'rot16')
    for j in range(16):
        s16.DESC['t' if j == 0 else f't@{j}'] = f'the line through U{1 + j} and U{(4 + j) % 16 + 1}'
    s16.DESC.update(DESCS)
    s16.ORDER.update(ORDERS)
    e = math.sqrt(.5) / math.sin(math.radians(33.75))
    step('The line through U1 and U5 crosses the horizontal line at E, beyond A. '
         'Draw a line through E parallel to the 67.5° line through O. '
         'Turn it round O by 22.5°, fifteen times.')
    g.meet('E', 't', 'h', (e, 0))
    g.line_par('pe', 'E', 'r2@1')
    g.repeat('per', ['pe'], 'rot16')
    # the pentagon's corner F and its outer side
    f0 = (1.4518, 0.4322)
    x, a, b = near(f0)
    da, db = s16.describe(a), s16.describe(b)
    step(f'{da[0].upper()}{da[1:]} crosses {db} at F. '
         'Draw a line through F parallel to the 101.25° line through O. '
         'Turn it round O by 22.5°, fifteen times.')
    g.meet('F', a, b, x)
    g.line_par('pf', 'F', s16.REF[9])
    g.repeat('pfr', ['pf'], 'rot16')
    # the eight-pointed star: its point G, then H 45° below it
    x, a, b = near((1.3321, 0.7209))
    da, db = s16.describe(a), s16.describe(b)
    step(f'{da[0].upper()}{da[1:]} crosses {db} at G. '.replace(',, ', ', ') +
         'Draw a line through G parallel to the 135° line through O. It crosses the line through U12 and U16 at H. '
         'Draw a vertical line through H. It crosses the horizontal line at M. '
         'Turn the vertical line round O by 90°, three times. '
         'The four lines make a square with corners K1, K2, K3 and K4.')
    g.meet('G', a, b, x)
    g.line_par('pg', 'G', 'd135')
    # H: where pg crosses the star line through the eight-pointed star's lower point
    hx = None
    for n in cm.lines():
        if n.startswith('t'):
            for c in cm.crossings('pg', n):
                if math.dist(c, (1.7405, 0.3125)) < 2e-3:
                    hx = (c, n)
    best = hx
    assert best[1] == 't@11', best
    g.meet('H', 'pg', best[1], best[0])
    L = best[0][0]
    g.line_perp('xl', 'H', 'h')
    g.meet('M', 'xl', 'h', (L, 0))
    g.repeat('xr', ['xl'], 'rot4')
    for i, (a, b, x, y) in enumerate((('xl', 'xl@1', 1, 1), ('xl@1', 'xl@2', -1, 1),
                                      ('xl@2', 'xl@3', -1, -1), ('xl@3', 'xl', 1, -1))):
        g.meet(f'K{i + 1}', a, b, (x * L, y * L))


DESCS = {'xl': 'the vertical line through M', 'h': 'the horizontal line through O',
         'v': 'the vertical line through O', 'd45': 'the 45° line through O', 'd135': 'the 135° line through O',
         'pe': 'the 67.5° line through E', 'pf': 'the 101.25° line through F', 'pg': 'the 135° line through G'}
ORDERS = {'xl': 4, 't': 16, 'pe': 16, 'pf': 16}
PLAN = [
    ('H', 'pg', 'xl', (1.740551, 0.312569), 13, 16, True),
    ('P1', 'pe', 'xl', (1.740551, 1.129351), 13, 4, False),
    ('P2', 'd45', 'm2', (1.374163, 1.374163), 11, 4, False),
    ('P1', 'pe', 'xl', (1.740551, 1.129351), 3, 4, True),
    ('P3', 'h', 'm4', (0.050358, 0.0), 13, 4, False),
]
WITHOUT = {
    2: 'Draw a vertical line through O. It crosses the circle at S5. '
       'Draw the line through O that halves the angle between the horizontal and the vertical line. '
       'It crosses the circle at S3. Draw a line through O at 90° to it. '
       'Draw the line through O that halves the angle between the horizontal line and the line through S3. '
       'It crosses the circle at S2.',
    3: 'Draw the line through O that halves the angle between the horizontal line and the line through S2. '
       'It crosses the circle at U1. Draw a line through O at 90° to it. '
       'Mark the points U1 to U16 on the circle, 22.5° apart, starting from U1.',
    5: 'The line through U1 and U5 crosses the horizontal line at E, beyond A. '
       'Draw a line through E parallel to the 67.5° line through O.',
    7: 'The line through U13 and U1 crosses the 101.25° line through F, turned by 22.5°, at G. '
       'Draw a line through G parallel to the 135° line through O. It crosses the line through U12 and U16 at H. '
       'Draw a vertical line through H. It crosses the horizontal line at M. '
       'Turn the vertical line round O by 90°, twice. '
       'These are three sides of a square with corners K1, K2, K3 and K4. Its fourth side is not drawn.',
}


def fix_words(st):
    st['text'] = st['text'].replace('the 0° line through', 'the horizontal line through').replace(
        'The 0° line through', 'The horizontal line through').replace(
        'the 90° line through', 'the vertical line through').replace('The 90° line through', 'The vertical line through')


def build():
    seeds()
    s16.DESC.update(DESCS)
    s16.ORDER.update(ORDERS)
    s16.write_plan(PLAN, size=2)
    for st in cm.steps:
        fix_words(st)
        if st['id'] in WITHOUT:
            st['textWithoutHelpers'] = WITHOUT[st['id']]


def lab():
    seeds()
    print('L', L)
    s16.DESC.update(DESCS)
    s16.ORDER.update(ORDERS)
    polys = drawing(sys.argv[2])
    nd = s16.need(polys, L)
    print('needed', len(nd), 'missing', len(s16.missing(nd)))
    tol = float(os.environ.get('TOL', '6e-4'))
    pl = s16.plan(polys, L, tol=tol, verbose=True)
    print(json.dumps(pl))


SPEC = {
    'id': 'hafiz-tomb-rosettes', 'title': 'Rosettes of the tomb of Hafiz (Shiraz)',
    'short': 'Hafiz tomb rosettes', 'subtitle': 'Tomb of Hafiz, Shiraz',
    'code': 'FIG8', 'folder': 'data169', 'frame': (ORIGIN, UNIT, 0, None), 'star': 16,
    'style': 'Persian',
    'given': {'O': 'The centre of a sixteen-pointed star.',
              'A': 'A point of the star.'},
    'note': 'The finished design was read from Wichmann’s FIG8 drawing: sixteen-pointed stars ringed by kites '
            'and pentagons, eight-pointed stars between them, octagons, and a four-pointed star at each corner '
            'of the square tile. Every edge runs at 11.25° plus a multiple of 22.5°. The star’s lines join points '
            'of its circle 90° apart and, carried on, make the kites round it. Each pentagon has three equal outer '
            'sides, and the eight-pointed star’s points fix the tile; every other line runs through a crossing of '
            'earlier lines.',
    'changes': 'The tile is 0.005% smaller than Wichmann’s (0.008 pt in his drawing). Colours follow his drawing. '
               'No photograph was checked.',
    'references': 'His references are a letter from Anthony Lee (the tomb of Hafiz at Shiraz) and a photograph '
                  'of the Kok Gumbaz mosque at Shahrisabz.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the stars, the pentagons and the pieces between them.',
    'small': set(),
    'palette': 'Timurid tile',
    'repeat': 'Put copies of the square tile side by side. The sixteen-pointed stars sit at the tile’s centre '
              'and, between them, four-pointed stars at its corners.',
}
NAMES = {(32, 2.655): ('star', 'a'), (16, 0.433): ('eight_star', 'a'), (8, 0.21): ('octagon', 'd'),
         (5, 0.163): ('pentagon', 'ground'), (6, 0.157): ('hexagon', 'c'), (8, 0.103): ('four_star', 'ground'),
         (4, 0.082): ('kite', 'b'), (4, 0.041): ('small_kite', 'b')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        import medium

        def run_build():
            build()
            SPEC['frame'] = (ORIGIN, UNIT, 0, L)
        medium.run(run_build, SPEC, NAMES, drawing=drawing)
