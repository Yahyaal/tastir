#!/usr/bin/env python3
"""C129B. Read with 1_pieces.py --precision 2. Usage: this script
<pieces.json> <tutorial.json>, then finish <dump.json> <tutorial.json>.
OA=36.2141225526 pt; half-side 2+2*sqrt(2). Corners fit a+b*sqrt(2)/2
within 0.000425 OA. Source shoelace areas are in the running report.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, step
import medium
import gen_meknes_bou_inania_petals as mp
from gen_meknes_bou_inania_rosette_rings import crossing_set

H, L = mp.H, 2+4*mp.H
UNIT = 298.5/(4+6*H)


def build():
    mp.build_frame(2, 2)
    step('The vertical side from S8 to S2 crosses the horizontal line at P. '
         'Draw a circle with centre P and radius OE. It crosses the horizontal line at J, to the right. '
         'Draw a vertical line through J. Turn it round O by 90°, three times.', 'compass')
    g.meet('P', 'q14', 'h', (H, 0))
    g.circle_from('cp', 'P', 'O', 'E')
    g.meet('J', 'cp', 'h', (3*H, 0))
    g.line_par('jv', 'J', 'v')
    g.repeat('jp', ['jv'], 'rot4')
    crossing_set('R', 'q14', 'q02', (H, 1+H), [('rh', 'h'), ('rd', 'q01')],
                 'The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
                 'Draw a horizontal line through R. Draw a line through R parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')
    cm.steps[-1]['textWithoutHelpers'] = (
        'The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
        'Draw a horizontal line through R. Turn it round O by 270°. '
        'Draw a line through R parallel to the line from S1 to S3. '
        'Turn that diagonal round O by 90°, three times.')
    crossing_set('V', 'rh@3', 'q02', (1+H, 2+H), [('vh', 'h'), ('vd', 'q01')],
                 'The line through R, turned by 270°, crosses the line from S3 to S5 at V. '
                 'Draw a horizontal line through V. Draw a line through V parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')
    crossing_set('W', 'rh', 'rd@3', (2+3*H, 1+H), [('wv', 'v'), ('wd', 'q01')],
                 'The horizontal line through R crosses the diagonal through R, turned by 270°, at W. '
                 'Draw a vertical line through W. Draw a line through W parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')
    crossing_set('X', 'jv', 'rh', (3*H, 1+H), [('xd', 'q01')],
                 'The vertical line through J crosses the horizontal line through R at X. '
                 'Draw a line through X parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    crossing_set('Y', 'jv', 'q02', (3*H, 1+3*H), [('yd', 'q01')],
                 'The vertical line through J crosses the line from S3 to S5 at Y. '
                 'Draw a line through Y parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    step('Draw a circle with centre K1 and radius OA. '
         'It crosses the vertical line through T1 at Q, towards T1. '
         'Draw a line through Q parallel to the line from S1 to S3. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('ck', 'K1', 'c')
    g.meet('Q', 'ck', 'gx', (L, L-1))
    g.line_par('qd', 'Q', 'q01')
    g.repeat('qp', ['qd'], 'rot4')


SPEC = {
    'id': 'ben-youssef-arrow-bands', 'title': 'Arrow bands of the Ben Youssef madrasa (Marrakesh)',
    'short': 'Ben Youssef arrow bands', 'subtitle': 'Ben Youssef madrasa, Marrakesh',
    'code': 'C129B', 'folder': 'data152', 'frame': ((297.5, 373.415), UNIT, 0, L),
    'given': {'O': 'The centre of an eight-pointed star.', 'A': 'A point of that star.'},
    'note': 'The finished design was read from Wichmann’s C129B drawing and snapped to exact values in '
            'small-star-radius units. Two radii and two unit-square diagonals set the cell half-side. '
            'The construction shares the unit-star opening with the Meknes reconstructions; '
            'crossings R, V and W then set the bands and square knots.',
    'changes': 'The finished tile edges follow the plain drawing. Castéra’s original example is uncoloured, '
               'according to Wichmann; the tutorial therefore opens as lines. '
               'Its palette is illustrative; no photograph was checked.',
    'references': 'His reference is Jean-Marc Castéra, Arabesques: Decorative Art in Morocco (1999), '
                  'page 129 bottom, Ben Youssef madrasa, Marrakesh. His page says there is no colouring on the original.',
    'look': 'lines',
    'ink': 'Ink the lines picked out in orange. They close the stars, arrow bands, square knots and small pentagons.',
}
NAMES = {(11, 3.157): ('eleven', 'c'), (16, 2.343): ('star', 'd'),
         (6, 2.0): ('hexagon', 'a'), (8, 2.0): ('arrow', 'b'),
         (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground'),
         (4, .343): ('square', 'd'), (5, .328): ('pentagon', 'ground')}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
