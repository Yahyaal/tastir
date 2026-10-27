#!/usr/bin/env python3
"""F109: star-point unit 35(1+sqrt(2)) pt, O=(301.480625,374.980625).

The rectangular half-sides are 2+sqrt(2), sqrt(2). Independent source
areas and counts in SPEC sum to 8+16H = 4(2+2H)(2H), H=sqrt(2)/2.
"""
import math

import common as cm
from common import g, step
from half_turn import unit_star, rectangle, diagonals, run

H = math.sqrt(.5)


def build():
    unit_star()
    step('Draw a circle with centre O through K1. '
         'It crosses the vertical line through O at V, above O. '
         'Draw a circle with centre A through O. '
         'It crosses the horizontal line through O again at E, right of A.', 'compass', ['K1', 'V', 'E'])
    g.circle_through('ck', 'O', 'K1')
    g.meet('V', 'ck', 'v', (0, 2*H))
    g.circle_through('ce', 'A', 'O')
    g.meet('E', 'ce', 'h', (2, 0))
    step('Draw a circle with centre E and opening from O to K1. '
         'It crosses the horizontal line through O at X, right of E.', 'compass', ['E', 'K1', 'X'])
    cm.circle_radius_of('cx', 'E', 'ck')
    g.meet('X', 'cx', 'h', (2+2*H, 0))
    rectangle('X', 'V', 2+2*H, 2*H)
    step('Draw a circle with centre E and opening OM. '
         'It crosses the horizontal line through O at W, right of E. '
         'Draw a vertical line through W. Turn it round O by 180°.', 'compass', ['E', 'M', 'W'])
    g.circle_from('cw', 'E', 'O', 'M')
    g.meet('W', 'cw', 'h', (2+H, 0))
    g.line_par('wx', 'W', 'v')
    g.repeat('wxPair', ['wx'], 'rot2')
    step('Draw a circle with centre B and opening from O to K1. '
         'It crosses the horizontal line through O at P, right of O.', 'compass', ['B', 'K1', 'P'])
    cm.circle_radius_of('cp', 'B', 'ck')
    g.meet('P', 'cp', 'h', (2*H-1, 0))
    step('Draw a circle with centre A and opening from O to K1. '
         'It crosses the horizontal line through O at J, right of A.', 'compass', ['A', 'K1', 'J'])
    cm.circle_radius_of('cj', 'A', 'ck')
    g.meet('J', 'cj', 'h', (1+2*H, 0))
    step('Draw a circle with centre E and opening OA. '
         'It crosses the horizontal line through O at Z, right of E.', 'compass', ['E', 'Z'])
    g.circle_from('cz', 'E', 'O', 'A')
    g.meet('Z', 'cz', 'h', (3, 0))
    step('Draw a circle with centre J and opening from O to K1. '
         'It crosses the horizontal line through O at R, right of J. '
         'Draw a circle with centre P, with the same opening. '
         'It crosses the horizontal line through O at S, right of P.', 'compass', ['J', 'P', 'K1', 'R', 'S'])
    cm.circle_radius_of('cr', 'J', 'ck')
    g.meet('R', 'cr', 'h', (1+4*H, 0))
    cm.circle_radius_of('cs', 'P', 'ck')
    g.meet('S', 'cs', 'h', (-1+4*H, 0))
    diagonals(['Z'])
    diagonals(['R', 'S'])


SPEC = {
    'code': 'F109', 'folder': 'data16', 'id': 'nishapur-mahruq-star-rows',
    'title': 'Stars and connecting tiles of the Mahruq imamzadeh, Nishapur',
    'short': 'Mahruq star rows', 'subtitle': 'Mahruq imamzadeh, Nishapur',
    'style': 'Persian', 'star': 8,
    'frame': (301.480625, 374.980625, 35*(1+2*H), 0, 2+2*H, 2*H),
    'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Its right point.'},
    'note': 'The finished design was read from Brian Wichmann’s F109 drawing and its corners snapped to exact values. '
            'OA is the star’s point radius. Compass transfers of the square diagonal and of OA give the longer rectangular repeat.',
    'changes': 'The plain tile boundaries are retained. The palette is illustrative. '
               'The source says the original colouring had extensive ornamentation, which is not reconstructed here. No tomb photograph was checked.',
    'references': 'Mahmood Maher al-Naqsh, Design and execution of drawing in Iranian tilework, Islamic period '
                  '(Reza Abbasi Museum, 1983), volume 3, figure 109, page 144; Mahruq imamzadeh, Nishabur, Iran.',
    'pieces': [('star', 16, 8, -8, 2, 'a'), ('eight', 8, 2, 0, 4, 'a'),
               ('kite', 4, -1, 2, 8, 'b'), ('square', 4, 6, -8, 2, 'a'), ('pentagon', 5, -2.5, 4, 8, 'b')],
}

if __name__ == '__main__':
    run(build, SPEC)
