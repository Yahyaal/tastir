#!/usr/bin/env python3
"""Builds the stars and crosses of the Tepe madrasa, Nishapur (painted bricks,
eleventh century), drawn by Brian Wichmann in Tiling Search (data193/W1).

Read from the PDF (period 386.3 pt). Its coloured pieces are drawn edge to
edge, with the white bands stroked over them, so they are the tiles: no
offset. Every corner snaps to the grid (a + b·√2/2)/2 in units of half the
period (worst error 0.0006 of OA). With h = (2 − √2)/4 every line is one of:
  - x, y = ±h and x, y = ±(1 − h), through P, where the line from K1 through
    E (on the circle and line OK2) crosses line AC;
  - x ± y = ±h√2, through S on the circle with centre O through G = (h, h):
    with the lines x, y = ±h they make the star at O;
  - x ± y = ±(1 + h√2), through T, where the circle with centre A and the
    same radius crosses the vertical through A: they frame the small squares
    at A, B, C and D.

Units: OA = 1, A on the horizontal line halfway to the next star; the tile is
the square cell.

Usage: gen_nishapur_madrasa_stars.py <W1-pieces.json> tutorials/nishapur-madrasa-stars.json
       pnpm review nishapur-madrasa-stars
       gen_nishapur_madrasa_stars.py finish docs/review/nishapur-madrasa-stars/dump.json tutorials/nishapur-madrasa-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
HH = (2 - math.sqrt(2)) / 4
S1 = HH * math.sqrt(2)
ORIGIN, PERIOD, BAND = (299.4, 375.54), 386.26, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a straight line through O and K2. It crosses the circle at E. '
         'Draw a straight line through K1 and E. Draw a straight line through A and C. '
         'It crosses the line through K1 and E at P.', 'ruler', ['K2', 'E', 'P'])
    g.line_through('d135', 'O', 'K2')
    g.meet('E', 'c', 'd135', (-H, H))
    g.line_through('ke', 'K1', 'E')
    g.line_through('ac', 'A', 'C')
    g.meet('P', 'ac', 'ke', (HH, 1 - HH))

    step('Draw a vertical line through P. Draw a horizontal line through P. '
         'Turn the two lines round O by 90°, three times.', 'ruler', ['P'])
    g.line_par('pv', 'P', 'v')
    g.line_par('ph', 'P', 'h')
    g.repeat('pp', ['pv', 'ph'], 'rot4')

    step('The vertical line through P crosses the line from O to K1 at G. '
         'Draw a circle with centre O through G. It crosses the horizontal line at S. '
         'Draw a line through S parallel to line AC. Turn it round O by 90°, three times. '
         'The lines make the star at O.', 'compass', ['G', 'S'])
    g.meet('G', 'pv', 'd45', (HH, HH))
    g.circle_through('cg', 'O', 'G')
    g.meet('S', 'cg', 'h', (S1, 0))
    g.line_par('sd', 'S', 'ac')
    g.repeat('sdp', ['sd'], 'rot4')

    step('Draw a circle with centre A and the same radius as the circle through G. '
         'It crosses the vertical line through A at T, above A. '
         'Draw a line through T parallel to line AC. Turn it round O by 90°, three times.', 'compass', ['A', 'T'])
    cm.circle_radius_of('ca', 'A', 'cg')
    g.meet('T', 'ca', 'gx', (1, S1))
    g.line_par('td', 'T', 'ac')
    g.repeat('tdp', ['td'], 'rot4')


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
        'format': 0, 'id': 'nishapur-madrasa-stars',
        'title': 'Stars and crosses of the Tepe madrasa, Nishapur',
        'short': 'Nishapur madrasa stars', 'subtitle': 'Tepe madrasa, Nishapur', 'fold': 4, 'star': 8,
        'style': 'Seljuk', 'level': 'beginner',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s W1 drawing, its corners snapped to exact '
                    'values. We devised the construction: one line from K1 through E fixes P, and every line is '
                    'drawn through P, S or T. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws '
                       'white bands over the lines; the tutorial draws the lines. No photo of the bricks was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data193/W1: Tepe Madrasah', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data193/W1.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from Charles K. Wilkinson, Nishapur: '
                     'Pottery of the Early Islamic Period (New York, 1973), plate 1 (painted bricks of the Tepe '
                     'madrasa, eleventh century), and lists a fragment of a frieze in the Metropolitan Museum of Art '
                     '(39.40.67). The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway from O to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the lines that carry its sides on, with the lines through T. '
                        'They close the crosses, the long pieces and the small squares.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A star sits at every centre and a small '
                            'square at every corner.',
                    'palette': 'Timurid tile', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(10, 0.25): ('cross', 'a'), (16, 0.243): ('star', 'b'), (5, 0.168): ('pentagon', 'a'),
         (4, 0.104): ('square', 'ground'), (4, 0.086): ('small_square', 'b'), (5, 0.082): ('small_pentagon', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
