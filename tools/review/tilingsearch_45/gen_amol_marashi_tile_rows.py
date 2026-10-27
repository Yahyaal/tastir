#!/usr/bin/env python3
"""IRAN16, previously skipped for cmm: O=(304.57,363.93), OA=15sqrt(2) pt.

The white square's half-side is the unit. Rectangular half-sides are
2+sqrt(2),4+sqrt(2); independent areas in SPEC sum to 40+48H.
Clipped white edge fragments outside this cell are not complete tiles.
"""
import math

import common as cm
from common import g, step
from half_turn import diagonals, run

H = math.sqrt(.5)


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'They make the square with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'They make the square with corners K1, K2, K3 and K4.')
    step('Draw a circle with centre O through K1. '
         'It crosses the horizontal line through O at T, right of A. '
         'Draw a line through T at 90° to the line from O to K1. '
         'Turn it round O by 90°, three times.', 'compass', ['K1', 'T'])
    g.circle_through('ck', 'O', 'K1')
    g.meet('T', 'ck', 'h', (2*H, 0))
    g.line_perp('td', 'T', 'd45')
    g.repeat('tips', ['td'], 'rot4')
    step('Draw a circle with centre A and opening from O to K1. '
         'It crosses the horizontal line through O at S, right of A. '
         'Draw a vertical line through S. Turn it round O by 180°.', 'compass', ['A', 'K1', 'S'])
    cm.circle_radius_of('cs', 'A', 'ck')
    g.meet('S', 'cs', 'h', (1+2*H, 0))
    g.line_par('sx', 'S', 'v')
    g.repeat('sxPair', ['sx'], 'rot2')
    step('Draw a circle with centre A through O. '
         'It crosses the horizontal line through O again at E, right of A. '
         'Draw a circle with centre E and opening from O to K1. '
         'It crosses the horizontal line through O at U, right of E.', 'compass', ['A', 'E', 'K1', 'U'])
    g.circle_through('ce', 'A', 'O')
    g.meet('E', 'ce', 'h', (2, 0))
    cm.circle_radius_of('cu', 'E', 'ck')
    g.meet('U', 'cu', 'h', (2+2*H, 0))
    step('Draw a circle with centre U and opening OA. '
         'It crosses the horizontal line through O at W, right of U. '
         'Draw a circle with centre W, with the same opening. '
         'It crosses the horizontal line through O at Z, right of W.', 'compass', ['U', 'W', 'Z'])
    g.circle_from('cw', 'U', 'O', 'A')
    g.meet('W', 'cw', 'h', (3+2*H, 0))
    g.circle_from('cz', 'W', 'O', 'A')
    g.meet('Z', 'cz', 'h', (4+2*H, 0))
    step('Draw a circle with centre O through W. '
         'It crosses the vertical line through O at R, above O. '
         'Draw a horizontal line through R. Turn it round O by 180°.', 'compass', ['W', 'R'])
    g.circle_through('cor', 'O', 'W')
    g.meet('R', 'cor', 'v', (0, 3+2*H))
    g.line_par('ry', 'R', 'h')
    g.repeat('ryPair', ['ry'], 'rot2')
    diagonals(['U', 'Z'])
    step('Draw a circle with centre O through Z. '
         'It crosses the vertical line through O at V, above O. '
         'Draw a vertical line through U. Draw a horizontal line through V. '
         'Turn both lines round O by 180°. They cross at N1, N2, N3 and N4.', 'compass', ['Z', 'V', 'U'])
    g.circle_through('cov', 'O', 'Z')
    g.meet('V', 'cov', 'v', (0, 4+2*H))
    g.line_par('sideX', 'U', 'v')
    g.line_par('sideY', 'V', 'h')
    g.repeat('frame', ['sideX', 'sideY'], 'rot2')
    for name, x, y, a, b in [('N1', 1, 1, 'sideX', 'sideY'), ('N2', -1, 1, 'sideX@1', 'sideY'),
                              ('N3', -1, -1, 'sideX@1', 'sideY@1'), ('N4', 1, -1, 'sideX', 'sideY@1')]:
        g.meet(name, a, b, (x*(2+2*H), y*(4+2*H)))


SPEC = {
    'code': 'IRAN16', 'folder': 'data197', 'id': 'amol-marashi-tile-rows',
    'title': 'Tile rows of the Mir Qavam al-Din Mar’ashi building, Amol',
    'short': 'Amol Mar’ashi tile rows', 'subtitle': 'Mir Qavam al-Din Mar’ashi building, Amol',
    'style': 'Persian', 'frame': (304.57, 363.93, 15*math.sqrt(2), 0, 2+2*H, 4+2*H),
    'given': {'O': 'The centre of a small square, at a half-turn point.', 'A': 'The midpoint of its right-hand side.'},
    'note': 'The finished design was read from Brian Wichmann’s IRAN16 drawing and its corners snapped to exact values. '
            'OA is half a small square’s side. The unit-square diagonal and compass transfers give the longer rectangular repeat.',
    'changes': 'The plain boundaries and four source fill classes are retained. The numeric palette is illustrative. No building photograph was checked.',
    'references': 'Al-Naqsh, Design and execution of drawing in Iranian tilework, Islamic period (Reza Abbasi Museum, 1983), '
                  'volume 2, page 176, Mir Qavam al-Din Mar’ashi, Amol. '
                  'Also Bonner page 267, figure 140: Sultan Han, Kayseri (1232–6), and Esrefoglu Suleyman Bey, Beysehir (1296–7).',
    'pieces': [('ten', 10, 6, 8, 2, 'a'), ('eight', 8, 4, 4, 4, 'b'),
               ('square', 4, 4, 0, 2, 'ground'), ('pentagon', 5, 1, 4, 4, 'd')],
}

if __name__ == '__main__':
    run(build, SPEC)
