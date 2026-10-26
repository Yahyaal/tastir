#!/usr/bin/env python3
"""Builds the stars of the Merinid madrasa of Salé, drawn by Brian Wichmann in
Tiling Search (data152/C129A) from Jean-Marc Castéra's Arabesques, page 129.

Read from the PDF (period 349.7 pt). The pieces are drawn edge to edge, so
they are the tiles: no offset. Every corner snaps to the grid a + b·√2/2 in
units of half the period (worst error 0.0005 of OA). With t = (2 − √2)/4 every
line is one of:
  - x, y = ±t and ±(1 − t), through P (as in gen_nishapur_madrasa_stars.py:
    the line from K1 through E crosses line AC at P);
  - x ± y = ±t√2, through S (the star at O), and x ± y = ±(1 + t√2), through
    T, both from the Nishapur steps;
  - x − y = 1 − t√2 through U, where the circle with centre A and radius t√2
    meets the horizontal line, and x − y = 2 − t√2 through W, where the line
    through S meets the vertical through A; both turned round O;
  - x, y = ±(1 − 3t), through Q, where the circle with centre O through U
    meets line OK1.
The opening steps (P, S, T) are those of the Nishapur madrasa stars; the
lines are a subset of the Alcázar mosaic's (gen_alcazar_mosaic_stars.py), but
the ink and the pieces differ, so this is its own design.

Units: OA = 1, A halfway to the next large star on the horizontal line; the
tile is the square cell.

Usage: gen_sale_madrasa_stars.py <C129A-pieces.json> tutorials/sale-madrasa-stars.json
       pnpm review sale-madrasa-stars
       gen_sale_madrasa_stars.py finish docs/review/sale-madrasa-stars/dump.json tutorials/sale-madrasa-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
HH = (2 - math.sqrt(2)) / 4
S1 = HH * math.sqrt(2)
ORIGIN, PERIOD, BAND = (299.2, 375.1), 349.7, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a straight line through O and K2. It crosses the circle at E. '
         'Draw a straight line through K1 and E. Draw a straight line through A and C. '
         'It crosses the line through K1 and E at P.', 'ruler', ['K2', 'E', 'P'])
    g.line_through('d135', 'O', 'K2')
    g.meet('E', 'c', 'd135', (-H, H))
    g.line_through('ke', 'K1', 'E')
    g.line_through('ac', 'A', 'C')
    g.meet('P', 'ac', 'ke', (HH, 1 - HH))

    step('Draw a vertical line through P. Draw a horizontal line through P. '
         'Turn the two lines round O by 90°, three times.', 'ruler', ['P'])
    g.line_par('pv', 'P', 'v')
    g.line_par('ph', 'P', 'h')
    g.repeat('pp', ['pv', 'ph'], 'rot4')

    step('The vertical line through P crosses the line from O to K1 at G. '
         'Draw a circle with centre O through G. It crosses the horizontal line at S. '
         'Draw a line through S parallel to line AC. Turn it round O by 90°, three times. '
         'The lines make the star at O.', 'compass', ['G', 'S'])
    g.meet('G', 'pv', 'd45', (HH, HH))
    g.circle_through('cg', 'O', 'G')
    g.meet('S', 'cg', 'h', (S1, 0))
    g.line_par('sd', 'S', 'ac')
    g.repeat('sdp', ['sd'], 'rot4')

    step('Draw a circle with centre A and the same radius as the circle through G. '
         'It crosses the vertical line through A at T, above A. '
         'Draw a line through T parallel to line AC. Turn it round O by 90°, three times.', 'compass', ['A', 'T'])
    cm.circle_radius_of('ca', 'A', 'cg')
    g.meet('T', 'ca', 'gx', (1, S1))
    g.line_par('td', 'T', 'ac')
    g.repeat('tdp', ['td'], 'rot4')

    step('The circle with centre A crosses the horizontal line at U, to the left of A. '
         'The line through S crosses the vertical line through A at W, below A. '
         'Draw a line through each of U and W parallel to the line from O to K1. '
         'Turn the two lines round O by 90°, three times.', 'ruler', ['U', 'W'])
    g.meet('U', 'ca', 'h', (1 - S1, 0))
    g.meet('W', 'sd', 'gx', (1, S1 - 1))
    g.line_par('ud', 'U', 'd45')
    g.line_par('wd', 'W', 'd45')
    g.repeat('uwp', ['ud', 'wd'], 'rot4')

    step('Draw a circle with centre O through U. It crosses the line from O to K1 at Q. '
         'Draw a vertical line and a horizontal line through Q. '
         'Turn the two lines round O by 90°, three times.', 'compass', ['U', 'Q'])
    g.circle_through('cu', 'O', 'U')
    g.meet('Q', 'cu', 'd45', ((1 - S1) * H, (1 - S1) * H))
    g.line_par('qv', 'Q', 'v')
    g.line_par('qh', 'Q', 'h')
    g.repeat('qp', ['qv', 'qh'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    polys = cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)
    if os.environ.get("REPORT"):
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
        'format': 0, 'id': 'sale-madrasa-stars',
        'title': 'Stars of the Merinid madrasa, Salé',
        'short': 'Salé madrasa stars', 'subtitle': 'Merinid madrasa, Salé', 'fold': 4, 'star': 8,
        'style': 'Marinid', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s C129A drawing, its corners snapped to '
                    'exact values. We devised the construction: one line from K1 through E fixes P, and every line '
                    'is drawn through P, S, T, U, W or Q. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Castéra’s '
                       'picture is uncoloured; the colours are ours. No photo of the madrasa was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data152/C129A: Merinid Madrasah, Sale', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data152/C129A.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Jean-Marc Castéra, Arabesques: '
                     'Decorative Art in Morocco (ACR Édition, Paris, 1999), page 129, top (Merinid madrasa, Salé, '
                     'uncoloured in the book). The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the small star at each corner. '
                        'Then ink the octagons and hexagons round them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and a small '
                            'star at every corner.',
                    'palette': 'Marinid zellige', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.243): ('star', 'b'), (16, 0.101): ('small_star', 'b'), (6, 0.129): ('hexagon', 'ground'),
         (8, 0.139): ('octagon', 'a'), (12, 0.164): ('twelve', 'c'), (12, 0.172): ('long', 'd')}

if __name__ == '__main__':
    cm.run(main, NAMES)
