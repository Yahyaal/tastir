#!/usr/bin/env python3
"""MIR17 (Tiling Search data214/MIR17, Mihrimah Sultan mosque, Üsküdar;
Miroslaw Majewski), ten-fold batch T3.

Reading the drawing (27 October 2026): interlaced bands 10 pt wide, drawn
with bevels; `bands_t3.py` keeps the light pieces and moves each out by half
a band, giving the edge-to-edge tiling of the band centre lines. pmm, with one
ten-pointed star {10/3} (points of 72°) in each cell, at a crossing of
mirrors, 284.19 pt apart across and 632.84 pt up. Turned by 90° so that the
star's lines run at 90° to OA, OB, … as in `tayabad-zayn-stars`, with OA the
distance from O to the star's lines (23.084 pt), the cell is |x| <= W,
|y| <= H with W = 7 + 3√5 and H = 2 tan 72°. Every edge is parallel to a line
of the star, at offsets (a + b√5) from O (drawing within 0.003 of OA, the
bevelled bands' accuracy). The page stops 2.4 OA left of O, so the drawing
is mirrored in the vertical through O.

Use: gen_mihrimah_uskudar_stars.py <MIR17-tiles.json> tutorials/mihrimah-uskudar-stars.json,
pnpm review mihrimah-uskudar-stars, then
gen_mihrimah_uskudar_stars.py finish <dump.json> <tutorial.json>.
Lab: gen_mihrimah_uskudar_stars.py lab <MIR17-tiles.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import snap10_t1 as s10  # noqa: E402
import snap10_t2 as t2  # noqa: E402
import snap10_t3 as t3  # noqa: E402

ORIGIN, UNIT, TURN = (173.5, 54.58), 23.084, 90.0
S5 = math.sqrt(5)
W = 7 + 3 * S5
H = 2 * math.tan(math.radians(72))
t2.HAVE_TOL[0] = 1e-2
_snap = cm.snap
cm.snap = lambda p, tol=0.012: _snap(p, tol)  # the bevelled bands are good to about 0.01 of OA


def near(a, b, p):
    return min(cm.crossings(a, b), key=lambda c: math.dist(c, p))


def seeds():
    t2.opening()
    t2.star_lines('Draw a line through A at 90° to the horizontal line. Turn it round O by 36°, nine times. '
                  'These ten lines touch the circle at A, B, C and on round. Lines three apart cross at the '
                  'points of the ten-pointed star.')
    t2.radial(['B', 'C', 'D', 'E'])
    step('The star line through C crosses the horizontal line at T. '
         'Draw a circle with centre A through F. It crosses the horizontal line at W1. '
         'Draw a circle with centre T and opening OA. It crosses the horizontal line at W2, beyond T. '
         'Draw a vertical line through W1, and one through W2. Turn each round O by 36°, nine times.', 'compass')
    g.meet('T', 't@2', 'h', near('t@2', 'h', (1 + S5, 0)))
    g.circle_through('cA', 'A', 'F')
    g.meet('W1', 'cA', 'h', (3, 0))
    g.circle_from('cT', 'T', 'O', 'A')
    g.meet('W2', 'cT', 'h', near('cT', 'h', (2 + S5, 0)))
    g.line_perp('w3', 'W1', 'h')
    g.line_perp('w5', 'W2', 'h')
    g.repeat('w3r', ['w3'], 'rot10')
    g.repeat('w5r', ['w5'], 'rot10')
    t2.DESC['w3'] = 'the vertical line through W1'
    t2.DESC['w5'] = 'the vertical line through W2'
    for j in range(1, 10):
        t2.DESC['w3@%d' % j] = 'the W1 line turned to %s' % t2.LETTERS[j]
        t2.DESC['w5@%d' % j] = 'the W2 line turned to %s' % t2.LETTERS[j]


def drawing(pieces):
    polys = s10.frame(pieces, ORIGIN, UNIT, TURN)
    return polys + [[(-x, y) for x, y in Q] for Q in polys]


def lab():
    seeds()
    polys = drawing(sys.argv[2])
    print(t2.plan(polys, W, H, tol=3e-3))
    names = cm.lines()
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            for p in cm.crossings(a, b):
                if abs(p[0] - W) < 1e-6 and abs(p[1]) < 8:
                    print('on the right side', a, b, p)
                if abs(p[1] - H) < 1e-6 and abs(p[0]) < 15:
                    print('on the top side', a, b, p)


# What the player hides with helper lines off (hidden_t2.sh).
HIDDEN = {'oB', 'm1@1', 'm1b@1', 'm5@1', 'm5b@1', 'm7@1', 'm7b@1', 'm9', 'P10', 'm11', 'm11@1', 'm11b@1',
          'm13', 'm13b', 'm17@1', 'm17b@1', 'm19', 'm19@1', 'm19b@1', 'm21', 'm21b'}

PLAN = [('P1', 't', 'oB', (1.0, 0.726543), 9, False), ('P2', 'h', 'm1', (0.763932, 0.0), 4, False),
        ('P3', 'v', 'm1b', (0.0, 2.351141), 6, False), ('P4', 'oC', 'm3', (0.854102, 2.628656), 2, False),
        ('P5', 'v', 'm2', (0.0, 0.248217), 8, False), ('P6', 't@3', 'm5', (0.763932, 1.299679), 4, False),
        ('P7', 'oC', 'm5', (0.145898, 0.449028), 2, False), ('P8', 'w5@3', 'm7b', (4.854102, 6.031259), 2, False),
        ('O', 'h', 'v', (0.0, 0.0), 4, True), ('P9', 'm8', 'm9b', (7.472136, 2.427844), 0, False),
        ('P10', 'oB', 'm2', (0.236068, 0.171513), 3, False), ('P11', 'w3@3', 'm11b', (8.708204, 5.983854), 0, False),
        ('P12', 'oC', 'm1b', (0.381966, 1.175571), 4, False), ('P13', 'm12', 'm13b@1', (8.708204, 4.129146), 2, False),
        ('P14', 'm9b', 'm14', (9.472136, 3.077684), 0, False), ('P15', 'm13b@1', 'm15', (9.472136, 4.377362), 2, False),
        ('P7', 'oC', 'm5', (0.145898, 0.449028), 3, True), ('P16', 'w3@3', 'm17b', (9.236068, 6.155367), 4, False),
        ('P17', 'v', 'm7', (0.0, 0.649839), 4, False), ('P18', 'm8b', 'm19b', (11.472136, 3.077684), 0, False),
        ('P10', 'oB', 'm2', (0.236068, 0.171513), 6, True), ('P19', 'm8b', 'm21@1', (12.0, 3.804226), 2, False)]


def build():
    seeds()
    t2.write_plan(PLAN)
    t3.without(HIDDEN)
    cm.steps[6]['textWithoutHelpers'] = 'Draw a straight line through O and C, O and D, and O and E.'
    step('The W2 line turned to C crosses the horizontal line through O at V. '
         'Draw a vertical line through V. Turn it round O by 180°. '
         'The W1 line turned to E crosses the W2 line turned to B at Y. '
         'Draw a horizontal line through Y. Turn it round O by 180°. '
         'The four lines cross at N1, N2, N3 and N4, the corners of the tile.', 'ruler')
    g.meet('V', 'w5@2', 'h', near('w5@2', 'h', (W, 0)))
    g.line_par('kr', 'V', 'v')
    g.repeat('krr', ['kr'], 'rot2')
    g.meet('Y', 'w3@4', 'w5@1', near('w3@4', 'w5@1', (0.764, H)))
    g.line_par('kt', 'Y', 'h')
    g.repeat('ktr', ['kt'], 'rot2')
    g.meet('N1', 'kr', 'kt', (W, H))
    g.meet('N2', 'kr@1', 'kt', (-W, H))
    g.meet('N3', 'kr@1', 'kt@1', (-W, -H))
    g.meet('N4', 'kr', 'kt@1', (W, -H))


SPEC = {
    'id': 'mihrimah-uskudar-stars', 'title': 'Ten-pointed stars of the Mihrimah Sultan mosque, Üsküdar',
    'short': 'Mihrimah Sultan stars', 'subtitle': 'Mihrimah Sultan mosque, Üsküdar, Istanbul',
    'code': 'MIR17', 'folder': 'data214', 'cell': (W, H), 'style': 'Ottoman', 'level': 'advanced',
    'look': 'interlace', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a ten-pointed star, where two mirrors of the pattern cross.',
              'A': 'A point to the right of O. The star’s lines touch the circle through A.'},
    'note': 'The finished design was read from Wichmann’s MIR17 drawing of interlaced bands; the band centre '
            'lines give the tiling. One ten-pointed star with sharp points of 72° sits in each tile, and every '
            'other band runs parallel to one of its ten lines. With OA the distance from O to the star’s lines, '
            'the tile is a rectangle 2(7 + 3√5) by 4 tan 72°, and every offset from O is a + b√5 (drawing within '
            '0.003 of OA, the accuracy of its bevelled bands). Each line is drawn through a crossing of earlier '
            'lines.',
    'changes': 'The bands are drawn as their centre lines. Colours follow the shapes; his drawing has one colour '
               'for every piece but the star. No photograph was checked.',
    'references': 'His reference is a personal communication from Miroslaw Majewski: a pattern of the '
                  'Mihrimah Sultan mosque, Üsküdar, Istanbul, Turkey.',
    'ink': 'Ink the lines picked out in orange. They close the star, the pentagons and the pieces between them.',
    'repeat': 'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre of every tile.',
}
NAMES = {(20, 6.498): ('star', 'c'), (10, 5.731): ('ten_sided', 'b'), (8, 7.302): ('big_octagon', 'd'),
         (8, 5.550): ('octagon', 'd'), (9, 4.165): ('nonagon', 'b'), (5, 3.633): ('pentagon', 'a'),
         (6, 3.804): ('hexagon_a', 'ground'), (6, 3.556): ('hexagon_b', 'ground'), (6, 2.848): ('hexagon_c', 'd'),
         (6, 2.256): ('hexagon_d', 'ground'), (6, 1.701): ('hexagon_e', 'c'), (4, 1.606): ('quad_a', 'ground'),
         (4, 1.241): ('quad_b', 'a'), (4, 1.051): ('quad_c', 'ground')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        s10.run(build, SPEC, NAMES, drawing)
