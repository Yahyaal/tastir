#!/usr/bin/env python3
"""Builds the stars and arrows of a Toledo tile (V&A 357-1876, 1500-25),
drawn by Brian Wichmann in Tiling Search (data184/RAY1).

Read from the PDF (plain tiles, period 349.6 pt), every corner snapped to the
grid a + b·√2/2 in units of half the period (worst error 0.0012 of OA). The
yellow stars sit at O and at the cell corners, but only the one at O has eight
arrows round it; the corner stars have four. (Read with the diagonal
neighbour as the next star, the drawing does not repeat: the two kinds of
star differ.) Every line is one of the lines of the other Toledo tile
(toledo-tile-interlace, RAY12), whose construction this one shares, or one of
four diagonals touching the circle through T round O: the Leones doors' star
at O, the diagonal sides of the same star at each corner, the diamond through
A, B, C and D, the square through R, and those four diagonals.

Units: OA = 1, A halfway to the next star on the horizontal line; the tile is the square cell.

Usage: gen_toledo_star_arrows.py <RAY1-pieces.json> tutorials/toledo-tile-stars.json
       pnpm review toledo-tile-stars
       gen_toledo_star_arrows.py finish docs/review/toledo-tile-stars/dump.json tutorials/toledo-tile-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
from gen_toledo_interlace import build as interlace  # noqa: E402

H = math.sqrt(2) / 2
ORIGIN, PERIOD = (297.5, 375.8), 349.6


def build():
    interlace()
    step('The vertical line through R crosses the horizontal line at T. Draw a circle with centre O through T. '
         'It crosses the line from O to K1 at U. Draw the line through U at 90° to the line from O to K1. '
         'Turn it round O by 90°, three times.', 'compass', ['R'])
    g.meet('T', 'rv', 'h', (3 - 3 * H, 0))
    g.circle_through('c3', 'O', 'T')
    g.meet('U', 'c3', 'd45', ((3 - 3 * H) * H, (3 - 3 * H) * H))
    g.line_perp('ud', 'U', 'd45')
    g.repeat('up', ['ud'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, 0))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'toledo-tile-stars',
        'title': 'Stars and arrows of a Toledo tile',
        'short': 'Toledo tile stars', 'subtitle': 'Toledo tile, V&A', 'fold': 4, 'star': 8,
        'style': 'Mudéjar', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s RAY1 drawing, its corners snapped to exact '
                    'values. We devised the construction, the same as for the other Toledo tile with four more '
                    'diagonals. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'tile was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data184/RAY1: Toledo tile, V&A', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data184/RAY1.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of a tile from Toledo, 1500-25 (Victoria and Albert Museum '
                     '357-1876). He lists the same design in the Bou Inania madrasa in Fez (David Wade, MOR 2816x). '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the lines that carry its sides on. They close eight arrows round the '
                        'star at O and four round the star at each corner. They also close the kites and the crosses.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and every corner. '
                            'Eight arrows point at each star at a centre, and four at each star at a corner.',
                    'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.402): ('star', 'a'), (16, 0.255): ('cross', 'ground'), (8, 0.201): ('arrow', 'b'),
         (4, 0.071): ('kite', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
