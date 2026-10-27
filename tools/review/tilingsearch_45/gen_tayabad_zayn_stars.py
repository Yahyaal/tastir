#!/usr/bin/env python3
"""F66B (Tiling Search data13/F66B, shrine of Zayn al-Din, Tayabad, Iran;
El-Said and Parman, figure 66b), ten-fold batch T2.

Reading the drawing (27 October 2026): pieces drawn edge to edge, no band
gap. pmm: mirrors 325.93 pt apart across and 105.90 pt apart up, with a
ten-pointed star (two regular pentagons) on every half-turn centre where a
column and a row of mirrors cross, and two kinds of star: O at
(296.25, 163.05) pt, the other at the cell corners. Every edge runs at 90°
or 18° + a multiple of 36° (its normal at a multiple of 36°). OA is the
distance from a star's centre to its lines (62.246 pt), so the star's lines
touch the circle through A at A, B, C, … and its points are at 1/cos 36°.
The cell is |x| <= 3 + √5, |y| <= 1/sin 36°; its corners are the other
stars' centres. Offsets of every line, fitted as (a + b√5)/c, are within
0.0007 of OA.
Use: gen_tayabad_zayn_stars.py lab <pieces.json>
     gen_tayabad_zayn_stars.py <pieces.json> tutorials/tayabad-zayn-stars.json
     gen_tayabad_zayn_stars.py finish <dump.json> <tutorial.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
import snap10_t2 as s10  # noqa: E402
from common import g, step  # noqa: E402

ORIGIN, UNIT = (296.25, 163.05), 62.246
R5 = math.sqrt(5)
HX, HY = 3 + R5, 1 / math.sin(math.radians(36))
Z = 1 + 3 / R5
Y3 = 2 * math.sin(math.radians(36))


def drawing(pieces):
    polys = cm.frame_pieces(pieces, ORIGIN, 2 * UNIT, 0)
    return polys + [[(-x, y) for x, y in Q] for Q in polys]


def seeds():
    s10.opening()
    s10.star_lines()
    tile()


def tile():
    step('The star lines through B and E cross at Y, on the vertical line. Draw a horizontal line through Y. '
         'Turn it round O by 180°. The star lines through A and B cross at X. Draw a straight line through O and X. '
         'It crosses the horizontal line through Y at K1. Draw a vertical line through K1. Turn it round O by 180°. '
         'The four lines make the tile, with corners K1, K2, K3 and K4.')
    g.meet('Y', 't@1', 't@4', (0, HY))
    g.line_par('top', 'Y', 'h')
    g.repeat('topr', ['top'], 'rot2')
    g.meet('X', 't', 't@1', (1, math.tan(math.radians(18))))
    g.line_through('oX', 'O', 'X')
    g.meet('K1', 'oX', 'top', (HX, HY))
    g.line_par('side', 'K1', 'v')
    g.repeat('sider', ['side'], 'rot2')
    g.meet('K2', 'side@1', 'top', (-HX, HY))
    g.meet('K3', 'side@1', 'top@1', (-HX, -HY))
    g.meet('K4', 'side', 'top@1', (HX, -HY))
    s10.DESC.update({'top': 'the top side of the tile', 'side': 'the right side of the tile', 'oX': 'line OX'})
    step('Draw a straight line through O and E, and a straight line through O and B. '
         'Draw a line through Y parallel to line OE. It crosses the horizontal line through O at Z. '
         'Reflect line YZ in the horizontal line through O. Turn both lines round O by 180°.')
    g.line_through('oE', 'O', 'E')
    g.line_through('oB', 'O', 'B')
    s10.REF[3], s10.REF[7] = 'oE', 'oB'
    g.line_par('yz', 'Y', 'oE')
    g.meet('Z', 'yz', 'h', (Z, 0))
    s10.copies('yzc', [('yz', 'Y', 3)])
    s10.DESC['yz'] = 'line YZ'


def lab():
    seeds()
    polys = drawing(sys.argv[2])
    nd = s10.need(polys, HX, HY)
    print('needed', len(nd), sorted((k[0] * 18, round(k[1], 4)) for k, _ in nd))
    print(s10.plan(polys, HX, HY, reach=float(os.environ.get('REACH', 1.01)), tol=2e-3))

    if os.environ.get('FAR'):
        xs = s10.crossings(HX, HY, float(os.environ['FAR']))
        for key in s10.missing(nd):
            t = math.radians(key[0] * 18)
            nv = (math.cos(t), math.sin(t))
            hits = [(a, b, (round(p[0], 3), round(p[1], 3))) for s, a, b, p in xs
                    if abs(p[0] * nv[0] + p[1] * nv[1] - key[1]) < 2e-3]
            print(key[0] * 18, round(key[1], 4), hits[:6])


def par(name, point, ref, k):
    g.line_par(name, point, ref)
    return (name, point, k)


def build():
    seeds()
    step('Draw a line through Z parallel to the star line through B. '
         'Line OX crosses the mirror image of line YZ at P1. Draw a vertical line through P1. '
         'Draw a line through P1 parallel to the star line through B. '
         'Reflect the new lines in the horizontal line through O. Turn all of them round O by 180°.')
    new = [par('m1', 'Z', 't@1', 2)]
    g.meet('P1', 'oX', 'yzb', (2 + R5, 1 / math.tan(math.radians(36))))
    new += [par('m2', 'P1', 'v', 0), par('m3', 'P1', 't@1', 2)]
    s10.copies('c1', new)
    step('The line through P1 parallel to the star line through B crosses the top side of the tile at P2. '
         'Draw a line through P2 parallel to the star line through E. It crosses line OX at P3. '
         'Draw a line through P3 parallel to the star line through C. '
         'Reflect the new lines in the horizontal line through O. Turn all of them round O by 180°.')
    g.meet('P2', 'm3', 'top', (4, HY))
    new = [par('m4', 'P2', 't@4', 8)]
    g.meet('P3', 'm4', 'oX', ((5 + R5) / 2, Y3))
    new += [par('m5', 'P3', 't@2', 4)]
    s10.copies('c2', new)
    step('Draw a horizontal line through X. It crosses the line through P2 and P3 at P4. '
         'Draw a vertical line through P4. '
         'Reflect the new lines in the horizontal line through O. Turn all of them round O by 180°.')
    new = [par('hx', 'X', 'h', 5)]
    g.meet('P4', 'hx', 'm4', (3, math.tan(math.radians(18))))
    new += [par('m6', 'P4', 'v', 0)]
    s10.copies('c3', new)
    step('Draw a horizontal line through P3. It crosses line YZ at P5. '
         'Draw a line through P5 parallel to the star line through C. '
         'It crosses the horizontal line through X at P6. Draw a vertical line through P6. '
         'Reflect the new lines in the horizontal line through O. Turn all of them round O by 180°.')
    new = [par('h3', 'P3', 'h', 5)]
    g.meet('P5', 'h3', 'yz', ((5 + R5) / 10, Y3))
    new += [par('m7', 'P5', 't@2', 4)]
    g.meet('P6', 'm7', 'hx', (2 + 3 / R5, math.tan(math.radians(18))))
    new += [par('m8', 'P6', 'v', 0)]
    s10.copies('c4', new)
    for i, t in WITHOUT.items():
        cm.steps[i - 1]['textWithoutHelpers'] = t


WITHOUT = {
    8: 'Draw a line through Y parallel to the line from O to E. It crosses the horizontal line through O at Z. '
       'Reflect line YZ in the horizontal line through O.',
    11: 'Draw a horizontal line through X. It crosses the line through P2 and P3 at P4. Draw a vertical line through P4. '
        'Turn it round O by 180°.',
}


SPEC = {
    'id': 'tayabad-zayn-stars', 'title': 'Ten-pointed stars of the shrine of Zayn al-Din, Tayabad',
    'short': 'Tayabad ten-pointed stars', 'subtitle': 'Shrine of Zayn al-Din, Tayabad, Iran',
    'code': 'F66B', 'folder': 'data13', 'cell': (HX, HY), 'style': 'Timurid', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a ten-pointed star.',
              'A': 'A point to the right of O. The star’s lines touch the circle through A.'},
    'note': 'The finished design was read from Wichmann’s F66B drawing, whose pieces are drawn edge to edge. '
            'O is the centre of a ten-pointed star made of two regular pentagons, and OA is the distance from O '
            'to the star’s lines. The repeat is a rectangle of half-sides 3 + √5 and 1/sin 36° (in OA), with a '
            'second kind of star at its corners. Every line runs at 90° to the star’s radius at A, B, C and on '
            'round, and every offset, fitted as (a + b√5)/c, lies within 0.0007 of OA of the drawing.',
    'changes': 'Colours follow the shapes, not his drawing. No photograph was checked.',
    'references': 'His reference is El-Said and Parman, Geometric Concepts in Islamic Art (1976), figure 66b, '
                  'plate 35 (shrine of Zayn al-Din, Tayabad, Iran).',
    'ink': 'Ink the lines picked out in orange. They close the stars, the pentagons and the pieces between them.',
    'repeat': 'Put copies of the rectangular tile side by side. A ten-pointed star sits at the centre and at '
              'each corner of every tile.',
}
NAMES = {(20, 4.016): ('star', 'c'), (10, 1.146): ('ten_sided', 'd'), (5, 0.727): ('pentagon', 'a'),
         (6, 0.711): ('hexagon', 'a'), (6, 0.451): ('bowtie', 'ground'), (4, 0.248): ('kite', 'b')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        s10.run(build, SPEC, NAMES, drawing)
