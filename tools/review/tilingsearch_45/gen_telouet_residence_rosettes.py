#!/usr/bin/env python3
"""F16, royal residence, Telouet (Paccard, volume 1, page 419).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the star's point radius r = 16.9 pt; the square cell has half-side
L = 6 + 8H (H = √2/2), 197 pt, with O at the star inside the blue rosette
and the cross rosettes at the tile's corners (repeat 394 pt, found by
matching pieces under translation). All corners snap to a + bH (worst
0.0007 OA). Axis lines lie at H, 1 + H, 3H, 3 + H, 2 + 3H, 3 + 3H, 2 + 5H,
3 + 5H, 4 + 5H, 4 + 7H, 5 + 7H, 6 + 7H and 5 + 9H; the diagonals at the
same but 5 + 7H and 5 + 9H, and at 6 + 9H and 8 + 11H. After the unit star
every line runs through a crossing of earlier lines (large/greedy.py). The
cell is the Najjarin rosette's, and the tile's sides come the same way.
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
ORIGIN, UNIT = (297.5, 372.13), 16.9

PLAN = [
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'v', 'rot8'),
    ('P2', 'm1', 'm1@3', (1.707107, 4.12132), 'h', 'rot8'),
    ('P3', 'q04', 'm2', (5.12132, 4.12132), 'v', 'rot8'),
    ('P4', 'm3', 'm3@1', (5.12132, 2.12132), 'h', 'rot8'),
    ('P5', 'q11', 'm4@5', (3.707107, 0.707107), 'v', 'rot8'),
    ('P6', 'm1', 'm3@1', (1.707107, 5.535534), 'h', 'rot8'),
    ('P7', 'q04', 'm6', (6.535534, 5.535534), 'v', 'rot8'),
    ('P8', 'q02', 'm7', (6.535534, 7.535534), 'h', 'rot8'),
    ('P9', 'm1', 'm3@3', (1.707107, 8.949747), 'h', 'rot8'),
    ('P10', 'q04', 'm9', (9.949747, 8.949747), 'v', 'rot4'),
    ('P11', 'q02', 'm10', (9.949747, 10.949747), 'h', 'rot8'),
    ('P12', 'q11', 'm8@5', (11.363961, 0.707107), 'v', 'rot4'),
    ('P13', 'm7', 'm11', (6.535534, 10.949747), 'd135', 'rot4'),
    ('P14', 'm11', 'm12', (11.363961, 10.949747), 'd135', 'rot4'),
]


def build():
    nj.mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))
    nj.build_tile('m8@5')


SPEC = {
    'id': 'telouet-residence-rosettes', 'title': 'Rosettes of the royal residence (Telouet)',
    'short': 'Telouet residence rosettes', 'subtitle': 'Royal residence, Telouet',
    'code': 'F16', 'folder': 'data166', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the star inside the large rosette.', 'A': 'A point of that star.'},
    'note': 'The finished design was read from Wichmann’s F16 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of earlier lines and turned round O.',
    'changes': 'The tile edges follow the plain drawing, which shows part of a larger pattern. The colours follow '
               'Wichmann’s drawing, which keeps the original colouring, in the Marinid zellige palette: his green, '
               'blue and black take the palette’s, and his orange and red both take its honey, since the palette '
               'has no red. No photograph was checked.',
    'references': 'His reference is André Paccard, Traditional Islamic Craft in Moroccan Architecture (1980), '
                  'volume 1, page 419, the royal residence, Telouet (part of a larger pattern, colours from the '
                  'original).',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart', 'rhombus'},
    'palette': 'Marinid zellige',
    'repeat': 'Put copies of the square tile side by side. A large rosette sits at the centre of every tile, '
              'and a cross rosette at every corner.',
}
NAMES = {(9, 3.328): ('shield', 'ground'), (6, 3.0): ('long_hexagon', 'a'), (8, 2.828): ('big_eight', 'c'),
         (16, 2.343): ('star', 'a'), (6, 2.0): ('petal', 'd'), (8, 2.0): ('eight', 'ground'),
         (6, 1.828): ('hexagon', 'a'), (16, 1.657): ('cross', 'c'), (4, 1.414): ('rhombus', 'a'),
         (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'a'), (4, .414): ('kite', 'ground')}
# Wichmann's colours by the player's nth (large/fillnth.py), in the Marinid zellige palette: black a,
# green b, blue c, his orange and red both honey d, white ground.
FILLS = {
    'long_hexagon': {'b': [5, 6, 8, 9, 13, 14, 16, 17, 26, 27, 29, 30, 34, 35, 37, 38],
                     'ground': [15, 18, 19, 21, 22, 24, 25, 28]},
    'star': {'d': [7]},
    'petal': {'b': [2, 3, 6, 16, 19, 29, 32, 33], 'a': [11, 13, 14, 17, 18, 21, 22, 24]},
    'eight': {'d': [2, 4, 5, 8, 11, 14, 15, 17]},
    'hexagon': {'d': [0, 3, 8, 9, 30, 31, 36, 39],
                'b': [1, 2, 4, 7, 10, 11, 18, 19, 20, 21, 28, 29, 32, 35, 37, 38]},
    'rhombus': {'ground': [3, 4, 6, 7, 8, 9, 11, 12]},
    'kite': {'a': [26, 27, 32, 33, 36, 37, 47, 50, 53, 56, 66, 67, 70, 71, 76, 77]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'shield': 20, 'long_hexagon': 40, 'big_eight': 16, 'star': 11, 'petal': 36, 'eight': 20, 'hexagon': 40,
          'cross': 1, 'rhombus': 16, 'dart': 40, 'triangle': 20, 'kite': 104}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
