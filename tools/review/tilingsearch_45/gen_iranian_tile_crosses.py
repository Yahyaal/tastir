#!/usr/bin/env python3
"""Builds the crosses and squares of an Iranian tile design, drawn by Brian
Wichmann in Tiling Search (data17/P35, after al-Naqsh, Design and execution of
drawing in Iranian tilework, volume 4, page 35).

The drawing is plain tiles: a square at O, a long cross at A (and B, C, D), a
four-armed cross at each corner of the cell, and the ground between them. All
the crosses' arms are 2t wide with pointed ends, and every short edge has the
same length √2·t; with OA = 1 that gives t = 1/(4 + √2) (drawing: OA = 134.0
pt, t = 24.75 pt, so OA/t = 5.414). That t comes from one line: from A
through N, where the vertical through the circle's 135° point meets the top
of the cell; it crosses the diagonal OK1 at M = (2t, 2t). Every line is then
x or y = ±t, ±(1 − t), or a 45° line through the square's corners or the
crosses' points. Corners land within 0.001 of OA.

Usage: gen_iranian_tile_crosses.py <P35-pieces.json> tutorials/iranian-tile-crosses.json
       pnpm review iranian-tile-crosses
       gen_iranian_tile_crosses.py finish docs/review/iranian-tile-crosses/dump.json tutorials/iranian-tile-crosses.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
T = 1 / (4 + math.sqrt(2))
ORIGIN, PERIOD = (314.0, 371.0), 268.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw the line through O at 90° to the line from O to K1. It crosses the circle at E, '
         'between C and B. Draw a vertical line through E. It crosses the line through C and K1 at N.',
         'ruler', ['d45', 'c'])
    g.line_perp('d135', 'O', 'd45')
    g.meet('E', 'c', 'd135', (-H, H))
    g.line_par('ev', 'E', 'v')
    g.meet('N', 'ev', 'gy', (-H, 1))

    step('Draw a straight line through A and N. It crosses the line from O to K1 at M. '
         'Draw a vertical line and a horizontal line through M. '
         'They cross the line through O and A at S, and the line through A and K1 at P.',
         'ruler', ['A', 'N'])
    g.line_through('an', 'A', 'N')
    g.meet('M', 'an', 'd45', (2 * T, 2 * T))
    g.line_par('mv', 'M', 'v')
    g.line_par('mh', 'M', 'h')
    g.meet('S', 'mv', 'h', (2 * T, 0))
    g.meet('P', 'mh', 'gx', (1, 2 * T))

    step('Draw the line through S at 90° to the line from O to K1. It is a side of the square at O. '
         'It crosses the line from O to K1 at Q. Draw a horizontal line through Q.', 'ruler', ['S'])
    g.line_perp('sq', 'S', 'd45')
    g.meet('Q', 'sq', 'd45', (T, T))
    g.line_par('qh', 'Q', 'h')

    step('Draw the line through A at 90° to the line from O to K1. It crosses the horizontal line through Q '
         'at R. Draw a vertical line through R.', 'ruler', ['A', 'qh'])
    g.line_perp('ad', 'A', 'd45')
    g.meet('R', 'ad', 'qh', (1 - T, T))
    g.line_par('rv', 'R', 'v')

    step('Draw a line through P parallel to the line from O to K1. Draw the line through P at 90° to it.',
         'ruler', ['P', 'd45'])
    g.line_par('pp', 'P', 'd45')
    g.line_perp('pq', 'P', 'd45')

    step('Turn the lines through S, Q, R and P round O by 90°, three times. '
         'They are the sides of the square and the crosses.', 'ruler', ['sq', 'qh', 'rv', 'pp', 'pq'])
    g.repeat('cp', ['sq', 'qh', 'rv', 'pp', 'pq'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, 0))
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'iranian-tile-crosses',
        'title': 'Crosses and squares of Iranian tilework',
        'short': 'Iranian tile crosses', 'subtitle': 'After al-Naqsh, Iranian tilework, volume 4',
        'fold': 4, 'style': 'Persian', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P35 drawing, its corners snapped to exact '
                    'values. We devised the construction: the arms of the crosses are as wide as their pointed '
                    'ends are long, which one line from A fixes. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of a '
                       'building was checked; the book gives none in colour.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data17/P35: Arabic collection, volume 4, page 35', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data17/P35.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, after Mahmood Maher al-Naqsh, Design and execution of '
                     'drawing in Iranian tilework, Islamic period (Reza Abbasi Museum, 1983), volume 4, page 35. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of a small square.',
                  'A': 'The centre of a long cross, halfway from O to the next square.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the square at O and the long crosses at A, B, C and D. '
                        'Ink the four-armed crosses at the corners. Their sides close the ground between them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. Squares and four-armed crosses take turns '
                            'on the diagonals, with long crosses between them.',
                    'palette': 'Timurid tile', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(4, 0.273): ('square', 'c'), (12, 0.466): ('bar', 'a'), (16, 0.659): ('cross', 'b'),
         (11, 0.534): ('ground', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
