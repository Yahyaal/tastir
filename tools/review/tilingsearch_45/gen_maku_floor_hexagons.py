#!/usr/bin/env python3
"""Builds the Maku "armband" floor tiling, drawn by Brian Wichmann in Tiling
Search (data199/SHAF27, after Javad Shafai): small squares on a square grid,
a long hexagon between each two squares, and a large sixteen-sided piece in
every gap.

Read from the PDF (tiles edge to edge, no bands). With O at the centre of a
sixteen-sided piece and A at the middle of the next long hexagon
(OA = 60.35 pt), the squares sit at the corners (±1, ±1) and every corner
snaps to the grid a + b·√2/2 (worst error 0.0009 of OA). The lines are
  x = ±√2/2, y = ±√2/2: through P, where the line OK1 crosses the circle;
  x ± y = ±(1 + √2/2): the sides of the squares, through M (1, √2/2) and
  N (√2/2, 1);
  x ± y = ±(1 − √2/2): through M at 90° to MN.
Areas (OA = 1): sixteen-sided piece 2.515, long hexagon 0.657, square
(2 − √2)²/2 = 0.172; 2.515 + 2 × 0.657 + 0.172 = 4.

Usage: gen_maku_floor_hexagons.py <SHAF27-pieces.json> tutorials/maku-floor-hexagons.json
       pnpm review maku-floor-hexagons
       gen_maku_floor_hexagons.py finish docs/review/maku-floor-hexagons/dump.json tutorials/maku-floor-hexagons.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
ORIGIN, PERIOD, BAND = (294.65, 375.05), 120.7, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The line through O and K1 crosses the circle at P. Draw a horizontal line through P. '
         'Turn it round O by 90°, three times. The four lines make a square round O.', 'ruler', ['P'])
    g.meet('P', 'c', 'd45', (H, H))
    g.line_par('ph', 'P', 'h')
    g.repeat('sq', ['ph'], 'rot4')

    step('The horizontal line through P crosses the vertical line through A at M. '
         'The vertical line through P crosses the horizontal line through C at N. '
         'Draw a straight line through M and N. Draw a line through M at 90° to line MN.',
         'ruler', ['M', 'N'])
    g.meet('M', 'ph', 'gx', (1, H))
    g.meet('N', 'ph@3', 'gy', (H, 1))
    g.line_through('mn', 'M', 'N')
    g.line_perp('mp', 'M', 'mn')

    step('Turn the two new lines through M round O by 90°, three times.', 'ruler', ['M'])
    g.repeat('dg', ['mn', 'mp'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND))
    paths = cm.along_ink(segs)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'maku-floor-hexagons',
        'title': 'Squares and long hexagons of a floor in Maku',
        'short': 'Maku floor hexagons', 'subtitle': 'Floor tiling, Maku, Iran', 'fold': 4,
        'style': 'Persian', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s SHAF27 drawing, its corners snapped to exact '
                    'values. We devised the construction. Every corner comes from the point where the 45° line '
                    'crosses the circle through A. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'floor was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data199/SHAF27: Maku ‘armband’ floor tiling', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data199/SHAF27.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Javad Shafai, On decoration in Persian '
                     'architecture and wood carving (Tehran, 1977), page 253: a floor tiling in Maku, Iran. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of a large sixteen-sided tile.', 'A': 'The middle of the next long hexagon.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the small squares at the corners, the long '
                        'hexagons between them and the large tile round O.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square tile side by side. A small square sits at every corner, with '
                            'a long hexagon on each side of it.',
                    'palette': 'Timurid tile', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 2.515): ('large', 'ground'), (6, 0.657): ('hexagon', 'a'), (4, 0.172): ('square', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)
