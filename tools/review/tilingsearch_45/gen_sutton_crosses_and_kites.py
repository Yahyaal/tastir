#!/usr/bin/env python3
"""Builds the stars, hexagons and kites of Daud Sutton's Islamic Design,
page 27 (left), drawn by Brian Wichmann in Tiling Search (data184/DS3).

Read from the PDF (plain tiles, period 291.4 pt = 2 OA). Every corner fits
the grid a + b·√2/2. With O at an eight-pointed star of two squares and a
small sixteen-sided star at each corner of the square cell, every line is one of:
  - the star's square x, y = ±a, a = 1 − 1/√2, through G, where the circle
    with centre K1 through A crosses line OK1;
  - the star's diamond x ± y = ±(√2 − 1), through T, where the circle with
    centre O through G crosses the horizontal line; these run on through the
    whole wall;
  - x ± y = ±(3 − √2), through M = (1, 2 − √2), where the diamond's side
    crosses the vertical through A;
  - x, y = ±3a, the small star's square, through P, where the horizontal
    through E (on the circle and line OK1) crosses the line through M.
The star at O is the one of CM010 (cahier-martin-cross-stars), and the star,
hexagon, triangle and kite are those of the Leones door stars.

Usage: gen_sutton_crosses_and_kites.py <DS3-pieces.json> tutorials/sutton-crosses-and-kites.json
       pnpm review sutton-crosses-and-kites
       gen_sutton_crosses_and_kites.py finish docs/review/sutton-crosses-and-kites/dump.json tutorials/sutton-crosses-and-kites.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step, steps  # noqa: E402

R2 = math.sqrt(2)
AA = 1 - 1 / R2
ORIGIN, PERIOD, BAND = (297.5, 375.04), 291.4, 0.0


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
    step('The line through T crosses the vertical line through A at M, above the horizontal line. '
         'Draw a line through M parallel to line AC. Turn it round O by 90°, three times.', 'ruler', ['M'])
    steps[-1]['textWithoutHelpers'] = ('The line through T crosses the vertical line through A at M, above the horizontal line. '
                                       'Draw a line through M parallel to the line through T. '
                                       'Turn it round O by 90°, three times.')
    g.meet('M', 'td@3', 'gx', (1, 2 - R2))
    g.line_par('md', 'M', 'ac')
    g.repeat('mdp', ['md'], 'rot4')
    step('The circle crosses the line from O to K1 at E. Draw a horizontal line through E. '
         'It crosses the line through M at P. Draw a vertical line through P. '
         'Turn it round O by 90°, three times. The lines make the small stars at the corners.', 'ruler', ['E', 'P'])
    steps[-1]['textWithoutHelpers'] = ('The circle crosses the line from O to K1 at E. '
                                       'The horizontal line through E crosses the line through M at P. '
                                       'Draw a vertical line through P. Turn it round O by 90°, three times. '
                                       'The lines make the small stars at the corners.')
    g.meet('E', 'c', 'd45', (1 / R2, 1 / R2))
    g.line_par('eh', 'E', 'h')
    g.meet('P', 'eh', 'md', (3 * AA, 1 / R2))
    g.line_par('pv', 'P', 'v')
    g.repeat('pvp', ['pv'], 'rot4')


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
        'format': 0, 'id': 'sutton-crosses-and-kites',
        'title': 'Stars, hexagons and kites from Daud Sutton',
        'short': 'Sutton stars and hexagons', 'subtitle': 'Daud Sutton, Islamic Design, page 27', 'fold': 4, 'star': 8,
        'style': 'Islamic tilework', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s DS3 drawing, its corners snapped to exact '
                    'values. We devised the construction: one circle from K1 fixes the star’s square at G, and '
                    'every other line comes from G and the cell. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of a '
                       'building was checked: the source gives no place.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data184/DS3: Daud Sutton, page 27 (left)', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data184/DS3.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Daud Sutton, Islamic Design: A Genius '
                     'for Geometry (Wooden Books, 2007), page 27 (left), which gives no place. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the side of the square tile on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O, the small stars at the corners and the long lines between them. '
                        'They close the hexagons, the kites and the triangles.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A large star sits in the middle and '
                            'a small star at every corner.',
                    'palette': 'Alhambra', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(6, 0.515): ('hexagon', 'c'), (16, 0.402): ('star', 'a'), (8, 0.343): ('eight', 'b'),
         (16, 0.284): ('small_star', 'a'), (3, 0.086): ('triangle', 'ground'), (4, 0.071): ('kite', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
