#!/usr/bin/env python3
"""MOR0411, Fès (Wade MOR 0411; Wichmann and Wade, figure 9.5c).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 20.5208 pt; the square cell has
half-side L = 7 + 10H (H = √2/2), 288.75 pt, with O at the small star in the
middle of the ring of four petal flowers (repeat found by matching pieces
under translation). All corners snap to a + bH (worst 0.0004). After the
unit star each line runs through a crossing of earlier lines
(large/greedy.py); where an axis line and a diagonal share their distance,
one line turned by 45° seven times draws both. The tile's sides run through
the crossings of the horizontal through O with a diagonal.
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
L = 7+10*H
ORIGIN, UNIT = (298.47, 371.97), 288.75/(7+10*H)

PLAN = [
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'v', 'rot8'),
    ('P2', 'q02', 'm1', (1.707107, 2.707107), 'h', 'rot8'),
    ('P3', 'm1', 'm1@3', (1.707107, 4.12132), 'h', 'rot8'),
    ('P4', 'q04', 'm3', (5.12132, 4.12132), 'v', 'rot8'),
    ('P5', 'q02', 'm4', (5.12132, 6.12132), 'h', 'rot4'),
    ('P6', 'q11', 'm3@5', (6.535534, 0.707107), 'v', 'rot8'),
    ('P7', 'q02', 'm6', (6.535534, 7.535534), 'h', 'rot8'),
    ('P8', 'q04', 'm7', (8.535534, 7.535534), 'v', 'rot4'),
    ('P9', 'm1', 'm4@3', (1.707107, 8.949747), 'h', 'rot8'),
    ('P10', 'q04', 'm9', (9.949747, 8.949747), 'v', 'rot8'),
    ('P11', 'm2@1', 'm6', (6.535534, 10.363961), 'h', 'rot4'),
    ('P12', 'q02', 'm10', (9.949747, 10.949747), 'h', 'rot8'),
    ('P13', 'm1', 'm7@1', (1.707107, 12.363961), 'h', 'rot8'),
    ('P14', 'q04', 'm13', (13.363961, 12.363961), 'v', 'rot8'),
    ('P2', 'q02', 'm1', (1.707107, 2.707107), 'd135', 'rot4'),
    ('P15', 'm4', 'm11', (5.12132, 10.363961), 'd45', 'rot4'),
    ('P16', 'q11', 'm8', (8.535534, 0.707107), 'd45', 'rot4'),
    ('P17', 'm10', 'm11', (9.949747, 10.363961), 'd135', 'rot4'),
    ('P12', 'q02', 'm10', (9.949747, 10.949747), 'd135', 'rot4'),
    ('P18', 'm8', 'm16', (8.535534, 13.778175), 'd135', 'rot4'),
    ('P19', 'q04', 'm12', (11.949747, 10.949747), 'd135', 'rot4'),
    ('P20', 'q02', 'm13', (11.363961, 12.363961), 'd135', 'rot4'),
]


def build_tile():
    step(f'The horizontal line through O crosses {pl.describe("m10@1")} at T. Draw a vertical line through T. '
         'Turn it round O by 90°, three times. The four lines make a square with corners K1, K2, K3 and K4.')
    g.meet('T', 'h', 'm10@1', (L, 0))
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
    'id': 'fes-petal-star-rosette', 'title': 'Petal and star rosette (Fès)',
    'short': 'Fès petal and star rosette', 'subtitle': 'Fès',
    'code': 'MOR0411', 'folder': 'data175', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star in the middle of the four petal flowers.',
              'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s MOR0411 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of earlier lines and turned round O.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Modern '
               'Moroccan palette: his red is the palette’s red and his light blue its dark blue. Wade’s photo '
               'MOR 0411 was not checked.',
    'references': 'His references are David Wade’s photo MOR 0411 (patterninislamicart.com), Fès, and Wichmann '
                  'and Wade, Islamic Design: a Mathematical Approach (2017), figures 9.5c and 11.16.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart', 'square', 'rhombus'},
    'palette': 'Modern Moroccan',
    'repeat': 'Put copies of the square tile side by side. Four petal flowers ring the small star at the '
              'centre of every tile.',
}
NAMES = {(16, 5.657): ('big_star', 'ground'), (11, 3.157): ('eleven', 'ground'), (6, 3.0): ('long_hexagon', 'a'),
         (16, 2.343): ('star', 'a'), (8, 2.0): ('eight', 'ground'), (6, 2.0): ('petal', 'a'),
         (7, 1.914): ('seven', 'b'), (6, 1.828): ('hexagon', 'c'), (8, 1.828): ('small_eight', 'c'),
         (4, 1.414): ('rhombus', 'ground'), (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'ground'),
         (4, .414): ('kite', 'ground'), (4, .343): ('square', 'a')}
# Wichmann's colours by the player's nth (large/fillnth.py): black a, red b, light blue c (the palette's
# dark blue).
FILLS = {
    'big_star': {'a': [0]},
    'star': {'c': [0, 1, 7, 21], 'b': [3, 6, 24, 27], 'ground': [8, 9, 11, 14, 16, 19, 22, 23]},
    'eight': {'c': [0, 5, 6, 9, 10, 29, 32, 35], 'a': [1, 4, 13, 14, 15, 26, 27, 28]},
    'petal': {'ground': [0, 3, 4, 9, 10, 35, 38, 43]},
    'hexagon': {'ground': [0, 1, 2, 5, 18, 21, 22, 23]},
    'small_eight': {'b': [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]},
    'rhombus': {'c': [0, 3, 4, 9, 22, 27, 28, 31]},
    'dart': {'a': [0, 1, 2, 5, 18, 21, 22, 23]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'big_star': 9, 'eleven': 16, 'long_hexagon': 42, 'star': 29, 'eight': 36, 'petal': 44, 'seven': 40,
          'hexagon': 24, 'small_eight': 32, 'rhombus': 32, 'dart': 24, 'triangle': 52, 'kite': 168, 'square': 8}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
