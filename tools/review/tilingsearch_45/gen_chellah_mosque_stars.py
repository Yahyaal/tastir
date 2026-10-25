#!/usr/bin/env python3
"""Builds the interlaced stars of the Chellah mosque in Rabat, drawn by Brian
Wichmann in Tiling Search (data152/C103, after Castéra, Arabesques, page 103,
top).

Read from the PDF (a band drawing, band 10 pt, period 412.2 pt), the bands'
centre lines put in the frame with O at a star and the square cell's corners
at stars of another kind; a third kind sits at A, B, C and D. All three are
the stars of the Spanish tile mosaic (DS4, spanish-mosaic-stars), two squares
on a circle of radius 1 − √2/2, and this design shares its first six steps
(with the square through M). It adds the sides of the star at A (through G)
and the four diagonals through Z of the El Badi design (MAR1,
badi-palace-stars), and leaves out the diagonals through V and W. Every
corner of the drawing lands on a crossing of these lines (the drawing's
corners lie within 0.001 of OA of the exact ones).

Units: OA = 1, A halfway to the next star on the horizontal line; the tile is the square cell.

Usage: gen_chellah_mosque_stars.py <C103-pieces.json> tutorials/chellah-mosque-stars.json
       pnpm review chellah-mosque-stars
       gen_chellah_mosque_stars.py finish docs/review/chellah-mosque-stars/dump.json tutorials/chellah-mosque-stars.json
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
ORIGIN, PERIOD, BAND = (297.5, 375.0), 412.2, 10.0


def build():
    # steps 1 to 6 as in gen_spanish_mosaic_stars.py
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

    step('The same star sits at A. Draw the line through G at 90° to the line from O to K1. '
         'It is a side of the star at A.', 'ruler', ['G'])
    g.line_perp('gd', 'G', 'd45')

    step(f'The vertical line through F crosses the line through {pts[6]} and {pts[0]} at Z. '
         'Draw the line through Z at 90° to the line from O to K1.',
         'ruler', ['fv', 'q04'])
    g.meet('Z', 'fv', 'q04', (H, H - R))
    g.line_perp('zd', 'Z', 'd45')

    step('Turn the lines of the last four steps round O by 90°, three times. Leave out the line through A and C.',
         'ruler', ['ev', 'pq', 'mv', 'gd', 'zd'])
    g.repeat('cp', ['ev', 'pq', 'mv', 'gd', 'zd'], 'rot4')


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
        'format': 0, 'id': 'chellah-mosque-stars',
        'title': 'Interlaced stars of the Chellah mosque (Rabat)',
        'short': 'Chellah mosque stars', 'subtitle': 'Chellah mosque, Rabat', 'fold': 4, 'star': 8,
        'style': 'Marinid', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s C103 drawing, the centre lines of its bands '
                    'snapped to exact values. We devised the construction. Its stars and first steps are those of '
                    'the Spanish tile mosaic, with one more star at A and four diagonals through Z. '
                    'The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws the '
                       'lines as interlaced bands; the tutorial draws their centre lines. No photo of the mosque was '
                       'checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data152/C103: Chellah Mosque, Rabat', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data152/C103.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, after J.-M. Castéra’s Arabesques: Decorative Art in Morocco '
                     '(1999), page 103 (top), the Chellah mosque in Rabat. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'The centre of a star of another kind, halfway '
                  'from O to the next star like the one at O.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the stars at O, at A, B, C and D, and at the corners. '
                        'Ink the lines that carry their sides on. They close the pieces between the stars.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. Stars sit in rows and columns, and the bands '
                            'between them weave over and under.',
                    'palette': 'Alhambra', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.201): ('star', 'b'), (10, 0.172): ('bow', 'ground'), (8, 0.157): ('boat', 'a'),
         (4, 0.036): ('kite', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
