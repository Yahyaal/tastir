#!/usr/bin/env python3
"""C126A. Use 1_pieces.py --precision 2, then this generator with
<pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.
8 pt bands; OA is the small-star radius 298.5/(4+3*sqrt(2)) pt.
Worst source residual 0.000727 OA. See the report for exact areas.
The unit-star and compass-transfer opening is shared with P70.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, step
import medium
import gen_meknes_bou_inania_petals as mp
from gen_meknes_bou_inania_rosette_rings import crossing_set

H, L = mp.H, 4+6*mp.H


def build(include_y1=True):
    mp.build_frame(4)
    crossing_set('R', 'q14', 'q02', (H, 1+H), [('rh', 'h'), ('rd', 'q01')],
                 'The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
                 'Draw a horizontal line through R. Draw a line through R parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')
    g.meet('R1', 'q11', 'q03', (-1-H, H))
    g.meet('R3', 'q13', 'q01', (1+H, -H))
    cm.steps[-1]['textWithoutHelpers'] = (
        'Draw a horizontal line through R. Turn it round O by 270°. '
        'The line from S2 to S4 crosses the line from S5 to S7 at R1. '
        'The line from S6 to S8 crosses the line from S1 to S3 at R3. '
        'Draw a line through each of R1 and R3 parallel to line OE.')
    crossing_set('V', 'rh@3', 'q02', (1+H, 2+H), [('vh', 'h')],
                 'The line through R, turned by 270°, crosses the line from S3 to S5 at V. '
                 'Draw a horizontal line through V. Turn it round O by 90°, three times.')
    crossing_set('W', 'rh', 'rd@3', (2+3*H, 1+H), [('wv', 'v'), ('wd', 'q01')],
                 'The horizontal line through R crosses the diagonal through R, turned by 270°, at W. '
                 'Draw a vertical line through W. Draw a line through W parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')

    step('The horizontal line through V crosses the vertical line through O at U. '
         'Draw a circle with centre T1 and radius OU. It crosses the horizontal line at P1, towards O. '
         'Draw a vertical line through P1. Turn it round O by 90°, three times.', 'compass')
    g.meet('U', 'vh', 'v', (0, 2+H))
    g.circle_from('cu', 'T1', 'O', 'U')
    g.meet('P1', 'cu', 'h', (2+5*H, 0))
    g.line_par('pv', 'P1', 'v')
    g.repeat('pp', ['pv'], 'rot4')

    step('Draw a circle with centre K1 and radius OA. It crosses line OE at Q, towards O. '
         'Draw a vertical line through Q. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('ck', 'K1', 'c')
    g.meet('Q', 'ck', 'd45', (L-H, L-H))
    g.line_par('qv', 'Q', 'v')
    g.repeat('qp', ['qv'], 'rot4')

    crossing_set('X', 'q14', 'rd@1', (H, 1+3*H), [('xd', 'q01')],
                 'The vertical side from S8 to S2 crosses the diagonal through R, turned by 90°, at X. '
                 'Draw a line through X parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    if include_y1:
        crossing_set('Y1', 'wv', 'q04', (2+3*H, 1+3*H), [('y1d', 'q01')],
                     'The vertical line through W crosses the line from S7 to S1 at Y1. '
                     'Draw a line through Y1 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    crossing_set('Y2', 'gx', 'wd@3', (L, 1+2*H), [('y2d', 'q01')],
                 'The vertical line through T1 crosses the diagonal through W, turned by 270°, at Y2. '
                 'Draw a line through Y2 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    crossing_set('Z', 'qv', 'rd@3', (L-H, 3+3*H), [('zd', 'q01')],
                 'The vertical line through Q crosses the diagonal through R, turned by 270°, at Z. '
                 'Draw a line through Z parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    crossing_set('Q2', 'ck', 'gx', (L, L-1), [('q2d', 'q01')],
                 'The circle with centre K1 crosses the vertical line through T1 at Q2, towards T1. '
                 'Draw a line through Q2 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')


SPEC = {
    'id': 'rabat-throne-octagons', 'title': 'Octagons and stars of the Royal Palace throne room (Rabat)',
    'short': 'Rabat throne-room octagons', 'subtitle': 'Royal Palace throne room, Rabat',
    'code': 'C126A', 'folder': 'data152', 'frame': ((297.5, 373.42), 298.5/L, 8, L),
    'given': {'O': 'The centre of the small star inside a large star.', 'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s C126A drawing. Its band centre lines were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening and square-diagonal '
            'compass transfers are shared with the Meknes rosette rings; different crossings complete the octagons.',
    'changes': 'The 8 pt bands are represented by their centre lines. Wichmann says his drawing regularizes '
               'the panel in Castéra’s book; we follow that regularized drawing, without claiming the wall’s exact proportions. '
               'The palette is illustrative; no photograph was checked.',
    'references': 'His reference is Jean-Marc Castéra, Arabesques: Decorative Art in Morocco (1999), '
                  'page 126, figure 1, Royal Palace throne room, Rabat. The page explicitly says “Redrawn to be more regular”.',
    'look': 'interlace',
    'ink': 'Ink the lines picked out in orange. They close the stars, the octagons and the pieces between them.',
    'small': {'triangle', 'kite'},
}
NAMES = {(8, 9.657): ('octagon', 'ground'), (6, 3.0): ('long_hexagon', 'a'),
         (16, 2.343): ('star', 'd'), (8, 2.0): ('eight', 'c'),
         (6, 1.828): ('hexagon', 'b'), (8, 1.828): ('arrow', 'b'),
         (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'c'), (4, .414): ('kite', 'ground')}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
