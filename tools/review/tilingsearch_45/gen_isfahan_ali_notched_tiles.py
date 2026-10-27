#!/usr/bin/env python3
"""IRA1330: half-turn repeat about a small square, OA its half-diagonal.

O = (297.5, 299.79) PDF points, OA = 40 pt. With H = sqrt(2)/2,
the cell half-sides are 1+2H and 1+4H. Its areas are independent
shoelace sums of the snapped source polygons: 5+8H twice, 4+4H twice,
and 2 once, totaling 20+24H = 4(1+2H)(1+4H).
Usage: gen_isfahan_ali_notched_tiles.py <IRA1330-pieces.json> <tutorial.json>
"""
import math

import common as cm
from common import g, step
from half_turn import run

H = math.sqrt(.5)


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'They cross at K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. '
        'They cross at K1. Draw a straight line through O and K1.')

    step('Draw a straight line through A and C. Turn it round O by 90°, three times. '
         'Draw the line through O at 90° to the line from O to K1.', 'ruler')
    g.line_through('ac', 'A', 'C')
    g.repeat('diamond', ['ac'], 'rot4')
    g.line_perp('d135', 'O', 'd45')

    step('The line from O to K1 crosses the circle at F. '
         'Draw a vertical line through F. It crosses the horizontal line through O at M.', 'ruler', ['F', 'M'])
    g.meet('F', 'c', 'd45', (H, H))
    g.line_par('fv', 'F', 'v')
    g.meet('M', 'fv', 'h', (H, 0))

    step('Draw a circle with centre O through K1. '
         'Draw a circle with centre A, with the same opening. '
         'It crosses the horizontal line through O at W, right of A.', 'compass', ['K1', 'A', 'W'])
    g.circle_through('ck', 'O', 'K1')
    cm.circle_radius_of('cw', 'A', 'ck')
    g.meet('W', 'cw', 'h', (1 + 2*H, 0))

    step('Draw a circle with centre W, with the same opening. '
         'It crosses the horizontal line through O at Z, right of W. '
         'Draw a circle with centre O through Z. It crosses the vertical line through O at V, above O.',
         'compass', ['W', 'Z', 'V'])
    cm.circle_radius_of('cz', 'W', 'ck')
    g.meet('Z', 'cz', 'h', (1 + 4*H, 0))
    g.circle_through('coz', 'O', 'Z')
    g.meet('V', 'coz', 'v', (0, 1 + 4*H))

    step('Draw a vertical line through W. Draw a horizontal line through V. '
         'Turn both lines round O by 180°. They cross at N1, N2, N3 and N4.', 'ruler', ['W', 'V'])
    g.line_par('sideX', 'W', 'v')
    g.line_par('sideY', 'V', 'h')
    g.repeat('frame', ['sideX', 'sideY'], 'rot2')
    for name, x, y, a, b in [('N1', 1, 1, 'sideX', 'sideY'), ('N2', -1, 1, 'sideX@1', 'sideY'),
                              ('N3', -1, -1, 'sideX@1', 'sideY@1'), ('N4', 1, -1, 'sideX', 'sideY@1')]:
        g.meet(name, a, b, (x*(1+2*H), y*(1+4*H)))

    step('Draw a circle with centre A and opening OM. '
         'It crosses the horizontal line through O at R, right of A. '
         'Draw a vertical line through R. Turn it round O by 180°.', 'compass', ['A', 'M', 'R'])
    g.circle_from('cr', 'A', 'O', 'M')
    g.meet('R', 'cr', 'h', (1 + H, 0))
    g.line_par('rx', 'R', 'v')
    g.repeat('rxPair', ['rx'], 'rot2')

    step('Draw a circle with centre V and opening OM. '
         'It crosses the vertical line through O at S, below V. '
         'Draw a horizontal line through S. Turn it round O by 180°.', 'compass', ['V', 'M', 'S'])
    g.circle_from('cs', 'V', 'O', 'M')
    g.meet('S', 'cs', 'v', (0, 1 + 3*H))
    g.line_par('sy', 'S', 'h')
    g.repeat('syPair', ['sy'], 'rot2')

    step('Draw a circle with centre Z and opening OA. '
         'It crosses the horizontal line through O at J, right of Z. '
         'Draw a line through each of Z and J at 90° to the line from O to K1.',
         'compass', ['Z', 'J', 'K1'])
    g.circle_from('cj', 'Z', 'O', 'A')
    g.meet('J', 'cj', 'h', (2 + 4*H, 0))
    g.line_perp('zd', 'Z', 'd45')
    g.line_perp('jd', 'J', 'd45')
    step('Turn both lines through Z and J round O by 90°, three times.', 'ruler', ['Z', 'J'])
    g.repeat('diagonals', ['zd', 'jd'], 'rot4')


SPEC = {
    'code': 'IRA1330', 'folder': 'data189', 'id': 'isfahan-ali-notched-tiles',
    'title': 'Notched tiles of the Masjid-e Ali, Isfahan',
    'short': 'Masjid-e Ali notched tiles', 'subtitle': 'Masjid-e Ali, Isfahan',
    'style': 'Persian', 'frame': (297.5, 299.79, 40, 0, 1+2*H, 1+4*H),
    'given': {'O': 'The centre of a small square, at a half-turn point.', 'A': 'The right corner of that square.'},
    'note': 'The finished design was read from Brian Wichmann’s IRA1330 drawing and its corners snapped to exact values. '
            'OA is the half-diagonal of a small square. Two compass transfers of the unit-square diagonal give the rectangular repeat.',
    'changes': 'The plain tile boundaries are retained. The palette is illustrative. No building photograph was checked.',
    'references': 'His page cites David Wade’s IRA 1330 photograph of the Masjid-e Ali, Isfahan, Iran (1552 AD, 959 AH).',
    'pieces': [('notched', 14, 5, 8, 2, 'a'), ('twelve', 12, 4, 4, 2, 'ground'), ('square', 4, 2, 0, 1, 'b')],
}

if __name__ == '__main__':
    run(build, SPEC)
