#!/usr/bin/env python3
"""Builds the four-pointed stars and rhombi of a Roman mosaic in Pompeii,
drawn by Brian Wichmann in Tiling Search (data155/F34, after El-Said, figure
34, and Balmelle, plate 184).

The drawing is plain tiles: four-pointed stars, white and orange by turns,
and 45° rhombi that meet eight at a time where the stars' points touch. O is
such a meeting point and A the centre of a star; the stars' points reach O
and the cell's corners. Every edge lies on one of the four lines through O at
22.5°, 67.5°, 112.5° and 157.5°, or on one of their parallels through a
corner of the cell (drawing: OA = 91.45 pt, corners within 0.001 of OA).

Usage: gen_pompeii_stars_and_rhombi.py <F34-pieces.json> tutorials/pompeii-stars-and-rhombi.json
       pnpm review pompeii-stars-and-rhombi
       gen_pompeii_stars_and_rhombi.py finish docs/review/pompeii-stars-and-rhombi/dump.json tutorials/pompeii-stars-and-rhombi.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
ORIGIN, PERIOD = (206.0, 201.1), 182.9


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4.')
    step('Draw a straight line through O and K2. The circle crosses it at G, and the line through O and K1 at F. '
         'Draw the lines through O that halve the angles AOF, FOC, COG and GOB.', 'ruler',
         ['A', 'K1', 'C', 'K2'])
    g.line_through('d135', 'O', 'K2')
    g.meet('G', 'c', 'd135', (-H, H))
    g.meet('F', 'c', 'd45', (H, H))
    g.line_bisect('b1', 'A', 'O', 'F')
    g.line_bisect('b2', 'F', 'O', 'C')
    g.line_bisect('b3', 'C', 'O', 'G')
    g.line_bisect('b4', 'G', 'O', 'B')

    step('Draw a line through K1 parallel to the line that halves the angle AOF. '
         'Draw a line through K1 parallel to the line that halves the angle FOC.', 'ruler', ['K1', 'b1', 'b2'])
    g.line_par('k1a', 'K1', 'b1')
    g.line_par('k1b', 'K1', 'b2')

    step('Turn the two lines through K1 round O by 90°, three times. '
         'They pass through K2, K3 and K4.', 'ruler', ['k1a', 'k1b'])
    g.repeat('cp', ['k1a', 'k1b'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, 0))
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'pompeii-stars-and-rhombi',
        'title': 'Stars and rhombi of a Roman mosaic (Pompeii)',
        'short': 'Pompeii stars and rhombi', 'subtitle': 'Roman mosaic, Pompeii', 'fold': 4, 'star': 8,
        'style': 'Roman', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s F34 drawing, its corners snapped to exact '
                    'values. We devised the construction: every line halves an angle of 45° at O or at a corner of '
                    'the cell. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'mosaic was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data155/F34: Roman mosaic, Pompei', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data155/F34.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, after Issam El-Said, Islamic Art and Architecture: The '
                     'System of Geometric Design (Garnet, 1993), page 43, figure 34, and Catherine Balmelle et '
                     'al., Le décor géométrique de la mosaïque romaine (Picard, 2002), plate 184 (Pompeii and '
                     'El Jem). The construction is ours.'}],
        'given': {'O': 'The point where eight rhombi touch.',
                  'A': 'The centre of a four-pointed star with a point at O.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines through O and through the corners, as far as they cross. '
                        'They make the eight rhombi round O and the four-pointed stars at A, B, C and D.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. The stars touch point to point, and eight '
                            'rhombi fill the space round each meeting point.',
                    'palette': 'Alhambra', 'colors': {},
                    'placements': {'repeat': [1, 1], 'rules': [{'piece': 'star', 'nth': 0, 'color': 'b'}]}},
        'expect': {'pieceTypes': 2, 'pieces': [{'name': 'star', 'vertices': 8, 'area': 1.17157, 'perCell': 2},
                                               {'name': 'rhombus', 'vertices': 4, 'area': 0.41421, 'perCell': 4}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(8, 1.172): ('star', 'ground'), (4, 0.414): ('rhombus', 'a')}

if __name__ == '__main__':
    cm.run(main, NAMES)
