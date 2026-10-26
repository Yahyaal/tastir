#!/usr/bin/env python3
"""S45A: source frame turns +45 degrees to put OA on a pmm mirror.

O=(297.5,375.829375), OA=30(1+sqrt(2)) pt, half-sides 1,sqrt(2).
Independent source areas/counts in SPEC sum to 8H. Partial polygons on
the outside of the PDF are not complete tiles and lie outside this cell.
"""
import math

import common as cm
from common import g, step
from half_turn import unit_star, diagonals, run

H = math.sqrt(.5)


def build():
    unit_star()
    cm.steps[1]['textWithoutHelpers'] = (
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through C. '
        'The lines through A and C cross at K1. Draw a straight line through O and K1.')
    step('Draw a circle with centre O through K1. '
         'It crosses the vertical line through O at V, above O. '
         'Draw a circle with centre B, with the same opening. '
         'It crosses the horizontal line through O at P, right of O.', 'compass', ['K1', 'B', 'V', 'P'])
    g.circle_through('ck', 'O', 'K1')
    g.meet('V', 'ck', 'v', (0, 2*H))
    cm.circle_radius_of('cp', 'B', 'ck')
    g.meet('P', 'cp', 'h', (2*H-1, 0))
    step('Draw a horizontal line through V. Turn it round O by 180°. '
         'They cross the vertical lines through A and B at N1, N2, N3 and N4.', 'ruler', ['V', 'A', 'B'])
    g.line_par('sideY', 'V', 'h')
    g.repeat('frame', ['sideY'], 'rot2')
    for name, x, y, a, b in [('N1', 1, 1, 'gx', 'sideY'), ('N2', -1, 1, 'gxw', 'sideY'),
                              ('N3', -1, -1, 'gxw', 'sideY@1'), ('N4', 1, -1, 'gx', 'sideY@1')]:
        g.meet(name, a, b, (x, 2*H*y))
    step('Draw a circle with centre P and opening from O to K1. '
         'It crosses the horizontal line through O at Q, right of P.', 'compass', ['P', 'K1', 'Q'])
    cm.circle_radius_of('cq', 'P', 'ck')
    g.meet('Q', 'cq', 'h', (4*H-1, 0))
    diagonals(['Q'])


SPEC = {
    'code': 'S45A', 'folder': 'data9', 'id': 'mosul-imam-yahya-star-rows',
    'title': 'Stars above the door of the Imam Yahya mosque, Mosul',
    'short': 'Imam Yahya mosque stars', 'subtitle': 'Imam Yahya mosque, Mosul, Iraq',
    'style': 'Iraqi', 'star': 8,
    'frame': (297.5, 375.829375, 30*(1+2*H), 0, 1, 2*H), 'angle': 45,
    'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Its right point, along a mirror.'},
    'note': 'The finished design was read from Brian Wichmann’s S45A drawing and its corners snapped to exact values. '
            'The frame turns by 45° to put OA on a mirror. OA is the star’s point radius; compass transfers of the square diagonal fix the repeat.',
    'changes': 'The plain boundaries are retained in the turned teaching frame. The palette is illustrative. '
               'No mosque photograph or original museum drawing was independently checked.',
    'references': 'Javad Shafai, On decoration in Persian architecture and wood carving (Tehran, 1977), page 231, '
                  'above the door of Imam Yahya mosque, Mosul (1239 AD, 636 AH). '
                  'Also Mirza Akbar, V&A AL.8322:1, record O402863, and Mirza Akber’s Persian decoration, '
                  'sheet 45a marked II (1898), pressmark VA.1898.0001.',
    'pieces': [('star', 16, 8, -8, 1, 'a'), ('ten', 10, 1, 0, 1, 'b'),
               ('square', 4, 6, -8, 1, 'c'), ('pentagon', 5, -2.5, 4, 6, 'ground')],
}

if __name__ == '__main__':
    run(build, SPEC)
