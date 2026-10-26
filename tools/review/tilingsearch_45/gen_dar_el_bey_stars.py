#!/usr/bin/env python3
"""Builds the stars of Dar el Bey, Tunis (J. Collin, plate 35), drawn by Brian
Wichmann in Tiling Search (data208/CL35).

Read from the PDF (period 412.1 pt, band 10 pt), every band centre line
snapped to the grid (a + b·√2/2)/2 in units of OA (worst error 0.0007 of OA).
O is the notched cross in the middle; with r = 1 − √2/2 every star is two
squares on a circle of radius r: one at each cell corner (as in
dar-el-bey-crosses, CL39) and four round O at S = (2r, 0) and its turns.
With H = √2/2 every line is one of:
  - the corner stars: x ± y = ±r and ±(1 + H) through U = (1, H), x, y = ±(1.5 − H)
    through R, where the circle with centre K1 through U crosses OK1;
  - the stars round O: their near sides are the lines x ± y = ±r through G = (r, 0);
    their squares' sides y = ±rH (through Q, where the circle with centre O
    through G crosses OK1) and x = ±(2r − rH) (through V, on the circle with
    centre S through G); their far sides x ± y = ±3r through T = (3r, 0);
  - the near sides of the next cell's stars, x ± y = ±(2 − 3r), through Z = (√2 − 1, H).

Usage: gen_dar_el_bey_stars.py <CL35-pieces.json> tutorials/dar-el-bey-stars.json
       pnpm review dar-el-bey-stars
       gen_dar_el_bey_stars.py finish docs/review/dar-el-bey-stars/dump.json tutorials/dar-el-bey-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
R_ = 1 - H
ORIGIN, PERIOD, BAND = (295.6, 372.9), 412.1, 10.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')
    step('The circle crosses the line from O to K1 at E. Draw a horizontal line through E. '
         'It crosses the vertical line through A at U.', 'ruler', ['E', 'U'])
    g.meet('E', 'c', 'd45', (H, H))
    g.line_par('eh', 'E', 'h')
    g.meet('U', 'eh', 'gx', (1, H))

    step('Draw a line through U at 90° to the line from O to K1. Draw a line through U parallel to the line '
         'from O to K1. Turn the two lines round O by 90°, three times.', 'ruler', ['U'])
    g.line_perp('ua', 'U', 'd45')
    g.line_par('ud', 'U', 'd45')
    g.repeat('up', ['ua', 'ud'], 'rot4')

    step('Draw a circle with centre K1 through U. It crosses the line from O to K1 at R. '
         'Draw a vertical line through R. Turn it round O by 90°, three times. '
         'The lines make the stars at the corners.', 'compass', ['K1', 'U', 'R'])
    g.circle_through('ck', 'K1', 'U')
    g.meet('R', 'ck', 'd45', (1.5 - H, 1.5 - H))
    g.line_par('rv', 'R', 'v')
    g.repeat('rvp', ['rv'], 'rot4')

    step('The lines of step 3 cross the horizontal line through O at G, nearest to O on the right. '
         'Draw a circle with centre O through G. It crosses the line from O to K1 at Q. '
         'Draw a horizontal line through Q. Turn it round O by 90°, three times.', 'compass', ['G', 'Q'])
    g.meet('G', 'ud', 'h', (R_, 0))
    g.circle_through('cg', 'O', 'G')
    g.meet('Q', 'cg', 'd45', (R_ * H, R_ * H))
    g.line_par('qh', 'Q', 'h')
    g.repeat('qhp', ['qh'], 'rot4')

    step('Draw a circle with centre G through O. It crosses the horizontal line through O at S. '
         'Draw a circle with centre S through G. It crosses the horizontal line through O at T, right of S. '
         'It crosses the horizontal line through Q at V, left of S.', 'compass', ['G', 'S', 'T', 'V'])
    g.circle_through('cgo', 'G', 'O')
    g.meet('S', 'cgo', 'h', (2 * R_, 0))
    g.circle_through('cs', 'S', 'G')
    g.meet('T', 'cs', 'h', (3 * R_, 0))
    g.meet('V', 'cs', 'qh', (2 * R_ - R_ * H, R_ * H))

    step('Draw a line through T at 90° to the line from O to K1. Draw a vertical line through V. '
         'Turn the two lines round O by 90°, three times. With the lines through G and Q, they make a star '
         'round S.', 'ruler', ['T', 'V'])
    g.line_perp('td', 'T', 'd45')
    g.line_par('vv', 'V', 'v')
    g.repeat('tvp', ['td', 'vv'], 'rot4')

    step('The horizontal line through E crosses a line of step 3 at Z, the first crossing left of U. '
         'Draw a line through Z at 90° to the line from O to K1. Turn it round O by 90°, three times.',
         'ruler', ['Z'])
    g.meet('Z', 'ud@2', 'eh', (2 * H - 1, H))
    g.line_perp('zd', 'Z', 'd45')
    g.repeat('zdp', ['zd'], 'rot4')


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
        'format': 0, 'id': 'dar-el-bey-stars',
        'title': 'Stars round a cross, Dar el Bey (Tunis)',
        'short': 'Dar el Bey stars', 'subtitle': 'Dar el Bey, Tunis', 'fold': 4, 'star': 8,
        'style': 'Tunisian', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s CL35 drawing, the centre lines of its bands '
                    'snapped to exact values. We devised the construction. Every star is two squares on a circle '
                    'of the same radius: the stars at the corners come first, as in the Dar el Bey crosses, and '
                    'four more stars sit round O at S, twice that radius from O. Their sides carried on make the '
                    'notched cross at O. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws the '
                       'lines as interlaced bands; the tutorial draws their centre lines. No photo of the building '
                       'was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data208/CL35: Dar el Bey, Tunis', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data208/CL35.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from J. Collin, Étude pratique de la '
                     'décoration polygonale arabe (Paris, 1911), plate 35 (Dar el Bey, Tunis), and lists David '
                     'Wade’s photo EPC 040. The construction is ours.'}],
        'given': {'O': 'The centre of a cross.',
                  'A': 'Halfway from O to the next cross on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the cross at O, the stars round it and the stars at the corners. '
                        'Ink the lines that carry their sides on.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A cross sits at every centre with four '
                            'stars round it, and a star sits at every corner.',
                    'palette': 'Marinid zellige', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(24, 0.426): ('cross', 'd'), (16, 0.201): ('star', 'b'), (8, 0.172): ('eight', 'ground'),
         (4, 0.036): ('kite', 'c'), (4, 0.029): ('square', 'd'), (5, 0.028): ('pentagon', 'a')}

if __name__ == '__main__':
    cm.run(main, NAMES)
