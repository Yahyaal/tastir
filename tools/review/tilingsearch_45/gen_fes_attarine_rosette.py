#!/usr/bin/env python3
"""MOR0321, Attarine madrasa, Fès (Wade MOR 0321).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 18.107 pt; the square cell has
half-side L = 6 + 8H (H = √2/2), 211.07 pt, as in the Najjarin rosette, with
O at the small star inside the large rosette (repeat found by matching pieces
under translation and turning). All corners snap to a + bH (worst 0.0006).
Axis lines lie at H, 1 + H, 2 + H, 2 + 3H, 3 + 3H, 2 + 5H, 3 + 5H, 4 + 5H,
5 + 5H, 4 + 7H, 6 + 5H, 5 + 7H and 6 + 7H; the diagonals at the same (but
6 + 5H), and at 6 + 9H, 6 + 11H and 8 + 11H. After the unit star each line
runs through a crossing of earlier lines (large/greedy.py); where an axis
line and a diagonal share their distance, one line turned by 45° seven times
draws both. The tile's sides come as in the Najjarin rosette.
"""
import math
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402,F401
from common import g, step  # noqa: E402,F401
import medium  # noqa: E402
import parallels as pl  # noqa: E402
import gen_fes_najjarin_rosette as nj  # noqa: E402
import gen_meknes_bou_inania_petals as mp  # noqa: E402

H, L = nj.H, nj.L
ORIGIN, UNIT = (297.5, 372.21), 211.07/(6+8*nj.H)

PLAN = [
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'v', 'rot8'),
    ('P2', 'q02', 'm1', (1.707107, 2.707107), 'h', 'rot8'),
    ('P3', 'm1', 'm1@3', (1.707107, 4.12132), 'h', 'rot8'),
    ('P4', 'q04', 'm3', (5.12132, 4.12132), 'v', 'rot8'),
    ('P5', 'm1', 'm2@1', (1.707107, 5.535534), 'h', 'rot8'),
    ('P6', 'q04', 'm5', (6.535534, 5.535534), 'v', 'rot8'),
    ('P7', 'q02', 'm6', (6.535534, 7.535534), 'h', 'rot8'),
    ('P8', 'q04', 'm7', (8.535534, 7.535534), 'v', 'rot8'),
    ('P9', 'm1', 'm4@3', (1.707107, 8.949747), 'h', 'rot8'),
    ('P10', 'q02', 'm8', (8.535534, 9.535534), 'h', 'rot4'),
    ('P11', 'q04', 'm9', (9.949747, 8.949747), 'v', 'rot8'),
    ('P12', 'q02', 'm11', (9.949747, 10.949747), 'h', 'rot8'),
    ('P13', 'm6', 'm12', (6.535534, 10.949747), 'd135', 'rot4'),
    ('P14', 'm8', 'm12', (8.535534, 10.949747), 'd135', 'rot4'),
    ('P15', 'm1@3', 'm11', (9.949747, 12.363961), 'd135', 'rot4'),
]
VIA = os.environ.get('VIA', 'm7@5')


def drawing(pieces):
    """The drawing's pieces and their turns about O."""
    polys = cm.frame_pieces(pieces, ORIGIN, 2*UNIT, 0)
    out = []
    for k in range(4):
        c, s = round(math.cos(k*math.pi/2)), round(math.sin(k*math.pi/2))
        out += [[(c*x-s*y, s*x+c*y) for x, y in Q] for Q in polys]
    return out


def build():
    mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))
    nj.build_tile(VIA)


SPEC = {
    'id': 'fes-attarine-rosette', 'title': 'Rosette of the Attarine madrasa (Fès)',
    'short': 'Attarine madrasa rosette', 'subtitle': 'Attarine madrasa, Fès',
    'code': 'MOR0321', 'folder': 'data175', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the large rosette.', 'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s MOR0321 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of earlier lines and turned round O.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Tétouan '
               'palette, whose dark navy stands for his black. No photograph was checked.',
    'references': 'His reference is David Wade’s photograph MOR 0321 (Pattern in Islamic Art), the Attarine '
                  'madrasa, Fès (1325).',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart'},
    'palette': 'Tétouan',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(9, 3.328): ('shield', 'ground'), (6, 3.0): ('long_hexagon', 'c'), (8, 2.657): ('big_eight', 'ground'),
         (16, 2.343): ('star', 'c'), (8, 2.172): ('wide_eight', 'c'), (10, 2.0): ('ten', 'c'),
         (8, 2.0): ('eight', 'c'), (6, 2.0): ('petal', 'd'), (7, 1.914): ('seven', 'c'),
         (6, 1.828): ('hexagon', 'c'), (16, 1.657): ('small_star', 'ground'), (4, 1.414): ('rhombus', 'ground'),
         (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground')}
# Wichmann's colours by the player's nth (read with the drawing's turns about O), in the Tétouan
# palette: his black c (its dark navy), red-brown d, yellow b.
FILLS = {
    'long_hexagon': {'d': [6, 7, 8, 10, 11, 13, 14, 15]},
    'star': {'d': [2, 3, 6, 7]},
    'petal': {'ground': [0, 3, 8, 11]},
    'eight': {'b': [6, 7, 10, 11, 15, 18, 21, 22, 27, 28, 31, 34, 38, 39, 42, 43],
              'ground': [12, 13, 16, 17, 19, 20, 23, 24, 25, 26, 29, 30, 32, 33, 36, 37]},
    'seven': {'ground': [0, 1, 16, 17, 38, 39, 54, 55]},
    'rhombus': {'d': [0, 3, 8, 9, 14, 15, 20, 23]},
    'triangle': {'c': [0, 1, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 27, 28, 29, 30, 31, 34, 35]},
}
SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'shield': 20, 'long_hexagon': 20, 'big_eight': 8, 'star': 8, 'wide_eight': 8, 'ten': 8, 'eight': 48,
          'petal': 16, 'seven': 56, 'hexagon': 8, 'small_star': 4, 'rhombus': 24, 'dart': 8, 'triangle': 44,
          'kite': 64}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES, drawing)
