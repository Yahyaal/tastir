#!/usr/bin/env python3
"""Builds the tile panel of the Mirador de Lindaraja (Alhambra) drawn by Brian
Wichmann in Tiling Search (data15/CM045, 129 pieces): a white eight-pointed star
at O, a smaller white sixteen-sided piece at each corner, blue and black
eight-sided pieces, white ten-sided pieces and small ochre squares.

Read from the PDF (plain tiles edge to edge). With O at a large star and A at
the ochre square on the middle of the cell's side (OA = 170.71 pt, an edge of
the star e = 25 pt = OA/(4 + 2√2)), every corner lies on eight sets of lines:
the axis lines at ±1/4 and ±3/4 of OA, and the diagonals at 1/4, (√2 − 1)/4,
(1 + √2)/4 and (3√2 − 1)/4 from O. Each diagonal after the first runs through a crossing of earlier lines.

Areas in e²: star 8 + 4√2 (one), corner piece 4 + 4√2 (one), blue 6 + 4√2 (four),
black 5 + 4√2 (four), ten-sided 9 + 6√2 (four), square 2 (two). Together
140 + 96√2 = 4(4 + 2√2)², the cell.

Usage: gen_alhambra_lindaraja_mirador_stars.py <CM045-pieces.json> tutorials/alhambra-lindaraja-mirador-stars.json
       pnpm review alhambra-lindaraja-mirador-stars
       gen_alhambra_lindaraja_mirador_stars.py finish docs/review/alhambra-lindaraja-mirador-stars/dump.json tutorials/alhambra-lindaraja-mirador-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

ORIGIN, PERIOD = (300.33, 373.82), 341.42
R2 = math.sqrt(2)


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a line through each of A, B, C and D at 90° to its line from O. '
        'These four lines cross at K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a line through each of A, B and C at 90° to its line from O. '
        'These lines cross at K1 and K2. Draw a straight line through O and K1.')

    step('Draw a circle with centre A through O. It crosses the first circle at G and H. '
         'Draw a straight line through G and H. It crosses line OA at M.', 'compass')
    cm.g.circle_through('cA', 'A', 'O')
    g.meet('G', 'c', 'cA', (0.5, math.sqrt(3) / 2))
    g.meet('H', 'c', 'cA', (0.5, -math.sqrt(3) / 2))
    g.line_through('mid', 'G', 'H')
    g.meet('M', 'mid', 'h', (0.5, 0))

    step('Draw a circle with centre O through M. Draw a circle with centre M through O. They cross at R and S. '
         'Draw a straight line through R and S. It crosses line OA at E.', 'compass')
    g.circle_through('cOM', 'O', 'M')
    g.circle_through('cMO', 'M', 'O')
    g.meet('R', 'cOM', 'cMO', (0.25, math.sqrt(3) / 4))
    g.meet('S', 'cOM', 'cMO', (0.25, -math.sqrt(3) / 4))
    g.line_through('a1', 'R', 'S')
    g.meet('E', 'a1', 'h', (0.25, 0))

    step('Draw a circle with centre M through E. It crosses line OA again at F. '
         'Draw a vertical line through F. Turn this line and line RS round O by 90°, three times.', 'compass')
    g.circle_through('cME', 'M', 'E')
    g.meet('F', 'cME', 'h', (0.75, 0))
    g.line_perp('a3', 'F', 'h')
    g.repeat('ar', ['a1', 'a3'], 'rot4')

    step('Draw a circle with centre O through E. It crosses the line through O and K1 at T. '
         'Draw a line through T at 90° to the line through O and K1. Turn it round O by 90°, three times.', 'compass')
    g.circle_through('cOE', 'O', 'E')
    g.meet('T', 'cOE', 'd45', (0.25 / R2, 0.25 / R2))
    g.line_perp('d1', 'T', 'd45')
    g.repeat('d1r', ['d1'], 'rot4')

    step('Line RS crosses the line through T at P. Draw a line through P parallel to the line through O and K1. '
         'Turn it round O by 90°, three times.')
    g.meet('P', 'a1', 'd1', (0.25, (R2 - 1) / 4))
    g.line_par('d2', 'P', 'd45')
    g.repeat('d2r', ['d2'], 'rot4')

    step('Line RS crosses the line through T, turned by 90°, at Q. Draw a line through Q at 90° to the line through O and K1. '
         'Turn it round O by 90°, three times.')
    g.meet('Q', 'a1', 'd1@1', (0.25, (1 + R2) / 4))
    g.line_perp('d3', 'Q', 'd45')
    g.repeat('d3r', ['d3'], 'rot4')

    step('The vertical line through A crosses the line through Q, turned by 270°, at U. '
         'Draw a line through U at 90° to the line through O and K1. Turn it round O by 90°, three times.')
    g.meet('U', 'gx', 'd3@3', (1, (2 - R2) / 4))
    g.line_perp('d4', 'U', 'd45')
    g.repeat('d4r', ['d4'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, 0.0))
    paths = cm.along_ink(segs)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-lindaraja-mirador-stars',
        'title': 'Stars and crosses of the Mirador de Lindaraja (Alhambra)',
        'short': 'Mirador de Lindaraja stars', 'subtitle': 'Mirador de Lindaraja, Alhambra',
        'fold': 4, 'star': 8, 'style': 'Nasrid', 'region': 'Alhambra and Nasrid Spain', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s CM045 drawing, its corners snapped to exact '
                    'values. The drawing gives no steps; we devised the construction.',
            'changes': 'The compass steps, their order and the named points are ours. No photograph confirms this '
                       'design: the Wade photograph Wichmann links, SPA 1813, shows mixed panels, so we built it from '
                       'his drawing alone. The colours follow the drawing.',
            'reviewed': '2026-11-01'},
        'credits': [
            {'source': 'Tiling Search, data15/CM045: Mirador de Lindaraja, Alhambra', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data15/CM045.html', 'kind': 'drawing',
             'note': 'Read from his finished drawing, not construction instructions. His references are David Wade’s '
                     'photograph SPA 1813 and page 45 of Cahier and Martin, 376 Decorative Allover Patterns. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of a large eight-pointed star.', 'A': 'The centre of the small square on the side of the tile.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the star at O and the white piece at each corner. '
                        'They also make the blue and black pieces, the ten-sided pieces and the small squares.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square tile side by side. A white star sits at the centre of every tile. '
                            'A small square sits at the middle of every side.',
                    'palette': 'Alhambra', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.293): ('star', 'ground'), (16, 0.207): ('corner_piece', 'ground'),
         (10, 0.375): ('ten_sided', 'ground'), (8, 0.25): ('blue_piece', 'd'),
         (8, 0.229): ('black_piece', 'a'), (4, 0.043): ('square', 'c')}

if __name__ == '__main__':
    cm.run(main, NAMES)
