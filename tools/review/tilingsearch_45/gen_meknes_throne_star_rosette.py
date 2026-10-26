#!/usr/bin/env python3
"""C122C, Royal Palace throne room, Meknes (Castéra pages 122-3).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 24.1427 pt; the square cell has
half-side L = 6 + 8H (H = √2/2), 281.42 pt, with O at the star inside the
large rosette (repeat found by matching pieces under translation). All
corners snap to a + bH. Axis lines lie at H, 1 + H, 2 + H, 2 + 3H, 3 + 3H,
2 + 5H, 3 + 5H, 4 + 5H, 4 + 7H, 5 + 7H and 6 + 7H; the diagonals at the
same (but 5 + 7H), and at 6 + 9H, 6 + 11H and 8 + 11H. After the unit star
each line runs through a crossing of earlier lines (large/greedy.py), and
where an axis line and a diagonal share their distance one line turned by
45° seven times draws both. The crossings for the last two diagonals lie
just outside the tile. The tile's sides come as in the Najjarin rosette.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402,F401
from common import g, step  # noqa: E402,F401
import medium  # noqa: E402
import parallels as pl  # noqa: E402
import gen_fes_najjarin_rosette as nj  # noqa: E402

H, L = nj.H, nj.L
ORIGIN, UNIT = nj.ORIGIN, nj.UNIT

PLAN = [
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'v', 'rot8'),
    ('P2', 'q02', 'm1', (1.707107, 2.707107), 'h', 'rot8'),
    ('P3', 'm1', 'm1@3', (1.707107, 4.12132), 'h', 'rot8'),
    ('P4', 'q04', 'm3', (5.12132, 4.12132), 'v', 'rot8'),
    ('P5', 'm1', 'm2@1', (1.707107, 5.535534), 'h', 'rot8'),
    ('P6', 'q04', 'm5', (6.535534, 5.535534), 'v', 'rot8'),
    ('P7', 'q02', 'm6', (6.535534, 7.535534), 'h', 'rot8'),
    ('P8', 'm1', 'm4@3', (1.707107, 8.949747), 'h', 'rot8'),
    ('P9', 'q04', 'm8', (9.949747, 8.949747), 'v', 'rot4'),
    ('P10', 'q02', 'm9', (9.949747, 10.949747), 'h', 'rot8'),
    ('P11', 'm6', 'm10', (6.535534, 10.949747), 'd135', 'rot4'),
    ('P12', 'm1@3', 'm10', (8.535534, 10.949747), 'd135', 'rot4'),
    ('P13', 'm1@3', 'm9', (9.949747, 12.363961), 'd135', 'rot4'),
]


def build():
    nj.mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))
    nj.build_tile('m7@5')


SPEC = {
    'id': 'meknes-throne-star-rosette', 'title': 'Star rosette of the Royal Palace throne room (Meknes)',
    'short': 'Meknes throne-room star rosette', 'subtitle': 'Royal Palace throne room, Meknes',
    'code': 'C122C', 'folder': 'data152', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the large rosette.', 'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s C122C drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of earlier lines and turned round O.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing, which keeps '
               'the original colouring: green, red, black and white, in the Tétouan palette, whose dark navy '
               'stands for his black. No photograph was checked.',
    'references': 'His references are Jean-Marc Castéra, Arabesques: Decorative Art in Morocco (1999), pages '
                  '122-3, Royal Palace throne room, Meknes (original colouring), and Wichmann and Wade, Islamic '
                  'Design: a Mathematical Approach (2017), figures 9.5b and 11.15.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart'},
    'palette': 'Tétouan',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(9, 3.328): ('shield', 'ground'), (6, 3.0): ('long_hexagon', 'c'), (16, 2.343): ('star', 'c'),
         (10, 2.0): ('ten', 'c'), (8, 2.0): ('eight', 'ground'), (7, 1.914): ('seven', 'a'),
         (6, 1.828): ('hexagon', 'a'), (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'c'),
         (4, .414): ('kite', 'ground')}
# Wichmann's colours by the player's nth (large/fillnth.py), in the Tétouan palette: green a, red d,
# black c (its dark navy).
FILLS = {
    'long_hexagon': {'a': [0, 1, 2, 3, 8, 16, 17, 19, 20, 23, 24, 27, 28, 30, 31, 38],
                     'd': [9, 12, 13, 22, 25, 34, 35, 39]},
    'seven': {'d': [5, 6, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23, 25, 26]},
    'hexagon': {'d': [5, 6, 8, 9, 10, 11, 16, 19, 20, 23, 28, 29, 30, 31, 33, 34],
                'c': [13, 14, 17, 18, 21, 22, 25, 26]},
    'triangle': {'ground': [4, 5, 8, 9, 26, 27, 30, 31]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'shield': 24, 'long_hexagon': 44, 'star': 16, 'ten': 8, 'eight': 24, 'seven': 32, 'hexagon': 40,
          'dart': 40, 'triangle': 32, 'kite': 136}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
