#!/usr/bin/env python3
"""P105: central square O=(297.5,362.666875), half-diagonal OA=25 pt.

With H=sqrt(2)/2 the rectangular half-sides are 5+8H,3+4H.
The independently snapped source areas in SPEC sum to 124+176H.
"""
import math

import common as cm
from common import g, step
from half_turn import diagonals, run

H = math.sqrt(.5)


def transfer(name, centre, radius, x):
    circle = 'circle_' + name
    a, b = radius
    g.circle_from(circle, centre, a, b)
    g.meet(name, circle, 'h', (x, 0))


def verticals(points):
    names = []
    for point in points:
        name = 'vertical_' + point
        g.line_par(name, point, 'v')
        names.append(name)
    g.repeat('pair_' + points[0], names, 'rot2')


def build():
    cm.cell_square('Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'They cross at K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. '
        'They cross at K1. Draw a straight line through O and K1.')
    step('The line from O to K1 crosses the circle at F. '
         'Draw a vertical line through F. It crosses the horizontal line through O at M. '
         'Draw a circle with centre O through K1.', 'compass', ['F', 'M', 'K1'])
    g.meet('F', 'c', 'd45', (H, H))
    g.line_par('fv', 'F', 'v')
    g.meet('M', 'fv', 'h', (H, 0))
    g.circle_through('ck', 'O', 'K1')
    step('Draw a straight line through A and C. Turn it round O by 90°, three times.', 'ruler', ['A', 'C'])
    g.line_through('ac', 'A', 'C')
    g.repeat('diamond', ['ac'], 'rot4')
    step('Draw a circle with centre A and opening OM. '
         'It crosses the horizontal line through O at S, right of A. '
         'Draw a circle with centre S and opening from O to K1. '
         'It crosses the same line at T, right of S. '
         'Draw a vertical line through each of S and T. Turn both lines round O by 180°.', 'compass', ['A', 'M', 'S', 'T'])
    transfer('S', 'A', ('O', 'M'), 1+H)
    transfer('T', 'S', ('O', 'K1'), 1+3*H)
    verticals(['S', 'T'])
    step('Draw a circle with centre T and opening OA. '
         'It crosses the horizontal line through O at E, right of T. '
         'Draw a circle with centre E, with the same opening. '
         'It crosses the same line at U, right of E.', 'compass', ['T', 'E', 'U'])
    transfer('E', 'T', ('O', 'A'), 2+3*H)
    transfer('U', 'E', ('O', 'A'), 3+3*H)
    step('Draw a circle with centre U and opening from O to K1. '
         'It crosses the horizontal line through O at V, right of U. '
         'Draw a circle with centre V and opening OS. '
         'It crosses the same line at J, right of V. '
         'Draw a vertical line through V. Turn it round O by 180°.', 'compass', ['U', 'S', 'V', 'J'])
    transfer('V', 'U', ('O', 'K1'), 3+5*H)
    transfer('J', 'V', ('O', 'S'), 4+6*H)
    verticals(['V'])
    step('Draw a circle with centre J and opening OM. '
         'It crosses the horizontal line through O at L, right of J. '
         'Draw a circle with centre L and opening OA. '
         'It crosses the same line at Q, right of L. '
         'Draw a vertical line through each of L and Q. Turn both lines round O by 180°.', 'compass', ['J', 'M', 'L', 'Q'])
    transfer('L', 'J', ('O', 'M'), 4+7*H)
    transfer('Q', 'L', ('O', 'A'), 5+7*H)
    verticals(['L', 'Q'])
    step('Draw a circle with centre Q and opening OM. '
         'It crosses the horizontal line through O at X, right of Q. '
         'Draw a vertical line through X. Turn it round O by 180°.', 'compass', ['Q', 'M', 'X'])
    transfer('X', 'Q', ('O', 'M'), 5+8*H)
    verticals(['X'])
    step('Draw a circle with centre O through each of S, E and U. '
         'They cross the vertical line through O at Y1, Y2 and Y3, above O. '
         'Draw a horizontal line through each new point. Turn the lines round O by 180°.', 'compass', ['S', 'E', 'U'])
    hs = []
    for point, label, y in [('S', 'Y1', 1+H), ('E', 'Y2', 2+3*H), ('U', 'Y3', 3+3*H)]:
        g.circle_through('circle_' + label, 'O', point)
        g.meet(label, 'circle_' + label, 'v', (0, y))
        g.line_par('horizontal_' + label, label, 'h')
        hs.append('horizontal_' + label)
    g.repeat('horizontalPairs', hs, 'rot2')
    step('Draw a circle with centre U and opening OM. '
         'It crosses the horizontal line through O at P, right of U. '
         'Draw a circle with centre O through P. '
         'It crosses the vertical line through O at Y4, above O. '
         'Draw a horizontal line through Y4. Turn it round O by 180°. '
         'These lines cross the verticals through X at N1, N2, N3 and N4.', 'compass', ['U', 'M', 'P', 'Y4'])
    transfer('P', 'U', ('O', 'M'), 3+4*H)
    g.circle_through('circle_Y4', 'O', 'P')
    g.meet('Y4', 'circle_Y4', 'v', (0, 3+4*H))
    g.line_par('horizontal_Y4', 'Y4', 'h')
    g.repeat('frameY', ['horizontal_Y4'], 'rot2')
    for label, x, y, a, b in [('N1', 1, 1, 'vertical_X', 'horizontal_Y4'),
            ('N2', -1, 1, 'vertical_X@1', 'horizontal_Y4'),
            ('N3', -1, -1, 'vertical_X@1', 'horizontal_Y4@1'),
            ('N4', 1, -1, 'vertical_X', 'horizontal_Y4@1')]:
        g.meet(label, a, b, (x*(5+8*H), y*(3+4*H)))
    step('Draw a circle with centre B and opening from O to K1. '
         'It crosses the horizontal line through O at R, right of O. '
         'Draw a circle with centre A, with the same opening. '
         'It crosses the same line at W, right of A.', 'compass', ['B', 'A', 'K1', 'R', 'W'])
    transfer('R', 'B', ('O', 'K1'), -1+2*H)
    transfer('W', 'A', ('O', 'K1'), 1+2*H)
    diagonals(['R', 'W'])
    step('Draw a circle with centre W and opening from O to K1. '
         'It crosses the horizontal line through O at Z, right of W.', 'compass', ['W', 'K1', 'Z'])
    transfer('Z', 'W', ('O', 'K1'), 1+4*H)
    diagonals(['Z', 'P'])
    step('Draw a circle with centre P and opening from O to K1. '
         'It crosses the horizontal line through O at G, right of P. '
         'Draw a circle with centre G and opening AB. '
         'It crosses the same line at H, right of G.', 'compass', ['P', 'K1', 'G', 'H', 'A', 'B'])
    transfer('G', 'P', ('O', 'K1'), 3+6*H)
    transfer('H', 'G', ('A', 'B'), 5+6*H)
    diagonals(['G', 'H'])
    step('The vertical through Q crosses the horizontal through Y2 at Z1. '
         'Draw a line through each of X and Z1 at 90° to the line from O to K1. '
         'Turn both lines round O by 90°, three times.', 'ruler', ['Q', 'Y2', 'X', 'Z1'])
    g.meet('Z1', 'vertical_Q', 'horizontal_Y2', (5+7*H, 2+3*H))
    g.line_perp('diagonal_X', 'X', 'd45')
    g.line_perp('diagonal_Z1', 'Z1', 'd45')
    g.repeat('outerDiagonals', ['diagonal_X', 'diagonal_Z1'], 'rot4')


SPEC = {
    'code': 'P105', 'folder': 'data181', 'id': 'qom-atiq-courtyard-rows',
    'title': 'Stars and squares of the Atiq courtyard, Qom', 'short': 'Atiq courtyard rows',
    'subtitle': 'Atiq courtyard, Qom, Iran', 'style': 'Persian', 'star': 8,
    'frame': (297.5, 362.666875, 25, 0, 5+8*H, 3+4*H),
    'given': {'O': 'The centre of a small square, at a half-turn point.', 'A': 'Its right corner.'},
    'note': 'The finished design was read from Brian Wichmann’s P105 drawing and its corners snapped to exact values. '
            'OA is a small square’s half-diagonal. Compass transfers of OA, OM and the unit-square diagonal give the rectangular repeat.',
    'changes': 'The plain boundaries and three source fill classes are retained. The numeric palette is illustrative. No courtyard photograph was checked.',
    'references': 'Mahmood Maher al-Naqsh, Design and execution of drawing in Iranian tilework, Islamic period '
                  '(Reza Abbasi Museum, 1983), volume 5, page 105, Atiq courtyard, Qom, Iran. '
                  'Wichmann says the colours follow the original mosaic presentation.',
    'placements': {'repeat': [1, 1], 'rules': [{'piece': 'star', 'nth': 0, 'color': 'a'}] +
                   [{'piece': 'square', 'nth': n, 'color': 'b'} for n in [0, 1, 4, 6]]},
    'pieces': [('star', 16, 8, 8, 5, 'ground'), ('upright_ten', 10, 3, 4, 3, 'b'),
               ('ten', 10, 2, 4, 14, 'b'), ('eight', 8, 2, 2, 8, 'b'),
               ('square', 4, 2, 0, 9, 'a'), ('pentagon', 5, .5, 2, 26, 'b')],
}

if __name__ == '__main__':
    run(build, SPEC)
