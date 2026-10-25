#!/usr/bin/env python3
"""Builds the ceiling fret of the Mexuar porch (Alhambra), drawn by Brian
Wichmann in Tiling Search (data184/AL2): T-shaped frets and long bars in a
pinwheel round a small eight-pointed star at O, with a cross at each corner of
the cell, the bands woven over and under.

Read from the PDF's centre lines (band 5 pt, period 318.7 pt), every line is
horizontal or vertical at y = 2k/3 ± √2/6, or diagonal at y ∓ x = (2k + 1)/3
(drawing: 0.2353, 0.4307, 0.9020 against 0.2357, 0.4310, 0.9024). The thirds
come as in the Sala de los Reyes fret (line K4C crosses OK1 at a third); √2/6
is the distance from O, and from (0, 2/3), to the diagonal y = x + 1/3, so it
is a circle touching that diagonal. Chiral: it turns by quarter turns only.

Units: OA = 1, A halfway to the next star; the tile is the square cell.

Usage: gen_mexuar_porch_fret.py <AL2-pieces.json> tutorials/alhambra-mexuar-porch-fret.json
       pnpm review alhambra-mexuar-porch-fret
       gen_mexuar_porch_fret.py finish docs/review/alhambra-mexuar-porch-fret/dump.json tutorials/alhambra-mexuar-porch-fret.json
(AL2-pieces.json from 0_vectors.py and 1_pieces.py in tools/review/alhambra_wichmann/.)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

R2 = 2 ** 0.5


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.')

    step('Draw a straight line through K4 and C. It crosses the line from O to K1 at T, a third of the way to K1. '
         'Draw a horizontal line through T. It crosses the vertical line at E.', 'ruler', ['K4', 'C'])
    g.line_through('kp', 'K4', 'C')
    g.meet('T', 'kp', 'd45', (1 / 3, 1 / 3))
    g.line_par('th', 'T', 'h')
    g.meet('E', 'th', 'v', (0, 1 / 3))

    step('Draw a line through E parallel to the line from O to K1. Draw a straight line through B and C. '
         'Draw a circle with centre C through E. It crosses the top side of the cell at F, on the left. '
         'Draw a line through F parallel to the line from O to K1.', 'compass', ['E'])
    g.line_par('e45', 'E', 'd45')
    g.line_through('bc', 'B', 'C')
    g.circle_through('cc', 'C', 'E')
    g.meet('F', 'cc', 'gy', (-2 / 3, 1))
    g.line_par('f45', 'F', 'd45')

    step('Draw a circle with centre O that touches the line through E. It crosses the vertical line at G, above O. '
         'Draw a circle with centre E through O. It crosses the vertical line again at J. '
         'Draw a circle with centre J that touches the line through E. It crosses the vertical line at L and M.',
         'compass', ['e45'])
    cm.circle_tangent('co', 'O', 'e45')
    g.meet('G', 'co', 'v', (0, R2 / 6))
    g.circle_through('ce', 'E', 'O')
    g.meet('J', 'ce', 'v', (0, 2 / 3))
    cm.circle_tangent('cj', 'J', 'e45')
    g.meet('L', 'cj', 'v', (0, 2 / 3 + R2 / 6))
    g.meet('M', 'cj', 'v', (0, 2 / 3 - R2 / 6))

    step('Draw a horizontal line through each of G, L and M. These are the lines of the bands.')
    g.line_par('yg', 'G', 'h')
    g.line_par('yl', 'L', 'h')
    g.line_par('ym', 'M', 'h')

    step('Turn the lines of the last three steps round O by 90°, three times.')
    g.repeat('cp', ['e45', 'bc', 'f45', 'yg', 'yl', 'ym'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    polys = cm.frame_pieces(pieces, (297.5, 374.5), 318.7, 5.0)
    segs = cm.network(polys)
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-mexuar-porch-fret', 'title': 'Ceiling fret of the Mexuar porch (Alhambra)',
        'short': 'Mexuar porch fret', 'subtitle': 'Mexuar porch, Alhambra', 'fold': 4, 'chiral': True,
        'style': 'Nasrid', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s AL2 drawing. We devised the construction: '
                    'the bands lie on thirds of the grid unit and on lines a circle’s radius away from them. '
                    'The drawing gives no steps.',
            'changes': 'The compass operations, step order and named crossings are our reconstruction. '
                       'The comparison with the drawing checks the finished lines, not the historical steps. '
                       'No photo of the real ceiling was available to check it.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data184/AL2: Alhambra, Mexuar/Arrayanes corridor', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data184/AL2.html',
             'note': 'The design was read from his drawing of the largest of three small ceiling panels in the porch '
                     'between the Mexuar Patio and the corridor to the Patio de los Arrayanes, made from a photo by '
                     'Nick Crossling. The construction is ours.',
             'kind': 'drawing'}],
        'given': {'O': 'The centre of a small eight-pointed star.', 'A': 'Halfway from O to the next star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the bands. They make the star at O and the T-shaped frets and long bars round it. '
                        'They make a cross at each corner of the cell.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Put copies of the square cell side by side. The frets and bars turn '
                                            'round each star like a pinwheel. The bands weave over and under.',
                    'palette': 'Alhambra', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(22, 0.594): ('bar', 'ground'), (16, 0.26): ('star', 'ground'), (16, 0.184): ('cross', 'c'),
         (11, 0.148): ('fret', 'c')}

if __name__ == '__main__':
    cm.run(main, NAMES)
