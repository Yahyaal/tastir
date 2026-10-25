#!/usr/bin/env python3
"""Builds two Persian courtyard designs drawn by Brian Wichmann in Tiling
Search, which share the star at O and the diamond lines through P:

  qom-atabaki-stars        data16/F77  Atabaki Court, Qom
  mashhad-courtyard-stars  data16/F82  Mashhad, the new courtyard

Read from the PDFs (plain tiles; stars 341.44 pt apart on the diagonal in
F77, 273.1 pt in F82), every corner snapped to the grid a + b·√2/2 in units
of half the star spacing (worst error 0.0009 of OA). Wichmann draws both
turned by 45°; turned back, the tile is the square cell with a star at O, the
next stars at (±2, 0) and (0, ±2). Every line is one of:
  - a side of the star at O: two squares on a circle of radius √2/2, the
    first square's sides at x, y = ±1/2;
  - a side of a diamond on the same circle round A, carried on (PR and the
    line through R), turned round O;
  - the line through U, where PR crosses the top side of the first square,
    at 90° to OK1 (a side of the next stars and of the diamonds round K1 to K4).

Units: OA = 1, A halfway to the next star on the horizontal line; the tile is
the square cell. F82 needs only steps 1 to 4 and the lines through P; F77
adds the lines through R and U.

Usage: gen_iran_court_stars.py <F77-pieces.json> <F82-pieces.json> tutorials/
       pnpm review qom-atabaki-stars ; pnpm review mashhad-courtyard-stars
       gen_iran_court_stars.py finish docs/review/<id>/dump.json tutorials/<id>.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
F77 = ((291.8, 376.7), 341.44)
F82 = ((297.5, 377.4), 273.12)


def build(variant):
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a circle with centre A through O. It crosses the first circle at E. '
         'Draw a vertical line through E. Turn it round O by 90°, three times. '
         'The four lines make a square, the first half of the star at O.', 'compass', ['A'])
    g.circle_through('ca', 'A', 'O')
    g.meet('E', 'ca', 'c', (0.5, math.sqrt(3) / 2))
    g.line_par('ev', 'E', 'v')
    g.repeat('evp', ['ev'], 'rot4')

    step('The square crosses the line from O to K1 at S. Draw a circle with centre O through S. '
         'It crosses the horizontal line at F. Draw a line through F at 90° to the line from O to K1. '
         'Turn it round O by 90°, three times. The four lines make the second square of the star.',
         'compass', ['S'])
    g.meet('S', 'ev', 'ev@1', (0.5, 0.5))
    g.circle_through('cs', 'O', 'S')
    g.meet('F', 'cs', 'h', (H, 0))
    g.line_perp('fd', 'F', 'd45')
    g.repeat('fdp', ['fd'], 'rot4')

    if variant == 'mashhad-courtyard-stars':
        step('Draw a circle with centre A and the same radius. It crosses the horizontal line at P. '
             'Draw a line through P parallel to the line from O to K1. '
             'Turn it round O by 90°, three times.', 'compass', ['cs'])
        cm.circle_radius_of('cr', 'A', 'cs')
        g.meet('P', 'cr', 'h', (1 - H, 0))
        g.line_par('pd', 'P', 'd45')
        g.repeat('pdp', ['pd'], 'rot4')
        return

    step('Draw a circle with centre A and the same radius. It crosses the horizontal line at P. '
         'It crosses the vertical line through A at R. Draw a line through P parallel to the line from O to K1. '
         'Draw a line through R at 90° to the line from O to K1.', 'compass', ['cs'])
    cm.circle_radius_of('cr', 'A', 'cs')
    g.meet('P', 'cr', 'h', (1 - H, 0))
    g.meet('R', 'cr', 'gx', (1, H))
    g.line_par('pd', 'P', 'd45')
    g.line_perp('rd', 'R', 'd45')

    step('The line through P crosses the top side of the first square at U. '
         'Draw a line through U at 90° to the line from O to K1.', 'ruler', ['pd'])
    g.meet('U', 'pd', 'ev@1', (0.5 + 1 - H, 0.5))
    g.line_perp('ud', 'U', 'd45')

    step('Turn the three lines of the last two steps round O by 90°, three times.')
    g.repeat('pdp', ['pd', 'rd', 'ud'], 'rot4')


def drawing(pieces, origin, period):
    polys = cm.frame_pieces(pieces, origin, period, 0)
    return [[((x + y) * H, (y - x) * H) for x, y in P] for P in polys]


COMMON_CONSTRUCTION = {
    'basis': 'reconstruction', 'fidelity': 'not-applicable',
    'changes': 'Wichmann draws the design turned by 45°; it is turned here so that the tile is the square cell. '
               'The compass steps, their order and the named points are ours. The comparison with the drawing '
               'checks the finished lines, not how the design was first laid out. No photo of the wall was checked.',
    'reviewed': '2026-10-25'}

NAQSH = ('Mahmood Maher al-Naqsh, Design and execution of drawing in Iranian tilework, Islamic period, '
         'Reza Abbasi Museum, 1983')

TUTS = {
    'qom-atabaki-stars': {
        'src': 0, 'origin': F77,
        'title': 'Stars and squares of the Atabaki court, Qom', 'short': 'Atabaki court stars',
        'subtitle': 'Atabaki court, Qom',
        'note': 'The finished design was read from Brian Wichmann’s F77 drawing, its corners snapped to exact '
                'values. We devised the construction: a star of two squares at O, and a diamond on the same circle '
                'round A, B, C and D, every side carried on. The drawing gives no steps.',
        'credit': {'source': 'Tiling Search, data16/F77: Atabaki Court, Qom', 'url': 'https://tilingsearch.mit.edu/HTML/data16/F77.html',
                   'note': 'The design was read from his drawing. He takes it from ' + NAQSH + ', volume 3, figure 77 '
                           '(the Atabaki courtyard, Qom; the original colouring is unclear). The construction is ours.'},
        'ink': 'Ink the star at O and the lines that carry the diamonds’ sides on. They close the long pieces round '
               'the star and the squares between them.',
        'pattern': 'Put copies of the square cell side by side. A star sits at every centre, with a large square '
                   'at each corner and on each side of the cell.'},
    'mashhad-courtyard-stars': {
        'src': 1, 'origin': F82,
        'title': 'Stars and crosses of the new courtyard, Mashhad', 'short': 'Mashhad courtyard stars',
        'subtitle': 'The new courtyard, Mashhad',
        'note': 'The finished design was read from Brian Wichmann’s F82 drawing, its corners snapped to exact '
                'values. It has every line of the Atabaki court design of Qom (F77), inked another way, so it uses '
                'the same construction. The drawing gives no steps.',
        'credit': {'source': 'Tiling Search, data16/F82: Mashhad, the new courtyard', 'url': 'https://tilingsearch.mit.edu/HTML/data16/F82.html',
                   'note': 'The design was read from his drawing. He takes it from ' + NAQSH + ', figure 82, page 40 '
                           '(the new courtyard, Mashhad). The construction is ours.'},
        'ink': 'Ink the star at O and the lines that carry the diamonds’ sides on. They close the crosses, the '
               'ten-sided pieces and the small squares.',
        'pattern': 'Put copies of the square cell side by side. A star sits at every centre and a cross at every '
                   'corner.'},
}


def main():
    pieces = sys.argv[1:3]
    outdir = sys.argv[3]
    for tid, t in TUTS.items():
        cm.el.clear()
        cm.steps.clear()
        build(tid)
        origin, period = t['origin']
        segs = cm.network(drawing(pieces[t['src']], origin, period))
        paths = cm.along_ink(segs)
        step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
        put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
        tut = {
            'format': 0, 'id': tid, 'title': t['title'], 'short': t['short'], 'subtitle': t['subtitle'],
            'fold': 4, 'star': 8, 'style': 'Persian', 'level': 'beginner',
            'construction': dict(COMMON_CONSTRUCTION, note=t['note']),
            'credits': [dict(t['credit'], creator='Brian Wichmann', kind='drawing')],
            'given': {'O': 'The centre of an eight-pointed star.',
                      'A': 'Halfway from O to the next star on the horizontal line.'},
            'steps': cm.steps,
            'ink': {'text': t['ink'], 'paths': paths},
            'pattern': {'cell': 'tile', 'text': t['pattern'], 'palette': 'Timurid tile', 'colors': {}},
            'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
        }
        cm.write(tut, os.path.join(outdir, tid + '.json'))
        print(tid, len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 1.172): ('star', 'a'), (11, 0.493): ('long_piece', 'ground'), (4, 0.172): ('square', 'b'),
         (4, 0.086): ('small_square', 'c'), (16, 0.828): ('cross', 'c'), (10, 0.414): ('ten', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)
