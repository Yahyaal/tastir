#!/usr/bin/env python3
"""data192/ALH1, not data190/ALH1. Extract with --precision 2.
Usage: this script <pieces.json> <tutorial.json>, then finish <dump.json>
<tutorial.json>. The 8 pt band centre lines are rational tenths after a
45-degree change of frame. O=(172.7,251) PDF pt; source unit 120 pt;
tutorial OA=120*sqrt(2) pt. Vertices fit tenths within 0.000014 OA.
The square cell has area 4. It is a primitive cell on the diagonal lattice.
"""
import math
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, step
import medium


def build():
    cm.cell_square(
        'Draw a vertical line through O. The circle crosses the two lines at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'The four corners are K1, K2, K3 and K4. Draw a straight line through O and K1.')
    step('Draw a straight line through A and C. It crosses the line from O to K1 at M. '
         'Draw a horizontal line through M. It crosses the vertical line through O at F.')
    g.line_through('ac', 'A', 'C')
    g.meet('M', 'ac', 'd45', (.5, .5))
    g.line_par('mh', 'M', 'h')
    g.meet('F', 'mh', 'v', (0, .5))
    step('Draw a straight line through K4 and F. It crosses the line from O to K1 at E. '
         'Draw a vertical line through E. It crosses the horizontal line at E1. '
         'Draw a horizontal line through E. It crosses the vertical line through O at E2. '
         'Draw a straight line through E1 and E2. It crosses the line from O to K1 at G.')
    g.line_through('kf', 'K4', 'F')
    g.meet('E', 'kf', 'd45', (.2, .2))
    g.line_par('ev', 'E', 'v')
    g.line_par('eh', 'E', 'h')
    g.meet('E1', 'ev', 'h', (.2, 0))
    g.meet('E2', 'eh', 'v', (0, .2))
    g.line_through('ee', 'E1', 'E2')
    g.meet('G', 'ee', 'd45', (.1, .1))
    step('Draw a vertical line through G. It crosses the horizontal line at H.')
    g.line_par('gv', 'G', 'v')
    g.meet('H', 'gv', 'h', (.1, 0))
    step('Keep the compass open to the distance from O to E1. '
         'Draw circles with centres H, P1, P2 and P3 in turn. '
         'Each circle crosses the horizontal line to the right at P1, P2, P3 and P4.', 'compass')
    for i in range(1, 5):
        g.circle_from(f'cp{i}', 'H' if i == 1 else f'P{i-1}', 'O', 'E1')
        g.meet(f'P{i}', f'cp{i}', 'h', (.1+.2*i, 0))
    step('Draw a vertical line through each of P1, P2, P3 and P4. '
         'Turn these four lines and the vertical line through G round O by 90°, three times.')
    lines = ['gv']
    for i in range(1, 5):
        g.line_par(f'p{i}v', f'P{i}', 'v')
        lines.append(f'p{i}v')
    g.repeat('vpcopies', lines, 'rot4')
    step('Draw a circle with centre A and radius OH. It crosses the horizontal line at Q, beyond A.', 'compass')
    g.circle_from('ca', 'A', 'O', 'H')
    g.meet('Q', 'ca', 'h', (1.1, 0))
    step('Draw a line through each of H, P1, P2, P3, P4 and Q parallel to line AC. '
         'Turn all six lines round O by 90°, three times.')
    lines = []
    for i, p in enumerate(['H', 'P1', 'P2', 'P3', 'P4', 'Q']):
        g.line_par(f'dd{i}', p, 'ac')
        lines.append(f'dd{i}')
    g.repeat('dcopies', lines, 'rot4')


def drawing(pieces):
    raw = cm.frame_pieces(pieces, (172.7, 251), 240, 8)
    turned = [[((x+y)/2, (y-x)/2) for x, y in Q] for Q in raw]
    return [[(x+2*i, y+2*j) for x, y in Q] for Q in turned
            for i in (-1, 0, 1) for j in (-1, 0, 1)]


SPEC = {
    'id': 'alhambra-mexuar-grid-fret', 'title': 'Grid fret of the Sala del Mexuar patio (Alhambra)',
    'short': 'Mexuar grid fret', 'subtitle': 'Sala del Mexuar patio, Alhambra',
    'code': 'ALH1', 'folder': 'data192', 'frame': ((172.7, 251), 120*math.sqrt(2), 8, 1),
    'given': {'O': 'A centre of quarter turning in the fret.', 'A': 'Halfway to the next such centre along the cell.'},
    'style': 'Nasrid', 'palette': 'Alhambra', 'look': 'interlace', 'chiral': True, 'star': None,
    'note': 'The finished design was read from Wichmann’s data192/ALH1 drawing. '
            'After taking the 8 pt band centre lines and turning the frame by 45 degrees, '
            'the corners lie on a rational grid in tenths of OA. '
            'Line K4F gives a fifth, and line E1E2 halves it to a tenth; compass transfers make the odd tenths.',
    'changes': 'The tutorial draws band centre lines. The square cell follows the primitive diagonal lattice; '
               'the change of frame preserves the drawing’s handedness. '
               'Wichmann notes two reversed hexagons in the real panel’s upper left; this tutorial follows his regular repeat. '
               'The palette is illustrative; no photograph was checked.',
    'references': 'His source is Tony Lee, personal communication, for the carved stucco panel above the southern '
                  'entrance of the small open patio south of the Sala del Mexuar. '
                  'This data192/ALH1 entry is distinct from data190/ALH1.',
    'ink': 'Ink the lines picked out in orange. They close the hooked frets, the squares and the small hexagons.',
}
NAMES = {(13, .13): ('hook', 'a'), (14, .12): ('fret', 'b'),
         (10, .09): ('crossbar', 'ground'), (11, .085): ('elbow', 'c'),
         (4, .04): ('square', 'd'), (6, .03): ('hexagon', 'c'), (5, .03): ('pentagon', 'ground')}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES, drawing=drawing)
