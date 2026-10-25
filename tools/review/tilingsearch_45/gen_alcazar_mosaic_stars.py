#!/usr/bin/env python3
"""Builds the tile mosaic of the Alcázar of Seville in Claude Humbert's plate
424, drawn by Brian Wichmann in Tiling Search (data9/H424): a large
eight-pointed {8/3} star at O, a small star at each corner of the cell, a
cross-shaped star between each two large stars, and interlaced bands.

Read from the PDF (period 468.6 pt, band 15 pt), every band centre line
snapped to the grid a + b·√2/2 in units of half the period (worst error
0.0009 of OA). Every line lies at distance t = (1 − √2/2)/2 or 3t from O,
from A (and the other side midpoints) or from a corner, at 90° to one of the
four lines through that point:
  - round O: eight lines at t (the large star) and eight at 3t;
  - round A: the vertical at t, the vertical at 3t, and the two diagonals at t
    on each side (these are copied round O to B, C and D);
  - round K1: the diagonal at t (copied to the other corners).
t is half of GA, G being the foot of F on the horizontal line: the line
through the crossings of the circles with centres G and A, each through the
other, is the vertical x = 1 − t, which meets the horizontal at M. With N,
where the circle with centre G meets the horizontal again, NM = 3t.

Units: OA = 1, A halfway to the next large star on the horizontal line; the tile is the square cell.

Usage: gen_alcazar_mosaic_stars.py <H424-pieces.json> tutorials/alcazar-mosaic-stars.json
       pnpm review alcazar-mosaic-stars
       gen_alcazar_mosaic_stars.py finish docs/review/alcazar-mosaic-stars/dump.json tutorials/alcazar-mosaic-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import P, g, put, step  # noqa: E402

H = math.sqrt(2) / 2
T = (1 - H) / 2
ORIGIN, PERIOD, BAND = (299.8, 376.5), 468.6, 15.0


def radius_from(name, c, p, q):
    put(name, 'circle', (P(c), math.dist(P(p), P(q))), {'circle': {'centre': c, 'radiusFrom': [p, q]}})


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at F. Draw a vertical line through F. '
         'It crosses the horizontal line at G.', 'ruler', ['F'])
    g.meet('F', 'c', 'd45', (H, H))
    g.line_par('fv', 'F', 'v')
    g.meet('G', 'fv', 'h', (H, 0))

    step('Draw a circle with centre G through A. It crosses the horizontal line again at N. '
         'Draw a circle with centre A through G. The two circles cross at X and Y. '
         'Draw a straight line through X and Y. It crosses the horizontal line at M, halfway from G to A.',
         'compass', ['G', 'A'])
    g.circle_through('cg', 'G', 'A')
    g.meet('N', 'cg', 'h', (1 - 4 * T, 0))
    g.circle_through('cag', 'A', 'G')
    g.meet('X', 'cg', 'cag', (1 - T, T * math.sqrt(3)))
    g.meet('Y', 'cg', 'cag', (1 - T, -T * math.sqrt(3)))
    g.line_through('xy', 'X', 'Y')
    g.meet('M', 'xy', 'h', (1 - T, 0))

    step('Draw a circle with centre O and radius MA. Draw a circle with centre O and radius NM, three times as big. '
         'Draw the line through O at 90° to the line from O to K1.', 'compass', ['M', 'N'])
    radius_from('ct', 'O', 'M', 'A')
    radius_from('c3', 'O', 'N', 'M')
    g.line_perp('d135', 'O', 'd45')

    step('The small circle crosses the horizontal line at T1 and the line from O to K1 at T2. '
         'The circle NM crosses them at T3 and T4. Draw the line through each of T1, T2, T3 and T4 '
         'at 90° to the line it lies on.', 'ruler', ['ct', 'c3'])
    g.meet('T1', 'ct', 'h', (T, 0))
    g.meet('T2', 'ct', 'd45', (T * H, T * H))
    g.meet('T3', 'c3', 'h', (3 * T, 0))
    g.meet('T4', 'c3', 'd45', (3 * T * H, 3 * T * H))
    g.line_perp('o1', 'T1', 'h')
    g.line_perp('o2', 'T2', 'd45')
    g.line_perp('o3', 'T3', 'h')
    g.line_perp('o4', 'T4', 'd45')

    step('Turn the four lines of the last step round O by 90°, three times. '
         'They make the large star at O and the square ring round it.', 'ruler', ['o1', 'o2', 'o3', 'o4'])
    g.repeat('op', ['o1', 'o2', 'o3', 'o4'], 'rot4')

    step('Draw a straight line through A and C. Draw circles with centre A, one with the radius of the small '
         'circle and one with the radius of the circle NM. The small one crosses line AC at U1 and U2. '
         'The other crosses the horizontal line at W, between O and A. '
         'Draw the lines through U1 and U2 at 90° to line AC. Draw a vertical line through W.', 'compass', ['A'])
    g.line_through('ac', 'A', 'C')
    cm.circle_radius_of('cat', 'A', 'ct')
    cm.circle_radius_of('ca3', 'A', 'c3')
    g.meet('U1', 'cat', 'ac', (1 - T * H, T * H))
    g.meet('U2', 'cat', 'ac', (1 + T * H, -T * H))
    g.meet('W', 'ca3', 'h', (1 - 3 * T, 0))
    g.line_perp('a1', 'U1', 'ac')
    g.line_perp('a2', 'U2', 'ac')
    g.line_par('a3', 'W', 'v')

    step('Draw a circle with centre K1 and the radius of the small circle. It crosses the line from O to K1 at E. '
         'Draw the line through E at 90° to the line from O to K1.', 'compass', ['K1'])
    cm.circle_radius_of('ckt', 'K1', 'ct')
    g.meet('E', 'ckt', 'd45', (1 - T * H, 1 - T * H))
    g.line_perp('k1', 'E', 'd45')

    step('Turn the line through X and Y and the lines through U1, U2, W and E round O by 90°, three times.',
         'ruler', ['xy', 'a1', 'a2', 'a3', 'k1'])
    g.repeat('ap', ['xy', 'a1', 'a2', 'a3', 'k1'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alcazar-mosaic-stars',
        'title': 'Tile mosaic stars of the Alcázar of Seville',
        'short': 'Alcázar mosaic stars', 'subtitle': 'Alcázar, Seville', 'fold': 4, 'star': 8,
        'style': 'Mudéjar', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s H424 drawing, its corners snapped to exact '
                    'values. We devised the construction: every line lies at one of two distances, t and 3t, from O, '
                    'from the middle of a side of the cell or from a corner. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the drawing '
                       'checks the finished lines, not how the design was first laid out. No photo of the real '
                       'mosaic was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data9/H424: Alcázar, Seville', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data9/H424.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, after Claude Humbert, Islamic Ornamental Design (1980), '
                     'plate 424 (tin-glazed earthenware mosaic, Alcázar of Seville, fifteenth century), and David '
                     'Wade’s photograph SPA 2311. The construction is ours.'}],
        'given': {'O': 'The centre of a large eight-pointed star.',
                  'A': 'Halfway from O to the next large star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the large star at O and the bands that carry the lines on. They close the small stars at '
                        'the corners, the crosses between the large stars and the pieces round them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A large star sits at every centre, a small '
                            'star at every corner and a cross between each two large stars.',
                    'palette': 'Alhambra', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.243): ('star', 'a'), (16, 0.257): ('cross', 'a'), (14, 0.207): ('shield', 'a'),
         (12, 0.139): ('bow', 'b'), (6, 0.129): ('hexagon', 'c'), (16, 0.101): ('small_star', 'd'),
         (8, 0.086): ('arrow', 'd')}

if __name__ == '__main__':
    cm.run(main, NAMES)
