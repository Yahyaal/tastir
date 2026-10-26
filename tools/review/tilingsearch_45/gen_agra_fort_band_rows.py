#!/usr/bin/env python3
"""DW5: remove bevel facets, expand coloured faces by half the 15 pt band.

O=(300.91375,374.41375), star-point OA=30(1+sqrt(2)) pt. The rectangular
half-sides are 2,1. Independent source areas/counts in SPEC sum to eight.
Input is the complete precision-two pieces file, including bevels.
"""
import math

import common as cm
from common import g, step
from half_turn import unit_star, diagonals, run

H = math.sqrt(.5)


def build():
    unit_star()
    step('Draw a circle with centre A and opening OM. '
         'It crosses the horizontal line through O at S, right of A. '
         'Draw a vertical line through S. Turn it round O by 180°.', 'compass', ['A', 'M', 'S'])
    g.circle_from('cs', 'A', 'O', 'M')
    g.meet('S', 'cs', 'h', (1+H, 0))
    g.line_par('sx', 'S', 'v')
    g.repeat('sxPair', ['sx'], 'rot2')
    step('Draw a circle with centre C and opening OM. '
         'It crosses the vertical line through O at R, below C. '
         'Draw a horizontal line through R. Turn it round O by 180°.', 'compass', ['C', 'M', 'R'])
    g.circle_from('cr', 'C', 'O', 'M')
    g.meet('R', 'cr', 'v', (0, 1-H))
    g.line_par('ry', 'R', 'h')
    g.repeat('ryPair', ['ry'], 'rot2')
    step('Draw a circle with centre O through K1.', 'compass', ['K1'])
    g.circle_through('ck', 'O', 'K1')
    step('Draw a circle with centre B and opening from O to K1. '
         'It crosses the horizontal line through O at P, right of O. '
         'Draw a circle with centre A, with the same opening. '
         'It crosses the horizontal line through O at Q, right of A.', 'compass', ['B', 'A', 'K1', 'P', 'Q'])
    cm.circle_radius_of('cp', 'B', 'ck')
    g.meet('P', 'cp', 'h', (2*H-1, 0))
    cm.circle_radius_of('cq', 'A', 'ck')
    g.meet('Q', 'cq', 'h', (1+2*H, 0))
    diagonals(['P', 'Q'])
    step('Draw a circle with centre A through O. '
         'It crosses the horizontal line through O again at E, right of A. '
         'Draw a vertical line through E. Turn it round O by 180°. '
         'They cross the horizontal lines through C and D at N1, N2, N3 and N4.', 'compass', ['A', 'E', 'C', 'D'])
    cm.steps[-1]['textWithoutHelpers'] = ('Draw a circle with centre A through O. '
        'It crosses the horizontal line through O again at E, right of A.')
    g.circle_through('ce', 'A', 'O')
    g.meet('E', 'ce', 'h', (2, 0))
    g.line_par('sideX', 'E', 'v')
    g.repeat('frame', ['sideX'], 'rot2')
    for name, x, y, a, b in [('N1', 1, 1, 'sideX', 'gy'), ('N2', -1, 1, 'sideX@1', 'gy'),
                              ('N3', -1, -1, 'sideX@1', 'gys'), ('N4', 1, -1, 'sideX', 'gys')]:
        g.meet(name, a, b, (2*x, y))


SPEC = {
    'code': 'DW5', 'folder': 'data214', 'id': 'agra-fort-band-rows',
    'title': 'Stars and banded rows of the Agra Fort', 'short': 'Agra Fort band rows',
    'subtitle': 'Agra Fort, Agra, India', 'style': 'Mughal', 'star': 8, 'look': 'strapwork',
    'frame': (300.91375, 374.41375, 30*(1+2*H), 15, 2, 1),
    'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Its right point.'},
    'note': 'The finished design was read from Brian Wichmann’s DW5 drawing and its band centre lines snapped to exact values. '
            'OA is the star’s point radius. The unit star and compass transfers fix the rectangular repeat.',
    'changes': 'The bevel facets are replaced by single lines along the centres of the 15 pt bands. '
               'The four source fill classes are retained with an illustrative numeric palette. No fort photograph was checked.',
    'references': 'David Wade’s IND 0404 photograph, Agra Fort, India, the top panel, as cited by Wichmann.',
    'pieces': [('star', 16, 8, -8, 1, 'ground'), ('ten', 10, 1, 0, 1, 'b'),
               ('eight', 8, 2, -2, 4, 'c'), ('square', 4, 6, -8, 1, 'ground'), ('pentagon', 5, -2.5, 4, 6, 'a')],
}


def drawing(pieces):
    bands = {(0, 0, 0), (.3, .16, .04), (.43, .29, .11)}
    return cm.frame_pieces(pieces, SPEC['frame'][:2], 2*SPEC['frame'][2], 15,
                           keep=lambda p: tuple(round(c, 2) for c in p['fill']) not in bands)


if __name__ == '__main__':
    run(build, SPEC, drawing)
