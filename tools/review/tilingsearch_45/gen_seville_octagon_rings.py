#!/usr/bin/env python3
"""RAY7, a Seville tile panel in the V&A (data183). Interlaced 7 pt bands;
use 1_pieces.py --precision 2, then this generator with <pieces.json>
<tutorial.json>; use finish <dump.json> <tutorial.json>.

The repeat is a square of side 358.19 pt with an eight-pointed star (45°
points) at O and another at each corner, in different surroundings. OA is a
quarter of the side, 89.5475 pt, so the half-side is 2. The band centre lines
snap to a + bH (H = √2/2) within 0.0002 OA. With t = √2 − 1 (tan 22.5°), the
axis lines lie at t³, t², 1 − t², 1, 1 + √2t², 1 + t², 2 − t and 2 − t²
from O, the diagonals at t², 1 − t², 1, 1 + √2t², √2, 2 − t, 2 − t² and 2 + t².
The star's sides are the lines at t²: the octagon round the circle (apothem 1)
has its corners at height t, and the octagon of the lines at t has its
corners at height t². Every other line runs through a crossing of earlier
ones (a greedy search over the drawing's missing lines); one line turned by
45° seven times makes an axis line and a diagonal at the same distance.
The Sidi Sa'id window (L90, gen_sidi_said_window.py) uses the same lines.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import medium  # noqa: E402
import parallels as pl  # noqa: E402

H, L = 2 ** .5 / 2, 2.0
T = 2 ** .5 - 1
ORIGIN, UNIT = (298.52, 373.47), 179.095/2

PLAN = [
    ('P1', 'vt@7', 'vt', (0.171573, 0.414214), 'v', 'rot8'), ('P2', 'm1', 'm1@1', (0.171573, 0.071068), 'h', 'rot4'),
    ('P3', 'vt', 'm1@7', (0.656854, 0.414214), 'v', 'rot8'), ('P4', 'ax', 'm1@3', (1.0, 1.242641), 'h', 'rot8'),
    ('P5', 'ax@1', 'm2', (1.343146, 0.071068), 'v', 'rot4'), ('P6', 'ax', 'vt@1', (1.0, 1.585786), 'h', 'rot8'),
    ('P7', 'ax@7', 'vt', (1.828427, 0.414214), 'v', 'rot8'), ('E', 'ax', 'd45', (1.0, 1.0), 'd135', 'rot4'),
    ('P8', 'm4', 'm7', (1.828427, 1.242641), 'd135', 'rot4'),
]


def opening(shown_turns='by 45° each way'):
    """The circle, the octagon round it and the lines at height t."""
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    cm.steps[-1]['textWithoutHelpers'] = 'Draw a circle with centre O through A.'
    g.circle_through('c', 'O', 'A')
    g.line_through('h', 'O', 'A')
    step('Draw a vertical line through O. Draw a vertical line through A. Turn it round O by 45°, seven times. '
         'The eight lines touch the circle. They make an octagon round it.')
    cm.steps[-1]['textWithoutHelpers'] = (
        'Draw a vertical line through A. Turn it round O by 45°, seven times. '
        'The eight lines touch the circle. They make an octagon round it.')
    g.line_perp('v', 'O', 'h')
    g.line_perp('ax', 'A', 'h')
    g.repeat('axr', ['ax'], 'rot8')
    step('The vertical line through A, turned by 90°, crosses the vertical line through A at E. '
         'Draw a straight line through O and E. Draw a line through O at 90° to line OE.')
    g.meet('E', 'ax', 'ax@2', (1, 1))
    g.line_through('d45', 'O', 'E')
    g.line_perp('d135', 'O', 'd45')
    step('The vertical line through A, turned by 45°, crosses the vertical line through A at V. '
         'Draw a horizontal line through V. Turn it round O by 45°, seven times.')
    cm.steps[-1]['textWithoutHelpers'] = (
        'The vertical line through A, turned by 45°, crosses the vertical line through A at V. '
        f'Draw a horizontal line through V. Turn it round O {shown_turns}.')
    g.meet('V', 'ax', 'ax@1', (1, T))
    g.line_par('vt', 'V', 'h')
    g.repeat('vtr', ['vt'], 'rot8')
    pl.EXTRA.update({'ax': 'the vertical line through A', 'vt': 'the horizontal line through V'})
    pl.ORDER.update({'ax': 8, 'vt': 8})


def tile(m):
    step(f'{pl.describe(m)[0].upper()}{pl.describe(m)[1:]} crosses the vertical line through O at T. '
         'Draw a horizontal line through T. Turn it round O by 90°, three times. '
         'The four lines make a square with corners K1, K2, K3 and K4.')
    cm.steps[-1]['textWithoutHelpers'] = (
        f'{pl.describe(m)[0].upper()}{pl.describe(m)[1:]} crosses the vertical line through O at T. '
        'Draw a horizontal line through T. Turn it round O by 90° each way. '
        'The three lines are sides of the square with corners K1, K2, K3 and K4.')
    g.meet('T', m, 'v', (0, L))
    g.line_par('gy', 'T', 'h')
    g.repeat('gyr', ['gy'], 'rot4')
    for i, (a, b, p) in enumerate([('gy@3', 'gy', (L, L)), ('gy', 'gy@1', (-L, L)),
                                   ('gy@1', 'gy@2', (-L, -L)), ('gy@2', 'gy@3', (L, -L))]):
        g.meet(f'K{i+1}', a, b, p)


def build():
    opening()
    pl.emit(pl.group(PLAN, 3))
    tile('m8')


SPEC = {
    'id': 'seville-octagon-rings', 'title': 'Stars in octagonal rings, a Seville tile panel',
    'short': 'Seville octagon rings', 'subtitle': 'Seville tiles, Victoria and Albert Museum',
    'code': 'RAY7', 'folder': 'data183', 'frame': (ORIGIN, UNIT, 7, L),
    'given': {'O': 'The centre of an eight-pointed star.', 'A': 'A point halfway from O to the side of the tile.'},
    'note': 'The finished design was read from Wichmann’s RAY7 drawing, its interlaced bands reduced to their '
            'centre lines and snapped to the square-root-of-two grid. The circle, the octagon round it and the '
            'octagon of the lines at height V give the star; every other line is drawn through a crossing of '
            'earlier lines and turned round O.',
    'changes': 'The bands are drawn as their centre lines, woven over and under as in the drawing. The colours '
               'follow Wichmann’s drawing, which he says are as in the original, mapped to the Alhambra palette. '
               'No photograph was checked.',
    'references': 'His references are tiles 1005:41 to 56-1884 (Seville, tin-glazed earthenware, 1300–1500) in '
                  'the V&A collections; Anthony Ray, Spanish Pottery 1248–1898 (2000), page 327, colour as in the '
                  'original; and David Wade, Pattern in Islamic Art (1976), page 96, Museum of Dar Si Said, Marrakesh.',
    'look': 'interlace',
    'ink': 'Ink the lines picked out in orange. They close the stars, the octagonal rings and the pieces between them.',
    'small': {'triangle'},
    'palette': 'Alhambra',
    'repeat': 'Put copies of the square tile side by side. A star sits at the centre and at every corner.',
}
# Wichmann's colours, one to a shape: orange, black, blue and green, mapped to the Alhambra palette's
# honey, black, deep blue and teal.
NAMES = {(8, .343): ('ring_eight', 'c'), (16, .333): ('star', 'c'), (12, .284): ('twelve', 'a'),
         (6, .201): ('hexagon', 'd'), (9, .196): ('nine', 'd'), (6, .177): ('arrow', 'a'),
         (9, .161): ('short_nine', 'd'), (8, .152): ('eight', 'a'), (6, .108): ('small_hexagon', 'b'),
         (4, .083): ('rhombus', 'd'), (4, .034): ('kite', 'b'), (3, .029): ('triangle', 'd')}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
