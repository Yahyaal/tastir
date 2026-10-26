#!/usr/bin/env python3
"""Builds the stars and squares of a tile from the tomb of Sheikh Badr al-Din
Nuri, Khojent (V&A 2093A-1899), drawn by Brian Wichmann in Tiling Search
(data184/VA6).

Read from the PDF (period 306.3 pt, band 10 pt). The band centre lines do not
fit the grid a + b·√2/2 in units of half the period (error 0.014): every line
is set by s = 1/(3 − √2), the point radius of the star at O. With
p = s/√2 and q = (1 + s)/2 every line is one of:
  - the star at O, two squares on the circle of radius s: the diamond
    x ± y = ±s through S, where the vertical through P (line K1R crossing
    line AC, R where the circle with centre B through C crosses the
    horizontal) meets the horizontal line, and the square x, y = ±p through G
    on the circle with centre O through S;
  - the square x, y = ±q, through Q, where line AD crosses the diamond's side.
With these, the lines x, y = p, q, 2 − q and 2 − p are evenly spaced, so the
squares between two stars make a grid of three by three.

Units: OA = 1, A on the horizontal line halfway to the next star; the tile is
the square cell.

Usage: gen_khojent_tile_stars.py <VA6-pieces.json> tutorials/khojent-tile-stars.json
       pnpm review khojent-tile-stars
       gen_khojent_tile_stars.py finish docs/review/khojent-tile-stars/dump.json tutorials/khojent-tile-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

S = 1 / (3 - math.sqrt(2))
PP = S / math.sqrt(2)
QQ = (1 + S) / 2
ORIGIN, PERIOD, BAND = (297.5, 377.45), 306.3, 10.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a circle with centre B through C. It crosses the horizontal line at R. '
         'Draw a straight line through K1 and R.', 'compass', ['B', 'C', 'R'])
    g.circle_through('cb', 'B', 'C')
    g.meet('R', 'cb', 'h', (math.sqrt(2) - 1, 0))
    g.line_through('kr', 'K1', 'R')

    step('Draw a straight line through A and C. It crosses the line through K1 and R at P. '
         'Draw a vertical line through P. It crosses the horizontal line at S.', 'ruler', ['P', 'S'])
    g.line_through('ac', 'A', 'C')
    g.meet('P', 'ac', 'kr', (S, 1 - S))
    g.line_par('pv', 'P', 'v')
    g.meet('S', 'pv', 'h', (S, 0))

    step('Draw a line through S parallel to line AC. Turn it round O by 90°, three times. '
         'The four lines make the first square of the star at O.', 'ruler', ['S'])
    g.line_par('sd', 'S', 'ac')
    g.repeat('sdp', ['sd'], 'rot4')

    step('Draw a circle with centre O through S. It crosses the line from O to K1 at G. '
         'Draw a vertical line through G. Turn it round O by 90°, three times. '
         'The four lines make the second square of the star.', 'compass', ['S', 'G'])
    g.circle_through('cs', 'O', 'S')
    g.meet('G', 'cs', 'd45', (PP, PP))
    g.line_par('gv', 'G', 'v')
    g.repeat('gvp', ['gv'], 'rot4')

    step('Draw a straight line through A and D. It crosses the line through S at Q. '
         'Draw a vertical line through Q. Turn it round O by 90°, three times.', 'ruler', ['Q'])
    g.line_through('ad', 'A', 'D')
    g.meet('Q', 'ad', 'sd', (QQ, QQ - 1))
    g.line_par('qv', 'Q', 'v')
    g.repeat('qvp', ['qv'], 'rot4')


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
        'format': 0, 'id': 'khojent-tile-stars',
        'title': 'Interlaced star and squares of a tile from Khojent',
        'short': 'Khojent tile stars', 'subtitle': 'Tomb of Sheikh Badr al-Din Nuri, Khojent', 'fold': 4, 'star': 8,
        'style': 'Timurid', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s VA6 drawing, the centre lines of its bands '
                    'snapped to exact values. We devised the construction: the line through K1 and R fixes the point S of the star '
                    'at O, the star is two squares on the circle through S, and line AD fixes the square through Q. '
                    'The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws the '
                       'lines as interlaced bands; the tutorial draws their centre lines. The tile itself was not '
                       'checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data184/VA6: Tile from Khojent, Iran', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data184/VA6.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of a tile in the Victoria and Albert Museum '
                     '(2093A-1899, about 1400, from the tomb of Sheikh Badr al-Din Nuri, Khojent). The construction '
                     'is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the lines that carry its sides on, with the square through Q. '
                        'They close the grids of small squares between the stars.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A large star sits at every centre, and a grid '
                            'of small squares between two stars.',
                    'palette': 'Timurid tile', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.932): ('star', 'ground'), (10, 0.398): ('ten', 'ground'), (4, 0.136): ('square', 'a'),
         (5, 0.131): ('pentagon', 'a')}

if __name__ == '__main__':
    cm.run(main, NAMES)
