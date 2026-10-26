#!/usr/bin/env python3
"""Builds the stars, crosses and squares of Cahier and Martin's page 10,
drawn by Brian Wichmann in Tiling Search (data15/CM010).

Read from the PDF (plain tiles, star spacing 145.7 pt = OA). Every corner
fits the grid a + b·√2/2. With O at an eight-pointed star of two squares, a
cross at each corner of the square cell and halfway along each side, every
line is one of:
  - the star's square x, y = ±a, a = 1 − 1/√2, through G, where the circle
    with centre K1 through A crosses line OK1;
  - the star's diamond x ± y = ±(√2 − 1), through T, where the circle with
    centre O through G crosses the horizontal line;
  - x ± y = ±2a, through G (they carry the star's points on to the crosses);
  - x ± y = ±√2, through Q on the circle with centre O through K1;
  - x ± y = ±(5 − 3√2), the sides of the small squares, through N, where the
    vertical through V = (2a, 0) crosses the star's side x − y = √2 − 1.

Units: OA = 1, A on the horizontal line halfway to the next star of the same
kind as O's; the tile is the square cell.

Usage: gen_cahier_martin_cross_stars.py <CM010-pieces.json> tutorials/cahier-martin-cross-stars.json
       pnpm review cahier-martin-cross-stars
       gen_cahier_martin_cross_stars.py finish docs/review/cahier-martin-cross-stars/dump.json tutorials/cahier-martin-cross-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step, steps  # noqa: E402

R2 = math.sqrt(2)
AA = 1 - 1 / R2
ORIGIN, PERIOD, BAND = (300.36, 373.86), 291.4, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')
    step('Draw a circle with centre K1 through A. It crosses the line from O to K1 at G. '
         'Draw a vertical line through G. Turn it round O by 90°, three times. '
         'The four lines make the square of the star at O.', 'compass', ['G'])
    g.circle_through('ck', 'K1', 'A')
    g.meet('G', 'ck', 'd45', (AA, AA))
    g.line_par('gv', 'G', 'v')
    g.repeat('gp', ['gv'], 'rot4')
    step('Draw a straight line through A and C. Draw a circle with centre O through G. '
         'It crosses the horizontal line at T. Draw a line through T parallel to line AC. '
         'Turn it round O by 90°, three times.', 'compass', ['T'])
    steps[-1]['textWithoutHelpers'] = ('Draw a circle with centre O through G. It crosses the horizontal line at T. '
                                       'Draw a line through T at 45° to the horizontal line. '
                                       'Turn it round O by 90°, three times.')
    g.line_through('ac', 'A', 'C')
    g.circle_through('cg', 'O', 'G')
    g.meet('T', 'cg', 'h', (R2 - 1, 0))
    g.line_par('td', 'T', 'ac')
    g.repeat('tdp', ['td'], 'rot4')
    step('Draw a line through G parallel to line AC. Turn it round O by 90°, three times.', 'ruler', ['G'])
    g.line_par('gd', 'G', 'ac')
    g.repeat('gdp', ['gd'], 'rot4')
    step('The line through G parallel to line AC crosses the horizontal line at V. Draw a vertical line through V. '
         'It crosses the other line through T at N, above the horizontal line. '
         'Draw a line through N parallel to line AC. Turn it round O by 90°, three times. '
         'The lines make the small squares.', 'ruler', ['V', 'N'])
    steps[-1]['textWithoutHelpers'] = ('The line through G at 45° crosses the horizontal line at V. '
                                       'The vertical line through V crosses the other line through T at N, above the horizontal line. '
                                       'Draw a line through N parallel to the line through G. Turn it round O by 90°, three times. '
                                       'The lines make the small squares.')
    g.meet('V', 'gd', 'h', (2 * AA, 0))
    g.line_par('vv', 'V', 'v')
    g.meet('N', 'vv', 'td@3', (2 * AA, 2 * AA - (R2 - 1)))
    g.line_par('nd', 'N', 'ac')
    g.repeat('ndp', ['nd'], 'rot4')
    step('Draw a circle with centre O through K1. It crosses the horizontal line at Q. '
         'Draw a line through Q parallel to line AC. Turn it round O by 90°, three times.', 'compass', ['Q'])
    g.circle_through('cq', 'O', 'K1')
    g.meet('Q', 'cq', 'h', (R2, 0))
    g.line_par('qd', 'Q', 'ac')
    g.repeat('qdp', ['qd'], 'rot4')


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
        'format': 0, 'id': 'cahier-martin-cross-stars',
        'title': 'Stars, crosses and squares from Cahier and Martin',
        'short': 'Cahier and Martin cross stars', 'subtitle': 'Cahier and Martin, page 10', 'fold': 4, 'star': 8,
        'style': 'Islamic tilework', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s CM010 drawing, its corners snapped to exact '
                    'values. We devised the construction: one circle from K1 fixes the star’s square at G, and '
                    'every other line comes from G and the cell. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of a '
                       'building was checked: the source gives no place.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data15/CM010: Cahier and Martin, page 10', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data15/CM010.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Charles Cahier and Arthur Martin, 376 '
                     'Decorative Allover Patterns from Historic Tilework and Textiles (Dover), page 10, which gives no '
                     'place. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the side of the square tile on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the stars, the crosses between them, the small squares and the large squares. '
                        'The lines between them close the long pieces.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits in the middle and a cross at every '
                            'corner and side. Large squares fill the space between them.',
                    'palette': 'Timurid tile', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(4, 0.686): ('large_square', 'c'), (16, 0.426): ('cross', 'b'), (16, 0.402): ('star', 'a'),
         (11, 0.343): ('eleven', 'ground'), (4, 0.059): ('square', 'c'), (5, 0.056): ('pentagon', 'd')}

if __name__ == '__main__':
    cm.run(main, NAMES)
