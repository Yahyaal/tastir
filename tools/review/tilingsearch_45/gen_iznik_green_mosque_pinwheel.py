#!/usr/bin/env python3
"""Builds the pinwheel of squares and ten-sided tiles from the band round the
minaret of the Green Mosque in Iznik, drawn by Brian Wichmann in Tiling Search
(data187/GREEN1).

The drawing is plain tiles (no bands): squares, and one ten-sided tile in two
colours. Its four-fold points are where four ten-sided tiles meet corner to
corner, not the squares (they have only a half turn), so the frame is turned
by 45° from Wichmann's: O at such a point, A at the centre of a square, half
way to the next four-fold point of the same hand (lines_of.py --turn, unit
144.82 pt). Every edge is then a side of one of the squares at A, B, C and D
(half-side r = 1 − √2/2) carried on across the cell, or one of the two
diagonals through O. The corners land within 0.001 of OA.

Usage: gen_iznik_green_mosque_pinwheel.py <GREEN1-pieces.json> tutorials/iznik-green-mosque-pinwheel.json
       pnpm review iznik-green-mosque-pinwheel
       gen_iznik_green_mosque_pinwheel.py finish docs/review/iznik-green-mosque-pinwheel/dump.json tutorials/iznik-green-mosque-pinwheel.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
R = 1 - H
ORIGIN, PERIOD = (461.5, 268.6), 289.64


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at F. Draw a vertical line through F. It crosses the '
         'horizontal line at G. Draw a circle with centre A through G.', 'compass', ['F', 'A'])
    g.meet('F', 'c', 'd45', (H, H))
    g.line_par('fv', 'F', 'v')
    g.meet('G', 'fv', 'h', (H, 0))
    g.circle_through('ca', 'A', 'G')

    step('The small circle crosses the vertical line through A at P. Draw a horizontal line through P. '
         'The lines through G and P are two sides of a square with centre A.', 'ruler', ['ca'])
    g.meet('P', 'ca', 'gx', (1, R))
    g.line_par('ph', 'P', 'h')

    step('Draw the line through O at 90° to the line from O to K1.', 'ruler', ['d45'])
    g.line_perp('d135', 'O', 'd45')

    step('Turn the lines through F and P round O by 90°, three times. '
         'They are the sides of the squares at A, B, C and D.', 'ruler', ['fv', 'ph'])
    g.repeat('cp', ['fv', 'ph'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    polys = [[((x + y) * H, (y - x) * H) for x, y in Q] for Q in cm.frame_pieces(pieces, ORIGIN, PERIOD, 0)]
    segs = cm.network(polys)
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'iznik-green-mosque-pinwheel',
        'title': 'Pinwheel of the Green Mosque (Iznik)',
        'short': 'Green Mosque pinwheel', 'subtitle': 'Green Mosque, Iznik', 'fold': 4, 'chiral': True,
        'style': 'Ottoman', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s GREEN1 drawing, its corners snapped to exact '
                    'values. We devised the construction: every line is a side of a small square carried on, or a '
                    'diagonal of the cell. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann’s drawing '
                       'is turned by 45° here, so that O sits where four tiles turn round a point. No photo of the '
                       'mosque was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data187/GREEN1: Green mosque, Iznik', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data187/GREEN1.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of the upper band round the minaret of the Green Mosque '
                     'in Iznik (after Tony Lee). He also cites David Wade’s photo TRA 0332, the Shir Dar madrasah '
                     'in Samarkand. The construction is ours.'}],
        'given': {'O': 'The point where four ten-sided tiles meet.',
                  'A': 'The centre of a small square, halfway from O to the next point like O.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the four small squares round O, at A, B, C and D. '
                        'Ink the lines that carry their sides on, and the two lines through O. '
                        'They close the ten-sided tiles.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. The ten-sided tiles turn round O like the '
                            'sails of a windmill.',
                    'palette': 'Timurid tile', 'colors': {},
                    # Wichmann colours the ten-sided tiles by which way they lie
                    'placements': {'repeat': [1, 1], 'rules': [{'piece': 'sail', 'turn': 135, 'color': 'c'}]}},
        'expect': {'pieceTypes': 2, 'pieces': [{'name': 'sail', 'vertices': 10, 'area': 0.82843, 'perCell': 4},
                                               {'name': 'square', 'vertices': 4, 'area': 0.34315, 'perCell': 2}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(4, 0.343): ('square', 'a'), (10, 0.828): ('sail', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)
