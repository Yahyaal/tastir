#!/usr/bin/env python3
"""Builds the doors of the south portico of the Patio de los Arrayanes
(Alhambra), drawn by Brian Wichmann in Tiling Search (data159/P077): eight-
pointed stars in rows, a long hexagon between each two, and between the rows
octagons, eleven-sided pieces and small diamonds; mirror lines across and up
(pmm), so the cell is a rectangle.

Read from the PDF: the drawing is bevelled, so its tiles were moved out by half
the gap between them (12 pt), and every corner snapped to the grid a + b·√2/2
in units of half the star spacing (116.55 pt, worst error 0.0011). The rows
are √2 times the star spacing apart (329.7 against 233.1 pt).

Units: OA = 1 is the star's tip radius, so that the pieces within 1 of O
keep the star's four-fold turn (the golden test's fold check; the wall itself
is pmm). The star at O is the star of two squares through A, C, B, D and
F1 to F4. Stars at (±2(1 + √2), 0); the cell is 2(1 + √2) by 2(2 + √2), its
corners where the circles with centres A and B through C mark the vertical
sides, x = ±(1 + √2), on the star's sides carried on. The other lines:
- x, y = ±(1 + √2/2), through Q, where two sides of the star cross;
- y = ±(2 + √2/2), through N, where x = 1 + √2/2 crosses a side of the star;
- x ± y = ±3, through M = (1, 2) and G = (0, 3);
- x ± y = ±(1 + 2√2), through P = (1, 2√2), on the circle through G.
(Half the star spacing, 116.55 pt in the PDF, is 1 + √2.)

Usage: gen_arrayanes_portico_doors.py <P077c-pieces.json> tutorials/alhambra-arrayanes-portico-doors.json
       pnpm review alhambra-arrayanes-portico-doors
       gen_arrayanes_portico_doors.py finish docs/review/alhambra-arrayanes-portico-doors/dump.json tutorials/alhambra-arrayanes-portico-doors.json
(P077c-pieces.json: the coloured pieces of P077-pieces.json, from 0_vectors.py
and 1_pieces.py in tools/review/alhambra_wichmann/.)
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
from gen_leones_door_stars import square_texts, star_points, two_squares  # noqa: E402

R2 = math.sqrt(2)
R = R2 - 1
H = R2 / 2


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'They cross at K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. '
        'They cross at K1. Draw a straight line through O and K1.')

    step('Draw the line through O at 90° to the line from O to K1. '
         'The two lines cross the circle at F1, F2, F3 and F4.', 'ruler', ['K1'])
    g.line_perp('d135', 'O', 'd45')
    for i, (nm, ln) in enumerate((('F1', 'd45'), ('F2', 'd135'), ('F3', 'd45'), ('F4', 'd135'))):
        a_ = math.radians(45 + 90 * i)
        g.meet(nm, 'c', ln, (math.cos(a_), math.sin(a_)))
    pts = ['A', 'F1', 'C', 'F2', 'B', 'F3', 'D', 'F4']

    step('Draw the star at O as two squares.', 'ruler', ['c'])
    two_squares(pts, 'q', square_texts(pts, 'Draw each line long, past the cell.'))

    step('The side of the star through D and A crosses the side through F1 and F2 at Q. '
         'Draw a vertical line through Q. It crosses the side through C and B at N. '
         'Draw a horizontal line through N.', 'ruler', ['A', 'F1'])
    g.meet('Q', 'q04', 'q11', (1 + H, H))
    g.line_par('qv', 'Q', 'v')
    g.meet('N', 'qv', 'q02', (1 + H, 2 + H))
    g.line_par('hn', 'N', 'h')

    step('The vertical line through A crosses the side of the star through C and B at M. '
         'Draw a line through M parallel to the line from F2 to F4. It crosses the vertical line through O at G. '
         'Draw a line through G parallel to the line from O to K1.', 'ruler', ['A'])
    g.meet('M', 'gx', 'q02', (1, 2))
    g.line_par('ml', 'M', 'd135')
    g.meet('G', 'ml', 'v', (0, 3))
    g.line_par('gl', 'G', 'd45')

    step('Draw a circle with centre O through G. It crosses the vertical line through A at P. '
         'Draw a line through P parallel to the line from F2 to F4.', 'compass', ['G'])
    g.circle_through('cg', 'O', 'G')
    g.meet('P', 'cg', 'gx', (1, 2 * R2))
    g.line_par('pl', 'P', 'd135')

    step('Turn the lines through Q and P round O by 90°, three times.')
    g.repeat('cp', ['qv', 'pl'], 'rot4')

    step('Mirror the line through N and the two lines through G in the horizontal line through O.')
    g.repeat('mi', ['hn', 'ml', 'gl'], 'mirror:h')

    step('Draw a circle with centre A through C. Draw a circle with centre B through C. '
         'They cross the horizontal line through O at E and H. '
         'Draw a vertical line through each of E and H. '
         'They cross the sides of the star at L1, L2, L3 and L4, the corners of the cell. '
         'Draw a straight line through L1 and L2. Draw a straight line through L3 and L4.', 'compass', ['A', 'B'])
    g.circle_through('cea', 'A', 'C')
    g.circle_through('ceb', 'B', 'C')
    g.meet('E', 'cea', 'h', (1 + R2, 0))
    g.meet('H', 'ceb', 'h', (-1 - R2, 0))
    g.line_par('ve', 'E', 'v')
    g.line_par('vh', 'H', 'v')
    g.meet('L1', 've', 'q02', (1 + R2, 2 + R2))
    g.meet('L2', 'vh', 'q01', (-1 - R2, 2 + R2))
    g.meet('L3', 'vh', 'q04', (-1 - R2, -2 - R2))
    g.meet('L4', 've', 'q03', (1 + R2, -2 - R2))
    g.line_through('top', 'L1', 'L2')
    g.line_through('bottom', 'L3', 'L4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, (300.7, 371.0), 2 * 116.55 * R, 12.0), 2 + R2, 1 + R2, 6)
    paths = cm.along_ink(segs)
    step('Join L1, L2, L3 and L4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['L1', 'L2', 'L3', 'L4']})
    tut = {
        'format': 0, 'id': 'alhambra-arrayanes-portico-doors',
        'title': 'Stars and octagons of the Patio de los Arrayanes doors (Alhambra)',
        'short': 'Arrayanes doors', 'subtitle': 'Patio de los Arrayanes, Alhambra', 'fold': 4, 'star': 8,
        'style': 'Nasrid', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P077 drawing, its corners snapped to exact '
                    'values. We devised the construction: the star at O has the tip radius of the Leones door stars, '
                    'its sides are carried on, and the rows of stars are √2 apart, the radius of the circle through '
                    'the corners of the square. The drawing gives no steps.',
            'changes': 'His bevelled bands are drawn as single lines along their middles. No photo of the doors was '
                       'checked: the copy of Wade’s SPA 2816 we hold shows a carved stucco panel instead. '
                       'The compass steps, their '
                       'order and the named points are ours. The comparison with the drawing checks the finished '
                       'lines, not how the design was first laid out.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data159/P077: Alhambra, Patio de los Arrayanes', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data159/P077.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of the wooden doors at the centre of the south portico of '
                     'the Patio de los Arrayanes (1354–62). He also cites David Wade’s photos SPA 2816 and SPA 2835. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'The centre of a long hexagon, halfway to the next star in the row.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the bands that carry its sides on. They close the long hexagons '
                        'between the stars, the octagons and the eleven-sided pieces between the rows.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the cell side by side. The stars make rows, and each row is the mirror '
                            'image of the next.',
                    'palette': 'Alhambra', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 2.343): ('star', 'a'), (6, 3.0): ('hexagon', 'b'), (8, 2.0): ('octagon', 'c'),
         (11, 3.157): ('eleven', 'ground'), (7, 1.914): ('heptagon', 'd'),
         (3, 0.5): ('triangle', 'c'), (4, 0.414): ('kite', 'b'), (4, 0.343): ('diamond', 'a')}

if __name__ == '__main__':
    cm.run(main, NAMES)
