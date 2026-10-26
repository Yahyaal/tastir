#!/usr/bin/env python3
"""Builds the wooden ceiling of the small porch into the Patio de los
Arrayanes (Alhambra), drawn by Brian Wichmann in Tiling Search
(data189/ALHAMK): an interlace of stars of two squares, all the same size, at
O, at the corners and at the middles of the sides, with long hexagons,
octagons, small kites and triangles between.

Read from the PDF (bevelled bands 15 pt wide; the grey bevels dropped with
1_pieces.py --no-grey and the pieces moved out by half a band). With O at a
star and A at the next star (OA = 233.1 pt) the corners snap to the grid
(a + b·√2)/4 (worst error 0.0012 of OA). The lines are exactly those of the
Nasrid textile (gen_nasrid_textile_stars.py, MMA2), so its construction is
reused: with s = (2 − √2)/4 and d = s√2, every star is cut by the 8 lines at
distance s from its centre, and the other lines lie at distance 3s or 1 − 3s
from the stars at O and at the corners. Here the stars are stars of two
squares, where the textile's are {8/3} stars, and the corner star needs its
diagonal sides (the lines through V); the textile's lines through E are not
used.
Areas (OA = 1): twelve-sided piece 0.139 (eight to a cell), long hexagon 0.129
(four), star 0.101 (four), octagon 0.086 (twelve), small octagon 0.043
(eight), triangle 0.021 (eight), kite 0.018 (24); together 4.

Usage: gen_arrayanes_porch_ceiling.py <ALHAMK-pieces.json> tutorials/alhambra-arrayanes-porch-ceiling.json
       pnpm review alhambra-arrayanes-porch-ceiling
       gen_arrayanes_porch_ceiling.py finish docs/review/alhambra-arrayanes-porch-ceiling/dump.json tutorials/alhambra-arrayanes-porch-ceiling.json
(ALHAMK-pieces.json from 0_vectors.py and 1_pieces.py --no-grey in tools/review/alhambra_wichmann/.)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import put, step  # noqa: E402
import gen_nasrid_textile_stars as textile  # noqa: E402

ORIGIN, PERIOD, BAND = (297.5, 374.2), 466.2, 15.0


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    textile.build(corner_diagonals=True)
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND))
    paths = cm.along_ink(segs)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-arrayanes-porch-ceiling',
        'title': 'Interlaced stars of a porch ceiling by the Patio de los Arrayanes, Alhambra',
        'short': 'Arrayanes porch ceiling', 'subtitle': 'Alhambra, Granada: porch into the Patio de los Arrayanes',
        'fold': 4, 'star': 8, 'style': 'Nasrid', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s ALHAMK drawing, its corners snapped to exact '
                    'values. We devised the construction. Its lines are exactly those of the Nasrid textile stars, '
                    'so the construction is the same; only the inked pieces differ. Each star is cut by eight lines '
                    'at one distance from its centre. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Our lines were '
                       'also laid over David Wade’s photo of the ceiling (SPA 0524x). They follow its bands in the '
                       'middle of the ceiling; towards the photo’s edges the camera’s angle bends the ceiling away '
                       'from a flat fit, and no difference from the drawing was found.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data189/ALHAMK: Alhambra, Patio de los Arrayanes', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data189/ALHAMK.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of the wooden ceiling over the small exit porch into the '
                     'Patio de los Arrayanes, at the north end of its west wall. He cites David Wade’s photo '
                     'SPA 0524x (patterninislamicart.com), which we used to check our lines. The construction is '
                     'ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'The centre of the next star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the stars, the long hexagons and octagons '
                        'between them, and the small kites and triangles.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square tile side by side. A star sits at every centre and every '
                            'corner, and at the middle of every side.',
                    'palette': 'Mamluk wood', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(12, 0.139): ('twelve', 'ground'), (6, 0.129): ('hexagon', 'c'), (16, 0.101): ('star', 'a'),
         (8, 0.086): ('octagon', 'ground'), (8, 0.043): ('small_octagon', 'b'), (3, 0.021): ('triangle', 'ground'),
         (4, 0.018): ('kite', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
