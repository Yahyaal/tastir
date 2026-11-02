#!/usr/bin/env python3
"""Builds the eight-fold rosettes that Brian Wichmann draws in Tiling Search
(data10/P042, Bourgoin's plate 42), the plain form of the Mirador de Lindaraja
panels: an eight-pointed star at each grid point, ringed by eight six-sided
petals, with white kites and four-pointed white stars between.

Inside the tile every edge lies on a side of the star's two squares, carried on
to the tile's edge. The squares are turned 22.5° from the grid; their points lie
on the verticals and horizontals halfway between neighbouring stars. Wichmann draws the grid turned by 45°; the
tutorial turns it back so neighbours sit along the axes.

Units: OA = 1, A halfway to the next star; the tile is the square cell.
Areas with a star's edge e (OA = 111.51 pt, e = 25 pt): star 8 + 4√2, petal
5 + 4√2 (four), four-pointed star 4, kite 1 + √2 (eight); in OA² that is
0.6866 + 4 × 0.5358 + 0.2011 + 8 × 0.1214 = 4, the cell.

Usage: gen_lindaraja_rosettes.py <P042-pieces.json> tutorials/alhambra-lindaraja-rosettes.json
       pnpm review alhambra-lindaraja-rosettes
       gen_lindaraja_rosettes.py finish docs/review/alhambra-lindaraja-rosettes/dump.json tutorials/alhambra-lindaraja-rosettes.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'tilingsearch_45'))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

ORIGIN, UNIT = (299.0, 374.7), 111.51
RT = 0.5 / math.cos(math.pi / 8)
R2 = math.sqrt(2)


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a line through each of A, B, C and D at 90° to its line from O. '
        'These four lines cross at K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a line through each of A, B and C at 90° to its line from O. '
        'These lines cross at K1 and K2. Draw a straight line through O and K1.')

    step('The first circle crosses the line through O and K1 at E. '
         'Draw the line through O that halves the angle AOE. Draw the line through O that halves the angle EOC. '
         'Draw a line through O at 90° to each of these two lines.')
    g.meet('E', 'c', 'd45', (R2 / 2, R2 / 2))
    g.line_bisect('r22', 'A', 'O', 'E')
    g.line_bisect('r67', 'E', 'O', 'C')
    g.line_perp('r112', 'O', 'r22')
    g.line_perp('r157', 'O', 'r67')

    step('Draw a circle with centre A through O. It crosses the first circle at G and H. '
         'Draw a straight line through G and H. It crosses the line that halves the angle AOE at T. '
         'Draw a circle with centre O through T.', 'compass')
    g.circle_through('cA', 'A', 'O')
    g.meet('G', 'c', 'cA', (0.5, math.sqrt(3) / 2))
    g.meet('H', 'c', 'cA', (0.5, -math.sqrt(3) / 2))
    g.line_through('mid', 'G', 'H')
    g.meet('T', 'mid', 'r22', (0.5, 0.5 * math.tan(math.pi / 8)))
    g.circle_through('ct', 'O', 'T')

    step('The circle through T crosses the four lines through O at eight points. '
         'Starting at T and going left round the circle, name them S1, S2, S3, S4, S5, S6, S7 and S8. '
         'Draw a straight line through S1 and S3, S2 and S4, S3 and S5, and S4 and S6. '
         'Draw a straight line through S5 and S7, S6 and S8, S7 and S1, and S8 and S2.', highlight=['ct'])
    ray = {22: 'r22', 67: 'r67', 112: 'r112', 157: 'r157'}
    pts = []
    for k in range(8):
        a = 22.5 + 45 * k
        g.meet(f'S{k + 1}', 'ct', ray[int(a % 180)], (RT * math.cos(math.radians(a)), RT * math.sin(math.radians(a))))
        pts.append(f'S{k + 1}')
    sides = []
    for k in range(8):
        g.line_through(f's{k}', pts[k], pts[(k + 2) % 8])
        sides.append(f's{k}')


def turned(pieces):
    """The drawing's pieces in the tutorial's frame, turned by 45°."""
    c = math.sqrt(0.5)
    out = []
    for Q in cm.frame_pieces(pieces, ORIGIN, 2 * UNIT, 0.0):
        out.append([(x * c - y * c, x * c + y * c) for x, y in Q])
    return out


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(turned(pieces))
    paths = cm.along_ink(segs)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used][:30])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-lindaraja-rosettes',
        'title': 'Eight-fold rosettes of the Mirador de Lindaraja (Alhambra)',
        'short': 'Mirador de Lindaraja rosettes', 'subtitle': 'Mirador de Lindaraja, Alhambra',
        'fold': 4, 'star': 8, 'style': 'Nasrid', 'region': 'Alhambra and Nasrid Spain', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P042 drawing of Bourgoin’s plate 42, its corners '
                    'snapped to exact values. The drawing gives no steps; we devised the construction. '
                    'The star is two squares, and their sides, carried on to the edge of the tile, make every line.',
            'changes': 'The compass steps, their order and the named points are ours. No photograph confirms this '
                       'design: Wade’s photograph SPA 1009 shows a different panel of the Mirador de Lindaraja, with '
                       'flower insets and five-sided petals. This is the plain form Wichmann draws, not that panel.',
            'reviewed': '2026-11-01'},
        'credits': [
            {'source': 'Tiling Search, data10/P042: Bourgoin, Plate 42', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data10/P042.html', 'kind': 'drawing',
             'note': 'Read from his finished drawing, not construction instructions. He links plate 42 of Jules Bourgoin '
                     'to the Mirador de Lindaraja and the Sala de los Reyes, which elaborate it. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Halfway from O to the next star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the star at O and the petals round it. '
                        'They also make the kites and the white stars between four rosettes.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square tile side by side. A rosette of eight petals sits at every grid point. '
                            'A white star sits between four rosettes.',
                    'palette': 'Alhambra', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.686): ('star', 'c'), (6, 0.536): ('petal', 'd'), (8, 0.201): ('white_star', 'ground'),
         (4, 0.121): ('kite', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
