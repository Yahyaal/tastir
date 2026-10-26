#!/usr/bin/env python3
"""Builds the interlaced stars of the tomb of Itimad al-Daula, Agra, drawn by
Brian Wichmann in Tiling Search (data153/F78).

Read from the PDF (a band drawing, band 10 pt, square cell 349.7 pt with a
small square at each corner), the bands' centre lines put with O at the star
in the middle of the cell. Every centre line snaps to the grid a + b·√2/2 in
units of half the cell (worst error 0.0012 of OA). Every line is a side of an
eight-pointed star of two squares with tip radius R = √2 − 1, carried on: the
star at O and the stars at T = (R, 1) and its copies, two on each side of the
cell. The star at O is the one of the Leones doors (alhambra-leones-door-
stars, steps 1 to 4). The star at T has its tips on the circle with centre T
through C: C, U = (2R, 1), F and G, where the horizontal through F crosses
that circle again. Pieces per cell: five stars, eight eight-sided pieces,
twenty pentagons and the small square at the corners.

Units: OA = 1, A on the horizontal line halfway across the cell; the tile is
the square cell.

Usage: gen_itimad_daula_stars.py <F78-pieces.json> tutorials/itimad-daula-stars.json
       pnpm review itimad-daula-stars
       gen_itimad_daula_stars.py finish docs/review/itimad-daula-stars/dump.json tutorials/itimad-daula-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
import gen_leones_door_stars as leones  # noqa: E402

R2 = math.sqrt(2)
R = R2 - 1
H = R2 / 2
ORIGIN, PERIOD, BAND = (297.55, 375.85), 349.7, 10.0


def star_at_o():
    """Steps 1 to 4 of the Leones doors: the cell and the star at O."""
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')
    step('The circle crosses the line from O to K1 at F. Draw a circle with centre K1 through F. '
         'Draw a circle with centre O and the same radius.', 'compass', ['K1'])
    g.meet('F', 'c', 'd45', (H, H))
    g.circle_through('ck', 'K1', 'F')
    cm.circle_radius_of('cs', 'O', 'ck')
    step('Draw the line through O at 90° to the line from O to K1. '
         'The small circle with centre O crosses the four lines through O at S1 to S8.', 'ruler', ['cs'])
    g.line_perp('d135', 'O', 'd45')
    pts = leones.star_points('S', 'cs', R)
    step('Draw the star at O as two squares.', 'ruler', ['cs'])
    leones.two_squares(pts, 'q', leones.square_texts(pts, 'Draw each line long, to the sides of the cell.'))


def build():
    star_at_o()
    step('Draw a circle with centre C and the same radius as the small circle. '
         'It crosses the horizontal line through C at T, on the right of C. '
         'Draw a circle with centre T through C. It crosses the horizontal line through C again at U.',
         'compass', ['C', 'T', 'U'])
    cm.circle_radius_of('cc', 'C', 'cs')
    g.meet('T', 'cc', 'gy', (R, 1))
    g.circle_through('ct', 'T', 'C')
    g.meet('U', 'ct', 'gy', (2 * R, 1))

    step('A second star sits at T. Its circle passes through F. '
         'Draw a vertical line and a horizontal line through F. '
         'The horizontal line crosses the circle with centre T again at G. Draw a vertical line through G.',
         'ruler', ['F', 'G'])
    g.line_par('fv', 'F', 'v')
    g.line_par('fh', 'F', 'h')
    g.meet('G', 'ct', 'fh', (3 * H - 2, H))
    g.line_par('gv', 'G', 'v')

    step('Draw a straight line through A and C. '
         'Draw a line through U parallel to line AC. '
         'Draw a line through U parallel to the line from O to K1. '
         'With the lines through F and G they make the star at T.', 'ruler', ['A', 'U'])
    g.line_through('ac', 'A', 'C')
    g.line_par('ua', 'U', 'ac')
    g.line_par('ud', 'U', 'd45')

    step('Turn the lines of the last two steps round O by 90°, three times. '
         'They make the stars on the four sides of the cell.')
    g.repeat('tp', ['fv', 'gv', 'ac', 'ua', 'ud'], 'rot4')


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
        'format': 0, 'id': 'itimad-daula-stars',
        'title': 'Interlaced stars of the tomb of Itimad al-Daula, Agra',
        'short': 'Itimad al-Daula stars', 'subtitle': 'Tomb of Itimad al-Daula, Agra', 'fold': 4, 'star': 8,
        'style': 'Mughal', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s F78 drawing, the centre lines of its bands '
                    'snapped to exact values. We devised the construction. Every line is a side of a star of two '
                    'squares, carried on: the star at O, which is the star of the Leones doors, and a star of the '
                    'same size at T, two on each side of the cell. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws the '
                       'lines as interlaced bands; the tutorial draws their centre lines. No photo of the tomb '
                       'was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data153/F78: Mausoleum of Itimad al-Daula, Agra', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data153/F78.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Clévenot, figure 78 (ornament on a '
                     'pillar of the tomb of Itimad al-Daula, Agra, 1622), and lists the same design in David Wade’s '
                     'photos IND 0414 (the same tomb), IRA 1002 (the Hakim mosque, Isfahan) and TRA 0506 (the '
                     'Tillya-Kari madrasa, Samarkand), and at the Nim Avard madrasa, Isfahan. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway across the cell on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the stars at O and T and the lines that carry their sides on. '
                        'They close the eight-sided pieces, the pentagons and the small squares.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre, two stars on '
                            'every side and a small square at every corner.',
                    'palette': 'Timurid tile', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.402): ('star', 'a'), (8, 0.101): ('eight', 'b'), (5, 0.056): ('pentagon', 'ground'),
         (4, 0.059): ('square', 'd')}

if __name__ == '__main__':
    cm.run(main, NAMES)
