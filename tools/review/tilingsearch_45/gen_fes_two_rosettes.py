#!/usr/bin/env python3
"""MOR0837, Fès (Wade MOR 0837).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 16.8993 pt; the square cell has
half-side L = 6 + 8H (H = √2/2), 196.99 pt, with O at the small star inside
the large rosette (repeat found by matching pieces under translation: the
rosettes of eight petals at the cell's corners are of another kind). All corners snap to
a + bH. The frame is that of the Najjarin and Meknes throne-room rosettes,
but the lines differ. After the unit star each line runs through a crossing
of earlier lines (large/greedy.py).
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
ORIGIN, UNIT = (297.5, 372.13), 196.99/(6+8*H)

PLAN = [
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'v', 'rot8'),
    ('P2', 'q11', 'm1@7', (3.12132, 0.707107), 'v', 'rot8'),
    ('P3', 'q04', 'm2', (3.12132, 2.12132), 'h', 'rot8'),
    ('P4', 'q02', 'm2', (3.12132, 4.12132), 'h', 'rot8'),
    ('P5', 'm1@7', 'm3', (4.535534, 2.12132), 'v', 'rot8'),
    ('P6', 'q04', 'm4', (5.12132, 4.12132), 'v', 'rot8'),
    ('P7', 'q02', 'm5', (4.535534, 5.535534), 'h', 'rot8'),
    ('P8', 'q02', 'm6', (5.12132, 6.12132), 'h', 'rot8'),
    ('P9', 'q04', 'm7', (6.535534, 5.535534), 'v', 'rot8'),
    ('P10', 'q02', 'm9', (6.535534, 7.535534), 'h', 'rot8'),
    ('P11', 'm1', 'm6@3', (1.707107, 8.949747), 'h', 'rot8'),
    ('P12', 'm1', 'm9@3', (1.707107, 10.949747), 'h', 'rot8'),
    ('P2', 'q11', 'm2', (3.12132, 0.707107), 'd135', 'rot4'),
    ('P13', 'm9', 'm12', (6.535534, 10.949747), 'd135', 'rot4'),
    ('P14', 'm1@3', 'm12', (8.535534, 10.949747), 'd135', 'rot4'),
    ('P15', 'm2@7', 'm11', (13.363961, 8.949747), 'd135', 'rot4'),
]


def build_lines():
    nj.mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))


def build():
    build_lines()
    nj.build_tile('m10@5')


SPEC = {
    'id': 'fes-two-rosettes', 'title': 'Two rosettes (Fès)',
    'short': 'Fès two rosettes', 'subtitle': 'Fès, Morocco',
    'code': 'MOR0837', 'folder': 'data181', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the large rosette.',
              'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s MOR0837 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of earlier lines and turned round O.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Marinid '
               'zellige palette. Wade’s photo MOR 0837 was not checked.',
    'references': 'His reference is David Wade’s photo MOR 0837 (patterninislamicart.com), Fès, 18th century.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart', 'square', 'pentagon'},
    'palette': 'Marinid zellige',
    'repeat': 'Put copies of the square tile side by side. A large rosette sits at the centre of every tile, and a rosette of eight petals at each corner.',
}
NAMES = {(9, 3.328): ('shield', 'ground'), (11, 3.157): ('eleven', 'a'), (6, 3.0): ('long_hexagon', 'b'),
         (8, 2.657): ('big_eight', 'ground'), (16, 2.343): ('star', 'a'), (8, 2.172): ('wide_eight', 'a'),
         (6, 2.0): ('petal', 'b'), (8, 2.0): ('eight', 'ground'), (7, 1.914): ('seven', 'd'),
         (6, 1.828): ('hexagon', 'a'), (4, 1.414): ('rhombus', 'ground'), (4, .586): ('dart', 'ground'),
         (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground'), (4, .343): ('square', 'ground'),
         (5, .328): ('pentagon', 'a')}
# Wichmann's colours by the player's nth (large/fillnth.py): black a, green b, blue c, orange d (the
# palette's honey).
FILLS = {
    'long_hexagon': {'d': [0, 3, 4, 9, 10, 27, 30, 35], 'a': [1, 2, 19, 20]},
    'eight': {'b': [0, 1, 3, 34]},
    'petal': {'c': [3, 4, 5, 7, 8, 10, 11, 12]},
    'hexagon': {'b': [1, 2, 5, 8, 10, 11, 14, 15, 16, 17, 20, 21, 23, 26, 29, 30]},
    'triangle': {'a': [2, 3, 6, 7, 9, 10, 13, 14, 17, 18, 21, 22, 24, 25, 28, 29]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'shield': 16, 'eleven': 8, 'long_hexagon': 36, 'big_eight': 8, 'star': 12, 'wide_eight': 8, 'petal': 16,
          'eight': 36, 'seven': 16, 'hexagon': 32, 'rhombus': 8, 'dart': 32, 'triangle': 32, 'kite': 104,
          'square': 8, 'pentagon': 16}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
