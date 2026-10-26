#!/usr/bin/env python3
"""Builds a painted ceiling of the Royal Palace, Fès, drawn by Brian Wichmann
in Tiling Search (data186/P397, after Paccard): an interlace of stars of two
squares, all the same size, with octagons, crosses and small kites between.

Read from the PDF (white bands 12 pt wide, moved out by half a band). With O
at a star and A at the X-shaped cross halfway to the next such star
(OA = 164.85 pt) the corners snap to the grid (a + b·√2)/2 (worst error
0.0015 of OA). Every line is a side of a star of two squares with apothem
d = (√2 − 1)/2 and point radius r = d√2 = 1 − √2/2, centred at
  O, the corners (±1, ±1), and G (1, √2 − 1), where the 22.5° line from O
  crosses the side of the cell, with its copies (±1, ±(√2 − 1)) and
  (±(√2 − 1), ±1).
r is QA, Q (√2/2, 0) the foot of P, where the circle crosses OK1.
Areas (OA = 1): star 0.201 (six to a cell: O, the corner and four on the
sides), octagon 0.172 (eight), cross 0.142 (six: the X at A and C, and four
plus-shaped ones round each corner star), kite 0.036 (sixteen); together 4.

Usage: gen_fes_palace_ceiling_stars.py <P397-pieces.json> tutorials/fes-palace-ceiling-stars.json
       pnpm review fes-palace-ceiling-stars
       gen_fes_palace_ceiling_stars.py finish docs/review/fes-palace-ceiling-stars/dump.json tutorials/fes-palace-ceiling-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

R2 = math.sqrt(2)
H = R2 / 2
D = (R2 - 1) / 2
R = 1 - H
ORIGIN, PERIOD, BAND = (297.5, 374.2), 329.7, 12.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The line through O and K1 crosses the circle at P. Draw a vertical line through P. '
         'It crosses the horizontal line through O at Q. Draw a circle with centre A through Q.',
         'compass', ['P', 'Q'])
    g.meet('P', 'c', 'd45', (H, H))
    g.line_par('pv', 'P', 'v')
    g.meet('Q', 'pv', 'h', (H, 0))
    g.circle_through('aq', 'A', 'Q')

    step('Draw a circle with centre O and the same radius. It crosses the horizontal line through O at T. '
         'It crosses the line through O and K1 at R. Draw a horizontal line through R. '
         'Draw a line through T at 90° to the line through O and K1. '
         'Turn the two lines round O by 90°, three times. They make the star at O.', 'compass', ['T', 'R'])
    put('or', 'circle', ((0, 0), R), {'circle': {'centre': 'O', 'radiusOf': 'aq'}})
    g.meet('T', 'or', 'h', (R, 0))
    g.meet('R', 'or', 'd45', (D, D))
    g.line_par('rh', 'R', 'h')
    g.line_perp('td', 'T', 'd45')
    g.repeat('st', ['rh', 'td'], 'rot4')

    step('Draw the line through O that halves the angle at O between A and K1. It crosses the vertical line through A at G. '
         'Draw a circle with centre G and the same radius as the circle through Q. '
         'It crosses the vertical line through A at L and M. M is above L.', 'compass', ['G', 'L', 'M'])
    g.line_bisect('l22', 'A', 'O', 'K1')
    g.meet('G', 'l22', 'gx', (1, 2 * D))
    put('gr', 'circle', (g.P('G'), R), {'circle': {'centre': 'G', 'radiusOf': 'aq'}})
    g.meet('L', 'gr', 'gx', (1, 2 * D - R))
    g.meet('M', 'gr', 'gx', (1, 2 * D + R))

    step('The circle with centre G crosses the horizontal line through R at U, left of A. '
         'Draw a vertical line through U. It crosses the circle with centre G again at Y. '
         'Draw a horizontal line through Y.', 'ruler', ['U', 'Y'])
    g.meet('U', 'gr', 'rh', (1 - D, D))
    g.line_par('uv', 'U', 'v')
    g.meet('Y', 'gr', 'uv', (1 - D, 3 * D))
    g.line_par('yh', 'Y', 'h')

    step('Draw a line through L parallel to the line through O and K1. '
         'Draw a line through each of L and M at 90° to the line through O and K1. '
         'Turn the five new lines through U, Y, L and M round O by 90°, three times. '
         'They make the stars round the corners.', 'ruler', ['L', 'M'])
    g.line_par('lq', 'L', 'd45')
    g.line_perp('lp', 'L', 'd45')
    g.line_perp('mp', 'M', 'd45')
    g.repeat('fr', ['uv', 'yh', 'lq', 'lp', 'mp'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND))
    paths = cm.along_ink(segs)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'fes-palace-ceiling-stars',
        'title': 'Interlaced stars of a ceiling in the Royal Palace, Fès',
        'short': 'Fès palace ceiling stars', 'subtitle': 'Royal Palace, Fès', 'fold': 4, 'star': 8,
        'style': 'Moroccan', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P397 drawing, its corners snapped to exact '
                    'values. We devised the construction. Every line is a side of a star of two squares, all the '
                    'same size. The stars sit at O, at the corners of the cell, and where the 22.5° line from O '
                    'crosses a side of the cell. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'ceiling was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data186/P397: Royal Palace, Fez', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data186/P397.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from André Paccard, Traditional Islamic '
                     'craft in Moroccan architecture (1980), volume 2, page 397: a ceiling in the Royal Palace, '
                     'Fès. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'The centre of the diagonal cross next to it.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the stars, the octagons between them, the '
                        'crosses and the small kites.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square tile side by side. A star sits at every centre and every '
                            'corner, with a diagonal cross between each two centres.',
                    'palette': 'Marinid zellige', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.201): ('star', 'a'), (8, 0.172): ('octagon', 'ground'), (16, 0.142): ('cross', 'b'),
         (4, 0.036): ('kite', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
