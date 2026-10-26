#!/usr/bin/env python3
"""SPA2929. Read coloured faces with 1_pieces.py --no-grey --precision 2.
Usage: this script <pieces.json> <tutorial.json>, then finish <dump.json>
<tutorial.json>. Band 6 pt, star-radius OA=36.2141225526 pt. Half-side
3*sqrt(2)-1, obtained by three diagonal transfers from B. Source corners
inside the cell fit a+b*sqrt(2)/2 within 0.000228 OA.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, step
import medium
import gen_meknes_bou_inania_petals as mp

H, L = mp.H, 6*mp.H-1
UNIT = 298.5/(4+6*H)


def build():
    mp.build_unit_star()
    step('Keep the compass open to OE. Draw circles with centres B, G1 and G2 in turn. '
         'Each circle crosses the horizontal line to the right at G1, G2 and G3.', 'compass')
    previous = 'B'
    for i in range(1, 4):
        g.circle_from(f'cg{i}', previous, 'O', 'E')
        g.meet(f'G{i}', f'cg{i}', 'h', (-1+2*i*H, 0))
        previous = f'G{i}'
    step('Draw a circle with centre O through G3. It crosses the horizontal and vertical lines at T1 to T4. '
         'Draw a vertical line through each of T1 and T3. Draw a horizontal line through each of T2 and T4. '
         'They make a square with corners K1, K2, K3 and K4.', 'compass')
    g.circle_through('co', 'O', 'G3')
    for i, (line, p) in enumerate([('h', (L, 0)), ('v', (0, L)), ('h', (-L, 0)), ('v', (0, -L))]):
        g.meet(f'T{i+1}', 'co', line, p)
    for name, p, line in [('gx', 'T1', 'v'), ('gy', 'T2', 'h'), ('gxw', 'T3', 'v'), ('gys', 'T4', 'h')]:
        g.line_par(name, p, line)
    for i, (a, b, p) in enumerate([('gx', 'gy', (L, L)), ('gxw', 'gy', (-L, L)),
                                    ('gxw', 'gys', (-L, -L)), ('gx', 'gys', (L, -L))]):
        g.meet(f'K{i+1}', a, b, p)
    step('Draw a circle with centre K1 and radius OA. It crosses line OE at N, towards O. '
         'Draw a vertical line through N. Turn it round O by 90°, three times. '
         'The circle crosses the vertical line through T1 at Q, towards T1. '
         'Draw a line through Q parallel to the line from S1 to S3. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('ck', 'K1', 'c')
    g.meet('N', 'ck', 'd45', (L-H, L-H))
    g.line_par('nv', 'N', 'v')
    g.repeat('np', ['nv'], 'rot4')
    g.meet('Q', 'ck', 'gx', (L, L-1))
    g.line_par('qd', 'Q', 'q01')
    g.repeat('qp', ['qd'], 'rot4')
    step('Draw a circle with centre O and radius AB. It crosses line OE at M, above O. '
         'Draw a line through M parallel to the line from S1 to S3. Turn it round O by 90°, three times.', 'compass')
    g.circle_from('c2', 'O', 'A', 'B')
    g.meet('M', 'c2', 'd45', (2*H, 2*H))
    g.line_par('md', 'M', 'q01')
    g.repeat('mcopy', ['md'], 'rot4')


SPEC = {
    'id': 'toledo-synagogue-star-bands', 'title': 'Stars and bands of a synagogue in Toledo',
    'short': 'Toledo synagogue bands', 'subtitle': 'Synagogue, Toledo',
    'code': 'SPA2929', 'folder': 'data173', 'frame': ((297.5, 373.41375), UNIT, 6, L),
    'style': 'Spanish', 'level': 'intermediate', 'palette': 'Alhambra', 'look': 'strapwork',
    'given': {'O': 'The centre of an eight-pointed star.', 'A': 'A point of that star.'},
    'note': 'The finished design was read from Wichmann’s SPA2929 drawing. Grey bevel shading was separated '
            'from the coloured faces, and the 6 pt band centre lines snapped to exact values. '
            'The unit-star opening is shared with the earlier reconstructions. '
            'Three square-diagonal transfers from B give the cell; the lines through M complete the bands.',
    'changes': 'The shaded bands are represented by their centre lines. The palette is illustrative; '
               'no photograph was checked. The source names only a synagogue in Toledo, so no more specific building is asserted.',
    'references': 'His reference is David Wade photograph SPA 2929, Synagogue, Toledo, Spain.',
    'ink': 'Ink the lines picked out in orange. They close the stars, the twelve-sided bands and the square knots.',
}
NAMES = {(12, 3.272): ('twelve', 'b'), (6, 2.657): ('hexagon', 'ground'),
         (8, 2.414): ('eight', 'c'), (16, 2.343): ('star', 'a'),
         (4, .414): ('kite', 'ground'), (4, .343): ('square', 'd')}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
