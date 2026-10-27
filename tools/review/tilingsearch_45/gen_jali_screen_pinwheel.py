#!/usr/bin/env python3
"""MET2 (Tiling Search data193/MET2, a Mughal jali screen in the Met,
1984.193), sixteen-fold batch S4. On Wichmann's list of two-level patterns
(his upper level is the Termez palace design), but the drawing is one
edge-to-edge tiling, so it is built as one.

Reading the drawing (27 October 2026): pieces drawn edge to edge, no band gap.
The square repeat is 252.34 pt. The pieces turn into themselves by 90° about
O, but have no mirror: the design is p4 (chiral), not p4m as the page says.
OA is half the repeat, so the cell is |x|, |y| <= 1 and the circle through A
runs through the middles of the tile's sides.
Every edge but two runs at 22.5° + a multiple of 45°, on a line through a
whole-numbered point (m, n) of the frame (a cell corner, a side's middle or a
centre): offsets 0, s, c - s, c, c - 2s, 3s at 22.5° and 112.5°, and 0, s,
c - s, c, 2s, 3s - c at 67.5° and 157.5° (s = sin 22.5°, c = cos 22.5°;
drawing within 0.0005). The others are horizontal and vertical, at 1/2.
Use: gen_jali_screen_pinwheel.py <pieces.json> tutorials/jali-screen-pinwheel.json, pnpm review
jali-screen-pinwheel, then gen_jali_screen_pinwheel.py finish <dump.json> <tutorial.json>.
Lab: gen_jali_screen_pinwheel.py lab <pieces.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import snap16_s2 as s16  # noqa: E402

C22, S22 = math.cos(math.pi / 8), math.sin(math.pi / 8)
L = 1.0
ORIGIN, UNIT = (293.8, 434.1), 126.17


def seeds():
    s16.opening(odd=False)
    step('Draw a vertical line through A. Turn it round O by 90°, three times. '
         'The four lines make the square tile, with corners K1, K2, K3 and K4.')
    g.line_perp('gx', 'A', 'h')
    g.repeat('gr', ['gx'], 'rot4')
    for i, (a, b, w) in enumerate([('gx', 'gx@1', (L, L)), ('gx@1', 'gx@2', (-L, L)),
                                   ('gx@2', 'gx@3', (-L, -L)), ('gx@3', 'gx', (L, -L))]):
        g.meet(f'K{i + 1}', a, b, w)


DESCS = {'gx': 'the right side of the tile', 'h': 'the horizontal line through O',
         'v': 'the vertical line through O', 'd45': 'the 45° line through O', 'd135': 'the 135° line through O'}
ORDERS = {'gx': 4}


def lab():
    import json
    seeds()
    polys = cm.frame_pieces(sys.argv[2], ORIGIN, 2 * UNIT, 0)
    s16.HAVE_TOL[0] = 2e-3
    nd = s16.need(polys, L)
    left = s16.missing(nd)
    print('needed', len(nd), 'missing', [(k * 11.25, round(o, 4)) for k, o in left])
    s16.DESC.update(DESCS)
    s16.ORDER.update(ORDERS)
    pl = s16.plan(polys, L, reach=float(os.environ.get("REACH", 1.01)), tol=1.5e-3, verbose=True, circles='--circles' in sys.argv)
    print(json.dumps(pl))


PLAN = [
    ('K1', 'd45', 'gx', (1.0, 1.0), 6, 8, True),
    ('A', 'h', 'gx', (1.0, 0.0), 2, 8, True),
    ('P1', 'h', 'm1', (0.585786, 0.0), 14, 4, False),
    ('A', 'h', 'gx', (1.0, 0.0), 6, 8, True),
    ('P2', 'm1', 'm2', (0.5, -0.207107), 8, 4, False),
    ('P3', 'm3', 'm5', (0.5, 0.035534), 2, 4, False),
    ('P4', 'r2', 'gx', (1.0, 0.414214), 6, 4, False),
    ('P5', 'gx', 'm4@2', (1.0, 0.585786), 10, 4, False),
]


def build():
    seeds()
    s16.DESC.update(DESCS)
    s16.ORDER.update(ORDERS)
    s16.write_plan(PLAN, size=2)
    for st in cm.steps:
        st['text'] = st['text'].replace('the 90° line through', 'the vertical line through').replace(
            'the 0° line through', 'the horizontal line through')
    for i, t in WITHOUT.items():
        cm.steps[i - 1]['textWithoutHelpers'] = t


WITHOUT = {
    1: 'Draw a circle with centre O through A.',
    2: 'Draw a vertical line through O. It crosses the circle at S5. '
       'Draw the line through O that halves the angle between A and S5. It crosses the circle at S3. '
       'Draw the line through O that halves the angle between A and S3. It crosses the circle at S2. '
       'Turn this line round O by 45°, three times. '
       'The lines through O cross the circle at S1 to S16, with S1 at A.',
    3: 'Draw a vertical line through A. Draw a horizontal line through S5. '
       'They cross at K1, a corner of the square tile. K2, K3 and K4 are its other corners.',
}


SPEC = {
    'id': 'jali-screen-pinwheel', 'title': 'Pinwheel of a Mughal jali screen',
    'short': 'Jali screen pinwheel', 'subtitle': 'Jali screen, India (Metropolitan Museum of Art)',
    'code': 'MET2', 'folder': 'data193', 'frame': (ORIGIN, UNIT, 0, L), 'star': None,
    'style': 'Mughal', 'palette': 'Timurid tile', 'look': 'strapwork', 'chiral': True,
    'given': {'O': 'The centre of the tile, where the pinwheel turns.',
              'A': 'The middle of the tile’s right side, halfway to the next tile’s centre.'},
    'note': 'The finished design was read from Wichmann’s MET2 drawing, whose pieces are drawn edge to edge. '
            'O is a centre of four-fold turning and OA is half the repeat. All but two of its lines run at 22.5° '
            'to the tile’s sides or at 45° to those, and each passes through a corner of the tile, the middle of '
            'a side or a centre of a tile (drawing within 0.0005 of OA). The other two lines each way are '
            'horizontal and vertical, halfway from O to the tile’s sides. Every line runs through a crossing of '
            'earlier lines inside the tile.',
    'changes': 'Wichmann’s page gives the symmetry as p4m, but the lines at 22.5° and at 67.5° are not mirror '
               'images of each other, so the design is a pinwheel; we follow the drawing. His thick and thin '
               'bands (the two levels of the design) are drawn as plain lines. Colours follow the shapes, not his '
               'drawing, which is one colour. No photograph was checked.',
    'references': 'His reference is the Metropolitan Museum of Art’s jali screen 1984.193 (India). He names the '
                  'upper level as the Termez palace design.',
    'ink': 'Ink the lines picked out in orange. They close the hexagons, the pentagons and the small squares.',
    'repeat': 'Put copies of the square tile side by side. The pinwheel turns about the centre of every tile.',
}
NAMES = {(6, 0.086): ('hexagon', 'b'), (8, 0.086): ('octagon', 'a'), (5, 0.048): ('pentagon', 'ground'),
         (4, 0.025): ('square', 'c')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        import medium
        medium.run(build, SPEC, NAMES, drawing=lambda pcs: cm.frame_pieces(pcs, ORIGIN, 2 * UNIT, 0))
