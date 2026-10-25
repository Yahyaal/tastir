#!/usr/bin/env python3
"""Builds the crosses of the Qavam Hosseiniyeh, Shiraz, drawn by Brian
Wichmann in Tiling Search (data180/P47).

Read from the PDF (plain tiles; the crosses 247.27 pt apart on the diagonal),
every corner snapped to the grid a + b·√2/2 in units of half that spacing
(worst error 0.0018 of OA). Wichmann draws it turned by 45°; turned back, the
tile is the square cell with a cross at O, a long twelve-sided piece at A, B,
C and D, and a small diamond at each corner. Every line follows from one
length, √2 − 1 (the radius of the circle round K1 through F, as in the Leones
doors):
  - the cross's point T, where that circle moved to A crosses the horizontal;
  - its shoulder S, where the line through T at 90° to OK1 crosses the
    vertical at √2 − 1 (through G, where the same circle round O crosses the
    horizontal); its arms are the horizontal through S and its turns;
  - the line through S parallel to OK1, which meets the cell side at V, the
    point of the corner diamond; the horizontal through V and the diamond's
    side through V, at 90° to OK1.

Units: OA = 1, A halfway to the next cross on the horizontal line; the tile
is the square cell.

Usage: gen_shiraz_qavam_crosses.py <P47-pieces.json> tutorials/shiraz-qavam-crosses.json
       pnpm review shiraz-qavam-crosses
       gen_shiraz_qavam_crosses.py finish docs/review/shiraz-qavam-crosses/dump.json tutorials/shiraz-qavam-crosses.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

R2 = math.sqrt(2)
H = R2 / 2
ORIGIN, PERIOD = (294.1, 374.4), 247.27


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at F. Draw a circle with centre K1 through F. '
         'Draw a circle with centre A and the same radius. It crosses the horizontal line at T. '
         'Draw a circle with centre O and the same radius. It crosses the horizontal line at G.', 'compass', ['K1'])
    g.meet('F', 'c', 'd45', (H, H))
    g.circle_through('ck', 'K1', 'F')
    cm.circle_radius_of('ca', 'A', 'ck')
    g.meet('T', 'ca', 'h', (2 - R2, 0))
    cm.circle_radius_of('co', 'O', 'ck')
    g.meet('G', 'co', 'h', (R2 - 1, 0))

    step('Draw a vertical line through G. Draw a line through T at 90° to the line from O to K1. '
         'The two lines cross at S. Draw a horizontal line through S. '
         'Draw a line through T parallel to the line from O to K1.', 'ruler', ['G', 'T'])
    g.line_par('gv', 'G', 'v')
    g.line_perp('tp', 'T', 'd45')
    g.meet('S', 'gv', 'tp', (R2 - 1, (R2 - 1) ** 2))
    g.line_par('sh', 'S', 'h')
    g.line_par('td', 'T', 'd45')

    step('Draw a line through S parallel to the line from O to K1. It crosses the vertical line through A at V. '
         'Draw a horizontal line through V. Draw a line through V at 90° to the line from O to K1.', 'ruler', ['S'])
    g.line_par('sd', 'S', 'd45')
    g.meet('V', 'sd', 'gx', (1, 5 - 3 * R2))
    g.line_par('vh', 'V', 'h')
    g.line_perp('vp', 'V', 'd45')

    step('Turn the lines through T, S and V round O by 90°, three times.')
    g.repeat('rp', ['tp', 'sh', 'td', 'sd', 'vh', 'vp'], 'rot4')


def drawing(pieces):
    polys = cm.frame_pieces(pieces, ORIGIN, PERIOD, 0)
    return [[((x + y) * H, (y - x) * H) for x, y in P] for P in polys]


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(drawing(pieces))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'shiraz-qavam-crosses',
        'title': 'Crosses of the Qavam Hosseiniyeh, Shiraz',
        'short': 'Qavam crosses', 'subtitle': 'Qavam Hosseiniyeh, Shiraz', 'fold': 4,
        'style': 'Persian', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P47 drawing, its corners snapped to exact '
                    'values. We devised the construction: one length, the radius of the circle round K1 through F, '
                    'gives the point and the shoulder of the cross, and the cross’s lines carried on give the rest. '
                    'The drawing gives no steps.',
            'changes': 'Wichmann draws the design turned by 45°; it is turned here so that the tile is the square '
                       'cell. The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. No photo of the '
                       'wall was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data180/P47: Shiraz, Qavam Hosseiniyeh', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data180/P47.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Mahmood Maher al-Naqsh, Design and '
                     'execution of drawing in Iranian tilework, Islamic period (Reza Abbasi Museum, 1983), volume 4, '
                     'page 47, where it is shown as tile mosaic. The construction is ours.'}],
        'given': {'O': 'The centre of a cross.', 'A': 'Halfway from O to the next cross on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the cross at O and the lines that carry its sides on. They close the long pieces, the '
                        'corner diamonds and the white pieces between them.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A cross sits at every centre and a diamond '
                            'at every corner.',
                    'palette': 'Timurid tile', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.569): ('cross', 'a'), (12, 0.676): ('long_piece', 'a'), (11, 0.490): ('white_piece', 'ground'),
         (4, 0.118): ('diamond', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)
