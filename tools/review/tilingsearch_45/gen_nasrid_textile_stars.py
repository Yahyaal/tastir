#!/usr/bin/env python3
"""Builds the Nasrid textile fragment in the Metropolitan Museum (46.156.16),
drawn by Brian Wichmann in Tiling Search (data196/MMA2): eight-pointed {8/3}
stars on a chessboard, each ringed by eight arrows, with small squares, long
bones and large nineteen-sided pieces between.

Read from the PDF (tiles edge to edge; the red bands are strokes along the
edges). Wichmann draws the stars on a square grid of side 247.3 pt with the
two kinds of star alternating; here the drawing is turned by 45° so that the
tile is the square cell with a star of one kind at O and the other kind at
the corners: OA = 247.3/√2 pt. Every corner then snaps to the grid
(a + b·√2)/4 (worst error 0.0005 of OA). With s = (2 − √2)/4 and d = s√2:
  each star (at O and at the corners) is cut by the 8 lines at distance s
  from its centre; its point T (s, √2/4) is the foot of the perpendicular from
  A to the 67.5° line, and the corner star's other lines come from S (s, 0)
  (its lines at 45° are the star at O's);
  the lines at distance 3s and 1 − 3s from both stars: W (1 − d, 0) is the
  star's inner radius d marked from A, and the circles about O and K1 through
  W and through Y (3s, 3s) give the rest.
Areas (OA = 1): star 0.243 (two to a cell), bone 0.186 (two), arrow 0.086
(sixteen), small square 0.015 (eight), nineteen-sided piece 0.206 (eight);
together 4.

Usage: gen_nasrid_textile_stars.py <MMA2-pieces.json> tutorials/nasrid-textile-stars.json
       pnpm review nasrid-textile-stars
       gen_nasrid_textile_stars.py finish docs/review/nasrid-textile-stars/dump.json tutorials/nasrid-textile-stars.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

R2 = math.sqrt(2)
S = (2 - R2) / 4
D = S * R2
ORIGIN, PERIOD = (299.2, 375.1), 247.29


def build(corner_diagonals=False):
    """The construction, shared with gen_arrayanes_porch_ceiling.py (ALHAMK),
    whose stars of two squares need the corner star's diagonal sides (the
    lines through V) but not the lines through E."""
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw the line through O that halves the angle at O between K1 and C. Draw a line through A at 90° to it. '
         'The two lines cross at T.', 'ruler', ['K1', 'C', 'T'])
    g.line_bisect('l67', 'K1', 'O', 'C')
    g.line_perp('ap', 'A', 'l67')
    g.meet('T', 'l67', 'ap', (S, R2 / 4))

    step('Draw a vertical line through T. Draw a line through T parallel to the line through O and K1. '
         'Turn the two lines round O by 90°, three times. They make the star at O.', 'ruler', ['T'])
    g.line_par('tv', 'T', 'v')
    g.line_par('td', 'T', 'd45')
    g.repeat('st', ['tv', 'td'], 'rot4')

    if corner_diagonals:
        step('The vertical line through T crosses the horizontal line through O at S. '
             'Draw a circle with centre K1 and radius OS. It crosses the horizontal line through C at U, left of K1. '
             'Draw a vertical line through U.', 'compass', ['S', 'U'])
    else:
        step('The vertical line through T crosses the horizontal line through O at S. '
             'Draw a circle with centre K1 and radius OS. It crosses the horizontal line through C at U, left of K1. '
             'Draw a vertical line through U. Turn it round O by 90°, three times. '
             'With the lines through T, they make the stars at the corners.', 'compass', ['S', 'U'])
    g.meet('S', 'tv', 'h', (S, 0))
    g.circle_from('ku', 'K1', 'O', 'S')
    g.meet('U', 'ku', 'gy', (1 - S, 1))
    g.line_par('uv', 'U', 'v')
    if corner_diagonals:
        step('The line through T parallel to the line through O and K1 crosses the horizontal line through C at V. '
             'Draw a line through V at 90° to the line through O and K1. '
             'Turn the new lines through U and V round O by 90°, three times. '
             'With the lines through T, they make the stars at the corners.', 'ruler', ['V'])
        g.meet('V', 'td', 'gy', (1 - D, 1))
        g.line_perp('vd', 'V', 'd45')
        g.repeat('ks', ['uv', 'vd'], 'rot4')
    else:
        g.repeat('ks', ['uv'], 'rot4')

    step('Another side of the star at O crosses the horizontal line through O at N. '
         'Draw a circle with centre A and radius ON. It crosses the horizontal line through O at W, left of A. '
         'Draw a circle with centre O through W. It crosses the line through O and K1 at X.',
         'compass', ['N', 'W', 'X'])
    g.meet('N', 'td@3', 'h', (D, 0))
    g.circle_from('an', 'A', 'O', 'N')
    g.meet('W', 'an', 'h', (1 - D, 0))
    g.circle_through('cw', 'O', 'W')
    g.meet('X', 'cw', 'd45', (1 - 3 * S, 1 - 3 * S))

    step('Draw a circle with centre K1 and the same radius as the circle through W. '
         'It crosses the line through O and K1 at Y. It crosses the horizontal line through C at Z. '
         'Draw a circle with centre O through Y. It crosses the horizontal line through O at G.',
         'compass', ['Y', 'Z', 'G'])
    g.put('kw', 'circle', (g.P('K1'), 1 - D), {'circle': {'centre': 'K1', 'radiusOf': 'cw'}})
    g.meet('Y', 'kw', 'd45', (3 * S, 3 * S))
    g.meet('Z', 'kw', 'gy', (D, 1))
    g.circle_through('cy', 'O', 'Y')
    g.meet('G', 'cy', 'h', (3 * D, 0))

    if corner_diagonals:
        step('Draw a horizontal line through each of X and Y. Draw a line through each of W, Z and G '
             'at 90° to the line through O and K1. Turn the five new lines round O by 90°, three times.',
             'ruler', ['X', 'Y', 'W', 'Z', 'G'])
        new = ['xh', 'yh', 'wd', 'zd', 'gd']
    else:
        step('Draw a circle with centre K1 and the same radius as the circle through Y. '
             'It crosses the horizontal line through C at E, left of K1.', 'compass', ['E'])
        g.put('ky', 'circle', (g.P('K1'), 3 * D), {'circle': {'centre': 'K1', 'radiusOf': 'cy'}})
        g.meet('E', 'ky', 'gy', (1 - 3 * D, 1))
        step('Draw a horizontal line through each of X and Y. Draw a line through each of W, Z, G and E '
             'at 90° to the line through O and K1. Turn the six new lines round O by 90°, three times.',
             'ruler', ['X', 'Y', 'W', 'Z', 'G', 'E'])
        new = ['xh', 'yh', 'wd', 'zd', 'gd', 'ed']
    g.line_par('xh', 'X', 'h')
    g.line_par('yh', 'Y', 'h')
    g.line_perp('wd', 'W', 'd45')
    g.line_perp('zd', 'Z', 'd45')
    g.line_perp('gd', 'G', 'd45')
    if not corner_diagonals:
        g.line_perp('ed', 'E', 'd45')
    g.repeat('fr', new, 'rot4')


def drawing(pieces):
    """Wichmann's pieces in the tutorial's frame: his drawing turned by 45°,
    his neighbouring star (2, 0) going to the corner (1, -1)."""
    polys = cm.frame_pieces(pieces, ORIGIN, PERIOD, 0.0)
    return [[((x + y) / 2, (y - x) / 2) for x, y in P] for P in polys]


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(drawing(pieces))
    paths = cm.along_ink(segs)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'nasrid-textile-stars',
        'title': 'Stars and arrows of a Nasrid textile in the Metropolitan Museum',
        'short': 'Nasrid textile stars', 'subtitle': 'Silk textile fragment, Granada, Metropolitan Museum',
        'fold': 4, 'star': 8, 'style': 'Nasrid', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s MMA2 drawing, its corners snapped to exact '
                    'values. We devised the construction. Each star is cut by eight lines at one distance from its '
                    'centre, and the other lines lie at three times that distance from a star, or at three times '
                    'that distance from the next star. The drawing gives no steps.',
            'changes': 'Wichmann draws the stars on a square grid; here his drawing is turned by 45° so that the '
                       'tile is a square with one kind of star at O and the other at its corners. The compass '
                       'steps, their order and the named points are ours. The comparison with the drawing checks '
                       'the finished lines, not how the design was first laid out. No photo of the textile was '
                       'checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data196/MMA2: Textile fragment, Nasrid period (1232-1492)',
             'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data196/MMA2.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of a Nasrid silk textile fragment in the Metropolitan '
                     'Museum of Art, New York (accession number 46.156.16). The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'The middle of the long bone between two such stars.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the stars and the eight arrows round each star. '
                        'They also make the small squares, the bones and the large pieces between them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square tile side by side. The stars at O and at the corners make a '
                            'chessboard. A bone joins each star at O to the next.',
                    'palette': 'Alhambra', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.243): ('star', 'a'), (19, 0.206): ('large', 'ground'), (12, 0.186): ('bone', 'b'),
         (8, 0.086): ('arrow', 'ground'), (4, 0.015): ('square', 'c')}

if __name__ == '__main__':
    cm.run(main, NAMES)
