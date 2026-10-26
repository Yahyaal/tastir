#!/usr/bin/env python3
"""Builds the interlaced squares of the Tillya-Kari madrasa, Samarkand, drawn
by Brian Wichmann in Tiling Search (data15/A222).

Read from the PDF (a band drawing, band 15 pt, period 241.4 pt), the bands'
centre lines put in the frame with O at a square turned by 45° and the
square cell's corners at the upright squares. Every centre line snaps to the
grid a + b·√2/2 in units of half the period (worst error 0.0015 of OA), and
there are only two kinds:
  - the horizontal and vertical lines at ±√2/2 (through F, where the circle
    crosses OK1);
  - the diagonals x ± y = ±(√2 − 1): the turned square at O (through E,
    where the circle with centre G = (√2/2, 0) through A crosses the
    vertical through F);
  - the diagonals x ± y = ±(3 − √2), the turned squares of the next cells
    (through Q, where the line through E crosses the vertical through A).
Pieces: two squares (one turned) of area 6 − 4√2, four pentagons and two
ten-sided pieces of area 1 per cell.

Usage: gen_tillya_kari_squares.py <A222-pieces.json> tutorials/tillya-kari-squares.json
       pnpm review tillya-kari-squares
       gen_tillya_kari_squares.py finish docs/review/tillya-kari-squares/dump.json tutorials/tillya-kari-squares.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
ORIGIN, PERIOD, BAND = (72.8, 129.6), 241.4, 15.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at F. Draw a vertical line through F. '
         'Turn it round O by 90°, three times.', 'ruler', ['F'])
    g.meet('F', 'c', 'd45', (H, H))
    g.line_par('fv', 'F', 'v')
    g.repeat('fvp', ['fv'], 'rot4')

    step('The vertical line through F crosses the horizontal line at G. Draw a circle with centre G through A. '
         'It crosses the vertical line through F at E. Draw a line through E parallel to the line from O to K1. '
         'Turn it round O by 90°, three times. The four lines make a square at O.', 'compass', ['G', 'E'])
    g.meet('G', 'fv', 'h', (H, 0))
    g.circle_through('cg', 'G', 'A')
    g.meet('E', 'cg', 'fv', (H, 1 - H))
    g.line_par('ed', 'E', 'd45')
    g.repeat('edp', ['ed'], 'rot4')


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
        'format': 0, 'id': 'tillya-kari-squares',
        'title': 'Interlaced squares of the Tillya-Kari madrasa, Samarkand',
        'short': 'Tillya-Kari squares', 'subtitle': 'Tillya-Kari madrasa, Samarkand', 'fold': 4,
        'style': 'Timurid', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s A222 drawing, the centre lines of its bands '
                    'snapped to exact values. We devised the construction: lines through F and a square at O turned '
                    'by 45°. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws the '
                       'lines as interlaced bands; the tutorial draws their centre lines. No photo of the madrasa '
                       'was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data15/A222: Tillya-Kari Madrasah, Samarkand', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data15/A222.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He lists the same design on the eastern tomb tower at '
                     'Kharraqan, Iran (Jay Bonner, Islamic Geometric Patterns, page 266), the Maghak-i Attari mosque '
                     'in Bukhara and the shrine at Chisht, Afghanistan (Eric Broug, Islamic Geometric Design), the '
                     'minaret of Jam, Jodh Bai’s palace at Fatehpur Sikri, and Agra Fort (David Wade’s photo '
                     'IND 0312). The construction is ours.'}],
        'given': {'O': 'The centre of a square turned by 45°.',
                  'A': 'Halfway from O to the next turned square on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the turned square at O and the lines that carry its sides on. They close the upright '
                        'squares at the corners, the pentagons and the ten-sided pieces.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A turned square sits at every centre and an '
                            'upright square at every corner.',
                    'palette': 'Timurid tile', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(10, 1.0): ('ten', 'ground'), (4, 0.343): ('square', 'a'), (5, 0.328): ('pentagon', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)
