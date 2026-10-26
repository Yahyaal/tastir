#!/usr/bin/env python3
"""Builds the stone ornament of the Khayrbak mosque, Cairo, drawn by Brian
Wichmann in Tiling Search (data4/P60B, after Hessemer): small eight-pointed
stars of 45° points on a square grid, a small square at each cell corner,
arrow-headed pieces between the stars and long diagonal bands.

Read from the PDF (an interlace drawn with white bands 6 pt wide, moved out by
half a band with offset_pieces.py). With O at a star and A halfway to the next
star (OA = 116.575 pt) every corner snaps to the grid a + b·√2/2 (worst error
0.0009 of OA). Every line runs at 0°, 45° or 90° and is set by one length,
s = 3 − 2√2 = (√2 − 1)²:
  the star's lines x = ±t, y = ±t and x ± y = ±s, with t = s/√2 (all touch the
  circle of radius t about O), carried on to make the corner squares;
  x + y = ±(2 − s) (the corner square's far sides), x = ±(1 − t), y = ±(1 − t);
  x ± y = ±3s; x ± y = ±1.
s: the line from K3 (−1, −1) to M1 (1, √2/2) crosses the horizontal at (s, 0).
3s: the line from S′ (−s, 0) through the star's inner corner (t, t) meets the
side x = 1 at E (1, 1 − 3s); through E runs y − x = −3s.

Usage: gen_khayrbak_mosque_stars.py <P60B-pieces-offset.json> tutorials/khayrbak-mosque-stars.json
       pnpm review khayrbak-mosque-stars
       gen_khayrbak_mosque_stars.py finish docs/review/khayrbak-mosque-stars/dump.json tutorials/khayrbak-mosque-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import el, g, put, step  # noqa: E402

R2 = math.sqrt(2)
H = R2 / 2
S = 3 - 2 * R2
T = S / R2
ORIGIN, PERIOD, BAND = (296.6, 373.3), 233.15, 0.0


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The line through O and K1 crosses the circle at P. Draw a horizontal line through P. '
         'It crosses the vertical line through A at M. Draw a straight line through K3 and M. '
         'It crosses the horizontal line through O at S.', 'ruler', ['P', 'M', 'S'])
    g.meet('P', 'c', 'd45', (H, H))
    g.line_par('ph', 'P', 'h')
    g.meet('M', 'ph', 'gx', (1, H))
    g.line_through('km', 'K3', 'M')
    g.meet('S', 'km', 'h', (S, 0))

    step('Draw a line through S at 90° to the line through O and K1. '
         'Draw a circle with centre O that touches this line. It crosses the horizontal line through O at T. '
         'Draw a vertical line through T.', 'compass', ['S', 'T'])
    g.line_perp('sd', 'S', 'd45')
    cm.circle_tangent('ct', 'O', 'sd')
    g.meet('T', 'ct', 'h', (T, 0))
    g.line_par('tv', 'T', 'v')

    step('Turn the two new lines round O by 90°, three times. Together they make the star at O, '
         'with its points between the lines.', 'ruler', ['ct'])
    g.repeat('st', ['sd', 'tv'], 'rot4')

    step('The line through S crosses the vertical line through A at N. '
         'Draw a line through N at 90° to the line through O and K1. '
         'Draw a circle with centre A and the same radius as the small circle. '
         'It crosses the horizontal line through O at U, left of A. Draw a vertical line through U.',
         'compass', ['N', 'U'])
    g.meet('N', 'sd@3', 'gx', (1, 1 - S))
    g.line_perp('nd', 'N', 'd45')
    cm.circle_radius_of('ca', 'A', 'ct')
    g.meet('U', 'ca', 'h', (1 - T, 0))
    g.line_par('uv', 'U', 'v')

    step('The line through S, turned, crosses the horizontal line through O at R, left of O. '
         'The vertical line through T and its turned copy cross at Q, on the line through O and K1. '
         'Draw a straight line through R and Q. It crosses the vertical line through A at E. '
         'Draw a line through E parallel to the line through O and K1. '
         'Draw a straight line through A and C.', 'ruler', ['R', 'Q', 'E'])
    g.meet('R', 'sd@2', 'h', (-S, 0))
    g.meet('Q', 'tv', 'tv@1', (T, T))
    g.line_through('rq', 'R', 'Q')
    g.meet('E', 'rq', 'gx', (1, 1 - 3 * S))
    g.line_par('ed', 'E', 'd45')
    g.line_through('ac', 'A', 'C')

    step('Turn the four new lines through N, U, E and A round O by 90°, three times.', 'ruler', ['N', 'U', 'E'])
    g.repeat('fr', ['nd', 'uv', 'ed', 'ac'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND))
    paths = cm.along_ink(segs)
    used = {p_['along'] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'khayrbak-mosque-stars',
        'title': 'Stars and arrows of the Khayrbak mosque, Cairo',
        'short': 'Khayrbak mosque stars', 'subtitle': 'Mosque of Khayrbak, Cairo', 'fold': 4, 'star': 8,
        'style': 'Mamluk', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P60B drawing, its corners snapped to exact '
                    'values. We devised the construction. Every line runs across, up or at 45°, and one length '
                    'fixes them all: the point S, found with the line from K3 to M. The star at O is made of '
                    'eight lines that touch the small circle; carried on, they make the small squares at the '
                    'corners. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. Wichmann draws '
                       'it as an interlace of bands; we draw the centre lines of the bands. No photo of the '
                       'stonework was checked.',
            'reviewed': '2026-10-26'},
        'credits': [
            {'source': 'Tiling Search, data4/P60B: Khayrbak, mosque', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data4/P60B.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He takes it from F. M. Hessemer, Historic Designs and '
                     'Patterns in Color (Dover), page 60 (stone ornaments of the mausoleum of the emir Khairbeg, '
                     'Cairo, about 1500), and lists David Wade’s photo EGY 0818 (Aqsunqur mosque, Cairo). '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.', 'A': 'The point halfway to the next star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They make the star at O, the arrows between the stars, '
                        'the small squares and the long diagonal pieces.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square tile side by side. A star sits at every centre and a small '
                            'square at every corner, with arrows pointing from star to star.',
                    'palette': 'Timurid tile', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(10, 0.456): ('large_piece', 'ground'), (5, 0.257): ('band', 'b'), (10, 0.23): ('arrow', 'a'),
         (16, 0.167): ('star', 'star'), (4, 0.059): ('square', 'd')}

if __name__ == '__main__':
    cm.run(main, NAMES)
