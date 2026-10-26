#!/usr/bin/env python3
"""BR14, Najjarin fountain, Fès (Broug, Islamic Geometric Design, fig. 3.56).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 24.1427 pt; the square cell has
half-side L = 6 + 8H (H = √2/2), 281.42 pt, with O at the star inside the
large rosette (repeat found by matching pieces under translation: the
rosettes at the cell's side midpoints and corners differ from the one at O).
All corners snap to a + bH. Axis lines lie at H, 3H, 2, 1 + 3H, 3 + H,
2 + 3H, 1 + 5H, 3 + 3H, 2 + 5H, -1 + 5H, 4 + 3H, 3 + 5H, 4 + 5H, 4 + 7H,
5 + 7H and 6 + 7H; the diagonals at the same (but 5 + 7H), and at 6 + 9H
and 8 + 11H. Each line after the unit star runs through a crossing of
earlier lines (the batch 17 greedy search); where an axis line and a
diagonal share their distance, one line turned by 45° seven times draws
both. The tile's sides come through the crossing of the horizontal through
C with an earlier line; the corner star's side through a point marked with
the compass from the tile's corner.
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
L = 6+8*H
ORIGIN, UNIT = (297.5, 372.61), 24.1427483684

PLAN = [
    ('P1', 'ax', 'q02', (1.0, 2.0), 'h', 'rot8'),
    ('P2', 'q11', 'm1@7', (2.12132, 0.707107), 'v', 'rot8'),
    ('P3', 'q02', 'm2', (2.12132, 3.12132), 'h', 'rot8'),
    ('P4', 'q11', 'm2@7', (3.707107, 0.707107), 'v', 'rot8'),
    ('P5', 'q04', 'm3', (4.12132, 3.12132), 'v', 'rot8'),
    ('P6', 'q11', 'm4@1', (4.535534, 0.707107), 'v', 'rot8'),
    ('P7', 'q02', 'm5', (4.12132, 5.12132), 'h', 'rot8'),
    ('P8', 'q02', 'm6', (4.535534, 5.535534), 'h', 'rot8'),
    ('P9', 'm2@3', 'm8', (2.535534, 5.535534), 'v', 'rot8'),
    ('P10', 'q04', 'm7', (6.12132, 5.12132), 'v', 'rot8'),
    ('P11', 'q04', 'm8', (6.535534, 5.535534), 'v', 'rot8'),
    ('P12', 'q02', 'm11', (6.535534, 7.535534), 'h', 'rot8'),
    ('P13', 'm1@1', 'm10', (6.12132, 8.949747), 'h', 'rot8'),
    ('P14', 'q04', 'm13', (9.949747, 8.949747), 'v', 'rot4'),
    ('P15', 'q02', 'm14', (9.949747, 10.949747), 'h', 'rot8'),
    ('P16', 'm11', 'm15', (6.535534, 10.949747), 'd135', 'rot4'),
]


def build_lines():
    mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))


def build_tile(via='m12@5'):
    step(f'The horizontal line through C crosses {pl.describe(via)} at T. Draw a vertical line through T. '
         'Turn it round O by 90°, three times. The four lines make a square with corners K1, K2, K3 and K4.')
    g.meet('T', 'cy', via, (L, 1))
    g.line_par('gs', 'T', 'v')
    g.repeat('gsr', ['gs'], 'rot4')
    for i, (a, b, p) in enumerate([('gs', 'gs@1', (L, L)), ('gs@1', 'gs@2', (-L, L)),
                                   ('gs@2', 'gs@3', (-L, -L)), ('gs@3', 'gs', (L, -L))]):
        g.meet(f'K{i+1}', a, b, p)


def build_corner():
    step('Draw a circle with centre K1 and radius OA. It crosses the side from K4 to K1 at U. '
         'Draw a line through U at 90° to line OE. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('ck', 'K1', 'c')
    g.meet('U', 'ck', 'gs', (L, L-1))
    g.line_par('ud', 'U', 'd135')
    g.repeat('udr', ['ud'], 'rot4')


def build():
    build_lines()
    build_tile()
    build_corner()


SPEC = {
    'id': 'fes-najjarin-rosette', 'title': 'Rosette of the Najjarin fountain (Fès)',
    'short': 'Najjarin fountain rosette', 'subtitle': 'Najjarin fountain, medina of Fès',
    'code': 'BR14', 'folder': 'data198', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the large rosette.', 'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s BR14 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line is drawn through a crossing of earlier lines and turned '
            'round O; the tile’s sides come the same way, and the corner star’s sides from a compass mark at the '
            'tile’s corner.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Marinid '
               'zellige palette; his light blue ring takes the palette’s blue, as his violet-blue pieces do. '
               'No photograph was checked.',
    'references': 'His reference is Eric Broug, Islamic Geometric Design (2013), page 84, figure 3.56, the '
                  'Najjarin fountain in the medina of Fès (part).',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart', 'square', 'rhombus', 'small_ten'},
    'palette': 'Marinid zellige',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(8, 4.172): ('big_eight', 'c'), (9, 3.328): ('shield', 'ground'), (11, 3.157): ('eleven', 'a'),
         (6, 3.0): ('long_hexagon', 'c'), (16, 2.343): ('star', 'a'), (6, 2.243): ('wide_hexagon', 'ground'),
         (8, 2.172): ('wide_eight', 'a'), (8, 2.0): ('eight', 'ground'), (6, 2.0): ('petal', 'c'),
         (8, 1.828): ('small_eight', 'ground'), (6, 1.828): ('hexagon', 'c'), (8, 1.757): ('arrow', 'd'),
         (10, 1.485): ('ten', 'ground'), (7, 1.257): ('seven', 'a'), (10, 0.828): ('small_ten', 'a'),
         (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'a'), (4, .485): ('rhombus', 'ground'),
         (4, .414): ('kite', 'ground'), (4, .343): ('square', 'ground')}
# Wichmann's colours by the player's nth (large/fillnth.py): green b, violet-blue c, black a.
FILLS = {
    'long_hexagon': {'b': [0, 3, 10, 25], 'a': [1, 2, 4, 7, 11, 12, 17, 18, 23, 24, 28, 31]},
    'petal': {'b': [0, 1, 10, 11]},
    'hexagon': {'b': [0, 3, 8, 9, 22, 23, 28, 31]},
    'triangle': {'ground': [7, 10, 11, 12, 13, 14, 17, 18, 19, 20, 23, 24, 25, 26, 27, 30]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'big_eight': 8, 'shield': 20, 'eleven': 8, 'long_hexagon': 32, 'star': 12, 'wide_hexagon': 8,
          'wide_eight': 8, 'eight': 16, 'petal': 12, 'small_eight': 12, 'hexagon': 32, 'arrow': 8, 'ten': 8,
          'seven': 8, 'small_ten': 8, 'dart': 32, 'triangle': 36, 'rhombus': 8, 'kite': 88, 'square': 8}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
