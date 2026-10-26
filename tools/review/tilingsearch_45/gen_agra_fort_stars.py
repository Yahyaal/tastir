#!/usr/bin/env python3
"""Builds the stars of the Agra Fort panel photographed by David Wade (IND
0312), drawn by Brian Wichmann in Tiling Search (data172/IND0312).

Read from the PDF (period 247.3 pt; the tiles are drawn whole with a white
stroke on top, so no band offset). With O at a star and A halfway to the next,
every corner snaps to the grid (a + b·√2/2)/2 (worst error 0.0004 of OA). With
a = √2 − 1 every line is one of:
  - the star at O, two squares on a circle of radius 2 − √2: the square
    sides x, y = ±a, through F = (1, a), and the diamond sides x ± y = ±(2 − √2),
    through P, where the circle with centre O through Q = (a, a) crosses the
    horizontal line;
  - the next stars' diamond sides x ± y = ±√2, through W = (√2, 0), where the
    circle with centre O through K1 crosses the horizontal line; F is where this
    line crosses the cell side;
  - x, y = ±2a, through N, where the circle with centre M = (a, 0) through O
    crosses the horizontal line; they make the small crosses at the corners.

Usage: gen_agra_fort_stars.py <IND0312-pieces.json> tutorials/agra-fort-stars.json
       pnpm review agra-fort-stars
       gen_agra_fort_stars.py finish docs/review/agra-fort-stars/dump.json tutorials/agra-fort-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
R2 = math.sqrt(2)
AA = R2 - 1
ORIGIN, PERIOD, BAND = (297.5, 375.8), 247.3, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a circle with centre O through K1. It crosses the horizontal line through O at W, right of A. '
         'Draw a line through W at 90° to the line from O to K1. Turn it round O by 90°, three times.',
         'compass', ['K1', 'W'])
    g.circle_through('ck', 'O', 'K1')
    g.meet('W', 'ck', 'h', (R2, 0))
    g.line_perp('wd', 'W', 'd45')
    g.repeat('wdp', ['wd'], 'rot4')

    step('The line through W crosses the vertical line through A at F. Draw a horizontal line through F. '
         'It crosses the line from O to K1 at Q. Turn the horizontal line round O by 90°, three times.',
         'ruler', ['F', 'Q'])
    g.meet('F', 'wd', 'gx', (1, AA))
    g.line_par('fh', 'F', 'h')
    g.meet('Q', 'fh', 'd45', (AA, AA))
    g.repeat('fhp', ['fh'], 'rot4')

    step('Draw a circle with centre O through Q. It crosses the horizontal line through O at P, right of O. '
         'Draw a line through P at 90° to the line from O to K1. Turn it round O by 90°, three times. '
         'The lines make the star at O.', 'compass', ['Q', 'P'])
    g.circle_through('cq', 'O', 'Q')
    g.meet('P', 'cq', 'h', (2 - R2, 0))
    g.line_perp('pd', 'P', 'd45')
    g.repeat('pdp', ['pd'], 'rot4')

    step('The vertical line through Q crosses the horizontal line through O at M. '
         'Draw a circle with centre M through O. It crosses the horizontal line through O again at N. '
         'Draw a vertical line through N. Turn it round O by 90°, three times.', 'compass', ['M', 'N'])
    g.meet('M', 'fh@3', 'h', (AA, 0))
    g.circle_through('cm', 'M', 'O')
    g.meet('N', 'cm', 'h', (2 * AA, 0))
    g.line_par('nv', 'N', 'v')
    g.repeat('nvp', ['nv'], 'rot4')


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
        'format': 0, 'id': 'agra-fort-stars',
        'title': 'Stars and crosses of the Agra Fort',
        'short': 'Agra Fort stars', 'subtitle': 'Agra Fort, India', 'fold': 4, 'star': 8,
        'style': 'Mughal', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s IND0312 drawing, its corners snapped to '
                    'exact values. We devised the construction. The star at O is two squares; the circle through '
                    'K1 gives the sides of the next stars, and those fix the square at O. A circle about M doubles '
                    'the square’s side for the lines of the small crosses at the corners. The drawing gives no '
                    'steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws '
                       'the lines as white bands; the tutorial draws their centre lines. David Wade’s photo was not '
                       'checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data172/IND0312: Agra Fort, Agra', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data172/IND0312.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from David Wade’s photo IND 0312 (Agra '
                     'Fort) and from E. W. Smith, The Moghul Architecture of Fathpur-Sikri (Archaeological Survey '
                     'of India, 1896), part 4, plate XXVII (the Friday Mosque, Fatehpur Sikri). '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of a star.', 'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O, the lines that carry its sides on, and the small crosses at the corners.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and a small '
                            'cross of squares at every corner.',
                    'palette': 'Timurid tile', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.804): ('star', 'b'), (4, 0.343): ('square', 'a'), (6, 0.201): ('six', 'ground'),
         (4, 0.142): ('kite', 'c'), (4, 0.118): ('small_square', 'd'), (5, 0.113): ('pentagon', 'd')}

if __name__ == '__main__':
    cm.run(main, NAMES)
