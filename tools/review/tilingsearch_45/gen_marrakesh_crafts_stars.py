#!/usr/bin/env python3
"""Builds the ceramic mosaic of the Crafts Center, Marrakesh (after Castéra,
Arabesques, page 99), drawn by Brian Wichmann in Tiling Search (data164/P99):
stars of two squares at O and at each corner of the square cell, green
crosses between them, small red squares at the stars' points.

Read from the PDF (plain tiles, period 261.4 pt, OA = 130.7 pt). The corners
do not fit the grid a + b·√2/2, but every line fits (p + q·√2)/7 (worst error
0.0005 of OA): the stars' tip radius is R = (4 − √2)/7 = 1 − 1/(3 − √2), the
small star of the Comares bath stars. With a = R/√2 (the half-side of the
stars' squares) and Rb = 1 − R the lines are:
  - X = (Rb, a), where the line through O halving the angle AOE crosses line
    K1 D (as for the bath stars); the horizontal through X is y = a, a side of
    the star at O;
  - the star at O: x, y = ±a and x ± y = ±R, through P = (R, 0) on the circle
    with centre O through Q = (a, a);
  - the corner stars: the circle with centre K1 and radius R crosses the cell
    side at G = (1, Rb) and OK1 at J: x ± y = ±(2 − R) through G, x, y = ±(1 − a)
    through J;
  - T = (2 − √2, 0), where the circle with centre A through W = (√2, 0) crosses
    the horizontal line: x ± y = ±(2 − √2) through T, which closes the small
    squares and notches the crosses; x, y = ±R through P and
    x, y = ±(13 − 5√2)/7 through V, where the line through T crosses y = −a:
    the sides of the crosses.

Usage: gen_marrakesh_crafts_stars.py <P99-pieces.json> tutorials/marrakesh-crafts-stars.json
       pnpm review marrakesh-crafts-stars
       gen_marrakesh_crafts_stars.py finish docs/review/marrakesh-crafts-stars/dump.json tutorials/marrakesh-crafts-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
R2 = math.sqrt(2)
RB = 1 / (3 - R2)
R = 1 - RB
A_ = R / R2
ORIGIN, PERIOD, BAND = (297.5, 374.2), 261.4, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at E. Draw the line through O that halves the angle AOE. '
         'Draw a straight line through K1 and D. It crosses the line through O at X.', 'ruler', ['E', 'X'])
    g.meet('E', 'c', 'd45', (H, H))
    g.line_bisect('hb', 'A', 'O', 'E')
    g.line_through('kd', 'K1', 'D')
    g.meet('X', 'hb', 'kd', (RB, A_))

    step('Draw a horizontal line through X. Turn it round O by 90°, three times. '
         'The four lines make a square round O.', 'ruler', ['X'])
    g.line_par('xh', 'X', 'h')
    g.repeat('xp', ['xh'], 'rot4')

    step('The horizontal line through X crosses the line from O to K1 at Q. Draw a circle with centre O through Q. '
         'It crosses the horizontal line through O at P. Draw a line through P at 90° to the line from O to K1. '
         'Turn it round O by 90°, three times. The lines make the star at O.', 'compass', ['Q', 'P'])
    g.meet('Q', 'xh', 'd45', (A_, A_))
    g.circle_through('cq', 'O', 'Q')
    g.meet('P', 'cq', 'h', (R, 0))
    g.line_perp('pd', 'P', 'd45')
    g.repeat('pdp', ['pd'], 'rot4')

    step('Draw a circle with centre K1 and the same radius as the circle through Q. '
         'It crosses the vertical line through A at G and the line from O to K1 at J. '
         'Draw a line through G at 90° to the line from O to K1. Draw a vertical line through J. '
         'Turn the two lines round O by 90°, three times. They make the stars at the corners.',
         'compass', ['K1', 'G', 'J'])
    cm.circle_radius_of('cg', 'K1', 'cq')
    g.meet('G', 'cg', 'gx', (1, RB))
    g.meet('J', 'cg', 'd45', (1 - A_, 1 - A_))
    g.line_perp('gd', 'G', 'd45')
    g.line_par('jv', 'J', 'v')
    g.repeat('gjp', ['gd', 'jv'], 'rot4')

    step('Draw a circle with centre O through K1. It crosses the horizontal line through O at W. '
         'Draw a circle with centre A through W. It crosses the horizontal line through O again at T.',
         'compass', ['W', 'T'])
    g.circle_through('ck', 'O', 'K1')
    g.meet('W', 'ck', 'h', (R2, 0))
    g.circle_through('caw', 'A', 'W')
    g.meet('T', 'caw', 'h', (2 - R2, 0))

    step('Draw a line through T at 90° to the line from O to K1. It crosses a side of the star at O at V, '
         'below the horizontal line. Draw a vertical line through V. Draw a vertical line through P. '
         'Turn the three lines round O by 90°, three times.', 'ruler', ['T', 'V', 'P'])
    g.line_perp('td', 'T', 'd45')
    g.meet('V', 'td', 'xh@2', ((13 - 5 * R2) / 7, -A_))
    g.line_par('vv', 'V', 'v')
    g.line_par('pv', 'P', 'v')
    g.repeat('tp', ['td', 'vv', 'pv'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND))
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'marrakesh-crafts-stars',
        'title': 'Stars and crosses of the Crafts Center, Marrakesh',
        'short': 'Marrakesh crafts stars', 'subtitle': 'Crafts Center, Marrakesh', 'fold': 4, 'star': 8,
        'style': 'Moroccan', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P99 drawing, its corners matched to exact '
                    'values. We devised the construction. The stars at O and at the corners are two squares, as '
                    'large as the small star of the Comares bath stars, and are found the same way: from X, where '
                    'line K1D crosses the line that halves the angle AOE. The point T, found with the circle '
                    'through K1, closes the small squares and the green crosses. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'mosaic was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data164/P99: Ceramic mosaic, Crafts Center, Marrakesh',
             'creator': 'Brian Wichmann', 'url': 'https://tilingsearch.mit.edu/HTML/data164/P99.html',
             'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Jean-Marc Castéra, Arabesques: '
                     'Decorative Art in Morocco (ACR, 1999), page 99 (the Crafts Center, Marrakesh), and shows it in '
                     'Wichmann and Wade, Islamic Design: A Mathematical Approach (Springer, 2017), figure 11.13a. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of a star.', 'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the stars at O and at the corners, the small squares at their points and the crosses '
                        'between them. Their sides close the white pieces.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and every '
                            'corner, with a green cross between each two.',
                    'palette': 'Marinid zellige', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(12, 0.476): ('cross', 'a'), (16, 0.32): ('star', 'b'), (8, 0.249): ('eight', 'c'),
         (8, 0.125): ('white_eight', 'ground'), (10, 0.08): ('ten', 'ground'), (4, 0.023): ('square', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)
