#!/usr/bin/env python3
"""MOR0803, tomb of Moulay Ismail, Meknes (Wade MOR 0803; also MOR 0911,
Bou Inania madrasa, Meknes). Plain tiles drawn edge to edge; use
1_pieces.py --precision 2, then this generator with <pieces.json>
<tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 24.1427 pt; the square cell has
half-side L = 4 + 6H (H = √2/2), 198.99 pt, with O at the star inside the
large rosette (repeat found by matching pieces under translation). All
corners snap to a + bH. Axis lines lie at H, 1 + H, 2 + H, 2 + 3H, 3 + 3H,
2 + 5H, 3 + 5H and 4 + 5H; the diagonals at the same, and at 4 + 3H,
4 + 7H and 6 + 7H. The first six lines after the unit star are those of the
Meknes throne-room star rosette (gen_meknes_throne_star_rosette.py), so
the two share their opening steps; every line runs through a crossing of
earlier lines (large/greedy.py). The tile's sides come as in the Najjarin
rosette, through the horizontal through C.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402,F401
from common import g, step  # noqa: E402,F401
import medium  # noqa: E402
import parallels as pl  # noqa: E402
import gen_fes_najjarin_rosette as nj  # noqa: E402
import gen_meknes_throne_star_rosette as ts  # noqa: E402

H = nj.H
L = 4+6*H
ORIGIN, UNIT = nj.ORIGIN, nj.UNIT
nj.L = L   # build_tile marks the corners at the tile's half-side

PLAN = [
    ('P7', 'q02', 'm6', (6.535534, 7.535534), 'h', 'rot8'),
    ('P8', 'q14', 'm4@3', (0.707107, 7.949747), 'd135', 'rot4'),
    ('P9', 'm4', 'm7', (5.12132, 7.535534), 'd135', 'rot4'),
    ('P10', 'm1@3', 'm6', (6.535534, 8.949747), 'd135', 'rot4'),
]


def build():
    nj.mp.build_unit_star()
    pl.emit(pl.group(ts.PLAN[:6], 3))
    pl.emit(pl.group(PLAN, 3))
    nj.build_tile('m4@7')


SPEC = {
    'id': 'meknes-moulay-ismail-rosette', 'title': 'Rosette of the tomb of Moulay Ismail (Meknes)',
    'short': 'Moulay Ismail tomb rosette', 'subtitle': 'Tomb of Moulay Ismail, Meknes',
    'code': 'MOR0803', 'folder': 'data173', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the large rosette.', 'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s MOR0803 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The opening, the unit star and the first '
            'six lines after it, is shared with the Meknes throne-room star rosette. After the unit star every '
            'line, the tile’s sides too, is drawn through a crossing of earlier lines and turned round O.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing: orange, green, '
               'black and white, in the Marinid zellige palette, whose honey stands for his orange. Wade’s '
               'photos MOR 0803 and MOR 0911 were not checked.',
    'references': 'His references are David Wade’s photos MOR 0803, the tomb of Moulay Ismail, Meknes, and '
                  'MOR 0911, the Bou Inania madrasa, Meknes (patterninislamicart.com).',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'square'},
    'palette': 'Marinid zellige',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(9, 3.328): ('shield', 'ground'), (11, 3.157): ('eleven', 'ground'), (6, 3.0): ('long_hexagon', 'b'),
         (16, 2.343): ('star', 'a'), (10, 2.0): ('ten', 'a'), (8, 2.0): ('eight', 'ground'),
         (7, 1.914): ('seven', 'd'), (6, 1.828): ('hexagon', 'd'), (4, .586): ('dart', 'ground'),
         (3, .5): ('triangle', 'a'), (4, .414): ('kite', 'ground'), (4, .343): ('square', 'a')}
# Wichmann's colours by the player's nth (large/fillnth.py): green b, orange d (honey), black a.
FILLS = {
    'long_hexagon': {'a': [0, 1, 4, 13], 'd': [2, 3, 14, 15]},
    'eight': {'a': [0, 1, 10, 11]},
    'hexagon': {'a': [4, 5, 6, 7, 8, 9, 10, 11]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'shield': 12, 'eleven': 4, 'long_hexagon': 16, 'star': 6, 'ten': 8, 'eight': 20, 'seven': 16,
          'hexagon': 16, 'dart': 16, 'triangle': 16, 'kite': 56, 'square': 2}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
