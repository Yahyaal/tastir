#!/usr/bin/env python3
"""Builds the interlaced stars of Bourgoin's plate 60 (the Bou Inania madrasa,
Fez, after Paccard), drawn by Brian Wichmann in Tiling Search (data11/P060).

Read from the PDF (period 341.4 pt, band 16 pt), every band centre line
snapped to the grid (a + b·√2/2)/4 in units of half the period (worst error
0.0014 of OA). O is a star whose four neighbours on the axes are long green
stars; the stars at the corners of the square cell are the same size but sit
among bands, so the tile holds two stars. With q = √2/4 every line is one of:
  - the star at O: the square x, y = ±1/4 and the diamond x ± y = ±q
    (two squares on a circle of radius q);
  - the same star at each corner: x, y = ±3/4 and x ± y = ±(2 − q);
  - the diamond through A, B, C and D (x ± y = ±1);
  - the lines x ± y = ±(1 − q), at a quarter from A;
  - the lines x, y = ±(q − 1/4), through the inner corners of the star at O.

Units: OA = 1, A on the horizontal line halfway to the next cell; the tile is
the square cell.

Usage: gen_bou_inania_interlaced_stars.py <P060-pieces.json> tutorials/bou-inania-interlaced-stars.json
       pnpm review bou-inania-interlaced-stars
       gen_bou_inania_interlaced_stars.py finish docs/review/bou-inania-interlaced-stars/dump.json tutorials/bou-inania-interlaced-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

Q = math.sqrt(2) / 4
ORIGIN, PERIOD, BAND = (300.36, 373.86), 341.4, 16.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Join A, C, B and D with straight lines. Line AC crosses the line from O to K1 at E.', 'ruler', ['E'])
    g.line_through('ac', 'A', 'C')
    g.repeat('acp', ['ac'], 'rot4')
    g.meet('E', 'ac', 'd45', (0.5, 0.5))

    step('Draw a vertical line through E. It crosses the horizontal line at F. '
         'Draw a line through F parallel to line AC. It crosses the line from O to K1 at G.', 'ruler', ['F', 'G'])
    g.line_par('ev', 'E', 'v')
    g.meet('F', 'ev', 'h', (0.5, 0))
    g.line_par('fd', 'F', 'ac')
    g.meet('G', 'fd', 'd45', (0.25, 0.25))

    step('Draw a vertical line through G. Turn it round O by 90°, three times. '
         'The four lines make the first square of the star at O.', 'ruler', ['G'])
    g.line_par('gv', 'G', 'v')
    g.repeat('gvp', ['gv'], 'rot4')

    step('Draw a circle with centre O through G. It crosses the horizontal line at S. '
         'Draw a line through S parallel to line AC. Turn it round O by 90°, three times. '
         'The four lines make the second square of the star.', 'compass', ['G', 'S'])
    g.circle_through('cq', 'O', 'G')
    g.meet('S', 'cq', 'h', (Q, 0))
    g.line_par('sd', 'S', 'ac')
    g.repeat('sdp', ['sd'], 'rot4')

    step('The horizontal line through G crosses line AC at T. Draw a vertical line through T. '
         'Turn it round O by 90°, three times. The four lines make the squares of the corner stars.', 'ruler', ['T'])
    g.meet('T', 'gv@1', 'ac', (0.75, 0.25))
    g.line_par('tv', 'T', 'v')
    g.repeat('tvp', ['tv'], 'rot4')

    step('Draw a circle with centre K1 and the same radius as the circle through G. '
         'It crosses the vertical line through A at U. Draw a line through U parallel to line AC. '
         'Turn it round O by 90°, three times.', 'compass', ['K1', 'U'])
    cm.circle_radius_of('ck', 'K1', 'cq')
    g.meet('U', 'ck', 'gx', (1, 1 - Q))
    g.line_par('ud', 'U', 'ac')
    g.repeat('udp', ['ud'], 'rot4')

    step('Draw a circle with centre A and the same radius. It crosses the horizontal line at V. '
         'Draw a line through V parallel to line AC. Turn it round O by 90°, three times.', 'compass', ['A', 'V'])
    cm.circle_radius_of('ca', 'A', 'cq')
    g.meet('V', 'ca', 'h', (1 - Q, 0))
    g.line_par('vd', 'V', 'ac')
    g.repeat('vdp', ['vd'], 'rot4')

    step('The horizontal line through G crosses the line through S at W. Draw a vertical line through W. '
         'Turn it round O by 90°, three times.', 'ruler', ['W'])
    g.meet('W', 'gv@1', 'sd', (Q - 0.25, 0.25))
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
        'format': 0, 'id': 'bou-inania-interlaced-stars',
        'title': 'Interlaced stars of the Bou Inania madrasa (Fez)',
        'short': 'Bou Inania interlaced stars', 'subtitle': 'Bou Inania madrasa, Fez', 'fold': 4, 'star': 8,
        'style': 'Moroccan', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P060 drawing, the centre lines of its bands '
                    'snapped to exact values. We devised the construction: the star at O is two squares on the '
                    'circle through G, the same star sits at each corner, and the diamond ABCD with lines at the '
                    'same distance from A makes the rest. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws the '
                       'lines as interlaced bands; the tutorial draws their centre lines. No photo of the madrasa '
                       'was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data11/P060: Bourgoin, Plate 60', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data11/P060.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of Jules Bourgoin’s plate 60. He lists the same design at '
                     'the Bou Inania madrasa, Fez (André Paccard, Traditional Islamic Craft in Moroccan '
                     'Architecture, volume 1 page 130 and volume 2 page 430) and on a fifteenth-century Toledo tile '
                     'in the Victoria and Albert Museum (308:100-1866), and in the books of El-Said, Critchlow and '
                     'Abas. The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the side of the square tile on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the two stars and the lines that carry their sides on, with the lines near A. '
                        'They close the long stars, the eight-sided pieces and the small squares.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and every corner, '
                            'and a long star halfway between two centres.',
                    'palette': 'Marinid zellige', 'look': 'interlace', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.293): ('star', 'a'), (16, 0.28): ('long_star', 'b'), (8, 0.25): ('eight', 'ground'),
         (8, 0.22): ('small_eight', 'ground'), (4, 0.052): ('square', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)
