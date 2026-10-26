#!/usr/bin/env python3
"""Builds the stars, arrows and squares of Cahier and Martin's page 54 (top),
drawn by Brian Wichmann in Tiling Search (data15/CM054A).

Read from the PDF (plain tiles, period 301.4 pt). The corners do not fit the
grid a + b·√2/2 (error 0.02): every line is set by one length
a = 1/(3 + √2) = (3 − √2)/7 in units of half the period (drawing 0.2265 to
0.2267). With O at a star and a second star at each corner of the square
cell, every line is one of:
  - the large square x, y = ±(1 − a), through R, where the line from C to
    U = (1, √2/2) crosses OK1 (this is what fixes a);
  - the star at O: the square x, y = ±a, through S, where the vertical through
    R crosses line AC, and the diamond x ± y = ±a√2, through T on the circle
    with centre O through G = (a, a);
  - the diamonds round A, B, C and D, whose sides carry on to the arrows'
    points: x ± y = ±(1 − a), through V = (1 − a, 0);
  - the second square of each corner star: x ± y = ±(2 − a√2), through W,
    where the circle with centre K1 through R crosses the vertical through A.

Units: OA = 1, A on the horizontal line halfway to the next star at O's
place; the tile is the square cell.

Usage: gen_cahier_martin_arrow_stars.py <CM054A-pieces.json> tutorials/cahier-martin-arrow-stars.json
       pnpm review cahier-martin-arrow-stars
       gen_cahier_martin_arrow_stars.py finish docs/review/cahier-martin-arrow-stars/dump.json tutorials/cahier-martin-arrow-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
AA = 1 / (3 + math.sqrt(2))
ORIGIN, PERIOD, BAND = (299.76, 373.26), 301.43, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at E. Draw a horizontal line through E. '
         'It crosses the vertical line through A at U. Draw a straight line through C and U. '
         'It crosses the line from O to K1 at R.', 'ruler', ['E', 'U', 'R'])
    g.meet('E', 'c', 'd45', (H, H))
    g.line_par('eh', 'E', 'h')
    g.meet('U', 'eh', 'gx', (1, H))
    g.line_through('cu', 'C', 'U')
    g.meet('R', 'cu', 'd45', (1 - AA, 1 - AA))

    step('Draw a vertical line through R. Turn it round O by 90°, three times. '
         'The four lines make the large square.', 'ruler', ['R'])
    g.line_par('rv', 'R', 'v')
    g.repeat('rvp', ['rv'], 'rot4')

    step('Draw a straight line through A and C. It crosses the vertical line through R at S. '
         'Draw a horizontal line through S. Turn it round O by 90°, three times. '
         'The four lines make the first square of the star at O.', 'ruler', ['S'])
    g.line_through('ac', 'A', 'C')
    g.meet('S', 'ac', 'rv', (1 - AA, AA))
    g.line_par('sh', 'S', 'h')
    g.repeat('shp', ['sh'], 'rot4')

    step('The horizontal line through S crosses the line from O to K1 at G. '
         'Draw a circle with centre O through G. It crosses the horizontal line at T. '
         'Draw a line through T parallel to line AC. Turn it round O by 90°, three times.', 'compass', ['G', 'T'])
    g.meet('G', 'sh', 'd45', (AA, AA))
    g.circle_through('cg', 'O', 'G')
    g.meet('T', 'cg', 'h', (AA * math.sqrt(2), 0))
    g.line_par('td', 'T', 'ac')
    g.repeat('tdp', ['td'], 'rot4')

    step('The vertical line through R crosses the horizontal line at V. '
         'Draw a line through V parallel to line AC. Turn it round O by 90°, three times.', 'ruler', ['V'])
    g.meet('V', 'rv', 'h', (1 - AA, 0))
    g.line_par('vd', 'V', 'ac')
    g.repeat('vdp', ['vd'], 'rot4')

    step('Draw a circle with centre K1 through R. It crosses the vertical line through A at W. '
         'Draw a line through W parallel to line AC. Turn it round O by 90°, three times. '
         'The lines make the stars at the corners.', 'compass', ['K1', 'R', 'W'])
    g.circle_through('ck', 'K1', 'R')
    g.meet('W', 'ck', 'gx', (1, 1 - AA * math.sqrt(2)))
    g.line_par('wd', 'W', 'ac')
    g.repeat('wdp', ['wd'], 'rot4')


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
        'format': 0, 'id': 'cahier-martin-arrow-stars',
        'title': 'Stars, arrows and squares from Cahier and Martin',
        'short': 'Cahier and Martin arrow stars', 'subtitle': 'Cahier and Martin, page 54', 'fold': 4, 'star': 8,
        'style': 'Islamic tilework', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s CM054A drawing, its corners snapped to exact '
                    'values. We devised the construction: one line from C through U fixes the large square at R, '
                    'and every other line comes from R. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of a '
                       'building was checked: the source gives no place.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data15/CM054A: Cahier and Martin, page 54 (top)', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data15/CM054A.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Charles Cahier and Arthur Martin, 376 '
                     'Decorative Allover Patterns from Historic Tilework and Textiles (Dover), page 54, which gives no '
                     'place. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the side of the square tile on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O, its arrows, the large square, the diamonds and the stars at the corners. '
                        'The lines between them close the bands.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star with four arrows sits in every large '
                            'square, and a small star where the bands cross.',
                    'palette': 'Timurid tile', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(6, 0.35): ('arrow', 'b'), (8, 0.29): ('eight', 'ground'), (16, 0.24): ('star', 'a'),
         (8, 0.188): ('band', 'd'), (4, 0.103): ('square', 'c')}

if __name__ == '__main__':
    cm.run(main, NAMES)
