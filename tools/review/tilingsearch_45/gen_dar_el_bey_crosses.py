#!/usr/bin/env python3
"""Builds the crosses and stars of Dar el Bey, Tunis (J. Collin, plate 39),
drawn by Brian Wichmann in Tiling Search (data208/CL39).

Read from the PDF (period 412.1 pt, band 10 pt), every band centre line
snapped to the grid (a + b·√2/2)/2 in units of half the period (worst error
0.0005 of OA). O is the cross in the middle of a square frame; a small star
sits at each corner of the square cell. With H = √2/2 every line is one of:
  - the diamond through A, B, C and D (x ± y = ±1);
  - the square frame x, y = ±1/2, through F, where AC crosses OK1;
  - the corner stars, two squares on a circle of radius 1 − H about each
    corner: the diamond sides x ± y = ±(1 + H) and x ± y = ±(1 − H), through
    U = (1, H) on the cell side, carried on past O, where they make the
    cross's points; the square sides x, y = ±(3 − √2)/2, through R, where the
    circle with centre K1 through U crosses OK1;
  - the cross's arms x, y = ±(3 − 2√2)/2, through W, level with P, where the
    line through U parallel to OK1 crosses the vertical through F.

Units: OA = 1, A on the horizontal line halfway to the next cross; the tile
is the square cell.

Usage: gen_dar_el_bey_crosses.py <CL39-pieces.json> tutorials/dar-el-bey-crosses.json
       pnpm review dar-el-bey-crosses
       gen_dar_el_bey_crosses.py finish docs/review/dar-el-bey-crosses/dump.json tutorials/dar-el-bey-crosses.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
ORIGIN, PERIOD, BAND = (297.5, 375.03), 412.14, 10.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Join A, C, B and D with straight lines. Line AC crosses the line from O to K1 at F. '
         'Draw a vertical line through F. Turn it round O by 90°, three times. '
         'The four lines make a square frame round O.', 'ruler', ['F'])
    g.line_through('ac', 'A', 'C')
    g.repeat('acp', ['ac'], 'rot4')
    g.meet('F', 'ac', 'd45', (0.5, 0.5))
    g.line_par('fv', 'F', 'v')
    g.repeat('fvp', ['fv'], 'rot4')

    step('The circle crosses the line from O to K1 at E. Draw a horizontal line through E. '
         'It crosses the vertical line through A at U.', 'ruler', ['E', 'U'])
    g.meet('E', 'c', 'd45', (H, H))
    g.line_par('eh', 'E', 'h')
    g.meet('U', 'eh', 'gx', (1, H))

    step('Draw a line through U parallel to line AC. Draw a line through U parallel to the line from O to K1. '
         'Turn the two lines round O by 90°, three times.', 'ruler', ['U'])
    g.line_par('ua', 'U', 'ac')
    g.line_par('ud', 'U', 'd45')
    g.repeat('up', ['ua', 'ud'], 'rot4')

    step('Draw a circle with centre K1 through U. It crosses the line from O to K1 at R. '
         'Draw a vertical line through R. Turn it round O by 90°, three times. '
         'The lines make the stars at the corners.', 'compass', ['K1', 'U', 'R'])
    g.circle_through('ck', 'K1', 'U')
    g.meet('R', 'ck', 'd45', (1.5 - H, 1.5 - H))
    g.line_par('rv', 'R', 'v')
    g.repeat('rvp', ['rv'], 'rot4')

    step('The line through U parallel to the line from O to K1 crosses the vertical line through F at P. '
         'Draw a horizontal line through P. '
         'The lines of step 4 cross the horizontal line through O at G and the vertical line at J. '
         'Line GJ crosses the horizontal line through P at W.', 'ruler', ['P', 'G', 'J', 'W'])
    g.meet('P', 'ud', 'fv', (0.5, H - 0.5))
    g.line_par('ph', 'P', 'h')
    g.meet('G', 'ud@1', 'h', (1 - H, 0))
    g.meet('J', 'ud@1', 'v', (0, 1 - H))
    g.meet('W', 'ph', 'ud@1', (1.5 - 2 * H, H - 0.5))

    step('Draw a vertical line through W. Turn it round O by 90°, three times. '
         'The lines make the arms of the cross at O.', 'ruler', ['W'])
    g.line_par('wv', 'W', 'v')
    g.repeat('wvp', ['wv'], 'rot4')


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
        'format': 0, 'id': 'dar-el-bey-crosses',
        'title': 'Crosses and stars of Dar el Bey (Tunis)',
        'short': 'Dar el Bey crosses', 'subtitle': 'Dar el Bey, Tunis', 'fold': 4, 'star': 8,
        'style': 'Tunisian', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s CL39 drawing, the centre lines of its bands '
                    'snapped to exact values. We devised the construction: the small stars at the corners are two '
                    'squares through U, their sides carried on make the points of the cross at O, and a square '
                    'frame through F holds the cross. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws the '
                       'lines as interlaced bands; the tutorial draws their centre lines. No photo of the building '
                       'was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data208/CL39: Dar el Bay, Office of the Prime Minister', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data208/CL39.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from J. Collin, Étude pratique de la '
                     'décoration polygonale arabe (Paris, 1911), plate 39 (the office of the Prime Minister, Dar el '
                     'Bey, Tunis), and lists David Wade’s photo EPC 044. The construction is ours.'}],
        'given': {'O': 'The centre of a cross.',
                  'A': 'Halfway from O to the next cross on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the cross at O, its frame, the stars at the corners and the lines that carry their sides '
                        'on. They close the long pieces and the triangles.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A framed cross sits at every centre and a '
                            'small star at every corner.',
                    'palette': 'Marinid zellige', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(9, 0.235): ('nine', 'ground'), (8, 0.222): ('long_eight', 'a'), (16, 0.201): ('star', 'b'),
         (6, 0.172): ('six', 'c'), (8, 0.172): ('eight', 'a'), (16, 0.142): ('cross', 'd'), (3, 0.043): ('triangle', 'd'),
         (4, 0.036): ('square', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
