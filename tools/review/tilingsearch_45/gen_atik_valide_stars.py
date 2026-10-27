#!/usr/bin/env python3
"""MIR26 (Tiling Search data216/MIR26, Atik Valide mosque, Üsküdar; photo by
Mirek Majewski), ten-fold batch T3.

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

Use: gen_atik_valide_stars.py <MIR26-tiles.json> tutorials/atik-valide-uskudar-stars.json,
pnpm review atik-valide-uskudar-stars, then
gen_atik_valide_stars.py finish <dump.json> <tutorial.json>.
Lab: gen_atik_valide_stars.py lab <MIR26-tiles.json>
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

ORIGIN, UNIT, TURN = (297.94, 372.3), 15.388, 90.0
S5 = math.sqrt(5)
W = 11 + 5 * S5
H = W / math.tan(math.radians(72))
t2.HAVE_TOL[0] = 1e-2
_snap = cm.snap
cm.snap = lambda p, tol=0.03: _snap(p, tol)  # sharp tips of the offset band pieces fall short by up to 0.02 of OA


def near(a, b, p):
    return min(cm.crossings(a, b), key=lambda c: math.dist(c, p))


def seeds():
    t2.opening()
    t2.star_lines('Draw a line through A at 90° to the horizontal line. Turn it round O by 36°, nine times. '
                  'These ten lines touch the circle at A, B, C and on round. Lines three apart cross at the '
                  'points of the ten-pointed star.')
    t2.radial(['B', 'C', 'D', 'E'])
    step('The star line through C crosses the horizontal line at T. '
         'Draw a circle with centre T and opening OA. It crosses the horizontal line at W2, beyond T. '
         'Draw a vertical line through W2. Turn it round O by 36°, nine times.', 'compass')
    g.meet('T', 't@2', 'h', near('t@2', 'h', (1 + S5, 0)))
    g.circle_from('cT', 'T', 'O', 'A')
    g.meet('W2', 'cT', 'h', near('cT', 'h', (2 + S5, 0)))
    g.line_perp('w5', 'W2', 'h')
    g.repeat('w5r', ['w5'], 'rot10')
    t2.DESC['w5'] = 'the vertical line through W2'
    for j in range(1, 10):
        t2.DESC['w5@%d' % j] = 'the W2 line turned to %s' % t2.LETTERS[j]


def drawing(pieces):
    return s10.frame(pieces, ORIGIN, UNIT, TURN)


def lab():
    seeds()
    polys = drawing(sys.argv[2])
    print(t2.plan(polys, W, H, tol=3e-3))
    names = cm.lines()
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            for p in cm.crossings(a, b):
                if abs(p[0] - W) < 1e-6 and abs(p[1]) < 9:
                    print('on the right side', a, b, p)
                if abs(p[1] - H) < 1e-6 and abs(p[0]) < 23:
                    print('on the top side', a, b, p)


# What the player hides with helper lines off (hidden_t2.sh).
HIDDEN = {'m1@1', 'm1b@1', 'm6b@1', 'm18@1', 'm18b@1', 'm20@1', 'm20b@1'}

PLAN = [('P1', 't', 'oC', (1.0, 3.077684), 2, False), ('P2', 'w5@3', 'm1b', (8.472136, 7.206829), 4, False),
        ('P3', 'oB', 'm2', (9.472136, 6.88191), 0, False), ('O', 'h', 'v', (0.0, 0.0), 4, True),
        ('P4', 'm3', 'm4b', (9.472136, 3.077684), 2, False), ('P1', 't', 'oC', (1.0, 3.077684), 6, True),
        ('P5', 'm2', 'm6', (11.09017, 6.356178), 2, False), ('P6', 'm4b', 'm7b', (20.562306, 6.681098), 4, False),
        ('P7', 'm6@1', 'm7b', (17.944272, 3.077684), 0, False), ('P8', 'm4b', 'm9', (17.944272, 5.830447), 2, False),
        ('P9', 't', 'm4b', (1.0, 0.32492), 4, False), ('P10', 'm8', 'm11b', (21.562306, 6.356178), 2, False),
        ('P11', 'm4b', 'm12', (21.18034, 6.88191), 0, False), ('P12', 'm2', 'm11b@1', (14.326238, 5.304716), 2, False),
        ('P13', 'm1b', 'm5', (7.472136, 5.830447), 5, False), ('P14', 'oB', 'm15', (8.024922, 5.830447), 0, False),
        ('P14', 'oB', 'm15', (8.024922, 5.830447), 4, True), ('P9', 'm4b', 'm11', (1.0, 0.32492), 9, True),
        ('P15', 'm15', 'm18', (2.788854, 5.830447), 2, False), ('P16', 'oC', 'm18b', (0.447214, 1.376382), 4, False),
        ('P17', 'm15', 'm20', (-13.26099, 5.830447), 8, False)]


def build():
    seeds()
    t2.write_plan(PLAN)
    t3.without(HIDDEN)
    step('The line through P6 crosses the horizontal line through O at V. '
         'Draw a vertical line through V. Turn it round O by 180°. '
         'The W2 line turned to B crosses the W2 line turned to E at Y. '
         'Draw a horizontal line through Y. Turn it round O by 180°. '
         'The four lines cross at N1, N2, N3 and N4, the corners of the tile.', 'ruler')
    g.meet('V', 'm10', 'h', near('m10', 'h', (W, 0)))
    g.line_par('kr', 'V', 'v')
    g.repeat('krr', ['kr'], 'rot2')
    g.meet('Y', 'w5@1', 'w5@4', near('w5@1', 'w5@4', (0, H)))
    g.line_par('kt', 'Y', 'h')
    g.repeat('ktr', ['kt'], 'rot2')
    g.meet('N1', 'kr', 'kt', (W, H))
    g.meet('N2', 'kr@1', 'kt', (-W, H))
    g.meet('N3', 'kr@1', 'kt@1', (-W, -H))
    g.meet('N4', 'kr', 'kt@1', (W, -H))


SPEC = {
    'id': 'atik-valide-uskudar-stars', 'title': 'Ten-pointed stars of the Atik Valide mosque, Üsküdar',
    'short': 'Atik Valide stars', 'subtitle': 'Atik Valide mosque, Üsküdar, Istanbul',
    'code': 'MIR26', 'folder': 'data216', 'cell': (W, H), 'small': ('rhombus',), 'style': 'Ottoman', 'level': 'advanced',
    'look': 'interlace', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a ten-pointed star, where two mirrors of the pattern cross.',
              'A': 'A point to the right of O. The star’s lines touch the circle through A.'},
    'note': 'The finished design was read from Wichmann’s MIR26 drawing of interlaced bands; the band centre '
            'lines give the tiling. Ten-pointed stars with sharp points of 72° sit at the centre and the corners '
            'of the tile, and the two kinds have different surroundings. Every band runs parallel to one of the '
            'star’s ten lines. With OA the distance from O to the star’s lines, the tile is a rectangle '
            '2(11 + 5√5) by 2(11 + 5√5)/tan 72° (drawing within 0.003 of OA). Each line is drawn through a '
            'crossing of earlier lines.',
    'changes': 'The bands are drawn as their centre lines. Colours follow his drawing, by shape. '
               'No photograph was checked.',
    'references': 'His reference is a photograph by Mirek Majewski (personal communication): the Atik Valide '
                  'mosque, Üsküdar, Istanbul, Turkey (1571–1583).',
    'ink': 'Ink the lines picked out in orange. They close the stars, the pentagons and the pieces between them.',
    'repeat': 'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at '
              'every corner.',
}
NAMES = {(10, 20.569): ('ten_sided', 'b'), (5, 13.037): ('pentagon', 'a'), (6, 12.762): ('hexagon', 'c'),
         (6, 8.098): ('long_hexagon', 'ground'), (20, 6.498): ('star', 'a'), (4, 4.454): ('kite', 'ground'),
         (6, 3.804): ('small_hexagon', 'ground'), (6, 1.701): ('bowtie', 'c'), (4, 1.051): ('rhombus', 'c')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        s10.run(build, SPEC, NAMES, drawing)
