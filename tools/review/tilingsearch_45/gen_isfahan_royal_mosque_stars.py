#!/usr/bin/env python3
"""IRA0501: unit star on a cmm lattice, rectangular half-sides 1+sqrt(2), 1.

OA is the star point radius, 50(1+sqrt(2)) PDF points. Independent source
areas, H=sqrt(2)/2: star 8-8H twice, boot 2-2H four, pentagon -5/2+4H eight.
Their sum is 4+8H, the cell area. O=(305.54625,371); the polygons share
boundaries, so the blue stroke is not expanded as a separating band.
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
        'Draw a vertical line through A. Draw a horizontal line through each of C and D. '
        'The lines through A and C cross at K1. Draw a straight line through O and K1.')

    step('The line from O to K1 crosses the circle at F. '
         'Draw a vertical line through F. It crosses the horizontal line through O at M. '
         'Turn the vertical line round O by 90°, three times.', 'ruler', ['F', 'M'])
    g.meet('F', 'c', 'd45', (H, H))
    g.line_par('fv', 'F', 'v')
    g.meet('M', 'fv', 'h', (H, 0))
    g.repeat('square', ['fv'], 'rot4')
    step('Draw a straight line through A and C. Turn it round O by 90°, three times.', 'ruler', ['A', 'C'])
    g.line_through('ac', 'A', 'C')
    g.repeat('diamond', ['ac'], 'rot4')

    step('Draw a circle with centre O through K1. '
         'It crosses the horizontal line through O at T, right of A. '
         'Draw a vertical line through T. Turn it round O by 180°.', 'compass', ['K1', 'T'])
    cm.steps[-1]['textWithoutHelpers'] = 'Draw a circle with centre O through K1.'
    g.circle_through('ck', 'O', 'K1')
    g.meet('T', 'ck', 'h', (2*H, 0))
    g.line_par('tx', 'T', 'v')
    g.repeat('txPair', ['tx'], 'rot2')

    step('Draw a circle with centre B and opening from O to K1. '
         'It crosses the horizontal line through O at P, right of O. '
         'Draw a line through P at 90° to the line from O to K1. '
         'Turn it round O by 90°, three times.', 'compass', ['B', 'K1', 'P'])
    cm.circle_radius_of('cp', 'B', 'ck')
    g.meet('P', 'cp', 'h', (2*H-1, 0))
    g.line_perp('pd', 'P', 'd45')
    g.repeat('pdSet', ['pd'], 'rot4')

    step('Draw a circle with centre C and opening OM. '
         'It crosses the vertical line through O at U, below C. '
         'Draw a horizontal line through U. Turn it round O by 180°.', 'compass', ['C', 'M', 'U'])
    g.circle_from('cu', 'C', 'O', 'M')
    g.meet('U', 'cu', 'v', (0, 1-H))
    g.line_par('uy', 'U', 'h')
    g.repeat('uyPair', ['uy'], 'rot2')

    step('Draw a circle with centre A and opening OM. '
         'It crosses the horizontal line through O at W, right of A. '
         'Draw a vertical line through W. Turn it round O by 180°.', 'compass', ['A', 'M', 'W'])
    g.circle_from('cw', 'A', 'O', 'M')
    g.meet('W', 'cw', 'h', (1+H, 0))
    g.line_par('wx', 'W', 'v')
    g.repeat('wxPair', ['wx'], 'rot2')

    step('Draw a circle with centre A and opening from O to K1. '
         'It crosses the horizontal line through O at X, right of A. '
         'Draw a vertical line through X. Turn it round O by 180°. '
         'The two new lines cross the horizontal lines through C and D at N1, N2, N3 and N4.',
         'compass', ['A', 'K1', 'X'])
    cm.circle_radius_of('cx', 'A', 'ck')
    g.meet('X', 'cx', 'h', (1+2*H, 0))
    g.line_par('sideX', 'X', 'v')
    g.repeat('frame', ['sideX'], 'rot2')
    for name, x, y, a, b in [('N1', 1, 1, 'sideX', 'gy'), ('N2', -1, 1, 'sideX@1', 'gy'),
                              ('N3', -1, -1, 'sideX@1', 'gys'), ('N4', 1, -1, 'sideX', 'gys')]:
        g.meet(name, a, b, (x*(1+2*H), y))
    step('Draw a line through X at 90° to the line from O to K1. '
         'Turn it round O by 90°, three times.', 'ruler', ['X', 'K1'])
    g.line_perp('xd', 'X', 'd45')
    g.repeat('xdSet', ['xd'], 'rot4')


SPEC = {
    'code': 'IRA0501', 'folder': 'data193', 'id': 'isfahan-royal-mosque-star-rows',
    'title': 'Rows of stars of the Royal Mosque, Isfahan',
    'short': 'Royal Mosque star rows', 'subtitle': 'Royal Mosque, Isfahan',
    'style': 'Persian', 'star': 8, 'frame': (305.54625, 371, 50*(1+2*H), 0, 1+2*H, 1),
    'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Its right point.'},
    'note': 'The finished design was read from Brian Wichmann’s IRA0501 drawing and its corners snapped to exact values. '
            'OA is the star’s point radius. Its two squares and compass transfers of the unit-square diagonal fix the rectangular repeat.',
    'changes': 'The plain tile boundaries are retained. The palette is illustrative. No building photograph was checked.',
    'references': 'His page cites Wade IRA 0501 (Royal Mosque, Isfahan, 1611 AD, 1020 AH) and IRA 0718. '
                  'It also cites Bonner, page 278 figure 157 (Hunat Hatun Complex, Kayseri, 1237–8) and page 144 photo 99 (Friday mosque, Isfahan).',
    'pieces': [('star', 16, 8, -8, 2, 'ground'), ('boot', 8, 2, -2, 4, 'a'), ('pentagon', 5, -2.5, 4, 8, 'b')],
}

if __name__ == '__main__':
    run(build, SPEC)
