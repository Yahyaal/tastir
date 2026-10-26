#!/usr/bin/env python3
"""Builds the stars of the Mazar-e Sharif shrine (Afghanistan), drawn by Brian
Wichmann in Tiling Search (data187/IRAN7) from al-Naqsh's book of Iranian
tilework.

Read from the PDF (period 174.85 pt). The coloured pieces are drawn edge to
edge with the white bands stroked over them, so they are the tiles: no
offset. O is the centre of a cluster of four stars, with a small cross
between them; the large lobed piece sits on the cell corners. With OA half
the period, every corner snaps to the grid a + b·√2/2 (worst error 0.001).
Every edge is a side of one of the four stars: two squares inscribed in a
circle of radius √2 − 1 about P = (2 − √2, 0), so each star's point touches A
and meets the next cluster's star there. P comes from two circles: O through
K1 gives F = (√2, 0), A through F gives P.

Usage: gen_mazar_shrine_stars.py <IRAN7-pieces.json> tutorials/mazar-shrine-stars.json
       pnpm review mazar-shrine-stars
       gen_mazar_shrine_stars.py finish docs/review/mazar-shrine-stars/dump.json tutorials/mazar-shrine-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
R = math.sqrt(2) - 1
X = 2 - math.sqrt(2)
ORIGIN, PERIOD, BAND = (295.8, 197.85), 174.85, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a circle with centre O through K1. It crosses the horizontal line at F, to the right of A. '
         'Draw a circle with centre A through F. It crosses the horizontal line at P, to the left of A.',
         'compass', ['K1', 'F', 'P'])
    g.circle_through('ck', 'O', 'K1')
    g.meet('F', 'ck', 'h', (math.sqrt(2), 0))
    g.circle_through('ca', 'A', 'F')
    g.meet('P', 'ca', 'h', (X, 0))

    step('Draw a circle with centre P through A. Draw a vertical line through P. '
         'Draw a line through P parallel to the line from O to K1. Draw a line through P at 90° to the line from O to K1. '
         'The circle crosses the four lines through P at A and S1 to S7.', 'compass', ['P', 'A'])
    g.circle_through('cp', 'P', 'A')
    g.line_perp('pv', 'P', 'h')
    g.line_par('pd', 'P', 'd45')
    g.line_perp('pe', 'P', 'd45')
    for k in range(1, 8):
        a = k * math.pi / 4
        g.meet(f'S{k}', 'cp', ('h', 'pd', 'pv', 'pe')[k % 4], (X + R * math.cos(a), R * math.sin(a)))

    step('Join A, S2, S4 and S6 with straight lines. Join S1, S3, S5 and S7 with straight lines. '
         'The two squares make a star. Turn the star round O by 90°, three times.', 'ruler', ['A', 'S1'])
    sq = []
    for i, (p, q) in enumerate((('A', 'S2'), ('S2', 'S4'), ('S4', 'S6'), ('S6', 'A'),
                                ('S1', 'S3'), ('S3', 'S5'), ('S5', 'S7'), ('S7', 'S1'))):
        g.line_through(f'sq{i}', p, q)
        sq.append(f'sq{i}')
    g.repeat('sqr', sq, 'rot4')


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
        'format': 0, 'id': 'mazar-shrine-stars',
        'title': 'Stars of the Mazar-e Sharif shrine',
        'short': 'Mazar-e Sharif stars', 'subtitle': 'Shrine of Ali, Mazar-e Sharif', 'fold': 4, 'star': 8,
        'style': 'Timurid', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s IRAN7 drawing, its corners snapped to '
                    'exact values. We devised the construction: two circles fix P, the centre of a star whose '
                    'point touches A, and every line is a side of one of the four stars round O. '
                    'The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws '
                       'white bands over the lines; the tutorial draws the lines. No photo of the shrine was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data187/IRAN7: Afghanistan, Mazar-e Sharif Shrine', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data187/IRAN7.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Mahmood Maher al-Naqsh, Design and '
                     'Execution of Drawing in Iranian Tilework, Islamic Period (Reza Abbasi Museum, 1983), volume 2 '
                     'page 191 (Mazar-e Sharif shrine, Afghanistan). The construction is ours.'}],
        'given': {'O': 'The centre of a small cross between four eight-pointed stars.',
                  'A': 'Halfway from O to the next cross on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the four stars round O. Between them they close the small cross at O and the large '
                        'piece at each corner of the cell.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. Four stars sit round every cross, point '
                            'to point with the next four.',
                    'palette': 'Timurid tile', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(48, 2.108): ('ground', 'a'), (16, 0.402): ('star', 'b'), (16, 0.284): ('cross', 'c')}

if __name__ == '__main__':
    cm.run(main, NAMES)
