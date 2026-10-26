#!/usr/bin/env python3
"""HAMA: cmm door panel, OA one straight side of the central ten-sided tile.

The 15 pt bevelled bands are replaced by their centre lines. O is at
(291.215, 371), OA = 40 pt; H = sqrt(2)/2. The rectangular conventional
cell has half-sides 1+6H and 1+2H. Independent source areas: arrow 9/2+6H
four times, ten 3+4H twice, square 2 twice; sum 28+32H.
Usage: gen_hama_door_tiles.py <HAMA-pieces.json> <tutorial.json>
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

    step('The line from O to K1 crosses the circle at F. '
         'Draw a vertical line through F. It crosses the horizontal line through O at M. '
         'Turn the vertical line round O by 90°, three times.', 'ruler', ['F', 'M'])
    g.meet('F', 'c', 'd45', (H, H))
    g.line_par('fv', 'F', 'v')
    g.meet('M', 'fv', 'h', (H, 0))
    g.repeat('neck', ['fv'], 'rot4')

    step('Draw a circle with centre O through K1. '
         'It crosses the horizontal line through O at T, right of A. '
         'Draw a line through T at 90° to the line from O to K1. '
         'Turn it round O by 90°, three times.', 'compass', ['K1', 'T'])
    g.circle_through('ck', 'O', 'K1')
    g.meet('T', 'ck', 'h', (2*H, 0))
    g.line_perp('td', 'T', 'd45')
    g.repeat('points', ['td'], 'rot4')

    step('Draw a circle with centre A and opening OM. '
         'It crosses the horizontal line through O at R, right of A. '
         'Draw a circle with centre O through R. It crosses the vertical line through O at S, above O. '
         'Draw a horizontal line through S. Turn it round O by 180°.', 'compass', ['A', 'M', 'R', 'S'])
    g.circle_from('cr', 'A', 'O', 'M')
    g.meet('R', 'cr', 'h', (1+H, 0))
    g.circle_through('cor', 'O', 'R')
    g.meet('S', 'cor', 'v', (0, 1+H))
    g.line_par('sy', 'S', 'h')
    g.repeat('shoulders', ['sy'], 'rot2')

    step('Draw a circle with centre A and opening from O to K1. '
         'It crosses the horizontal line through O at U, right of A. '
         'Draw a circle with centre O through U. It crosses the vertical line through O at V, above O.',
         'compass', ['A', 'K1', 'U', 'V'])
    cm.circle_radius_of('cu', 'A', 'ck')
    g.meet('U', 'cu', 'h', (1+2*H, 0))
    g.circle_through('cou', 'O', 'U')
    g.meet('V', 'cou', 'v', (0, 1+2*H))

    step('Draw a circle with centre U and opening from O to K1. '
         'It crosses the horizontal line through O at W, right of U. '
         'Draw a circle with centre W, with the same opening. '
         'It crosses the horizontal line through O at X, right of W.', 'compass', ['U', 'K1', 'W', 'X'])
    cm.circle_radius_of('cw', 'U', 'ck')
    g.meet('W', 'cw', 'h', (1+4*H, 0))
    cm.circle_radius_of('cx', 'W', 'ck')
    g.meet('X', 'cx', 'h', (1+6*H, 0))

    step('Draw a vertical line through X. Draw a horizontal line through V. '
         'Turn both lines round O by 180°. They cross at N1, N2, N3 and N4.', 'ruler', ['X', 'V'])
    g.line_par('sideX', 'X', 'v')
    g.line_par('sideY', 'V', 'h')
    g.repeat('frame', ['sideX', 'sideY'], 'rot2')
    for name, x, y, a, b in [('N1', 1, 1, 'sideX', 'sideY'), ('N2', -1, 1, 'sideX@1', 'sideY'),
                              ('N3', -1, -1, 'sideX@1', 'sideY@1'), ('N4', 1, -1, 'sideX', 'sideY@1')]:
        g.meet(name, a, b, (x*(1+6*H), y*(1+2*H)))

    step('Draw a circle with centre W and opening OM. '
         'It crosses the horizontal line through O at P, right of W. '
         'Draw a vertical line through P. Turn it round O by 180°.', 'compass', ['W', 'M', 'P'])
    g.circle_from('cp', 'W', 'O', 'M')
    g.meet('P', 'cp', 'h', (1+5*H, 0))
    g.line_par('px', 'P', 'v')
    g.repeat('arms', ['px'], 'rot2')

    step('Draw a circle with centre X and opening OA. '
         'It crosses the horizontal line through O at J, right of X. '
         'Draw a line through each of W and J at 90° to the line from O to K1.',
         'compass', ['X', 'J', 'W', 'K1'])
    g.circle_from('cj', 'X', 'O', 'A')
    g.meet('J', 'cj', 'h', (2+6*H, 0))
    g.line_perp('wd', 'W', 'd45')
    g.line_perp('jd', 'J', 'd45')
    step('Turn both lines through W and J round O by 90°, three times.', 'ruler', ['W', 'J'])
    g.repeat('diagonals', ['wd', 'jd'], 'rot4')


SPEC = {
    'code': 'HAMA', 'folder': 'data187', 'id': 'hama-azem-door-tiles',
    'title': 'Notched door tiles of the Azem Palace, Hama',
    'short': 'Azem Palace door', 'subtitle': 'Azem Palace, Hama, Syria',
    'style': 'Syrian', 'palette': 'Mamluk wood', 'look': 'strapwork',
    'frame': (291.215, 371, 40, 15, 1+6*H, 1+2*H),
    'given': {'O': 'The centre of a ten-sided tile, at a half-turn point.',
              'A': 'One straight tile-edge length to the right of O.'},
    'note': 'The finished design was read from Brian Wichmann’s HAMA drawing and its corners snapped to exact values. '
            'OA is one straight side of the ten-sided tile. Compass transfers of the square diagonal fix the rectangular repeat.',
    'changes': 'His bevelled wood is represented by single lines along the middles of its 15 pt bands. '
               'The palette is illustrative. No door photograph was checked.',
    'references': 'His page credits Dick Osseman’s pbase photograph of a door panel at the Azem Palace, Hama, Syria.',
    'pieces': [('arrow', 11, 4.5, 6, 4, 'a'), ('ten', 10, 3, 4, 2, 'b'), ('square', 4, 2, 0, 2, 'ground')],
}

if __name__ == '__main__':
    run(build, SPEC)
