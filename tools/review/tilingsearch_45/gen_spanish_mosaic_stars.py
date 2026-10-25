#!/usr/bin/env python3
"""Builds a fourteenth-century Spanish tile-mosaic panel (David Collection,
Copenhagen), drawn by Brian Wichmann in Tiling Search (data184/DS4).

Read from the PDF (plain tiles, stars of one kind 291.4 pt apart on the
diagonal), every corner snapped to the grid a + b·√2/2 in units of half that
spacing (worst error 0.0007 of OA). Wichmann draws it turned by 45°; turned
back, the tile is the square cell with a star at O and the same star at each
corner, both two squares on a circle of radius 1 − √2/2 (the distance from G,
below F, to A). Every line is a side of one of those stars, carried on, or
one of:
  - the square through M, where line AC crosses OK1 (x, y = ±1/2);
  - the four diagonals through V and W, where the vertical through S1 and the
    horizontal through S3 cross the star's sides (x ± y = ±3(1 − √2/2)).

Units: OA = 1, A halfway to the next star on the horizontal line; the tile is the square cell.

Usage: gen_spanish_mosaic_stars.py <DS4-pieces.json> tutorials/spanish-mosaic-stars.json
       pnpm review spanish-mosaic-stars
       gen_spanish_mosaic_stars.py finish docs/review/spanish-mosaic-stars/dump.json tutorials/spanish-mosaic-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
from gen_leones_door_stars import square_texts, star_points, two_squares  # noqa: E402

H = math.sqrt(2) / 2
R = 1 - H           # the stars' tip radius
ORIGIN, PERIOD = (297.5, 375.0), 412.1


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at F. Draw a vertical line through F. It crosses the '
         'horizontal line at G. Draw a circle with centre A through G. '
         'Draw circles with centres O and K1 and the same radius.', 'compass', ['F', 'A'])
    g.meet('F', 'c', 'd45', (H, H))
    g.line_par('fv', 'F', 'v')
    g.meet('G', 'fv', 'h', (H, 0))
    g.circle_through('ca', 'A', 'G')
    cm.circle_radius_of('cs', 'O', 'ca')
    cm.circle_radius_of('ck', 'K1', 'ca')

    step('Draw the line through O at 90° to the line from O to K1. '
         'The small circle with centre O crosses the four lines through O at S1 to S8.', 'ruler', ['cs'])
    g.line_perp('d135', 'O', 'd45')
    pts = star_points('S', 'cs', R)

    step('Draw the star at O as two squares.', 'ruler', ['cs'])
    two_squares(pts, 'q', square_texts(pts, 'Draw each line long, to the sides of the cell.'))

    step('The same star sits at each corner of the cell. The circle with centre K1 crosses the line from O to K1 '
         'at E. Draw a vertical line through E. The circle with centre K1 crosses the vertical line through A at P. '
         'It crosses the horizontal line through C at Q. Draw a straight line through P and Q.', 'ruler', ['ck'])
    g.meet('E', 'ck', 'd45', (1 - R * H, 1 - R * H))
    g.line_par('ev', 'E', 'v')
    g.meet('P', 'ck', 'gx', (1, 1 - R))
    g.meet('Q', 'ck', 'gy', (1 - R, 1))
    g.line_through('pq', 'P', 'Q')

    step('Draw a straight line through A and C. It crosses the line from O to K1 at M. '
         'Draw a vertical line through M.', 'ruler', ['A', 'C'])
    g.line_through('ac', 'A', 'C')
    g.meet('M', 'ac', 'd45', (0.5, 0.5))
    g.line_par('mv', 'M', 'v')

    step(f'Draw a vertical line through {pts[0]}. It crosses the line through {pts[2]} and {pts[4]} at V. '
         f'Draw a horizontal line through {pts[2]}. It crosses the line through {pts[6]} and {pts[0]} at W. '
         'Draw a straight line through V and W.', 'ruler', [pts[0], pts[2]])
    g.line_par('s1v', pts[0], 'v')
    g.meet('V', 's1v', 'q02', (R, 2 * R))
    g.line_par('s3h', pts[2], 'h')
    g.meet('W', 's3h', 'q04', (2 * R, R))
    g.line_through('vw', 'V', 'W')

    step('Turn the lines through E, P and Q, through M, and through V and W round O by 90°, three times.',
         'ruler', ['ev', 'pq', 'mv', 'vw'])
    g.repeat('cp', ['ev', 'pq', 'mv', 'vw'], 'rot4')


def drawing(pieces):
    """Wichmann's tiles, turned by 45° into the tutorial's frame."""
    polys = cm.frame_pieces(pieces, ORIGIN, PERIOD, 0)
    return [[((x + y) * H, (y - x) * H) for x, y in P] for P in polys]


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(drawing(pieces))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'spanish-mosaic-stars',
        'title': 'Stars of a Spanish tile mosaic (David Collection)',
        'short': 'Spanish mosaic stars', 'subtitle': 'Tile mosaic panel, Spain', 'fold': 4, 'star': 8,
        'style': 'Mudéjar', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s DS4 drawing, its corners snapped to exact '
                    'values. We devised the construction: a star at O and one at each corner of the cell, both the '
                    'same size, the square through M and four diagonals through V and W. The drawing gives no steps.',
            'changes': 'Wichmann draws the design turned by 45°; it is turned back here so that the tile is the square '
                       'cell. The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'panel was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data184/DS4: panel of tile mosaic, Spain', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data184/DS4.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of a fourteenth-century Spanish tile-mosaic panel in the '
                     'David Collection, Copenhagen (Sheila Blair, Cosmophilia, 2006, fig. 60). He also cites Wichmann '
                     'and Wade, Islamic Design: a Mathematical Approach (2017), fig. 9.9b, and Daud Sutton, Islamic '
                     'Design (2007), p. 27. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the lines that carry the stars’ sides on. They close the star at each '
                        'corner and the pieces between the stars.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and every corner.',
                    'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.201): ('star', 'a'), (6, 0.172): ('arrow', 'a'), (8, 0.172): ('shield', 'b'),
         (11, 0.271): ('ground', 'ground'), (8, 0.157): ('boat', 'ground'), (3, 0.043): ('triangle', 'a'),
         (4, 0.036): ('kite', 'ground'), (4, 0.029): ('square', 'a')}

if __name__ == '__main__':
    cm.run(main, NAMES)
