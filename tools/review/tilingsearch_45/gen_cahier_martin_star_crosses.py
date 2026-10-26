#!/usr/bin/env python3
"""Builds the small stars, crosses and hexagons of Cahier and Martin's page 33,
drawn by Brian Wichmann in Tiling Search (data15/CM033).

Read from the PDF (plain tiles, star spacing 174.8 pt = 2 OA). The corners do
not fit the grid a + b·√2/2 in OA (error 0.008), but they do in thirds of OA.
With O at a small star of two squares and the plain ground round each cell
corner, every line is one of:
  - x ± y = ±2/3, the long sides of the crosses' arms and of the hexagons,
    through F = (1/3, 1/3), where the line from K2 to A crosses line OK1;
  - x, y = ±s, s = (2 − √2)/3, through S, where the circle with centre
    V = (2/3, 0) through F crosses the horizontal line;
  - the star's diamond x ± y = ±s√2, through T, where the circle with centre
    O through H = (s, s) crosses the horizontal line.

Usage: gen_cahier_martin_star_crosses.py <CM033-pieces.json> tutorials/cahier-martin-star-crosses.json
       pnpm review cahier-martin-star-crosses
       gen_cahier_martin_star_crosses.py finish docs/review/cahier-martin-star-crosses/dump.json tutorials/cahier-martin-star-crosses.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step, steps  # noqa: E402

R2 = math.sqrt(2)
SS = (2 - R2) / 3
ORIGIN, PERIOD, BAND = (298.64, 372.14), 174.84, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')
    step('Draw a straight line through K2 and A. It crosses the line from O to K1 at F. '
         'Draw a straight line through A and C. Draw a line through F parallel to line AC. '
         'Turn it round O by 90°, three times.', 'ruler', ['K2', 'F'])
    steps[-1]['textWithoutHelpers'] = ('The line from K2 to A crosses the line from O to K1 at F. '
                                       'Draw a line through F at 45° to the horizontal line. '
                                       'Turn it round O by 90°, three times.')
    g.line_through('k2a', 'K2', 'A')
    g.meet('F', 'k2a', 'd45', (1 / 3, 1 / 3))
    g.line_through('ac', 'A', 'C')
    g.line_par('fd', 'F', 'ac')
    g.repeat('fdp', ['fd'], 'rot4')
    step('The line through F crosses the horizontal line at V. Draw a circle with centre V through F. '
         'It crosses the horizontal line at S, near O. Draw a vertical line through S. '
         'Turn it round O by 90°, three times.', 'compass', ['V', 'S'])
    g.meet('V', 'fd', 'h', (2 / 3, 0))
    g.circle_through('cv', 'V', 'F')
    g.meet('S', 'cv', 'h', (SS, 0))
    g.line_par('sv', 'S', 'v')
    g.repeat('svp', ['sv'], 'rot4')
    step('The vertical line through S crosses the line from O to K1 at H. Draw a circle with centre O through H. '
         'It crosses the horizontal line at T. Draw a line through T parallel to line AC. '
         'Turn it round O by 90°, three times. The lines make the star at O.', 'compass', ['H', 'T'])
    steps[-1]['textWithoutHelpers'] = ('The vertical line through S crosses the line from O to K1 at H. '
                                       'Draw a circle with centre O through H. It crosses the horizontal line at T. '
                                       'Draw a line through T parallel to the line through F. '
                                       'Turn it round O by 90°, three times. The lines make the star at O.')
    g.meet('H', 'sv', 'd45', (SS, SS))
    g.circle_through('ch', 'O', 'H')
    g.meet('T', 'ch', 'h', (SS * R2, 0))
    g.line_par('td', 'T', 'ac')
    g.repeat('tdp', ['td'], 'rot4')


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
        'format': 0, 'id': 'cahier-martin-star-crosses',
        'title': 'Small stars, crosses and hexagons from Cahier and Martin',
        'short': 'Cahier and Martin star crosses', 'subtitle': 'Cahier and Martin, page 33', 'fold': 4, 'star': 8,
        'style': 'Islamic tilework', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s CM033 drawing, its corners snapped to exact '
                    'values in thirds of OA. We devised the construction: the line from K2 to A marks a third at F, '
                    'and every other line comes from F. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of a '
                       'building was checked: the source gives no place.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data15/CM033: Cahier and Martin, page 33', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data15/CM033.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Charles Cahier and Arthur Martin, 376 '
                     'Decorative Allover Patterns from Historic Tilework and Textiles (Dover), page 33, which gives no '
                     'place. The construction is ours.'}],
        'given': {'O': 'The centre of a small eight-pointed star.',
                  'A': 'Halfway from O to the side of the square tile on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O, the four arms round it and the hexagons on the sides of the cell.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. The crosses join through the hexagons '
                            'into a square net, with plain ground in each square.',
                    'palette': 'Timurid tile', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(28, 2.895): ('ground', 'ground'), (6, 0.184): ('hexagon', 'c'), (16, 0.179): ('star', 'a'),
         (8, 0.139): ('arm', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)
