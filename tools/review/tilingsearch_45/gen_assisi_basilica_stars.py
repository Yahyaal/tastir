#!/usr/bin/env python3
"""Builds the eight-pointed stars and squares of the mosaic in the Basilica of
St Francis, Assisi (Hessemer, page 78 bottom), drawn by Brian Wichmann in
Tiling Search (data4/P78B).

Read from the PDF (plain tiles, star spacing 170.7 pt = 2 OA). Every corner
fits the grid a + b·√2/2. With O at a star and the next stars at O's place in
the neighbouring cells, every line is one of:
  - x ± y = ±√2, the star's long sides, through Q and W on the circle with
    centre O through K1;
  - x, y = ±(√2 − 1), through R, where the first of those lines crosses the
    vertical through A;
  - x ± y = ±(2 − √2), through R parallel to line OK1.
Pieces: the star 24√2 − 32 (1.941), a large square 12 − 8√2 at each cell corner
(0.686), a diamond halfway along each side (0.343) and four triangles
(0.172); they add up to the cell, 4.

Usage: gen_assisi_basilica_stars.py <P78B-pieces.json> tutorials/assisi-basilica-stars.json
       pnpm review assisi-basilica-stars
       gen_assisi_basilica_stars.py finish docs/review/assisi-basilica-stars/dump.json tutorials/assisi-basilica-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

R2 = math.sqrt(2)
ORIGIN, PERIOD, BAND = (295.14, 376.66), 170.7, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')
    step('Draw a circle with centre O through K1. It crosses the horizontal line at Q and the vertical line at W. '
         'Draw a straight line through Q and W. Turn it round O by 90°, three times.', 'compass', ['Q', 'W'])
    g.circle_through('cq', 'O', 'K1')
    g.meet('Q', 'cq', 'h', (R2, 0))
    g.meet('W', 'cq', 'v', (0, R2))
    g.line_through('qq', 'Q', 'W')
    g.repeat('qqp', ['qq'], 'rot4')
    step('The line through Q and W crosses the vertical line through A at R. '
         'Draw a horizontal line through R. Turn it round O by 90°, three times.', 'ruler', ['R'])
    g.meet('R', 'qq', 'gx', (1, R2 - 1))
    g.line_par('rh', 'R', 'h')
    g.repeat('rhp', ['rh'], 'rot4')
    step('Draw a line through R parallel to the line from O to K1. Turn it round O by 90°, three times. '
         'The lines make the star at O.', 'ruler', ['R'])
    g.line_par('rd', 'R', 'd45')
    g.repeat('rdp', ['rd'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    polys = cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)
    if '--find' in sys.argv:
        import find_crossings
        find_crossings.report(polys)
        return
    segs = cm.network(polys)
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'assisi-basilica-stars',
        'title': 'Stars and squares of the Basilica of St Francis, Assisi',
        'short': 'Assisi basilica stars', 'subtitle': 'Basilica of St Francis, Assisi', 'fold': 4, 'star': 8,
        'style': 'Cosmatesque', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P78B drawing, its corners snapped to exact '
                    'values. We devised the construction: the circle through the cell’s corners gives the star’s '
                    'long sides, and every other line comes from R. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'basilica was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data4/P78B: Basilica of St Francis, Assisi', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data4/P78B.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from F. M. Hessemer, Historic Designs and '
                     'Patterns in Color (Dover), page 78 (bottom): a mosaic wall in the Basilica of St Francis. '
                     'He also cites David Wade’s photo SIC 031 from Monreale Cathedral. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the side of the square tile on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the squares at the corners. '
                        'Their sides close the diamonds and the triangles between them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. The stars stand in rows, '
                            'with a square between four stars and a diamond between two.',
                    'palette': 'Timurid tile', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 1.941): ('star', 'a'), (4, 0.686): ('square', 'ground'), (4, 0.343): ('diamond', 'b'),
         (3, 0.172): ('triangle', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)
