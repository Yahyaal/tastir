#!/usr/bin/env python3
"""P065, Bourgoin's plate 65 (Tiling Search data168/P065), sixteen-fold batch
S3. Drawn as tiles edge to edge.

Reading the drawing (27 October 2026): sixteen-pointed stars on a square
grid, 343.288 pt apart, O at one of them. OA is half that spacing, so the
square tile's sides touch the circle at O through A. Every edge runs at a
multiple of 22.5°, and every line belongs to one of three sets about O:
- sixteen lines joining points of the circle 90° apart (offset √2/2, drawing
  0.70711);
- sixteen lines parallel to those, at 1 − √(2 − √2) from O (drawing 0.23463),
  where two of the first set two apart cross √(2 − √2) from O;
- eight lines at 22.5° + 45°k, 1.14063 from O.
Each runs through a crossing of earlier lines, found by the greedy plan
(lab mode: gen_bourgoin_65_rosettes.py lab <pieces.json>).

Use: gen_bourgoin_65_rosettes.py <pieces.json> <tutorial.json>, then pnpm review,
then gen_bourgoin_65_rosettes.py finish <dump.json> <tutorial.json>
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

ORIGIN, UNIT = (297.956, 373.294), 171.644
L = 1.0


def seeds():
    s16.opening(odd=False)
    step('Draw a straight line through S1 and S5. Turn it round O by 22.5°, fifteen times. '
         'These sixteen lines make the large star at O.')
    g.line_through('t', 'S1', 'S5')
    g.repeat('tr', ['t'], 'rot16')
    for j in range(16):
        s16.DESC['t' if j == 0 else f't@{j}'] = f'the line through S{1 + j} and S{(4 + j) % 16 + 1}'
    step('Draw a vertical line through A. Turn it round O by 90°, three times. '
         'The four lines make a square with corners K1, K2, K3 and K4.')
    g.line_perp('gx', 'A', 'h')
    g.repeat('gr', ['gx'], 'rot4')
    for i, (a, b, x, y) in enumerate((('gx', 'gx@1', 1, 1), ('gx@1', 'gx@2', -1, 1),
                                      ('gx@2', 'gx@3', -1, -1), ('gx@3', 'gx', 1, -1))):
        g.meet(f'K{i + 1}', a, b, (x, y))
    r = math.sqrt(2 - math.sqrt(2))
    step('The line through S2 and S6 crosses the line through S4 and S8 at X, above O. '
         'Open the compass from X to S5. Draw a circle with this opening and centre O. '
         'It crosses the vertical line through O at Y, above O. '
         'Draw a horizontal line through Y. Turn it round O by 22.5°, fifteen times.', 'compass')
    g.meet('X', 't@1', 't@3', (0, r))
    g.circle_from('kx', 'O', 'X', 'S5')
    g.meet('Y', 'kx', 'v', (0, 1 - r))
    g.line_perp('a', 'Y', 'v')
    g.repeat('ar', ['a'], 'rot16')


DESCS = {'h': 'the horizontal line through O', 'v': 'the vertical line through O',
         'd45': 'the 45° line through O', 'd135': 'the 135° line through O',
         'gx': 'the vertical line through A', 'gx@1': 'the horizontal line through S5'}
ORDERS = {'t': 16}
PLAN = [('P1', 't@13', 'gx', (1.0, 0.566454), 10, 8, False)]
WITHOUT = {
    1: 'Draw a circle with centre O through A.',
    2: 'Draw a vertical line through O. It crosses the circle at S5. Draw the 45° line through O. '
       'It crosses the circle at S3. Draw a line through O at 90° to it. '
       'Mark the points S1 to S16 that divide the circle into sixteen equal parts, with S1 at A.',
    4: 'Draw a vertical line through A. Turn it round O by 90°, twice. '
       'These are three sides of a square with corners K1, K2, K3 and K4. Its fourth side is not drawn.',
}


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
    polys = cm.frame_pieces(sys.argv[2], ORIGIN, 2 * UNIT, 0)
    nd = s16.need(polys, L)
    print('needed', len(nd), 'missing', len(s16.missing(nd)))
    tol = float(os.environ.get('TOL', '4e-4'))
    pl = s16.plan(polys, L, tol=tol, verbose=True)
    print(json.dumps(pl))


SPEC = {
    'id': 'bourgoin-65-rosettes', 'title': 'Rosettes of Bourgoin’s plate 65',
    'short': 'Bourgoin 65 rosettes', 'subtitle': 'Bourgoin, plate 65',
    'code': 'P065', 'folder': 'data168', 'frame': (ORIGIN, UNIT, 0, L), 'star': 16,
    'style': 'Mamluk',
    'given': {'O': 'The centre of a sixteen-pointed star.',
              'A': 'The middle of a side of the square tile around the star.'},
    'note': 'The finished design was read from Wichmann’s P065 drawing of Bourgoin’s plate 65: sixteen-pointed '
            'stars on a square grid, with octagons between them. Every edge runs at a multiple of 22.5°, and every '
            'line is one of three sets of lines about the star: the sixteen lines joining points of the circle 90° '
            'apart, sixteen lines parallel to them nearer O, and eight more. Each runs through a crossing of '
            'earlier lines.',
    'changes': 'Colours follow Wichmann’s drawing. No photograph was checked.',
    'references': 'His reference is Jules Bourgoin, Arabic Geometrical Pattern and Design (Dover, 1973), plate 65.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the star, the octagons and the pieces between them.',
    'small': {'claw'},
    'palette': 'Mamluk wood',
    'repeat': 'Put copies of the square tile side by side. A sixteen-pointed star sits at the centre of every '
              'tile, and an octagon at each corner.',
}
NAMES = {(32, 0.437): ('star', 'ground'), (8, 0.187): ('eight', 'ground'), (8, 0.091): ('octagon', 'ground'),
         (6, 0.078): ('hexagon', 'ground'), (6, 0.045): ('six', 'ground'), (4, 0.039): ('green_kite', 'b'),
         (4, 0.032): ('square_kite', 'b'), (4, 0.023): ('red_kite', 'c'), (4, 0.019): ('white_kite', 'ground'),
         (4, 0.016): ('small_kite', 'b'), (6, 0.012): ('claw', 'a')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        import medium
        medium.run(build, SPEC, NAMES)
