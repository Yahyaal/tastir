#!/usr/bin/env python3
"""A285, Bourgoin's plate 149 (top) (Tiling Search data15/A285), sixteen-fold
batch S3. Drawn as tiles edge to edge, every star split into kites.

Reading the drawing (27 October 2026): Wichmann draws the square cell turned
by 33.75°, so the pieces are turned back about the large star first (DRAWING).
Every edge then runs at a multiple of 11.25°. OA is the radius of the
sixteen-pointed star's points, R = 127.859 pt; the star's sixteen lines join
points of the circle 90° apart (point angle 90°, as Wichmann's page says).
- The cell's half-side L is the only other free length: drawing 251.9685 pt =
  1.97067 R. The line through A at 45° and the chord from U3 to S7 cross at
  x = 1.97086 (0.024 pt from the drawing), which we take.
- An eight-pointed star sits on each side of the cell, on the 22.5° line
  through O; a four-pointed star at each corner.
Every other line runs through a crossing of these, found by the greedy plan
(lab mode: gen_bourgoin_149_rosettes.py lab <pieces.json>).

Use: gen_bourgoin_149_rosettes.py <pieces.json> <tutorial.json>, then pnpm review,
then gen_bourgoin_149_rosettes.py finish <dump.json> <tutorial.json>
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

ORIGIN, UNIT, TURN = (368.6, 371.0), 127.859, -33.75


def corner():
    """The crossing of the 45° line through A and the chord U3–S7."""
    u3 = (math.cos(math.radians(56.25)), math.sin(math.radians(56.25)))
    s7 = (-math.sqrt(.5), math.sqrt(.5))
    # x - y = 1 meets the line u3 + t (s7 - u3)
    dx, dy = s7[0] - u3[0], s7[1] - u3[1]
    t = (1 - u3[0] + u3[1]) / (dx - dy)
    return u3[0] + t * dx, u3[1] + t * dy


QX, QY = corner()
L = QX


def drawing(pieces, page=(612, 792)):
    """Wichmann's pieces turned back by 33.75° about the large star, in the
    frame. The page cuts off one corner of the turned cell, so the pieces cut
    by the page's edge are dropped and the rest copied by the eight turns and
    mirrors of the square about O."""
    ps = json.load(open(pieces))
    t = math.radians(TURN)
    out = []
    for p in ps:
        if any(X < 0.5 or Y < 0.5 or X > page[0] - 0.5 or Y > page[1] - 0.5 for X, Y in p['poly']):
            continue
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
    s16.opening(odd=True)
    step('Draw a straight line through U1 and U5. Turn it round O by 22.5°, fifteen times. '
         'These sixteen lines make the star at O.')
    g.line_through('t', 'U1', 'U5')
    g.repeat('tr', ['t'], 'rot16')
    for j in range(16):
        s16.DESC['t' if j == 0 else f't@{j}'] = 'a star line'
    step('Draw a line through A parallel to the 45° line through O. Draw a straight line through U3 and S7. '
         'The two lines cross at Q. Draw a vertical line through Q. It crosses the horizontal line at M. '
         'Turn the vertical line round O by 90°, three times. '
         'The four lines make a square with corners K1, K2, K3 and K4.')
    g.line_par('qa', 'A', 'd45')
    g.line_through('qb', 'U3', 'S7')
    g.meet('Q', 'qa', 'qb', (QX, QY))
    g.line_perp('xl', 'Q', 'h')
    g.meet('M', 'xl', 'h', (L, 0))
    g.repeat('xr', ['xl'], 'rot4')
    for i, (a, b, x, y) in enumerate((('xl', 'xl@1', 1, 1), ('xl@1', 'xl@2', -1, 1),
                                      ('xl@2', 'xl@3', -1, -1), ('xl@3', 'xl', 1, -1))):
        g.meet(f'K{i + 1}', a, b, (x * L, y * L))


DESCS = {'xl': 'the vertical line through M', 'h': 'the horizontal line through O',
         'v': 'the vertical line through O', 'd45': 'the 45° line through O', 'd135': 'the 135° line through O'}
ORDERS = {'xl': 4, 't': 16}
# the greedy plan (lab): (point, line, line, where, direction k, turn, point already named)
PLAN = [
    ('P1', 'r2', 'xl', (1.970864, 0.816359), 0, 8, False),
    ('P1', 'r2', 'xl', (1.970864, 0.816359), 14, 8, True),
    ('P2', 'd45', 'm2', (1.154505, 1.154505), 3, 4, False),
    ('P3', 'v', 'm3', (0.0, 0.38309), 13, 4, False),
    ('P4', 'm1', 'm3', (0.648433, 0.816359), 13, 16, False),
    ('P5', 'r1', 'm4', (0.44181, 0.087881), 9, 16, False),
    ('P2', 'd45', 'm2', (1.154505, 1.154505), 15, 16, True),
    ('P1', 'r2', 'xl', (1.970864, 0.816359), 12, 8, True),
    ('P6', 'm3', 'm8', (1.441172, 1.34605), 7, 4, False),
    ('P7', 'd45', 'm9', (1.464791, 1.464791), 1, 4, False),
    ('P1', 'r2', 'xl', (1.970864, 0.816359), 10, 8, True),
    ('P8', 'm6', 'm10', (0.217285, 1.216647), 0, 4, False),
    ('P9', 'xl', 'm3', (1.970864, 1.699979), 13, 4, False),
    ('P10', 'xl', 'm10', (1.970864, 1.565456), 11, 4, False),
    ('P11', 'm11', 'm12', (1.805059, 1.216647), 4, 8, False),
    ('P12', 'm2', 'm12', (1.004482, 1.216647), 12, 8, False),
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
    s16.DESC.update(DESCS)
    s16.ORDER.update(ORDERS)
    polys = drawing(sys.argv[2])
    nd = s16.need(polys, L)
    print('L', L, 'needed', len(nd), 'missing', len(s16.missing(nd)))
    tol = float(os.environ.get('TOL', '6e-4'))
    pl = s16.plan(polys, L, tol=tol, verbose=True)
    print(json.dumps(pl))


SPEC = {
    'id': 'bourgoin-149-rosettes', 'title': 'Rosettes of Bourgoin’s plate 149',
    'short': 'Bourgoin 149 rosettes', 'subtitle': 'Bourgoin, plate 149 (top)',
    'code': 'A285', 'folder': 'data15', 'frame': (ORIGIN, UNIT, 0, L), 'star': 16,
    'style': 'Mamluk',
    'given': {'O': 'The centre of a sixteen-pointed star.',
              'A': 'A point of the star.'},
    'note': 'The finished design was read from Wichmann’s A285 drawing of Bourgoin’s plate 149 (top): a '
            'sixteen-pointed star on a square tile, eight-pointed stars on the tile’s sides and a four-pointed '
            'star at each corner, every star split into kites. Every edge runs at a multiple of 11.25°. The '
            'star’s lines join points of its circle 90° apart. The tile’s half-side is the one free length '
            '(drawing: 1.97067 times the star’s radius); we take the crossing of the 45° line through A with '
            'the chord from U3 to S7, 1.97086. Every other line runs through a crossing of earlier lines.',
    'changes': 'The tile is 0.01% larger than Wichmann’s (0.024 pt in his drawing). Wichmann colours each piece and its mirror image differently; we colour by shape. '
               'No photograph was checked.',
    'references': 'His references are Jules Bourgoin, Arabic Geometrical Pattern and Design (Dover, 1973), '
                  'plate 149 (top), and S. J. Abas and A. S. Salman, Symmetries of Islamic Geometrical Patterns '
                  '(World Scientific, 1995), page 285.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They outline every kite of the stars and the pieces between them.',
    'small': {'thin_wedge'},
    'palette': 'Mamluk wood',
    'repeat': 'Put copies of the square tile side by side. A sixteen-pointed star sits at the centre of every '
              'tile. Eight-pointed stars sit on its sides, and a four-pointed star at each corner.',
}
NAMES = {(4, 0.166): ('star_kite', 'a'), (4, 0.115): ('wing', 'b'), (4, 0.094): ('eight_kite', 'a'),
         (4, 0.066): ('four_kite', 'd'), (4, 0.06): ('quad', 'c'), (4, 0.055): ('wedge', 'ground'),
         (4, 0.031): ('thin_wedge', 'ground')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        import medium
        medium.run(build, SPEC, NAMES, drawing=drawing)
