#!/usr/bin/env python3
"""MOR1218, Bahia Palace, Marrakesh (Wade MOR 1218).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 21.7274 pt; the square cell has
half-side L = 6 + 10H (H = √2/2), 284.0 pt, with O at the small star in the
middle of the large rosette (repeat found by matching pieces under
translation: the rosettes at the cell's corners differ from the one at O,
and the half-diagonal shift is not a repeat). All corners snap to a + bH
(worst 0.0005). Axis lines lie at 1 + H, 1 + 3H, 3H, 2 + 3H, 1 + 5H,
3 + 3H, 2 + 5H, 4 + 3H, 3 + 5H, 4 + 5H, 4 + 7H, 4 + 9H, 6 + 7H and 6 + 9H;
the diagonals at the same but 4 + 9H, and at 2 + H, 6 + 5H, 8 + 7H, 8 + 9H,
8 + 11H and 10 + 11H. After the unit star each line runs through a crossing
of earlier lines (large/greedy.py); where an axis line and a diagonal share
their distance, one line turned by 45° seven times draws both. The crossing
for the last diagonal lies just outside the tile.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402,F401
from common import g, step  # noqa: E402
import medium  # noqa: E402
import parallels as pl  # noqa: E402
import gen_meknes_bou_inania_petals as mp  # noqa: E402

H = mp.H
L = 6+10*H
ORIGIN, UNIT = (297.5, 372.45), 284/(6+10*H)

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
    ('P12', 'm1', 'm8@1', (1.707107, 10.363961), 'h', 'rot4'),
    ('P13', 'm1', 'm9@3', (1.707107, 10.949747), 'h', 'rot8'),
    ('P14', 'm1', 'm10@1', (1.707107, 12.363961), 'h', 'rot8'),
    ('P2', 'q11', 'm2', (3.12132, 0.707107), 'd135', 'rot4'),
    ('P15', 'm2', 'm12', (3.12132, 10.363961), 'd135', 'rot4'),
    ('P16', 'm1@3', 'm12', (7.949747, 10.363961), 'd135', 'rot4'),
    ('P17', 'm1@7', 'm11', (11.363961, 8.949747), 'd135', 'rot4'),
    ('P18', 'm1@3', 'm14', (9.949747, 12.363961), 'd135', 'rot4'),
    ('P19', 'm2@7', 'm12', (14.778175, 10.363961), 'd135', 'rot4'),
]


def build_tile():
    step(f'The line from S7 to S1 crosses {pl.describe("m20")} at T. Draw a vertical line through T. '
         'Turn it round O by 90°, three times. The four lines make a square with corners K1, K2, K3 and K4.')
    g.meet('T', 'q04', 'm20', (L, 5+10*H))
    g.line_par('gs', 'T', 'v')
    g.repeat('gsr', ['gs'], 'rot4')
    for i, (a, b, p) in enumerate([('gs', 'gs@1', (L, L)), ('gs@1', 'gs@2', (-L, L)),
                                   ('gs@2', 'gs@3', (-L, -L)), ('gs@3', 'gs', (L, -L))]):
        g.meet(f'K{i+1}', a, b, p)


def build():
    mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))
    build_tile()


SPEC = {
    'id': 'marrakesh-bahia-rosette', 'title': 'Rosette of the Bahia Palace (Marrakesh)',
    'short': 'Bahia Palace rosette', 'subtitle': 'Bahia Palace, Marrakesh',
    'code': 'MOR1218', 'folder': 'data190', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star in the middle of the large rosette.',
              'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s MOR1218 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of earlier lines and turned round O.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Marinid '
               'zellige palette: his ochre takes the palette’s amber. Wade’s photo MOR 1218 was not checked.',
    'references': 'His reference is David Wade’s photo MOR 1218 (patterninislamicart.com), the Bahia Palace, '
                  'Marrakesh.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart'},
    'palette': 'Marinid zellige',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(9, 3.328): ('shield', 'ground'), (6, 3.0): ('long_hexagon', 'a'), (8, 2.657): ('big_eight', 'ground'),
         (16, 2.343): ('star', 'a'), (8, 2.172): ('wide_eight', 'a'), (6, 2.0): ('petal', 'a'),
         (8, 2.0): ('eight', 'd'), (7, 1.914): ('seven', 'd'), (6, 1.828): ('hexagon', 'a'),
         (16, 1.657): ('small_star', 'ground'), (4, 1.414): ('rhombus', 'ground'), (4, .586): ('dart', 'ground'),
         (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground')}
# Wichmann's colours by the player's nth (large/fillnth.py): black a, ochre d (the palette's amber).
FILLS = {
    'shield': {'a': [4, 7, 8, 11, 12, 15, 16, 19]},
    'long_hexagon': {'d': [5, 6, 13, 14, 39, 40, 48, 49], 'ground': [15, 18, 19, 26, 27, 34, 35, 38]},
    'eight': {'a': [6, 7, 8, 9, 10, 13, 28, 31, 32, 33, 34, 35], 'ground': [16, 17, 18, 20, 21, 23, 24, 26]},
    'hexagon': {'d': [0, 1, 10, 11, 36, 37, 46, 47],
                'ground': [8, 9, 14, 15, 16, 17, 22, 23, 24, 25, 30, 31, 32, 33, 38, 39]},
    'dart': {'a': [8, 9, 12, 13, 16, 17, 22, 23, 24, 25, 30, 31, 34, 35, 38, 39]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'shield': 24, 'long_hexagon': 52, 'big_eight': 8, 'star': 22, 'wide_eight': 8, 'petal': 16, 'eight': 36,
          'seven': 16, 'hexagon': 48, 'small_star': 10, 'rhombus': 8, 'dart': 48, 'triangle': 32, 'kite': 152}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
