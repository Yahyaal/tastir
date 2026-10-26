#!/usr/bin/env python3
"""MOR0910, Bou Inania madrasa, Meknes. Plain tiles. OA is the small
star's point radius, 241.13/(2+3*sqrt(2)) = 38.6262820632 PDF points.
The square cell has half-side L=2+3*sqrt(2). All source vertices snap to
 a+b*sqrt(2)/2 within 0.001792 OA. Taking half the spacing as OA instead
would require sevenths and make a longer construction.
Axis distances: H,3H,2+3H,2+5H. Diagonal distances: H,1+H,2+H,3+H,
3+3H,4+3H,5+3H, where H=sqrt(2)/2. The construction obtains
every one from the unit star, compass transfers and earlier crossings.

Usage: gen_meknes_bou_inania_petals.py <MOR0910-pieces.json> <tutorial.json>
       gen_meknes_bou_inania_petals.py finish <dump.json> <tutorial.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, put, step
import gen_leones_door_stars as le

H = math.sqrt(.5)
L = 2+6*H
ORIGIN, UNIT = (297.5, 373.59), 241.13/L


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    g.circle_through('c', 'O', 'A')
    g.line_through('h', 'O', 'A')

    step('Draw a vertical line through O. It crosses the circle at C and D. '
         'The horizontal line crosses the circle at B on the left. '
         'Draw a vertical line through A. Draw a horizontal line through C. They cross at E. '
         'Draw a straight line through O and E. Draw a line through O at 90° to line OE. '
         'The circle crosses the four lines through O at S1 to S8.')
    g.line_perp('v', 'O', 'h')
    g.meet('B', 'c', 'h', (-1, 0))
    g.meet('C', 'c', 'v', (0, 1))
    g.meet('D', 'c', 'v', (0, -1))
    g.line_perp('ax', 'A', 'h')
    g.line_perp('cy', 'C', 'v')
    g.meet('E', 'ax', 'cy', (1, 1))
    g.line_through('d45', 'O', 'E')
    g.line_perp('d135', 'O', 'd45')
    ss = le.star_points('S', 'c', 1)

    step('Draw the star at O as two squares.')
    le.two_squares(ss, 'q', le.square_texts(ss, 'Draw each line long, beyond the circle.'))

    step('Draw a circle with centre A through O. It crosses the horizontal line at F, beyond A.', 'compass')
    g.circle_through('ca', 'A', 'O')
    g.meet('F', 'ca', 'h', (2, 0))

    step('Keep the compass open to OE. Draw circles with centres F, G1 and G2 in turn. '
         'Each circle crosses the horizontal line to the right at G1, G2 and G3.', 'compass')
    prev = 'F'
    for i in range(1, 4):
        g.circle_from(f'cg{i}', prev, 'O', 'E')
        g.meet(f'G{i}', f'cg{i}', 'h', (2+2*i*H, 0))
        prev = f'G{i}'

    step('Draw a circle with centre O through G3. It crosses the horizontal and vertical lines at T1 to T4.', 'compass')
    g.circle_through('co', 'O', 'G3')
    for i, (line, p) in enumerate([('h', (L, 0)), ('v', (0, L)), ('h', (-L, 0)), ('v', (0, -L))]):
        g.meet(f'T{i+1}', 'co', line, p)

    step('Draw a vertical line through each of T1 and T3. Draw a horizontal line through each of T2 and T4. '
         'They make a square with corners K1, K2, K3 and K4.')
    for name, p, line in [('gx', 'T1', 'v'), ('gy', 'T2', 'h'), ('gxw', 'T3', 'v'), ('gys', 'T4', 'h')]:
        g.line_par(name, p, line)
    for i, (a, b, p) in enumerate([('gx', 'gy', (L, L)), ('gxw', 'gy', (-L, L)),
                                    ('gxw', 'gys', (-L, -L)), ('gx', 'gys', (L, -L))]):
        g.meet(f'K{i+1}', a, b, p)

    step('The vertical side from S8 to S2 crosses the horizontal line at P. Draw a circle with centre P and radius OE. '
         'It crosses the horizontal line at J, to the right. Draw a vertical line through J. '
         'Turn it round O by 90°, three times.', 'compass')
    g.meet('P', 'q14', 'h', (H, 0))
    g.circle_from('cp', 'P', 'O', 'E')
    g.meet('J', 'cp', 'h', (3*H, 0))
    g.line_par('jv', 'J', 'v')
    g.repeat('jvp', ['jv'], 'rot4')

    step('Draw a circle with centre T1 and radius OJ. It crosses the horizontal line at L, towards O. '
         'Draw a vertical line through L. Turn it round O by 90°, three times.', 'compass')
    g.circle_from('ct', 'T1', 'O', 'J')
    g.meet('L', 'ct', 'h', (L-3*H, 0))
    g.line_par('lv', 'L', 'v')
    g.repeat('lvp', ['lv'], 'rot4')

    step('Draw a circle with centre K1 and radius OA. It crosses line OE at N, towards O. '
         'Draw a vertical line through N. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('ck', 'K1', 'c')
    g.meet('N', 'ck', 'd45', (L-H, L-H))
    g.line_par('nv', 'N', 'v')
    g.repeat('nvp', ['nv'], 'rot4')

    step('The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
         'Draw a line through R parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    g.meet('R', 'q14', 'q02', (H, 1+H))
    g.line_par('rd', 'R', 'q01')
    g.repeat('rdp', ['rd'], 'rot4')

    step('The vertical line through J crosses the line from S3 to S5 at V. '
         'Draw a line through V parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    g.meet('V', 'jv', 'q02', (3*H, 1+3*H))
    g.line_par('vd', 'V', 'q01')
    g.repeat('vdp', ['vd'], 'rot4')

    step('The vertical line through L crosses the line from S7 to S1 at W. '
         'Draw a line through W parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    g.meet('W', 'lv', 'q04', (2+3*H, 1+3*H))
    g.line_par('wd', 'W', 'q01')
    g.repeat('wdp', ['wd'], 'rot4')

    step('The vertical side from S8 to S2 crosses the diagonal through R, turned by 90°, at X. '
         'Draw a line through X parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    g.meet('X', 'q14', 'rd@1', (H, 1+3*H))
    g.line_par('xd', 'X', 'q01')
    g.repeat('xdp', ['xd'], 'rot4')

    step('The vertical line through N crosses the diagonal through R, turned by 270°, at Y. '
         'Draw a line through Y parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    g.meet('Y', 'nv', 'rd@3', (L-H, 1+3*H))
    g.line_par('yd', 'Y', 'q01')
    g.repeat('ydp', ['yd'], 'rot4')


def main():
    pieces, out = sys.argv[1:3]
    build()
    polys = cm.frame_pieces(pieces, ORIGIN, 2*UNIT, 0)
    paths = cm.along_ink(cm.network(polys, hcell=L, reach=3*L))
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'meknes-bou-inania-petals',
        'title': 'Petal rosettes of the Bou Inania madrasa (Meknes)',
        'short': 'Meknes petal rosettes', 'subtitle': 'Bou Inania madrasa, Meknes',
        'fold': 4, 'star': 8, 'style': 'Moroccan', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s MOR0910 vector drawing. '
                    'The corners were snapped to exact values with the small star’s point radius as the unit. '
                    'The drawing gives no steps. We devised the construction: the unit star and a square '
                    'diagonal set the compass transfers, and earlier crossings give every remaining line.',
            'changes': 'The compass steps, their order and the named points are ours. '
                       'OA is the small star’s point radius; the cell half-side is two radii plus three square diagonals. '
                       'The finished tile edges follow the plain drawing. '
                       'The palette is illustrative; no photograph was checked.',
            'reviewed': '2026-10-26'},
        'credits': [{
            'source': 'Tiling Search, data190/MOR0910: Bou Inania Madrasah, Meknes',
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': 'https://tilingsearch.mit.edu/HTML/data190/MOR0910.html',
            'note': 'Read from his finished drawing, not construction instructions. '
                    'His reference is David Wade photograph MOR 0910, Bou Inania madrasa, Meknes '
                    '(the page dates this example to the eighteenth century).'}],
        'given': {'O': 'The centre of a small star inside a rosette.', 'A': 'A point of that star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They close the small stars, the petal rosettes and the pointed stars between them.',
                'paths': paths},
        'pattern': {'cell': 'tile', 'palette': 'Marinid zellige', 'look': 'tiles',
                    'text': 'Put copies of the square tile side by side. A pointed star sits at every corner between four rosettes.',
                    'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]}}
    cm.write(tut, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')


NAMES = {(16, 5.657): ('pointed_star', 'a'), (6, 3.0): ('long_hexagon', 'd'),
         (16, 2.343): ('star', 'b'), (6, 2.0): ('petal', 'd'),
         (8, 2.0): ('arrow', 'ground'), (7, 1.914): ('seven', 'c'),
         (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground')}
if __name__ == '__main__':
    cm.run(main, NAMES)
