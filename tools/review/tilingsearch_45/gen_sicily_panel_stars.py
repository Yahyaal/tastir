#!/usr/bin/env python3
"""Builds the stars of a wooden panel from medieval Sicily (British Museum),
drawn by Brian Wichmann in Tiling Search (data207/BM1).

Read from the PDF (bevelled tiles joined with bevel_tiles.py, star spacing
144.85 pt = OA). Every corner fits the grid a + b·√2/2. Every line is one of
the eight lines touching a small circle of radius t = (2 − √2)/4 round a point
of the unit grid (O, A, C, K1 and their copies): a sharp eight-pointed star
round each point, carried on. In the cell that is
  - x, y = ±t, through the perpendicular bisector of O and the point (2t, 0),
    which comes from G = (2t, 2t) on the circle with centre K1 through A;
  - x ± y = ±d, d = t√2, through T on the circle with centre O through H = (t, t);
  - x, y = ±(1 − t), through the circle with centre A and radius t;
  - x ± y = ±(1 + d), through the circle with centre A and radius d;
  - x ± y = ±(2 − d), through the circle with centre K1 and radius d.
The ink keeps a sharp star at O, a large star round A and C, and squares and
eight-sided pieces between.

Usage: gen_sicily_panel_stars.py <BM1-tiles.json> tutorials/sicily-panel-stars.json
       pnpm review sicily-panel-stars
       gen_sicily_panel_stars.py finish docs/review/sicily-panel-stars/dump.json tutorials/sicily-panel-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step, steps  # noqa: E402

R2 = math.sqrt(2)
TT = (2 - R2) / 4
DD = TT * R2
ORIGIN, PERIOD, BAND = (298.9, 374.4), 289.7, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')
    step('Draw a circle with centre K1 through A. It crosses the line from O to K1 at G. '
         'Draw a vertical line through G. It crosses the horizontal line at N.', 'compass', ['G', 'N'])
    g.circle_through('ck', 'K1', 'A')
    g.meet('G', 'ck', 'd45', (2 * TT, 2 * TT))
    g.line_par('gv', 'G', 'v')
    g.meet('N', 'gv', 'h', (2 * TT, 0))
    step('Draw a circle with centre O through N. Draw a circle with centre N through O. '
         'They cross at P and Q. Draw a straight line through P and Q. Turn it round O by 90°, three times.',
         'compass', ['P', 'Q'])
    g.circle_through('con', 'O', 'N')
    g.circle_through('cno', 'N', 'O')
    g.meet('P', 'con', 'cno', (TT, math.sqrt(3) * TT))
    g.meet('Q', 'con', 'cno', (TT, -math.sqrt(3) * TT))
    g.line_through('pq', 'P', 'Q')
    g.repeat('pqp', ['pq'], 'rot4')
    step('The line through P and Q crosses the horizontal line at S. It crosses the line from O to K1 at H. '
         'Draw a circle with centre O through H. It crosses the horizontal line at T. '
         'Draw a straight line through A and C. Draw a line through T parallel to line AC. '
         'Turn it round O by 90°, three times. The lines make the star at O.', 'compass', ['S', 'H', 'T'])
    steps[-1]['textWithoutHelpers'] = ('The line through P and Q crosses the horizontal line at S. '
                                       'It crosses the line from O to K1 at H. Draw a circle with centre O through H. '
                                       'It crosses the horizontal line at T. '
                                       'Draw a line through T at 45° to the horizontal line. '
                                       'Turn it round O by 90°, three times. The lines make the star at O.')
    g.meet('S', 'pq', 'h', (TT, 0))
    g.meet('H', 'pq', 'd45', (TT, TT))
    g.circle_through('cht', 'O', 'H')
    g.meet('T', 'cht', 'h', (DD, 0))
    g.line_through('ac', 'A', 'C')
    g.line_par('td', 'T', 'ac')
    g.repeat('tdp', ['td'], 'rot4')
    step('Draw a circle with centre O through S. Draw a circle with centre A and the same radius. '
         'It crosses the horizontal line at U, near O. Draw a vertical line through U. '
         'Turn it round O by 90°, three times.', 'compass', ['U'])
    g.circle_through('cs', 'O', 'S')
    cm.circle_radius_of('cas', 'A', 'cs')
    g.meet('U', 'cas', 'h', (1 - TT, 0))
    g.line_par('uv', 'U', 'v')
    g.repeat('uvp', ['uv'], 'rot4')
    step('Draw a circle with centre A and the same radius as the circle through T. '
         'It crosses the horizontal line at W, beyond A. Draw a line through W parallel to line AC. '
         'Turn it round O by 90°, three times.', 'compass', ['W'])
    steps[-1]['textWithoutHelpers'] = ('Draw a circle with centre A and the same radius as the circle through T. '
                                       'It crosses the horizontal line at W, beyond A. '
                                       'Draw a line through W parallel to the line through T. '
                                       'Turn it round O by 90°, three times.')
    cm.circle_radius_of('cat', 'A', 'cht')
    g.meet('W', 'cat', 'h', (1 + DD, 0))
    g.line_par('wd', 'W', 'ac')
    g.repeat('wdp', ['wd'], 'rot4')
    step('Draw a circle with centre K1 and the same radius as the circle through T. '
         'It crosses the vertical line through A at Z, below K1. Draw a line through Z parallel to line AC. '
         'Turn it round O by 90°, three times.', 'compass', ['K1', 'Z'])
    steps[-1]['textWithoutHelpers'] = ('Draw a circle with centre K1 and the same radius as the circle through T. '
                                       'It crosses the vertical line through A at Z, below K1. '
                                       'Draw a line through Z parallel to the line through T. '
                                       'Turn it round O by 90°, three times.')
    cm.circle_radius_of('ckt', 'K1', 'cht')
    g.meet('Z', 'ckt', 'gx', (1, 1 - DD))
    g.line_par('zd', 'Z', 'ac')
    g.repeat('zdp', ['zd'], 'rot4')


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
        'format': 0, 'id': 'sicily-panel-stars',
        'title': 'Stars of a wooden panel from medieval Sicily',
        'short': 'Sicilian panel stars', 'subtitle': 'British Museum, wooden panel from Sicily', 'fold': 4,
        'star': 8, 'style': 'Norman Sicily', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s BM1 drawing, its corners snapped to exact '
                    'values. We devised the construction: every line touches a small circle round O, A, C or K1, '
                    'all of one radius, found by halving the length ON. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. The panel itself '
                       'was not checked: no free photo of it was found.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data207/BM1: exhibit at the British Museum', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data207/BM1.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, made from a photo by Dirk Booms of a wooden panel from '
                     'medieval Sicily (1125–1195) in the British Museum. The construction is ours.'}],
        'given': {'O': 'The centre of a small sharp star.',
                  'A': 'The centre of a large star, halfway to the side of the square tile.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the small star at O, the large stars round A, B, C and D, and the lines between them. '
                        'They close the squares and the eight-sided pieces.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. Small and large stars take turns '
                            'along every row.',
                    'palette': 'Mamluk wood', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.5): ('large_star', 'b'), (8, 0.293): ('eight', 'b'), (16, 0.243): ('cross', 'a'),
         (8, 0.164): ('shield', 'a'), (4, 0.104): ('square', 'a'), (16, 0.101): ('star', 'a')}

if __name__ == '__main__':
    cm.run(main, NAMES)
