#!/usr/bin/env python3
"""C122B, Royal Palace throne room, Fès (Castéra page 122): a variant of
C122C, the Meknes throne-room star rosette (gen_meknes_throne_star_rosette.py).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

Same frame and unit as C122C (OA = 24.1427 pt, half-side L = 6 + 8H, O at
the small star in the middle of the large rosette), and the same lines: the
outer ring of the rosette and everything between the rosettes match. Only
the rosette's middle differs: sixteen long arms radiate from the small star,
which needs one more family of diagonals, at 3H from O, through the crossing
of the horizontal through C with a side of the unit star (large/greedy.py).
Every corner snaps to a + bH.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402,F401
from common import g, step  # noqa: E402,F401
import medium  # noqa: E402
import parallels as pl  # noqa: E402
import gen_meknes_throne_star_rosette as ts  # noqa: E402

H, L = ts.H, ts.L
ORIGIN, UNIT = ts.ORIGIN, ts.UNIT

PLAN = [
    ('P14', 'cy', 'q03', (-2.0, 1.0), 'd45', 'rot4'),
]


def build():
    ts.nj.mp.build_unit_star()
    pl.emit(pl.group(ts.PLAN, 3))
    # Two lines of the shared steps are helpers here: the vertical through
    # P4 (all its copies but one) and the diagonals through P12.
    by = {s['id']: s for s in cm.steps}
    by[6]['textWithoutHelpers'] = (
        'The line from S7 to S1 crosses the horizontal line through P3 at P4. The vertical line through P1 '
        'crosses the horizontal line through P2, turned by 45°, at P5. Draw a horizontal line through P5. '
        'Turn it round O by 45°, seven times. Draw the vertical line through P4, turned round O by 135°.')
    by[11]['textWithoutHelpers'] = (
        'The vertical line through P6 crosses the horizontal line through P10 at P11. The vertical line '
        'through P1, turned by 135°, crosses the vertical line through P9 at P13. Draw a line through P11 '
        'at 90° to line OE. Draw a line through P13 at 90° to line OE. Turn the new lines round O by 90°, '
        'three times.')
    pl.emit(pl.group(PLAN, 3))
    ts.nj.build_tile('m7@5')


SPEC = {
    'id': 'fes-throne-star-burst', 'title': 'Star burst of the Royal Palace throne room (Fès)',
    'short': 'Fès throne-room star burst', 'subtitle': 'Royal Palace throne room, Fès',
    'code': 'C122B', 'folder': 'data152', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star in the middle of the large rosette.',
              'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s C122B drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. It is the Meknes throne-room star '
            'rosette with a different middle to the rosette, so it shares that tutorial’s steps and adds one '
            'family of diagonals for the long arms round the small star.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing, which keeps '
               'the original colouring: green, black, white and one maroon star, in the Tétouan palette, whose '
               'dark navy stands for his black. Wade’s photo MOR 0422 was not checked.',
    'references': 'His references are Jean-Marc Castéra, Arabesques: Decorative Art in Morocco (1999), page '
                  '122, Royal Palace throne room, Fès (original colouring), Wichmann and Wade, Islamic Design: '
                  'a Mathematical Approach (2017), figures 9.5a and 11.14, and David Wade’s photo MOR 0422 '
                  '(patterninislamicart.com).',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart'},
    'palette': 'Tétouan',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(9, 3.328): ('shield', 'ground'), (6, 3.0): ('long_hexagon', 'c'), (16, 2.343): ('star', 'c'),
         (6, 2.0): ('arm', 'a'), (8, 2.0): ('eight', 'c'), (7, 1.914): ('seven', 'ground'),
         (6, 1.828): ('hexagon', 'c'), (8, 1.828): ('small_eight', 'ground'), (4, 1.414): ('rhombus', 'c'),
         (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'c'), (4, .414): ('kite', 'ground')}
# Wichmann's colours by the player's nth (large/fillnth.py), in the Tétouan palette: green a, maroon d,
# black c (its dark navy).
FILLS = {
    'long_hexagon': {'a': [8, 13, 14, 21, 22, 29, 30, 35]},
    'star': {'d': [12]},
    'arm': {'c': [0, 1, 11, 14, 15, 17, 18, 20, 21, 24, 34, 35], 'ground': [6, 9, 10, 16, 19, 25, 26, 29]},
    'hexagon': {'a': [6, 7, 10, 11, 13, 14, 18, 19, 20, 21, 25, 26, 28, 29, 32, 33]},
    'rhombus': {'ground': [0, 1, 6, 7, 8, 11, 13, 14, 17, 18, 20, 23, 24, 25, 30, 31]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'shield': 12, 'long_hexagon': 40, 'star': 20, 'arm': 36, 'eight': 8, 'seven': 16, 'hexagon': 40,
          'small_eight': 4, 'rhombus': 32, 'dart': 40, 'triangle': 12, 'kite': 152}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
