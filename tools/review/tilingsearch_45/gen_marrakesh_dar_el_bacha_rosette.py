#!/usr/bin/env python3
"""MIR19, after the Dar el Bacha palace, Marrakesh (a photo by Mirek
Majewski). Plain tiles drawn edge to edge; use 1_pieces.py --precision 2,
then this generator with <pieces.json> <tutorial.json>; use finish
<dump.json> <tutorial.json>.

The symmetry is p4g: four-fold turns about O and about the cell's corners,
but no mirror through them (the mirrors run between), so the tutorial is
fold 4 and chiral. OA is the small star's point radius r = 16.8993 pt; the
square cell has half-side L = 6 + 8H (H = √2/2), 196.99 pt, with O at the
small star in the middle of the cross-shaped rosette and the mirrored
rosettes at the corners (found by testing turns about piece centres; the
half-diagonal shift is not a repeat). All corners snap to a + bH. The frame
is that of the Najjarin and Meknes throne-room rosettes. After the unit
star each line runs through a crossing of earlier lines (large/greedy.py),
and the tile's sides come as in the Najjarin rosette.
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
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'd135', 'rot4'),
    ('P2', 'q12', 'm1', (-0.707107, 3.12132), 'd45', 'rot8'),
    ('P3', 'cy', 'm2@2', (-4.828427, 1.0), 'd45', 'rot8'),
    ('P4', 'q14', 'm3', (0.707107, 6.535534), 'd135', 'rot4'),
    ('P5', 'm2', 'm4', (1.707107, 5.535534), 'h', 'rot8'),
    ('P6', 'm4', 'm5@1', (-0.292893, 7.535534), 'h', 'rot8'),
    ('P7', 'm4', 'm6@1', (-1.707107, 8.949747), 'h', 'rot8'),
    ('P8', 'q12', 'm4', (-0.707107, 7.949747), 'd45', 'rot8'),
    ('P9', 'm3', 'm6', (1.707107, 7.535534), 'd135', 'rot4'),
    ('P10', 'm7@1', 'm9', (-1.707107, 10.949747), 'h', 'rot4'),
    ('P11', 'q02', 'm6', (6.535534, 7.535534), 'd135', 'rot4'),
    ('P12', 'm4', 'm10', (-3.707107, 10.949747), 'd45', 'rot4'),
    ('P13', 'q04', 'm6', (8.535534, 7.535534), 'd135', 'rot4'),
    ('P14', 'm1@3', 'm6', (9.949747, 7.535534), 'd135', 'rot4'),
    ('P15', 'm1', 'm10', (-8.535534, 10.949747), 'd45', 'rot4'),
    ('P16', 'm4@3', 'm6', (14.778175, 7.535534), 'd135', 'rot4'),
]


def build_lines():
    nj.mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))


TILE = 'm6@5'


def build():
    build_lines()
    nj.build_tile(TILE)


SPEC = {
    'id': 'marrakesh-dar-el-bacha-rosette', 'title': 'Rosette of the Dar el Bacha palace (Marrakesh)',
    'short': 'Dar el Bacha rosette', 'subtitle': 'Dar el Bacha palace, Marrakesh',
    'code': 'MIR19', 'folder': 'data215', 'frame': (ORIGIN, UNIT, 0, L), 'chiral': True,
    'given': {'O': 'The centre of the small star in the middle of the cross-shaped rosette.',
              'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s MIR19 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of earlier lines and turned round O. The pattern turns about O but has no mirror through it.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Marinid '
               'zellige palette: his pale green takes its green, his rust its honey, and his dark blue and sea green '
               'both its blue. No photograph was checked; '
               'Wichmann notes that the photo shows a band round the panel, which is not drawn.',
    'references': 'His reference is a photo of the Dar el Bacha palace, Marrakesh (1910), sent to him by Mirek '
                  'Majewski.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart', 'square'},
    'palette': 'Marinid zellige',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile, and its '
              'mirror image at each corner.',
}
NAMES = {(9, 3.328): ('shield', 'ground'), (11, 3.157): ('eleven', 'ground'), (6, 3.0): ('long_hexagon', 'd'),
         (16, 2.343): ('star', 'a'), (8, 2.0): ('eight', 'ground'), (7, 1.914): ('seven', 'd'),
         (6, 1.828): ('hexagon', 'd'), (16, 1.657): ('pointed_star', 'ground'), (4, .586): ('dart', 'ground'),
         (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground'), (4, .343): ('square', 'c')}
# Wichmann's colours by the player's nth (large/fillnth.py): black a, pale green b (the palette's green),
# dark blue and sea green c (the palette's blue), rust d (the palette's honey).
FILLS = {
    'long_hexagon': {'a': [0, 3, 10, 14, 15, 19, 22, 27, 30, 34, 35, 39], 'b': [6, 7, 11, 12, 13, 36, 37, 38, 42, 43],
                     'c': [24, 25]},
    'star': {'c': [2, 4, 5, 7, 10, 12, 16, 18, 19]},
    'eight': {'b': [0, 1, 2, 6, 7, 15, 18, 21, 24, 32, 33, 37], 'd': [9, 12, 16, 17, 19, 20, 22, 23, 27, 30]},
    'seven': {'b': [2, 3, 6, 7, 10, 11, 20, 21, 24, 25, 28, 29]},
    'hexagon': {'b': [1, 2, 6, 7, 10, 11, 16, 17, 20, 21, 25, 26]},
    'triangle': {'c': [6, 7, 8, 9, 14, 15, 16, 17, 34, 35, 36, 37, 42, 43, 44, 45]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'shield': 8, 'eleven': 8, 'long_hexagon': 46, 'star': 20, 'eight': 38, 'seven': 32, 'hexagon': 28,
          'pointed_star': 2, 'dart': 28, 'triangle': 52, 'kite': 172, 'square': 4}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
