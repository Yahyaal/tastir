#!/usr/bin/env python3
"""C124, Royal Palace throne room, Meknes (Castéra page 124).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 19.3136 pt; the square cell has
half-side L = 6 + 10H (H = √2/2), 252.45 pt, with O at the star inside the
green-ringed rosette. The repeat (504.9 pt) was found by matching pieces
under translation: the white star rosettes on the cell's sides differ from
the one at O. All corners snap to a + bH (worst 0.0008 OA). Axis lines lie
at H, 1 + H, 2 + H, 1 + 3H, 2 + 3H, 3 + 3H, 2 + 5H, 4 + 3H, 3 + 5H, 4 + 5H,
3 + 7H, 4 + 7H, 5 + 7H, 4 + 9H, 6 + 7H and 6 + 9H; the diagonals at the
same but 4 + 9H, and at 6 + 5H, 8 + 7H, 8 + 9H, 8 + 11H and 10 + 11H.
The first eight lines after the unit star are those of the Meknes
throne-room star rosette (gen_meknes_throne_star_rosette.py), from the same
room; the rest come from the greedy search (large/greedy.py), each a
parallel through a crossing of earlier lines. The last diagonal's crossing
lies outside the tile. The tile's sides come as in the Najjarin rosette.
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
L = 6+10*H
ORIGIN, UNIT = (297.5, 372.29), 19.3136
nj.L = L   # build_tile marks the corners at the tile's half-side

PLAN = [
    ('P9', 'q02', 'm3', (3.12132, 4.12132), 'v', 'rot8'),
    ('P10', 'q02', 'm4', (5.12132, 6.12132), 'h', 'rot8'),
    ('P11', 'q02', 'm8', (7.949747, 8.949747), 'v', 'rot8'),
    ('P12', 'q04', 'm8', (9.949747, 8.949747), 'v', 'rot8'),
    ('P13', 'm1', 'm10@1', (1.707107, 10.363961), 'h', 'rot4'),
    ('P14', 'q02', 'm12', (9.949747, 10.949747), 'h', 'rot8'),
    ('P15', 'm1', 'm7@1', (1.707107, 12.363961), 'h', 'rot8'),
    ('P16', 'm5', 'm11', (7.949747, 5.535534), 'd135', 'rot4'),
    ('P17', 'm11', 'm13', (7.949747, 10.363961), 'd135', 'rot4'),
    ('P18', 'm11', 'm15', (7.949747, 12.363961), 'd135', 'rot4'),
    ('P19', 'm12', 'm15', (9.949747, 12.363961), 'd135', 'rot4'),
    ('P20', 'm4@7', 'm8', (16.192388, 8.949747), 'd135', 'rot4'),
]


def build():
    nj.mp.build_unit_star()
    pl.emit(pl.group(ts.PLAN[:8], 3))
    pl.emit(pl.group(PLAN, 3))
    nj.build_tile('m12@1')


SPEC = {
    'id': 'meknes-throne-ring-rosette', 'title': 'Ringed rosette of the Royal Palace throne room (Meknes)',
    'short': 'Meknes throne-room ringed rosette', 'subtitle': 'Royal Palace throne room, Meknes',
    'code': 'C124', 'folder': 'data188', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the ringed rosette.', 'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s C124 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The opening, the unit star and the first '
            'eight lines after it, is shared with the Meknes throne-room star rosette from the same room. After '
            'the unit star every line, the tile’s sides too, is drawn through a crossing of earlier lines and '
            'turned round O.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing, which keeps '
               'the original colouring: red, green, black and white, in the Tétouan palette, whose dark navy '
               'stands for his black. No photograph was checked.',
    'references': 'His reference is Jean-Marc Castéra, Arabesques: Decorative Art in Morocco (1999), page '
                  '124, Royal Palace throne room, Meknes (colouring from the original).',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart', 'square'},
    'palette': 'Tétouan',
    'repeat': 'Put copies of the square tile side by side. A ringed rosette sits at the centre of every tile.',
}
NAMES = {(18, 5.485): ('eighteen', 'ground'), (9, 3.328): ('shield', 'c'), (6, 3.0): ('long_hexagon', 'c'),
         (16, 2.343): ('star', 'c'), (6, 2.0): ('petal', 'ground'), (8, 2.0): ('eight', 'ground'),
         (7, 1.914): ('seven', 'd'), (6, 1.828): ('hexagon', 'c'), (16, 1.657): ('pointed_star', 'ground'),
         (4, 1.414): ('rhombus', 'a'), (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'ground'),
         (4, .414): ('kite', 'ground'), (4, .343): ('square', 'c')}
# Wichmann's colours by the player's nth (large/fillnth.py), in the Tétouan palette: green a, red d,
# black c (its dark navy), white ground.
FILLS = {
    'shield': {'ground': [6, 7, 8, 11, 12, 15, 16, 17]},
    'long_hexagon': {'d': [0, 1, 4, 5, 6, 19, 21, 22, 24, 25, 27, 28, 30, 41, 44, 45],
                     'ground': [13, 16, 17, 23, 26, 32, 33, 36]},
    'eight': {'c': [0, 1, 2, 3, 4, 5, 6, 7, 15, 18, 21, 24, 27, 30, 38, 39], 'd': [10, 13, 14, 22, 23, 31, 32, 35]},
    'seven': {'ground': [6, 7, 10, 11, 14, 15, 22, 23, 24, 25, 32, 33, 36, 37, 40, 41]},
    'hexagon': {'a': [8, 9, 12, 13, 18, 19, 22, 23]},
    'rhombus': {'ground': [0, 1, 4, 5, 10, 11, 14, 15]},
    'triangle': {'c': [10, 14, 15, 25, 30, 40, 41, 45],
                 'a': [11, 16, 17, 18, 19, 20, 26, 27, 28, 29, 35, 36, 37, 38, 39, 44]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'eighteen': 4, 'shield': 24, 'long_hexagon': 48, 'star': 18, 'petal': 16, 'eight': 40, 'seven': 48,
          'hexagon': 32, 'pointed_star': 4, 'rhombus': 16, 'dart': 32, 'triangle': 56, 'kite': 136, 'square': 2}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
