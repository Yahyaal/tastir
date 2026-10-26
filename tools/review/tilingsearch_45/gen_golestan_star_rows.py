#!/usr/bin/env python3
"""P30: O=(297.5,375.829375), star-point unit=30(1+sqrt(2)) pt.

The rectangular half-sides are 2,1+sqrt(2). Independent source areas
and counts in SPEC sum to 8+16H. Equal stars in different surroundings
remain one geometric type; the pentagons retain two source fill classes.
"""
import math

import common as cm
from common import g, step
from half_turn import unit_star, rectangle, diagonals, run

H = math.sqrt(.5)


def build():
    unit_star()
    step('Draw a circle with centre A and opening OM. '
         'It crosses the horizontal line through O at R and S, left and right of A. '
         'Draw a vertical line through each of R and S. '
         'Turn both lines round O by 90°, three times.', 'compass', ['A', 'M', 'R', 'S'])
    g.circle_from('cr', 'A', 'O', 'M')
    g.meet('R', 'cr', 'h', (1-H, 0))
    g.meet('S', 'cr', 'h', (1+H, 0))
    g.line_par('rv', 'R', 'v')
    g.line_par('sv', 'S', 'v')
    g.repeat('ends', ['rv', 'sv'], 'rot4')
    step('Draw a circle with centre O through K1. '
         'Draw a circle with centre B, with the same opening. '
         'It crosses the horizontal line through O at P, right of O. '
         'Draw a circle with centre A, with the same opening. '
         'It crosses the horizontal line through O at Q, right of A.', 'compass', ['K1', 'B', 'A', 'P', 'Q'])
    g.circle_through('ck', 'O', 'K1')
    cm.circle_radius_of('cp', 'B', 'ck')
    g.meet('P', 'cp', 'h', (2*H-1, 0))
    cm.circle_radius_of('cq', 'A', 'ck')
    g.meet('Q', 'cq', 'h', (1+2*H, 0))
    diagonals(['P', 'Q'])
    step('Draw a circle with centre A through O. '
         'It crosses the horizontal line through O again at E, right of A. '
         'Draw a circle with centre O through Q. It crosses the vertical line through O at V, above O.',
         'compass', ['A', 'E', 'Q', 'V'])
    g.circle_through('ce', 'A', 'O')
    g.meet('E', 'ce', 'h', (2, 0))
    g.circle_through('coq', 'O', 'Q')
    g.meet('V', 'coq', 'v', (0, 1+2*H))
    rectangle('E', 'V', 2, 1+2*H)


SPEC = {
    'code': 'P30', 'folder': 'data17', 'id': 'golestan-palace-star-rows',
    'title': 'Stars and connecting tiles of the Golestan Palace, Tehran',
    'short': 'Golestan Palace star rows', 'subtitle': 'Golestan Palace, Tehran',
    'style': 'Persian', 'star': 8,
    'frame': (297.5, 375.829375, 30*(1+2*H), 0, 2, 1+2*H),
    'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Its right point.'},
    'note': 'The finished design was read from Brian Wichmann’s P30 drawing and its corners snapped to exact values. '
            'OA is the star’s point radius. The star’s two squares and transfers of the unit-square diagonal give the rectangular repeat.',
    'changes': 'The plain boundaries and the three source fill classes are retained. The numeric palette is illustrative. '
               'Equal star outlines in different surroundings remain one piece type. No palace photograph was checked.',
    'references': 'Mahmood Maher al-Naqsh, Design and execution of drawing in Iranian tilework, Islamic period '
                  '(Reza Abbasi Museum, 1983), volume 5, page 30, Golestan Palace, Tehran, colours from the original; '
                  'Wichmann and Wade, Islamic Design: a Mathematical Approach (2017), figure A.4.',
    'pieces': [('star', 16, 8, -8, 3, 'a'), ('ten', 10, 1, 0, 2, 'ground'),
               ('eight', 8, 2, -2, 8, 'b'), ('square', 4, 6, -8, 1, 'b'), ('pentagon', 5, -2.5, 4, 16, 'b')],
    'placements': {'repeat': [1, 1], 'rules': [{'piece': 'pentagon', 'nth': i, 'color': 'a'} for i in range(4, 12)]},
}

if __name__ == '__main__':
    run(build, SPEC)
