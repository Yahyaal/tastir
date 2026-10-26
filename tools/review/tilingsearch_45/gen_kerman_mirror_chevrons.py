#!/usr/bin/env python3
"""P111: pm, O=(297.5,469.589375), OA=32(1+sqrt(2)) pt.

The star-point unit gives half-sides 1,sqrt(2), and a horizontal mirror.
Unlike the half-turn generators, extra diagonals are mirrored in OA only.
The two noncongruent ten-sided chevrons have the same engine invariants
(area, sorted sides and perimeter), so share one golden key; no edge is lost.
"""
import math

import common as cm
from common import g, step
from half_turn import unit_star, run

H = math.sqrt(.5)


def build():
    unit_star()
    step('Draw a circle with centre O through K1. '
         'It crosses the vertical line through O at V, above O.', 'compass', ['K1', 'V'])
    g.circle_through('ck', 'O', 'K1')
    g.meet('V', 'ck', 'v', (0, 2*H))
    step('Draw a horizontal line through V. Turn it round O by 180°. '
         'They cross the vertical lines through A and B at N1, N2, N3 and N4.', 'ruler', ['V', 'A', 'B'])
    g.line_par('sideY', 'V', 'h')
    g.repeat('frame', ['sideY'], 'rot2')
    for name, x, y, a, b in [('N1', 1, 1, 'gx', 'sideY'), ('N2', -1, 1, 'gxw', 'sideY'),
                              ('N3', -1, -1, 'gxw', 'sideY@1'), ('N4', 1, -1, 'gx', 'sideY@1')]:
        g.meet(name, a, b, (x, y*2*H))
    step('Draw a circle with centre B and opening from O to K1. '
         'It crosses the horizontal line through O at P, right of O. '
         'Draw a vertical line through P.', 'compass', ['B', 'K1', 'P'])
    cm.circle_radius_of('cp', 'B', 'ck')
    g.meet('P', 'cp', 'h', (2*H-1, 0))
    g.line_par('px', 'P', 'v')
    step('Draw a circle with centre P and opening from O to K1. '
         'It crosses the horizontal line through O at Q, right of P. '
         'Draw a line through each of P and Q at 90° to the line from O to K1. '
         'Reflect both lines in the horizontal line through O.', 'compass', ['P', 'K1', 'Q'])
    cm.circle_radius_of('cq', 'P', 'ck')
    g.meet('Q', 'cq', 'h', (4*H-1, 0))
    g.line_perp('pd', 'P', 'd45')
    g.line_perp('qd', 'Q', 'd45')
    g.repeat('mirrorDiagonals', ['pd', 'qd'], 'mirror:h')


SPEC = {
    'code': 'P111', 'folder': 'data181', 'id': 'kerman-ganj-ali-khan-chevrons',
    'title': 'Stars and chevrons of the Ganj Ali Khan complex, Kerman',
    'short': 'Ganj Ali Khan chevrons', 'subtitle': 'Ganj Ali Khan complex, Kerman',
    'style': 'Persian', 'fold': 1,
    'frame': (297.5, 469.589375, 32*(1+2*H), 0, 1, 2*H),
    'given': {'O': 'The centre of an eight-pointed star, on a horizontal mirror.', 'A': 'Its right point, on that mirror.'},
    'note': 'The finished design was read from Brian Wichmann’s P111 drawing and its corners snapped to exact values. '
            'OA is the star’s point radius and follows a mirror. The chevrons keep their direction, so the boundaries have no half-turn.',
    'changes': 'The plain boundaries and the three source fill classes are retained. The palette is illustrative. '
               'Two ten-sided forms share one piece key because their areas, side lengths and perimeters agree; their different outlines are retained. '
               'No building photograph was checked.',
    'references': 'Mahmood Maher al-Naqsh, Design and execution of drawing in Iranian tilework, Islamic period '
                  '(Reza Abbasi Museum, 1983), volume 5, page 111; Ganj Ali Khan complex, Kerman, Iran. '
                  'Wichmann says the colours follow the original mosaic presentation.',
    'pieces': [('star', 16, 8, -8, 1, 'a'), ('chevron', 10, -2, 4, 2, 'b'),
               ('square', 4, 6, -8, 1, 'a'), ('pentagon', 5, -2.5, 4, 4, 'b')],
    'placements': {'repeat': [1, 1], 'rules': [{'piece': 'pentagon', 'nth': 2, 'color': 'c'}]},
}

if __name__ == '__main__':
    run(build, SPEC)
