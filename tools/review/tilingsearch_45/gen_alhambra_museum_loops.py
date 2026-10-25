#!/usr/bin/env python3
"""Builds the interlaced loops of the Alhambra Museum piece RE3559, drawn by
Brian Wichmann in Tiling Search (data183/RE3559): square loops with a notch
in each side, each round a large notched cross (one at O), linked with its
four neighbours, with an eight-pointed star between four loops.

Wichmann draws the bands as tiles 24 pt wide; their centre lines (period
289.7 pt) are horizontal and vertical at ±√2/4 and ±(1 − √2/4) from O, and
diagonal at x ± y = ±½ and ±3/2 (drawing: 0.3540 and 0.6469 against 0.3536
and 0.6464). √2/4 is where the circle of radius ½ crosses OK1, and 1 − √2/4
its mirror image in H (½, ½). Mirror-symmetric, so not chiral. The same
design is CM014 (Chellah minaret, Rabat) in Tiling Search.

Units: OA = 1, loops round O and the corners of the square cell, stars at A.

Usage: gen_alhambra_museum_loops.py <RE3559w-pieces.json> tutorials/alhambra-museum-loops.json
       pnpm review alhambra-museum-loops
       gen_alhambra_museum_loops.py finish docs/review/alhambra-museum-loops/dump.json tutorials/alhambra-museum-loops.json
(RE3559w-pieces.json: the white pieces of RE3559-pieces.json, from 0_vectors.py
and 1_pieces.py in tools/review/alhambra_wichmann/.)
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

R2 = math.sqrt(2)


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.')

    step('Draw a straight line through A and C. It crosses the line from O to K1 at H. '
         'Draw a horizontal line through H. It crosses the vertical line through O at E.', 'ruler', ['A', 'C'])
    g.line_through('ac', 'A', 'C')
    g.meet('H', 'ac', 'd45', (0.5, 0.5))
    g.line_par('hh', 'H', 'h')
    g.meet('E', 'hh', 'v', (0, 0.5))

    step('Draw a circle with centre O through E. It crosses the line from O to K1 at F. '
         'Draw a circle with centre H through F. It crosses the line from O to K1 again at J.', 'compass', ['E'])
    g.circle_through('ce', 'O', 'E')
    g.meet('F', 'ce', 'd45', (R2 / 4, R2 / 4))
    g.circle_through('ch', 'H', 'F')
    g.meet('J', 'ch', 'd45', (1 - R2 / 4, 1 - R2 / 4))

    step('Draw a vertical line through F. Draw a vertical line through J. '
         'Draw a line through E parallel to line AC.')
    g.line_par('fv', 'F', 'v')
    g.line_par('jv', 'J', 'v')
    g.line_par('ed', 'E', 'ac')

    step('Turn the three lines of the last step round O by 90°, three times.')
    g.repeat('cp', ['fv', 'jv', 'ed'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    polys = cm.frame_pieces(pieces, (300.1, 228.8), 289.7, 24.0)
    segs = cm.network(polys)
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-museum-loops', 'title': 'Interlaced loops of the Alhambra Museum',
        'short': 'Interlaced loops', 'subtitle': 'Alhambra Museum, Granada', 'fold': 4,
        'style': 'Nasrid', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s RE3559 drawing. We devised the construction: '
                    'the straight bands pass where a circle of radius one half, or its mirror image, crosses the '
                    'diagonal, and the notches are lines at 45° through the middles of OA and OC. '
                    'The drawing gives no steps.',
            'changes': 'The compass operations, step order and named crossings are our reconstruction. '
                       'The comparison with the drawing checks the finished lines, not the historical steps. '
                       'Wichmann draws two loops in two colours; we draw one band. '
                       'No photo of the real piece was available to check it.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data183/RE3559: Alhambra Museum', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data183/RE3559.html',
             'note': 'The design was read from his drawing of piece RE3559 in the Alhambra Museum, with two-colour '
                     'interlacing as in the original. The construction is ours.',
             'kind': 'drawing'}],
        'given': {'O': 'The centre of a loop.', 'A': 'The centre of an eight-pointed star between four loops.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the bands. Each band makes a square loop with a notch in every side. '
                        'The loops link with their neighbours.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Put copies of the square cell side by side. Each loop weaves over and '
                                            'under its four neighbours.',
                    'palette': 'Alhambra', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(24, 1.243): ('cross', 'ground'), (16, 0.586): ('star', 'a'), (4, 0.086): ('square', 'c')}

if __name__ == '__main__':
    cm.run(main, NAMES)
