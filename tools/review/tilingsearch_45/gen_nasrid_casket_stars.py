#!/usr/bin/env python3
"""VA1: O=(297.5,374.22), OA=20(1+sqrt(2)) pt, 12 pt interlaced bands.

Expand coloured faces by 6 pt. Independent snapped source shoelaces give
six types, 84 pieces, area 32+48H, for half-sides 2+2H and 2+4H.
"""
import math

import common as cm
from common import g, step
from half_turn import unit_star, diagonals, run

H = math.sqrt(.5)


def transfer(name, centre, a, b, x):
    circle = 'circle_' + name
    g.circle_from(circle, centre, a, b)
    g.meet(name, circle, 'h', (x, 0))


def build():
    unit_star()
    step('Draw a circle with centre A through O. '
         'It crosses the horizontal line through O again at E, right of A. '
         'Draw a circle with centre E and opening OA. '
         'It crosses the same line at J, right of E.', 'compass', ['A', 'E', 'J'])
    transfer('E', 'A', 'O', 'A', 2)
    transfer('J', 'E', 'O', 'A', 3)
    step('Draw a circle with centre O through K1. '
         'Draw a circle with centre M, with the same opening. '
         'It crosses the horizontal line through O at L, right of M. '
         'Draw a vertical line through L. Turn it round O by 90°, three times.', 'compass', ['K1', 'M', 'L'])
    g.circle_through('ck', 'O', 'K1')
    transfer('L', 'M', 'O', 'K1', 3*H)
    g.line_par('lx', 'L', 'v')
    g.repeat('ls', ['lx'], 'rot4')
    step('Draw a circle with centre E and opening OM. '
         'It crosses the horizontal line through O at P, right of E. '
         'Draw a vertical line through P. Turn it round O by 90°, three times.', 'compass', ['E', 'M', 'P'])
    transfer('P', 'E', 'O', 'M', 2+H)
    g.line_par('px', 'P', 'v')
    g.repeat('ps', ['px'], 'rot4')
    step('Draw a circle with centre A and opening OM. '
         'It crosses the horizontal line through O at S, right of A. '
         'Draw a circle with centre S through O. '
         'It crosses the same line again at T, right of S. '
         'Draw a vertical line through T. Turn it round O by 180°.', 'compass', ['A', 'M', 'S', 'T'])
    transfer('S', 'A', 'O', 'M', 1+H)
    g.circle_through('circle_T', 'S', 'O')
    g.meet('T', 'circle_T', 'h', (2+2*H, 0))
    g.line_par('sideX', 'T', 'v')
    g.repeat('frameX', ['sideX'], 'rot2')
    step('Draw a circle with centre T and opening OM. '
         'It crosses the horizontal line through O at U, right of T. '
         'Draw a circle with centre T and opening from O to K1. '
         'It crosses the same line at Z, right of U.', 'compass', ['T', 'M', 'K1', 'U', 'Z'])
    transfer('U', 'T', 'O', 'M', 2+3*H)
    transfer('Z', 'T', 'O', 'K1', 2+4*H)
    step('Draw a circle with centre O through each of U and Z. '
         'They cross the vertical line through O at R and V, above O. '
         'Draw a horizontal line through each of R and V. Turn both lines round O by 180°. '
         'The line through V and its copy cross the verticals through T at N1, N2, N3 and N4.', 'compass', ['U', 'Z', 'R', 'V'])
    for label, point, y, line in [('R', 'U', 2+3*H, 'ry'), ('V', 'Z', 2+4*H, 'sideY')]:
        g.circle_through('circle_' + label, 'O', point)
        g.meet(label, 'circle_' + label, 'v', (0, y))
        g.line_par(line, label, 'h')
    g.repeat('frameY', ['ry', 'sideY'], 'rot2')
    for label, x, y, a, b in [('N1', 1, 1, 'sideX', 'sideY'), ('N2', -1, 1, 'sideX@1', 'sideY'),
            ('N3', -1, -1, 'sideX@1', 'sideY@1'), ('N4', 1, -1, 'sideX', 'sideY@1')]:
        g.meet(label, a, b, (x*(2+2*H), y*(2+4*H)))
    step('Draw a circle with centre B and opening from O to K1. '
         'It crosses the horizontal line through O at D1, right of O. '
         'Draw a circle with centre D1, with the same opening. '
         'It crosses the same line at D2, right of D1.', 'compass', ['B', 'K1', 'D1', 'D2'])
    transfer('D1', 'B', 'O', 'K1', 2*H-1)
    transfer('D2', 'D1', 'O', 'K1', 4*H-1)
    step('Draw a circle with centre A and opening from O to K1. '
         'It crosses the horizontal line through O at Q, right of A. '
         'Draw a circle with centre Q, with the same opening. '
         'It crosses the same line at W, right of Q.', 'compass', ['A', 'K1', 'Q', 'W'])
    transfer('Q', 'A', 'O', 'K1', 1+2*H)
    transfer('W', 'Q', 'O', 'K1', 1+4*H)
    diagonals(['D2', 'W'])
    step('Draw a circle with centre W and opening AB. '
         'It crosses the horizontal line through O at G, right of W. '
         'Draw a circle with centre G, with the same opening. '
         'It crosses the same line at H, right of G.', 'compass', ['W', 'A', 'B', 'G', 'H'])
    transfer('G', 'W', 'A', 'B', 3+4*H)
    transfer('H', 'G', 'A', 'B', 5+4*H)
    diagonals(['G', 'H'])
    diagonals(['J'])


SPEC = {
    'code': 'VA1', 'folder': 'data185', 'id': 'nasrid-casket-stars',
    'title': 'Interlaced stars of a Nasrid casket', 'short': 'Nasrid casket stars',
    'subtitle': 'Nasrid casket, V&A 270-1895, Granada', 'style': 'Nasrid', 'star': 8,
    'palette': 'Alhambra', 'look': 'interlace',
    'frame': (297.5, 374.22, 20*(1+2*H), 12, 2+2*H, 2+4*H),
    'given': {'O': 'The centre of an eight-pointed star, at a half-turn point.', 'A': 'Its right point.'},
    'note': 'The finished design was read from Brian Wichmann’s VA1 drawing and its band centre lines snapped to exact values. '
            'OA is the full star’s point radius. The unit star and compass transfers fix the rectangular repeat.',
    'changes': 'The coloured faces are expanded to the centres of the 12 pt bands. '
               'The player weaves those centre lines and retains the five source fill classes with an illustrative numeric palette. '
               'No museum photograph was checked.',
    'references': 'Victoria and Albert Museum, casket 270-1895, collection record O369842, '
                  'Granada, Spain, dated 1400–50 AD (802–54 AH), as cited by Wichmann.',
    'placements': {'repeat': [1, 1], 'rules': [{'piece': 'star', 'nth': n, 'color': 'b'} for n in [1, 5]]},
    'pieces': [('star', 16, 8, -8, 6, 'a'), ('twelve', 12, 5, -4, 4, 'ground'),
               ('eight', 8, 2, 0, 10, 'c'), ('square', 4, 6, -8, 8, 'ground'),
               ('pentagon', 5, -2.5, 4, 32, 'd'), ('kite', 4, -1, 2, 24, 'ground')],
}

if __name__ == '__main__':
    run(build, SPEC)
