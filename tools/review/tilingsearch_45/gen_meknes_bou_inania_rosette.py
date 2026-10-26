#!/usr/bin/env python3
"""MOR2404X, Bou Inania madrasa, Meknes: a variant of BR14, the Najjarin
fountain rosette (gen_fes_najjarin_rosette.py). Plain tiles drawn edge to
edge; use 1_pieces.py --precision 2, then this generator with
<pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

Same frame and unit as BR14 (OA = 24.1427 pt, half-side L = 6 + 8H, O at
the star inside the large rosette), and the same lines up to the horizontal
at 4 + 7H. The rosettes at the tile's corners differ: there is no vertical
at 5 + 7H, and the diagonals at 2 + H and 6 + 11H come in, with the line at
6 + 7H turned by 45° too. Every corner snaps to a + bH; each new line runs
through a crossing of earlier ones (the greedy search of large/greedy.py).
The crossing for the diagonal at 6 + 11H lies just outside the tile.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402,F401
from common import g, step  # noqa: E402
import medium  # noqa: E402
import parallels as pl  # noqa: E402
import gen_fes_najjarin_rosette as nj  # noqa: E402

H, L = nj.H, nj.L
ORIGIN, UNIT = nj.ORIGIN, nj.UNIT

PLAN = [
    ('P14', 'm3@1', 'm11', (6.535534, 10.949747), 'h', 'rot8'),
    ('P15', 'q14', 'm3', (0.707107, 3.12132), 'd135', 'rot4'),
    ('P14', 'm11', 'm14', (6.535534, 10.949747), 'd135', 'rot4'),
    ('P16', 'm3@5', 'm12', (11.949747, 7.535534), 'd135', 'rot4'),
]


def build():
    nj.mp.build_unit_star()
    pl.emit(pl.group(nj.PLAN[:13], 3))
    pl.emit(pl.group(PLAN, 3))
    nj.build_tile()
    nj.build_corner()


SPEC = {
    'id': 'meknes-bou-inania-rosette', 'title': 'Rosette of the Bou Inania madrasa (Meknes)',
    'short': 'Meknes Bou Inania rosette', 'subtitle': 'Bou Inania madrasa, Meknes',
    'code': 'MOR2404X', 'folder': 'data175', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the large rosette.', 'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s MOR2404X drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. It is the Najjarin fountain rosette '
            'with different rosettes at the tile’s corners, so it shares that tutorial’s opening steps. After the '
            'unit star every line is drawn through a crossing of earlier lines and turned round O; the tile’s '
            'sides come the same way, and the corner star’s sides from a compass mark at the tile’s corner.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Modern '
               'Moroccan palette: his maroon is the palette’s red and his light blue its dark blue. Wade’s photo '
               'MOR 2404x was not checked.',
    'references': 'His reference is David Wade’s photo MOR 2404x (patterninislamicart.com), the Bou Inania '
                  'madrasa, Meknes.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart', 'square', 'rhombus', 'small_ten'},
    'palette': 'Modern Moroccan',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(8, 4.172): ('big_eight', 'c'), (9, 3.328): ('shield', 'ground'), (11, 3.157): ('eleven', 'a'),
         (6, 3.0): ('long_hexagon', 'b'), (16, 2.343): ('star', 'a'), (6, 2.243): ('wide_hexagon', 'ground'),
         (8, 2.172): ('wide_eight', 'a'), (8, 2.0): ('eight', 'ground'), (6, 2.0): ('petal', 'b'),
         (8, 1.828): ('small_eight', 'ground'), (6, 1.828): ('hexagon', 'b'), (8, 1.757): ('arrow', 'b'),
         (10, 1.485): ('ten', 'ground'), (7, 1.257): ('seven', 'a'), (10, 0.828): ('small_ten', 'a'),
         (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'ground'), (4, .485): ('rhombus', 'ground'),
         (4, .414): ('kite', 'ground'), (4, .343): ('square', 'ground')}
# Wichmann's colours by the player's nth (large/fillnth.py): maroon b, light blue c, black a.
FILLS = {
    'long_hexagon': {'c': [0, 3, 4, 9, 10, 27, 30, 35], 'a': [1, 2, 5, 8, 13, 14, 19, 20, 25, 26, 31, 34]},
    'eight': {'b': [0, 1, 2, 19]},
    'hexagon': {'a': [6, 7, 12, 13, 18, 19, 24, 25]},
    'triangle': {'a': [2, 3, 6, 7, 9, 10, 16, 17, 22, 23, 29, 30, 32, 33, 36, 37]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'big_eight': 8, 'shield': 16, 'eleven': 8, 'long_hexagon': 36, 'star': 12, 'wide_hexagon': 8,
          'wide_eight': 8, 'eight': 20, 'petal': 8, 'small_eight': 8, 'hexagon': 32, 'arrow': 8, 'ten': 8,
          'seven': 8, 'small_ten': 8, 'dart': 32, 'triangle': 40, 'rhombus': 8, 'kite': 104, 'square': 8}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
