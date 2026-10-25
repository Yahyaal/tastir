#!/usr/bin/env python3
"""Builds the red frets of a Moroccan zellige panel from André Paccard's book,
drawn by Brian Wichmann in Tiling Search (data183/P201).

Read from the PDF (plain tiles, star spacing 386.3 pt on the axes). Stars of two
squares sit at O and at the cell corners; a larger star with four short arms
(24 sides) at A, B, C and D; a small square halfway between each star and its
diagonal neighbour; and red frets (12 sides, eight to the cell) between them.
Every corner snaps to the grid a + b·√2/2 in units of the small square's side
w = OA / (5 + 2√2) (worst error 0.005 w, 0.0006 of OA). In those units the
stars' points are 3 from their centres and the frets are bands of width
2 − √2/2 whose centre lines lie halfway between O and the vertical through E.

The one length that fixes the design is P, the point of the star at A that
faces O: the line from G = (0, 2) to F = (√2/2, 0) crosses the 22.5° line
through O at X, and the vertical through X gives P = (2 + 6√2)/17.

Units: OA = 1, A at the centre of the next large star; the tile is the square cell.

Usage: gen_paccard_zellige_frets.py <P201-pieces.json> tutorials/paccard-zellige-frets.json
       pnpm review paccard-zellige-frets
       gen_paccard_zellige_frets.py finish docs/review/paccard-zellige-frets/dump.json tutorials/paccard-zellige-frets.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
PERIOD = 386.275
W = 1 / (5 + 4 * H)
r = 3 * W                 # the stars' point radius
s = r * H                 # half-side of the stars' squares
tip = 1 - r
t = (2 + 2 * H) * W       # the inner side of the band round the star at O
T8 = math.tan(math.pi / 8)


def origin(pieces):
    ps = [p for p in json.load(open(pieces)) if len(p['poly']) == 16]
    return min((p['c'] for p in ps), key=lambda c: math.dist(c, (300, 300)))


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at E. Draw a vertical line through E. '
         'It crosses the horizontal line at F. Draw a circle with centre C through O. '
         'It crosses the vertical line through O at G. Draw a straight line through G and F.', 'compass', ['c', 'd45'])
    g.meet('E', 'c', 'd45', (H, H))
    g.line_par('ev', 'E', 'v')
    g.meet('F', 'ev', 'h', (H, 0))
    g.circle_through('cc', 'C', 'O')
    g.meet('G', 'cc', 'v', (0, 2))
    g.line_through('gf', 'G', 'F')

    step('Draw the line through O that halves the angle AOE. It crosses the line through G and F at X. '
         'Draw a vertical line through X. It crosses the horizontal line at P. '
         'Draw a circle with centre A through P. Draw a circle with centre O and the same radius.', 'compass', ['A', 'E'])
    g.line_bisect('b22', 'A', 'O', 'E')
    g.meet('X', 'b22', 'gf', (tip, tip * T8))
    g.line_par('xv', 'X', 'v')
    g.meet('P', 'xv', 'h', (tip, 0))
    g.circle_through('ca', 'A', 'P')
    cm.circle_radius_of('co', 'O', 'ca')

    step('The small circle with centre O crosses the horizontal line at R. It crosses the line from O to K1 at Q. '
         'Draw a vertical line through Q and the line through R at 90° to the line from O to K1. '
         'Turn both lines round O by 90°, three times. They make the star at O, two squares.', 'ruler', ['co'])
    g.meet('R', 'co', 'h', (r, 0))
    g.meet('Q', 'co', 'd45', (s, s))
    g.line_par('qv', 'Q', 'v')
    g.line_perp('rd', 'R', 'd45')
    g.repeat('qp', ['qv', 'rd'], 'rot4')

    step('The same star sits at A and at K1. The circle with centre A crosses the line through A and C at S. '
         'Draw a vertical line through S. Draw the line through P at 90° to the line from O to K1. '
         'Draw a circle with centre K1 and the same radius as the circle with centre A. '
         'It crosses the vertical line through A at U. Draw the line through U at 90° to the line from O to K1. '
         'The circle with centre A crosses the vertical line through A at Y. '
         'Draw the line through Y at 90° to the line from O to K1. '
         'Turn the four lines round O by 90°, three times.', 'compass', ['ca'])
    cm.steps[-1]['textWithoutHelpers'] = cm.steps[-1]['text'].replace(
        'The circle with centre A crosses the line through A and C at S. Draw a vertical line through S.',
        'S is a point of the star at A. Draw a vertical line through S.')
    g.line_through('acl', 'A', 'C')
    g.meet('S', 'ca', 'acl', (1 - s, s))
    g.line_par('sv', 'S', 'v')
    g.line_perp('pd', 'P', 'd45')
    cm.circle_radius_of('ck', 'K1', 'ca')
    g.meet('U', 'ck', 'gx', (1, 1 - r))
    g.line_perp('ud', 'U', 'd45')
    g.meet('Y', 'ca', 'gx', (1, r))
    g.line_perp('yd', 'Y', 'd45')
    g.repeat('sp', ['sv', 'pd', 'ud', 'yd'], 'rot4')

    step('Draw a circle with centre E and the same radius. It crosses the line from O to K1 at T. '
         'Draw a circle with centre K1 and radius OT. It crosses the line from O to K1 at M. '
         'Draw a vertical line through T and a vertical line through M. '
         'Turn both lines round O by 90°, three times. They are the sides of the red bands.', 'compass', ['E'])
    cm.circle_radius_of('ce', 'E', 'ca')
    g.meet('T', 'ce', 'd45', (t, t))
    g.circle_from('ckt', 'K1', 'O', 'T')
    g.meet('M', 'ckt', 'd45', (1 - t, 1 - t))
    g.line_par('tv', 'T', 'v')
    g.line_par('mv', 'M', 'v')
    g.repeat('tp', ['tv', 'mv'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, origin(pieces), PERIOD, 0))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'paccard-zellige-frets',
        'title': 'Red frets of a Moroccan zellige panel',
        'short': 'Zellige frets', 'subtitle': 'Zellige panel, Morocco (Paccard)', 'fold': 4, 'chiral': True, 'star': 8,
        'style': 'Moroccan', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P201 drawing, its corners snapped to exact '
                    'values. We devised the construction. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. The drawing fits '
                       'stars whose points reach 3/(5 + 2√2) of OA to within 0.0003 of OA; we use that value. '
                       'The frets turn like a pinwheel round each small star, so the design has no mirror. '
                       'No photo of the panel was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data183/P201: Paccard, panel of zellige', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data183/P201.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, after a panel of zellige in its original colours in '
                     'André Paccard’s Traditional Islamic Craft in Moroccan Architecture (1980), volume 1, page 201. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of a small star.', 'A': 'The centre of the next large star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O, and the large stars with four arms at A, B, C and D. '
                        'Ink the small square between O and each corner. What is left are the red frets.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. Small stars and large stars with arms take '
                            'turns like the squares of a chessboard. Red frets wind between them.',
                    'palette': 'Alhambra', 'look': 'tiles', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])


NAMES = {(24, 0.798): ('large_star', 'ground'), (16, 0.344): ('star', 'ground'), (12, 0.206): ('fret', 'a'),
         (4, 0.016): ('square', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
