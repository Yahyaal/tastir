#!/usr/bin/env python3
"""MOR1137. Read with 1_pieces.py --precision 2. Usage: this script
<pieces.json> <tutorial.json>, then finish <dump.json> <tutorial.json>.
OA=36.2141225526 pt, small central-star radius; half-side 4+2*sqrt(2).
Worst snapped corner residual 0.000404 OA. See the report for exact areas.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, step
import medium
import gen_meknes_bou_inania_petals as mp
from gen_meknes_bou_inania_rosette_rings import crossing_set

H, L = mp.H, 4+4*mp.H
UNIT = 298.5/(4+6*H)


def build():
    mp.build_frame(4, 2)
    cm.steps[2]['text'] = 'Draw two guide squares.'
    crossing_set('R', 'q14', 'q02', (H, 1+H), [('rh', 'h'), ('rd', 'q01')],
                 'The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
                 'Draw a horizontal line through R. Draw a line through R parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')
    g.meet('R3', 'q13', 'q01', (1+H, -H))
    cm.steps[-1]['textWithoutHelpers'] = (
        'Draw a horizontal line through R. Turn it round O by 90°, three times. '
        'The line from S6 to S8 crosses the line from S1 to S3 at R3. '
        'Draw a line through R3 parallel to line OE.')
    crossing_set('V', 'rh@3', 'q02', (1+H, 2+H), [('vh', 'h')],
                 'The line through R, turned by 270°, crosses the line from S3 to S5 at V. '
                 'Draw a horizontal line through V. Turn it round O by 90°, three times.')
    crossing_set('W', 'rh', 'rd@3', (2+3*H, 1+H), [('wv', 'v'), ('wd', 'q01')],
                 'The horizontal line through R crosses the diagonal through R, turned by 270°, at W. '
                 'Draw a vertical line through W. Draw a line through W parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')

    step('The horizontal line through R crosses the vertical line through O at U. '
         'Draw a circle with centre T1 and radius OU. It crosses the horizontal line at N, towards O. '
         'Draw a vertical line through N. Turn it round O by 90°, three times.', 'compass')
    g.meet('U', 'rh', 'v', (0, 1+H))
    g.circle_from('cu', 'T1', 'O', 'U')
    g.meet('N', 'cu', 'h', (L-1-H, 0))
    g.line_par('nv', 'N', 'v')
    g.repeat('np', ['nv'], 'rot4')

    step('Draw a circle with centre K1 and radius OA. It crosses line OE at Q, towards O. '
         'Draw a vertical line through Q. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('ck', 'K1', 'c')
    g.meet('Q', 'ck', 'd45', (L-H, L-H))
    g.line_par('qv', 'Q', 'v')
    g.repeat('qp', ['qv'], 'rot4')

    crossing_set('P', 'q01', 'q11', (1-H, H), [('pv', 'v')],
                 'The line from S1 to S3 crosses the line from S2 to S4 at P. '
                 'Draw a vertical line through P. Turn it round O by 90°, three times.')
    step('Draw a line through F2 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    g.line_par('fd', 'F2', 'q01')
    g.repeat('fp', ['fd'], 'rot4')
    crossing_set('Y', 'vh', 'rd@3', (3+3*H, 2+H), [('yd', 'q01')],
                 'The horizontal line through V crosses the diagonal through R, turned by 270°, at Y. '
                 'Draw a line through Y parallel to the line from S1 to S3. Turn it round O by 90°, three times.')

    crossing_set('Q2', 'ck', 'gx', (L, L-1), [('q2d', 'q01')],
                 'The circle with centre K1 through Q crosses the vertical line through T1 at Q2, towards T1. '
                 'Draw a line through Q2 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')


SPEC = {
    'id': 'rabat-rosette-bands', 'title': 'Rosette bands from Rabat',
    'short': 'Rabat rosette bands', 'subtitle': 'Rabat', 'code': 'MOR1137', 'folder': 'data190',
    'frame': ((297.5, 373.415), UNIT, 0, L),
    'given': {'O': 'The centre of the small cross inside a rosette.', 'A': 'A point of that cross.'},
    'note': 'The finished design was read from Wichmann’s MOR1137 vector drawing and snapped to exact '
            'values in small-star-radius units. Four radii and two unit-square diagonals set the cell half-side. '
            'The construction shares the unit-star opening with the Meknes and Rabat reconstructions, '
            'then adds lines through the guide squares’ corners to make the bands and the small central cross.',
    'changes': 'The finished tile edges follow the plain drawing. The opening squares are guides; '
               'the cross at O is picked out from them at the ink stage. '
               'The palette is illustrative; no photograph was checked.',
    'references': 'His reference is David Wade photograph MOR 1137, Rabat, Morocco. '
                  'The page does not name a more specific building.',
    'ink': 'Ink the lines picked out in orange. They close the central cross, the rosette bands and the surrounding stars.',
}
NAMES = {(9, 3.328): ('shield', 'a'), (6, 3.0): ('long_hexagon', 'd'),
         (16, 2.343): ('star', 'd'), (6, 2.0): ('petal', 'b'), (8, 2.0): ('eight', 'ground'),
         (6, 1.828): ('hexagon', 'c'), (8, 1.828): ('arrow', 'ground'),
         (16, 1.657): ('cross', 'd'), (4, .586): ('dart', 'ground'),
         (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground')}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
