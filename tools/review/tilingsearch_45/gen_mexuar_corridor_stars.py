#!/usr/bin/env python3
"""Builds the incised stucco panel of the Mexuar corridor (Alhambra), drawn
by Brian Wichmann in Tiling Search (data159/P051): an eight-pointed star of
two squares at O, long frets with a pointed cross-piece turning round it like
a pinwheel, and a small square at each corner of the cell.

Read from the PDF (period 262.13 pt), every line is horizontal or vertical at
a, a + s or a + 2s from O, or diagonal: a side of the star's turned square, or
a side of the square through A and C. Here a is the half-side of the star's
squares and s, the width of the bands, is the width of a star point at its
base, s = 2a·tan 22.5°; the corner square has side s, so a + 5s/2 = 1, which
gives a = 1/(5√2 − 4) = 0.32562 and s = 0.26975 (drawing 0.3256 and 0.2698).
The point (a, a + s) is where the line from E (0, ½) to F (√2/2, √2/2) crosses
the line from H (½, ½) to G (√2, 0). Chiral: quarter turns only.

Units: OA = 1, A halfway to the next star; the tile is the square cell.

Usage: gen_mexuar_corridor_stars.py <P051-pieces.json> tutorials/alhambra-mexuar-corridor-stars.json
       pnpm review alhambra-mexuar-corridor-stars
       gen_mexuar_corridor_stars.py finish docs/review/alhambra-mexuar-corridor-stars/dump.json tutorials/alhambra-mexuar-corridor-stars.json
(P051-pieces.json from 0_vectors.py and 1_pieces.py in tools/review/alhambra_wichmann/.)
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

R2 = math.sqrt(2)
T = R2 - 1
SA = 1 / (5 * R2 - 4)
SS = 2 * SA * T


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a straight line through A and C. It crosses the line from O to K1 at H. '
         'Draw a horizontal line through H. It crosses the vertical line at E. '
         'Draw a straight line through E and F, where the circle crosses the line from O to K1.', 'ruler', ['A', 'C'])
    g.line_through('ac', 'A', 'C')
    g.meet('H', 'ac', 'd45', (0.5, 0.5))
    g.line_par('hh', 'H', 'h')
    g.meet('E', 'hh', 'v', (0, 0.5))
    g.meet('F', 'c', 'd45', (R2 / 2, R2 / 2))
    g.line_through('ef', 'E', 'F')

    step('Draw a circle with centre O through K1. It crosses the horizontal line at G, beyond A. '
         'Draw a straight line through G and H. It crosses line EF at Q.', 'compass', ['K1'])
    g.circle_through('ck', 'O', 'K1')
    g.meet('G', 'ck', 'h', (R2, 0))
    g.line_through('gh', 'G', 'H')
    g.meet('Q', 'gh', 'ef', (SA, SA + SS))

    step('Draw a vertical line through Q. It crosses the line from O to K1 at S. '
         'Draw a horizontal line through Q. Draw a circle with centre Q through S. '
         'It crosses the vertical line through Q again at R. Draw a horizontal line through R.', 'compass', ['Q'])
    g.line_par('qv', 'Q', 'v')
    g.meet('S', 'qv', 'd45', (SA, SA))
    g.line_par('qh', 'Q', 'h')
    g.circle_through('cq', 'Q', 'S')
    g.meet('R', 'cq', 'qv', (SA, SA + 2 * SS))
    g.line_par('rh', 'R', 'h')

    step('Draw a circle with centre O through S. It crosses the horizontal line at U, between O and A. '
         'Draw a line through U parallel to line AC. It is a side of the turned square of the star.', 'compass', ['S'])
    g.circle_through('cs', 'O', 'S')
    g.meet('U', 'cs', 'h', (SA * R2, 0))
    g.line_par('ud', 'U', 'ac')

    step('Turn line AC and the lines of the last two steps round O by 90°, three times.')
    g.repeat('cp', ['ac', 'qv', 'qh', 'rh', 'ud'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    polys = cm.frame_pieces(pieces, (297.5, 375.044), 262.13, 0)
    segs = cm.network(polys)
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-mexuar-corridor-stars', 'title': 'Stars and frets of the Mexuar corridor (Alhambra)',
        'short': 'Mexuar corridor stars', 'subtitle': 'Mexuar corridor, Alhambra', 'fold': 4, 'star': 8, 'chiral': True,
        'style': 'Nasrid', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P051 drawing. We devised the construction: '
                    'the width of the bands is the width of a star point, and the small corner square is one band '
                    'wide, which fixes the size of the star. The drawing gives no steps.',
            'changes': 'The compass operations, step order and named crossings are our reconstruction. '
                       'The comparison with the drawing checks the finished lines, not the historical steps. '
                       'No photo of the real panel was available to check it.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data159/P051: Alhambra, Mexuar Patio corridor', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data159/P051.html',
             'note': 'The design was read from his drawing of the incised stucco panel on the east wall of the '
                     'corridor from the Mexuar Patio to the Patio de los Arrayanes, made from a photo by John Rigby. '
                     'It is also Fig. A.6 of Wichmann and Wade, Islamic Design: a Mathematical Approach (2017). '
                     'The construction is ours.',
             'kind': 'drawing'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Halfway from O to the next star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the long frets that turn round it. '
                        'Ink the small square at each corner of the cell.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Put copies of the square cell side by side. The frets turn round each '
                                            'star like a pinwheel. A small square joins four frets.',
                    'palette': 'Alhambra', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.497): ('star', 'a'), (15, 0.5): ('ground', 'ground'), (10, 0.358): ('fret', 'c'),
         (4, 0.073): ('square', 'd')}

if __name__ == '__main__':
    cm.run(main, NAMES)
