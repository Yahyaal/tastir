#!/usr/bin/env python3
"""SHAF2, Shafai page 248 (Tiling Search data200/SHAF2), sixteen-fold batch S3:
the design of Bourgoin's plate 149 (A285, gen_bourgoin_149_rosettes.py) with a
smaller tile, drawn as tiles edge to edge, every star split into kites.

Reading the drawing (27 October 2026): the stars sit on a square grid turned
by 45°, so the pieces are turned by 45° about a large star first (DRAWING).
Every edge then runs at a multiple of 11.25°. OA is the radius of the large
star's points, R = 127.858 pt, the same star as A285 (the same sixteen lines,
U1 to U5 turned), so the two share steps 1 to 4.
- The tile's half-side L is the one free length of the design: drawing
  211.729 pt = 1.65597 R. Two of the star's own corners give it exactly: X,
  where the lines through U2, U6 and U16, U4 cross (0.76537 from O on the
  56.25° line), and Y, where those through U12, U16 and U13, U1 cross (0.72096
  from O on the 315° line). The horizontal line through X meets the 45° line
  through Y at x = 0.76537 sin 56.25° + 2 · 0.72096 cos 45° = 1.65597.
- As in A285, an eight-pointed star sits on each side of the tile, on the
  22.5° line through O.
Every other line runs through a crossing of these, found by the greedy plan
(lab mode: gen_shafai_248_rosettes.py lab <pieces.json>).

Use: gen_shafai_248_rosettes.py <pieces.json> <tutorial.json>, then pnpm review,
then gen_shafai_248_rosettes.py finish <dump.json> <tutorial.json>
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
import gen_bourgoin_149_rosettes as a285  # noqa: E402

ORIGIN, UNIT, TURN = (367.23, 357.13), 127.858, 45.0
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


def seeds():
    global L
    a285.star()
    for j in range(16):
        s16.DESC['t' if j == 0 else f't@{j}'] = f'the line through U{1 + j} and U{(4 + j) % 16 + 1}'
    step('The line through U2 and U6 crosses the line through U16 and U4 at X. '
         'The line through U12 and U16 crosses the line through U13 and U1 at Y. '
         'Draw a horizontal line through X. Draw a line through Y parallel to the 45° line through O. '
         'The two new lines cross at Q.')
    r1, r2 = math.sqrt(.5) / math.cos(math.pi / 8), math.sqrt(.5) / math.cos(math.pi / 16)
    x = (r1 * math.cos(math.radians(56.25)), r1 * math.sin(math.radians(56.25)))
    y = (r2 * math.sqrt(.5), -r2 * math.sqrt(.5))
    g.meet('X', 't@1', 't@15', x)
    g.meet('Y', 't@11', 't@12', y)
    g.line_perp('qx', 'X', 'v')
    g.line_par('qy', 'Y', 'd45')
    L = y[0] + (x[1] - y[1])
    g.meet('Q', 'qx', 'qy', (L, x[1]))
    step('Draw a vertical line through Q. It crosses the horizontal line at M. '
         'Turn it round O by 90°, three times. '
         'The four lines make a square with corners K1, K2, K3 and K4.')
    g.line_perp('xl', 'Q', 'h')
    g.meet('M', 'xl', 'h', (L, 0))
    g.repeat('xr', ['xl'], 'rot4')
    for i, (a, b, xx, yy) in enumerate((('xl', 'xl@1', 1, 1), ('xl@1', 'xl@2', -1, 1),
                                        ('xl@2', 'xl@3', -1, -1), ('xl@3', 'xl', 1, -1))):
        g.meet(f'K{i + 1}', a, b, (xx * L, yy * L))


DESCS = {'xl': 'the vertical line through M', 'h': 'the horizontal line through O',
         'v': 'the vertical line through O', 'd45': 'the 45° line through O', 'd135': 'the 135° line through O'}
ORDERS = {'xl': 4, 't': 16}
# the greedy plan (lab): (point, line, line, where, direction k, turn, point already named)
PLAN = [
    ('P1', 'r2', 'xl', (1.65597, 0.685925), 10, 8, False),
    ('P1', 'r2', 'xl', (1.65597, 0.685925), 12, 8, True),
    ('P1', 'r2', 'xl', (1.65597, 0.685925), 4, 8, True),
    ('P2', 'r1', 'm3', (1.21091, 0.240865), 11, 16, False),
    ('P3', 'r2', 'm4', (1.074471, 0.44506), 7, 4, False),
    ('P4', 'h', 'm5', (0.985943, 0.0), 9, 4, False),
    ('P5', 'h', 'm4', (1.371851, 0.0), 10, 8, False),
    ('P6', 'd45', 'm7', (0.970045, 0.970045), 5, 4, False),
    ('P7', 'r1', 'm8', (0.37122, 0.07384), 9, 16, False),
    ('P8', 'h', 'm8', (0.321882, 0.0), 11, 4, False),
    ('P9', 'm2', 'm5', (1.21091, 1.130986), 1, 16, False),
    ('P10', 't@1', 'm10', (-0.18435, 0.757629), 12, 8, False),
    ('P11', 'm1', 'm12@6', (1.53976, 0.966481), 0, 4, False),
    ('P12', 'm2', 'm13', (1.375415, 0.966481), 8, 8, False),
]
WITHOUT = {}


def build():
    seeds()
    s16.DESC.update(DESCS)
    s16.ORDER.update(ORDERS)
    s16.write_plan(PLAN, size=2)
    for st in cm.steps:
        st['text'] = st['text'].replace('the 0° line through', 'the horizontal line through').replace(
            'The 0° line through', 'The horizontal line through').replace(
            'the 90° line through', 'the vertical line through').replace('The 90° line through', 'The vertical line through')
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
    'id': 'shafai-248-rosettes', 'title': 'Rosettes from Shafai, page 248',
    'short': 'Shafai 248 rosettes', 'subtitle': 'Shafai, page 248',
    'code': 'SHAF2', 'folder': 'data200', 'frame': (ORIGIN, UNIT, 0, None), 'star': 16,
    'style': 'Persian',
    'given': {'O': 'The centre of a sixteen-pointed star.',
              'A': 'A point of the star.'},
    'note': 'The finished design was read from Wichmann’s SHAF2 drawing of a pattern in Shafai’s book: the design '
            'of Bourgoin’s plate 149 on a smaller square tile, a sixteen-pointed star at its centre and '
            'eight-pointed stars on its sides, every star split into kites. Every edge runs at a multiple of '
            '11.25°. The star is the same, so the first four steps are shared. The tile’s half-side comes '
            'exactly from two corners of the star’s own lines, and every other line runs through a crossing of '
            'earlier lines.',
    'changes': 'Wichmann colours each piece and its mirror image differently; we colour by shape. '
               'No photograph was checked.',
    'references': 'His reference is Javad Shafai, On decoration in Persian architecture and wood carving '
                  '(Tehran, 1977), page 248, whose caption gives no place.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They outline every kite of the stars and the pieces between them.',
    'small': {'thin_wedge'},
    'palette': 'Mamluk wood',
    'repeat': 'Put copies of the square tile side by side. A sixteen-pointed star sits at the centre of every '
              'tile, and eight-pointed stars sit on its sides.',
}
NAMES = {(4, 0.166): ('star_kite', 'a'), (4, 0.062): ('corner_kite', 'd'), (4, 0.057): ('wing', 'b'),
         (4, 0.053): ('quad', 'c'), (4, 0.046): ('eight_kite', 'a'), (4, 0.039): ('wedge', 'ground'),
         (4, 0.022): ('thin_wedge', 'ground')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        import medium

        def run_build():
            build()
            # a hair over L, so the drawing's edges on the tile's sides are kept
            SPEC['frame'] = (ORIGIN, UNIT, 0, L + 2e-4)
        medium.run(run_build, SPEC, NAMES, drawing=drawing)
