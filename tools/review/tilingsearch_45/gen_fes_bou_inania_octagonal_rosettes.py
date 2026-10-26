#!/usr/bin/env python3
"""MOR2841X. Extract with 1_pieces.py --precision 2. Usage: this script
<pieces.json> <tutorial.json>, then finish <dump.json> <tutorial.json>.
OA=36.2141225526 pt; half-side 3+2*sqrt(2). Worst corner error 0.000415 OA.
The outer octagon apothem is 5*sqrt(2)/2-1, constructed by compass transfers.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, step
import medium
import gen_meknes_bou_inania_petals as mp
from gen_meknes_bou_inania_rosette_rings import crossing_set

H, L = mp.H, 3+4*mp.H
UNIT = 298.5/(4+6*H)


def build():
    mp.build_frame(3, 2)
    step('The vertical side from S8 to S2 crosses the horizontal line at P. '
         'Draw a circle with centre P and radius OE. It crosses the horizontal line at J, to the right. '
         'Draw a vertical line through J.', 'compass')
    g.meet('P', 'q14', 'h', (H, 0))
    g.circle_from('cp', 'P', 'O', 'E')
    g.meet('J', 'cp', 'h', (3*H, 0))
    g.line_par('jv', 'J', 'v')
    crossing_set('R', 'q14', 'q02', (H, 1+H), [('rh', 'h'), ('rd', 'q01')],
                 'The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
                 'Draw a horizontal line through R. Draw a line through R parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')
    g.meet('R3', 'q13', 'q01', (1+H, -H))
    cm.steps[-1]['textWithoutHelpers'] = (
        'The line from S6 to S8 crosses the line from S1 to S3 at R3. '
        'Draw a vertical line through R3. '
        'The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
        'Draw a line through R parallel to the line from S1 to S3. '
        'Turn that diagonal round O by 90°, three times.')
    crossing_set('Y', 'jv', 'q02', (3*H, 1+3*H), [('yh', 'h'), ('yd', 'q01')],
                 'The vertical line through J crosses the line from S3 to S5 at Y. '
                 'Draw a horizontal line through Y. Draw a line through Y parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')
    step('Draw a vertical line through F1. Turn it round O by 90°, three times.')
    g.line_par('fv', 'F1', 'v')
    g.repeat('fp', ['fv'], 'rot4')

    step('Draw a circle with centre F and radius OP. It crosses the horizontal line at Q, beyond F. '
         'Draw a vertical line through Q. Turn it round O by 90°, three times.', 'compass')
    g.circle_from('cf', 'F', 'O', 'P')
    g.meet('Q', 'cf', 'h', (3+H, 0))
    g.line_par('qv', 'Q', 'v')
    g.repeat('qp', ['qv'], 'rot4')

    step('Draw a circle with centre K1 and radius OA. It crosses line OE at N, towards O. '
         'Draw a vertical line through N. Turn it round O by 90°, three times. '
         'The circle crosses the vertical line through T1 at Q2, towards T1. '
         'Draw a line through Q2 parallel to the line from S1 to S3. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('ck', 'K1', 'c')
    g.meet('N', 'ck', 'd45', (L-H, L-H))
    g.line_par('nv', 'N', 'v')
    g.repeat('np', ['nv'], 'rot4')
    g.meet('Q2', 'ck', 'gx', (L, L-1))
    g.line_par('q2d', 'Q2', 'q01')
    g.repeat('q2p', ['q2d'], 'rot4')

    step('Draw a circle with centre O through F1. It crosses line OE at U, above O. '
         'Draw a line through U parallel to the line from S1 to S3. Turn it round O by 90°, three times.', 'compass')
    g.circle_through('c2', 'O', 'F1')
    g.meet('U', 'c2', 'd45', (2*H, 2*H))
    g.line_par('ud', 'U', 'q01')
    g.repeat('up', ['ud'], 'rot4')
    crossing_set('V', 'rh@3', 'q02', (1+H, 2+H), [('vd', 'q01')],
                 'The line through R, turned by 270°, crosses the line from S3 to S5 at V. '
                 'Draw a line through V parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    crossing_set('W', 'yh', 'q04', (2+3*H, 1+3*H), [('wd', 'q01')],
                 'The horizontal line through Y crosses the line from S7 to S1 at W. '
                 'Draw a line through W parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    crossing_set('Z', 'nv', 'q04', (3+3*H, 2+3*H), [('zd', 'q01')],
                 'The vertical line through N crosses the line from S7 to S1 at Z. '
                 'Draw a line through Z parallel to the line from S1 to S3. Turn it round O by 90°, three times.')

    step('Draw a circle with centre J and radius OE. It crosses the horizontal line at M1, beyond J. '
         'Draw a circle with centre M1 and radius OA. It crosses the horizontal line at M2, towards O. '
         'Draw a vertical line through M2. Turn it round O by 90°, three times.', 'compass')
    g.circle_from('cj', 'J', 'O', 'E')
    g.meet('M1', 'cj', 'h', (5*H, 0))
    cm.circle_radius_of('cm1', 'M1', 'c')
    g.meet('M2', 'cm1', 'h', (5*H-1, 0))
    g.line_par('m2v', 'M2', 'v')
    g.repeat('m2p', ['m2v'], 'rot4')
    step('Draw a circle with centre O through M2. It crosses line OE at M3, above O. '
         'Draw a line through M3 parallel to the line from S1 to S3. Turn it round O by 90°, three times.', 'compass')
    g.circle_through('cm2', 'O', 'M2')
    g.meet('M3', 'cm2', 'd45', ((5*H-1)*H, (5*H-1)*H))
    g.line_par('m3d', 'M3', 'q01')
    g.repeat('m3p', ['m3d'], 'rot4')


SPEC = {
    'id': 'fes-bou-inania-octagonal-rosettes', 'title': 'Octagonal rosettes of the Bou Inania madrasa (Fez)',
    'short': 'Fez octagonal rosettes', 'subtitle': 'Bou Inania madrasa, Fez',
    'code': 'MOR2841X', 'folder': 'data190', 'frame': ((297.5, 373.415), UNIT, 0, L),
    'given': {'O': 'The centre of the star inside an octagonal rosette.', 'A': 'A point of that star.'},
    'note': 'The finished design was read from Wichmann’s MOR2841X vector drawing and snapped to exact '
            'values in small-star-radius units. Three radii and two unit-square diagonals set the half-side. '
            'The unit-star opening is shared with the earlier reconstructions. '
            'Compass transfers from J give M2, whose distance from O is the outer octagon’s apothem.',
    'changes': 'The finished tile edges follow the plain drawing. The palette is illustrative; no photograph was checked.',
    'references': 'His reference is David Wade photograph MOR 2841x of the Bou Inania madrasa, Fez.',
    'ink': 'Ink the lines picked out in orange. They close the star, its octagonal rings and the bands between rosettes.',
}
NAMES = {(8, 4.172): ('long_eight', 'b'), (6, 3.0): ('hexagon', 'd'),
         (16, 2.343): ('star', 'd'), (8, 2.0): ('arrow', 'a'),
         (8, 1.828): ('eight', 'ground'), (8, 1.757): ('short_eight', 'ground'),
         (10, 1.485): ('ten', 'ground'), (7, 1.257): ('seven', 'c'),
         (3, .5): ('triangle', 'ground'), (4, .485): ('rhombus', 'ground'), (4, .414): ('kite', 'ground')}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
