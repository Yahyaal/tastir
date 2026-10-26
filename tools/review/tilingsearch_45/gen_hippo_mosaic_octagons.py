#!/usr/bin/env python3
"""Builds the braided octagons of a Roman mosaic from Hippo Regius
(Hippone, Annaba), drawn by Brian Wichmann in Tiling Search (data192/ROMAN11,
after Balmelle, plate 413 b).

A band drawing (bevelled bands 18.0 pt wide). Its coloured pieces moved out
by half a band give the centre lines: octagons at O and at the corners of the
cell, and four bands crossing at each of A, B, C and D, at 22.5°, 67.5°,
112.5° and 157.5°. Two of the bands through each crossing are sides of the
octagon at O. Every corner lies within 0.002 of OA of a crossing of these
lines (OA = 141.9 pt).

Usage: gen_hippo_mosaic_octagons.py <ROMAN11-col.json> tutorials/hippo-mosaic-octagons.json
       (ROMAN11-col.json: the green and blue pieces of ROMAN11-pieces.json)
       pnpm review hippo-mosaic-octagons
       gen_hippo_mosaic_octagons.py finish docs/review/hippo-mosaic-octagons/dump.json tutorials/hippo-mosaic-octagons.json
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

ORIGIN, PERIOD, BAND = (161.5, 223.1), 283.8, 18.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4.')

    step('Draw the lines through A that halve the angles OAC and OAD. '
         'Draw the line through A at 90° to each of them.', 'ruler', ['O', 'A', 'C', 'D'])
    g.line_bisect('a1', 'O', 'A', 'C')
    g.line_bisect('a2', 'O', 'A', 'D')
    g.line_perp('a3', 'A', 'a1')
    g.line_perp('a4', 'A', 'a2')

    step('Turn the four lines through A round O by 90°, three times. '
         'They pass through C, B and D, and make an octagon round O.', 'ruler', ['a1', 'a2', 'a3', 'a4'])
    g.repeat('cp', ['a1', 'a2', 'a3', 'a4'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND))
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'hippo-mosaic-octagons',
        'title': 'Braided octagons of a Roman mosaic (Hippo Regius)',
        'short': 'Hippo mosaic octagons', 'subtitle': 'Roman mosaic, Hippone (Annaba)', 'fold': 4, 'star': 8,
        'style': 'Roman', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s ROMAN11 drawing, the centre lines of its '
                    'bands snapped to exact values. We devised the construction: four lines cross at each of A, '
                    'B, C and D, halving the angles there. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws '
                       'the lines as bevelled bands, and the floor has thick braids; the tutorial draws their centre '
                       'lines. No photo of the floor was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data192/ROMAN11: Roman mosaic, Hippone-Annaba', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data192/ROMAN11.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, after Catherine Balmelle et al., Le décor géométrique '
                     'de la mosaïque romaine (Picard, 2002), plate 413 b, a floor at Hippone (Annaba). '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of an octagon.',
                  'A': 'The point where four bands cross, halfway from O to the next octagon on its side.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the octagon at O and the four bands through each of A, B, C and D. '
                        'They close the darts and kites between the octagons.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. The bands run on from cell to cell and '
                            'weave over and under.',
                    'palette': 'Alhambra', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(8, 0.485): ('octagon', 'b'), (4, 0.414): ('kite', 'a'), (4, 0.172): ('dart', 'a')}

if __name__ == '__main__':
    cm.run(main, NAMES)
