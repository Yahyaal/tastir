#!/usr/bin/env python3
"""FEZ7, a Fès motif (W. Betsch's photo, sent to Wichmann).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 6(1 + √2) = 14.485 pt (the drawing's
edge is 6 pt); the square cell has half-side L = 7 + 10H (H = √2/2), 203.83 pt,
with O at the yellow star inside the red rosette (repeat 407.65 pt, found by
matching pieces under translation; the white star at the corner is the
other four-fold centre). All corners snap to a + bH (worst 0.001 OA). Axis
lines lie at H, 1 + H, 2 + H, 1 + 3H, 2 + 3H, 3 + 3H, 4 + 3H, 2 + 5H,
3 + 5H, 4 + 5H, 5 + 5H, 4 + 7H, 5 + 7H, 6 + 7H, 5 + 9H, 6 + 9H and 7 + 9H;
the diagonals at the same, and at 7 + 11H, 8 + 11H, 9 + 11H, 9 + 13H and
10 + 13H. After the unit star each line runs through a crossing of earlier
lines (large/greedy.py); where an axis line and a diagonal share their
distance, one line turned by 45° seven times draws both. The crossing for
the last diagonal lies just outside the tile. The tile's sides run through
the crossings of the horizontal through O with a diagonal, as in the Fès
petal and star rosette (same cell, a different design: eight of its lines
differ).
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
ORIGIN, UNIT = (297.5, 371.965), 6*(1+2*H)

PLAN = [
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'v', 'rot8'),
    ('P2', 'q02', 'm1', (1.707107, 2.707107), 'h', 'rot8'),
    ('P3', 'q11', 'm1@7', (3.12132, 0.707107), 'v', 'rot8'),
    ('P4', 'q02', 'm3', (3.12132, 4.12132), 'h', 'rot8'),
    ('P5', 'q04', 'm4', (5.12132, 4.12132), 'v', 'rot8'),
    ('P6', 'm1', 'm2@1', (1.707107, 5.535534), 'h', 'rot8'),
    ('P7', 'q02', 'm5', (5.12132, 6.12132), 'h', 'rot8'),
    ('P8', 'q04', 'm6', (6.535534, 5.535534), 'v', 'rot8'),
    ('P9', 'q02', 'm8', (6.535534, 7.535534), 'h', 'rot8'),
    ('P10', 'q04', 'm9', (8.535534, 7.535534), 'v', 'rot8'),
    ('P11', 'm1', 'm5@3', (1.707107, 8.949747), 'h', 'rot8'),
    ('P12', 'q04', 'm11', (9.949747, 8.949747), 'v', 'rot8'),
    ('P13', 'q02', 'm12', (9.949747, 10.949747), 'h', 'rot8'),
    ('P14', 'q11', 'm9@5', (11.363961, 0.707107), 'v', 'rot8'),
    ('P15', 'q02', 'm14', (11.363961, 12.363961), 'h', 'rot8'),
    ('P16', 'q04', 'm15', (13.363961, 12.363961), 'v', 'rot8'),
    ('P13', 'q02', 'm12', (9.949747, 10.949747), 'd135', 'rot4'),
    ('P17', 'm11', 'm16', (13.363961, 8.949747), 'd135', 'rot4'),
    ('P15', 'q02', 'm14', (11.363961, 12.363961), 'd135', 'rot4'),
    ('P16', 'q04', 'm15', (13.363961, 12.363961), 'd135', 'rot4'),
    ('P18', 'm1@7', 'm15', (14.778175, 12.363961), 'd135', 'rot4'),
]


def build_tile():
    step(f'The horizontal line through O crosses {pl.describe("m12@1")} at T. Draw a vertical line through T. '
         'Turn it round O by 90°, three times. The four lines make a square with corners K1, K2, K3 and K4.')
    g.meet('T', 'h', 'm12@1', (L, 0))
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
    'id': 'fes-motif-rosette', 'title': 'Star and rosette motif (Fès)',
    'short': 'Fès star and rosette motif', 'subtitle': 'Fès',
    'code': 'FEZ7', 'folder': 'data191', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the red rosette.',
              'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s FEZ7 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of earlier lines and turned round O.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Modern '
               'Moroccan palette. No photograph was checked.',
    'references': 'His reference is a photo by W. Betsch of a pattern in Fès, sent to him in a personal '
                  'communication; the building is not named.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart', 'notch', 'small_hexagon', 'rhombus'},
    'palette': 'Modern Moroccan',
    'repeat': 'Put copies of the square tile side by side. A red rosette sits at the centre of every tile, '
              'a white star at every corner.',
}
NAMES = {(8, 4.172): ('big_eight', 'c'), (6, 3.0): ('long_hexagon', 'a'), (8, 2.657): ('broad_eight', 'ground'),
         (16, 2.343): ('star', 'a'), (6, 2.243): ('wide_hexagon', 'ground'), (8, 2.172): ('wide_eight', 'b'),
         (6, 2.0): ('petal', 'a'), (8, 2.0): ('eight', 'd'), (10, 2.0): ('ten', 'a'), (7, 1.914): ('seven', 'c'),
         (8, 1.828): ('small_eight', 'b'), (6, 1.828): ('hexagon', 'a'), (4, 1.414): ('rhombus', 'd'),
         (6, .828): ('small_hexagon', 'ground'), (6, .586): ('notch', 'ground'), (4, .586): ('dart', 'ground'),
         (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground')}
# Wichmann's colours by the player's nth (large/fillnth.py), in the Modern Moroccan palette: black a, his red
# and brown b (the palette's red), his blue and teal c (its dark blue), yellow d.
FILLS = {
    'long_hexagon': {'b': [1, 9]},
    'star': {'ground': [0], 'b': [5, 7, 8, 13, 17, 22, 23, 25], 'c': [9, 11, 12, 14, 16, 18, 19, 21], 'd': [15]},
    'petal': {'b': [18, 21, 22, 24, 25, 27, 28, 31]},
    'eight': {'ground': [10, 11, 14, 15, 18, 19, 23, 24, 26, 27, 30, 31, 34, 35, 38, 39]},
    'seven': {'b': [14, 15, 20, 21, 26, 27, 35, 38, 41, 44, 52, 53, 58, 59, 64, 65],
              'a': [18, 19, 24, 25, 30, 31, 36, 37, 42, 43, 48, 49, 54, 55, 60, 61]},
    'rhombus': {'ground': [6, 7, 9, 10, 14, 15, 17, 18, 21, 22, 24, 25, 29, 30, 32, 33]},
    'notch': {'a': [2, 3, 6, 7, 8, 9, 12, 13]},
    'triangle': {'c': [16, 18, 19, 25, 28, 34, 35, 37]},
    'kite': {'d': [21, 22, 72, 73, 134, 135, 185, 186], 'c': [88, 89, 98, 99, 108, 109, 118, 119]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'big_eight': 8, 'long_hexagon': 18, 'broad_eight': 8, 'star': 26, 'wide_hexagon': 8, 'wide_eight': 8,
          'petal': 48, 'eight': 48, 'ten': 8, 'seven': 80, 'small_eight': 4, 'hexagon': 16, 'rhombus': 40,
          'small_hexagon': 8, 'notch': 16, 'dart': 8, 'triangle': 52, 'kite': 208}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
