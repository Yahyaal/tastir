#!/usr/bin/env python3
"""Builds the crosses of the Tash-Khauli palace, Khiva, drawn by Brian
Wichmann in Tiling Search (data185/R241B, from Rempel's drawing of the
palace's majolica).

Read from the PDF (a band drawing, band 10 pt, crosses 339.5 pt apart), the
bands' centre lines put with O at a twelve-sided cross and the square cell's
corners at the pointed crosses. The corners do not fit the grid a + b·√2/2:
every centre line lies on a grid of sixths of OA (worst error 0.0007 of OA):
  - the horizontal and vertical lines at ±1/6, ±1/2 and ±5/6;
  - the diagonals x ± y = ±2/3 and ±4/3.
The line from K2 to A crosses the vertical at M = (0, 1/2) and OK1 at
T = (1/3, 1/3); the circle with centre T through O crosses OK1 at
U = (2/3, 2/3). The horizontal through M then gives E = (1/6, 1/2) and
G = (5/6, 1/2). Pieces per cell (in 36ths of OA²): the cross at O (20), four
squares round it (4 each), the square at a corner (4) with four pentagons
round it (5 each), and six ten-sided pieces (14 each).

Usage: gen_tash_khauli_crosses.py <R241B-inner.json> tutorials/tash-khauli-crosses.json
       pnpm review tash-khauli-crosses
       gen_tash_khauli_crosses.py finish docs/review/tash-khauli-crosses/dump.json tutorials/tash-khauli-crosses.json
(R241B-inner.json: R241B-pieces.json without the pieces cut by the page's edge.)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

ORIGIN, PERIOD, BAND = (137.2, 191.8), 339.5, 10.0


def snap6(polys):
    """The drawing's corners are on a grid of sixths: round them there, so
    that common.snap finds them on the construction. The page cuts the cell
    on the left, so each piece is also turned and mirrored about O (the
    design has the symmetry of the square)."""
    out = []
    for Q in polys:
        Q = [(round(x * 6) / 6, round(y * 6) / 6) for x, y in Q]
        for sx in (1, -1):
            for sy in (1, -1):
                out.append([(sx * x, sy * y) for x, y in Q])
                out.append([(sy * y, sx * x) for x, y in Q])
    return out


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a straight line through K2 and A. It crosses the vertical line at M. '
         'It crosses the line from O to K1 at T. Draw a horizontal line through M. '
         'Draw a line through T at 90° to the line from O to K1.', 'ruler', ['K2', 'A', 'M', 'T'])
    g.line_through('ka', 'K2', 'A')
    g.meet('M', 'ka', 'v', (0, 0.5))
    g.meet('T', 'ka', 'd45', (1 / 3, 1 / 3))
    g.line_par('mh', 'M', 'h')
    g.line_perp('td', 'T', 'd45')

    step('Draw a circle with centre T through O. It crosses the line from O to K1 at U. '
         'Draw a line through U at 90° to the line from O to K1.', 'compass', ['T', 'U'])
    g.circle_through('ct', 'T', 'O')
    g.meet('U', 'ct', 'd45', (2 / 3, 2 / 3))
    g.line_perp('ud', 'U', 'd45')

    step('The horizontal line through M crosses the line through T at E. '
         'It crosses the line through U at G. Draw a vertical line through each of E and G.', 'ruler', ['E', 'G'])
    g.meet('E', 'mh', 'td', (1 / 6, 0.5))
    g.meet('G', 'mh', 'ud', (5 / 6, 0.5))
    g.line_par('ev', 'E', 'v')
    g.line_par('gv', 'G', 'v')

    step('Turn the five lines of the last three steps round O by 90°, three times.')
    g.repeat('rp', ['mh', 'td', 'ud', 'ev', 'gv'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(snap6(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)))
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'tash-khauli-crosses',
        'title': 'Crosses of the Tash-Khauli palace, Khiva',
        'short': 'Tash-Khauli crosses', 'subtitle': 'Tash-Khauli palace, Khiva', 'fold': 4,
        'style': 'Central Asian', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s R241B drawing, the centre lines of its bands '
                    'snapped to exact values: every line lies on a grid of sixths of OA. We devised the construction: '
                    'the line from K2 to A marks a half and a third, and the rest follows from them. The drawing gives '
                    'no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws the '
                       'lines as bands; the tutorial draws their centre lines. No photo of the palace was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data185/R241B: Khiva majolica, Palace of Tash-Khauli', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data185/R241B.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Lazar Rempel, Arkhitekturnyi ornament '
                     'Uzbekistana (Tashkent, 1961), figure 241, item 2, page 474 (majolica of the Tash-Khauli palace, '
                     'Khiva), and lists photos of the same design at the Pahlavan Mahmud necropolis in Khiva. The '
                     'construction is ours.'}],
        'given': {'O': 'The centre of a cross.', 'A': 'Halfway from O to the next cross of the same kind.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the cross at O and the lines round it. They close the squares, the ten-sided pieces, and '
                        'the pentagons round each corner of the cell.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A cross sits at every centre, and a square '
                            'with four pentagons round it at every corner.',
                    'palette': 'Timurid tile', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(12, 0.556): ('cross', 'a'), (10, 0.389): ('ten', 'ground'), (4, 0.111): ('square', 'b'),
         (5, 0.139): ('pentagon', 'c')}

if __name__ == '__main__':
    cm.run(main, NAMES)
