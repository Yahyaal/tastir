#!/usr/bin/env python3
"""NC2, Alhambra, Sala de las Dos Hermanas: the tile mosaic on the jambs of
the north arch into the Sala de los Ajimeces. A red star at O inside a ring of
eight blue stars, all lines running at 22.5° to the square repeat.

Read from the PDF with 1_pieces.py --precision 2 (9 pt white bands outlined
in black; the pieces are moved out by half a band to the band centres).
O is the red star at PDF (298.21, 372.71) and OA = R = 27.763 pt, the red
star's point radius, with A on the horizontal mirror line of the square
repeat. Every line runs at 22.5°, 67.5°, 112.5° or 157.5°. Turned by −22.5°,
all corners snap to a + bH (H = √2/2) within 0.0006 R, and the lines lie in
all four directions at the same distances from O: H, 2 − H, 2 + H, 5H,
2 + 3H, 2 + 5H, 4 + 3H, 4 + 5H and 4 + 7H. So the construction marks these
distances on the 22.5° line through O (compass transfers of OA, OP and the
square side S1S3 = √2) and turns the perpendiculars round O by 45°.
The cell's side point T1 = (L, 0) lies on the line through the 4 + 5H mark:
L cos 22.5° = 4 + 5H, so L = √(34 + 46H) = 8.1564 R (226.45 pt).
Areas (R², H = √2/2): pointed star 8H (eight), long octagon 7 − 4H (eight),
star 8 − 8H (one), twelve-sided piece 5 − 4H (four), eight 2 (sixteen),
hexagon −1 + 4H (thirty-two), nine-sided piece 3/2 (sixteen), short hexagon
4 − 4H (twenty-four), small octagon 12 − 16H (five), dart 2 − 2H (twelve),
triangle 1/2 (eight), rhombus −8 + 12H (sixteen), kite −1 + 2H
(twenty-eight); together 136 + 184H = 4L², the cell.

Usage: gen_alhambra_dos_hermanas_jamb_rosette.py <NC2-pieces.json> <tutorial.json>
       gen_alhambra_dos_hermanas_jamb_rosette.py finish <dump.json> <tutorial.json>
Overlay: overlay_drawing.py <dump> <page.png> <dpi> 298.21 372.71 55.526 <out>.
"""
import math
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import medium  # noqa: E402
import gen_leones_door_stars as le  # noqa: E402

H = math.sqrt(.5)
L = math.sqrt(34+46*H)
C22, S22 = math.cos(math.pi/8), math.sin(math.pi/8)
ORIGIN, R = (298.21, 372.71), 27.763


def ray(d):
    """The point at distance d along the 22.5° line through O."""
    return (d*C22, d*S22)


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    g.circle_through('c', 'O', 'A')
    g.line_through('h', 'O', 'A')
    cm.steps[-1]['textWithoutHelpers'] = 'Draw a circle with centre O through A.'

    step('Draw a vertical line through O. It crosses the circle at C. '
         'Draw the line through O that halves the angle AOC. It crosses the circle at E, above A. '
         'Draw the line through O that halves the angle AOE. Draw the line through O that halves the angle EOC. '
         'Draw a line through O at 90° to each of these two lines. '
         'The circle crosses the four new lines at S1 to S8.')
    g.line_perp('v', 'O', 'h')
    g.meet('C', 'c', 'v', (0, 1))
    g.line_bisect('d45', 'A', 'O', 'C')
    g.meet('E', 'c', 'd45', (H, H))
    g.line_bisect('r22', 'A', 'O', 'E')
    g.line_bisect('r67', 'E', 'O', 'C')
    g.line_perp('r112', 'O', 'r22')
    g.line_perp('r157', 'O', 'r67')
    lines = ['r22', 'r67', 'r112', 'r157']
    ss = []
    for i in range(8):
        a = math.radians(22.5+45*i)
        n = f'S{i+1}'
        g.meet(n, 'c', lines[i % 4], (math.cos(a), math.sin(a)))
        ss.append(n)

    step('Draw the star at O as two squares.')
    le.two_squares(ss, 'q', le.square_texts(ss, 'Draw each line long, beyond the circle.'))

    step('The line from S8 to S2 crosses the line through O and S1 at P. '
         'Draw a circle with centre S1 through O. It crosses the line through O and S1 at F, beyond S1. '
         'Draw a circle with centre F and radius OP. It crosses the line through O and S1 at M1 and M2.', 'compass')
    g.meet('P', 'q14', 'r22', ray(H))
    g.circle_through('cs', 'S1', 'O')
    g.meet('F', 'cs', 'r22', ray(2))
    g.circle_from('cf', 'F', 'O', 'P')
    g.meet('M1', 'cf', 'r22', ray(2-H))
    g.meet('M2', 'cf', 'r22', ray(2+H))

    step('Keep the compass open from S1 to S3. Draw circles with centres M2 and M3 in turn. '
         'They cross the line through O and S1 at M3 and M4, beyond their centres. '
         'Draw a circle with centre M3 and radius OF. It crosses the line through O and S1 at M5, beyond M3. '
         'Keep the compass open from S1 to S3 again. Draw circles with centres M5 and M6 in turn. '
         'They cross the line through O and S1 at M6 and M7, beyond their centres.', 'compass')
    g.circle_from('cm3', 'M2', 'S1', 'S3')
    g.meet('M3', 'cm3', 'r22', ray(2+3*H))
    g.circle_from('cm4', 'M3', 'S1', 'S3')
    g.meet('M4', 'cm4', 'r22', ray(2+5*H))
    g.circle_from('cm5', 'M3', 'O', 'F')
    g.meet('M5', 'cm5', 'r22', ray(4+3*H))
    g.circle_from('cm6', 'M5', 'S1', 'S3')
    g.meet('M6', 'cm6', 'r22', ray(4+5*H))
    g.circle_from('cm7', 'M6', 'S1', 'S3')
    g.meet('M7', 'cm7', 'r22', ray(4+7*H))

    step('Keep the compass open from S1 to S3. Draw circles with centres P and Q1 in turn. '
         'They cross the line through O and S1 at Q1 and Q2, beyond their centres.', 'compass')
    g.circle_from('cq1', 'P', 'S1', 'S3')
    g.meet('Q1', 'cq1', 'r22', ray(3*H))
    g.circle_from('cq2', 'Q1', 'S1', 'S3')
    g.meet('Q2', 'cq2', 'r22', ray(5*H))

    marks = ['M1', 'M2', 'Q2', 'M3', 'M4', 'M5', 'M6', 'M7']
    step('Draw a line through each of M1 to M7 and Q2 at 90° to the line through O and S1. '
         'Turn the eight new lines round O by 45°, seven times.')
    names = []
    for m in marks:
        n = 'p'+m.lower()
        g.line_perp(n, m, 'r22')
        names.append(n)
    g.repeat('pp', names, 'rot8')

    step('The line through M6 crosses the horizontal line at T1. '
         'Draw a circle with centre O through T1. It crosses the horizontal and vertical lines at T2, T3 and T4. '
         'Draw a vertical line through each of T1 and T3. Draw a horizontal line through each of T2 and T4. '
         'They make a square with corners K1, K2, K3 and K4.', 'compass')
    cm.steps[-1]['textWithoutHelpers'] = (
        'The line through M6 crosses its copy turned by 315° at T1. '
        'Draw a circle with centre O through T1. It crosses the vertical line at T2 and T4. '
        'It crosses the line through M6, turned by 180°, at T3, level with T1. '
        'Draw a vertical line through each of T1 and T3. Draw a horizontal line through each of T2 and T4. '
        'They make a square with corners K1, K2, K3 and K4.')
    g.meet('T1', 'pm6', 'h', (L, 0))
    g.circle_through('co', 'O', 'T1')
    for i, (line, p) in enumerate([('v', (0, L)), ('h', (-L, 0)), ('v', (0, -L))]):
        g.meet(f'T{i+2}', 'co', line, p)
    for name, p, line in [('gx', 'T1', 'v'), ('gy', 'T2', 'h'), ('gxw', 'T3', 'v'), ('gys', 'T4', 'h')]:
        g.line_par(name, p, line)
    for i, (a, b, p) in enumerate([('gx', 'gy', (L, L)), ('gxw', 'gy', (-L, L)),
                                    ('gxw', 'gys', (-L, -L)), ('gx', 'gys', (L, -L))]):
        g.meet(f'K{i+1}', a, b, p)


SPEC = {
    'id': 'alhambra-dos-hermanas-jamb-rosette',
    'title': 'Rosette of the arch jambs in the Sala de las Dos Hermanas, Alhambra',
    'short': 'Dos Hermanas jamb rosette', 'subtitle': 'Alhambra, Granada: Sala de las Dos Hermanas, north arch',
    'code': 'NC2', 'folder': 'data174', 'frame': (ORIGIN, R, 9, L),
    'style': 'Nasrid', 'palette': 'Alhambra', 'look': 'interlace',
    'given': {'O': 'The centre of the red star.', 'A': 'Sets the circle through the star’s points, on the line of the tile’s middle.'},
    'note': 'The finished design was read from Wichmann’s NC2 drawing. Every line runs at 22.5° to the square repeat. '
            'Turned by 22.5°, the band centre lines snap to the square-root-of-two grid in units of the red star’s '
            'point radius, and the four line directions share one set of distances from O. '
            'So all lines are perpendiculars to the 22.5° line through O, marked by compass transfers and turned by 45°.',
    'changes': 'The 9 pt bands are represented by their centre lines. Our lines were laid over David Wade’s photograph '
               'SPA 1803 of the jamb and follow its white bands; no difference from the drawing was found. '
               'The colours follow Wichmann’s approximate drawing on the Alhambra palette (his red as honey-brown); '
               'the jamb itself also has purple pieces.',
    'references': 'He drew it from Nick Crossling’s photograph (personal communication) of the ceramic mosaic on the east '
                  'and west jambs of the north arch from the Sala de las Dos Hermanas into the Sala de los Ajimeces '
                  '(1354–62). His other references are David Wade’s photograph SPA 1803 and Wichmann and Wade, '
                  'Islamic Design: a Mathematical Approach (2017), figure 9.6c.',
    'ink': 'Ink the lines picked out in orange. They close the red star, its ring of stars and the pieces between them.',
    'repeat': 'Put copies of the square tile side by side. A small octagon sits at every corner.',
}
NAMES = {(16, 5.657): ('pointed_star', 'd'), (8, 4.172): ('long_octagon', 'a'), (16, 2.343): ('star', 'c'),
         (12, 2.172): ('twelve', 'd'), (8, 2.0): ('eight', 'd'), (6, 1.828): ('hexagon', 'a'),
         (9, 1.5): ('nine', 'a'), (6, 1.172): ('short_hexagon', 'a'), (8, .686): ('small_octagon', 'a'),
         (4, .586): ('dart', 'a'), (3, .5): ('triangle', 'a'), (4, .485): ('rhombus', 'a'), (4, .414): ('kite', 'a')}
# The finished pieces (checked by hand above and by the engine), so the placement rules can name them.
COUNTS = {'pointed_star': 8, 'long_octagon': 8, 'star': 1, 'twelve': 4, 'eight': 16, 'hexagon': 32, 'nine': 16,
          'short_hexagon': 24, 'small_octagon': 5, 'dart': 12, 'triangle': 8, 'rhombus': 16, 'kite': 28}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
# Wichmann's colours (blue-teal, green, red and black) on the Alhambra palette: the green eights and the red
# hexagons by their place in the cell (nth counted by the player and checked against the drawing).
SPEC['placements'] = {'repeat': [1, 1], 'rules': (
    [{'piece': 'eight', 'nth': n, 'color': 'b'} for n in (0, 1, 4, 5, 10, 11, 14, 15)]
    + [{'piece': 'hexagon', 'nth': n, 'color': 'c'}
       for n in (1, 2, 5, 6, 9, 10, 11, 13, 14, 17, 22, 25, 26, 28, 30, 31)])}
SPEC['small'] = {'triangle', 'rhombus', 'kite'}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
