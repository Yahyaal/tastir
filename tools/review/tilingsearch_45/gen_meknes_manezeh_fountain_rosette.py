#!/usr/bin/env python3
"""F19, Manezeh fountain, Meknes (Paccard, Traditional Islamic Craft in
Moroccan Architecture, volume 1, pages 435 and 424).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

The frame is that of MOR0837 (gen_fes_two_rosettes.py): OA is the small
star's point radius r = 16.8993 pt, the square cell has half-side
L = 6 + 8H (H = √2/2), 196.99 pt, O at the small star inside the large
rosette, and the petal rosettes at the cell's corners. All corners snap to
a + bH. Every line of MOR0837 is a line of this design too, and the outer
field is the same; one more set of axis lines at 2 + H, through a crossing
of earlier lines (large/greedy.py), changes the large rosette. So it shares
that whole construction, adds one step, and takes the tile the same way.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402,F401
from common import g, step  # noqa: E402,F401
import medium  # noqa: E402
import parallels as pl  # noqa: E402
import gen_fes_two_rosettes as tr  # noqa: E402
import gen_fes_najjarin_rosette as nj  # noqa: E402

H, L = tr.H, tr.L
ORIGIN, UNIT = (297.5, 372.13), tr.UNIT

PLAN = [
    ('P16', 'q02', 'm1', (1.707107, 2.707107), 'h', 'rot4'),
]


def build_lines():
    tr.build_lines()
    pl.emit(pl.group(PLAN, 3))


def build():
    build_lines()
    nj.build_tile('m10@5')


SPEC = {
    'id': 'meknes-manezeh-fountain-rosette', 'title': 'Rosette of the Manezeh fountain (Meknes)',
    'short': 'Manezeh fountain rosette', 'subtitle': 'Manezeh fountain, Meknes',
    'code': 'F19', 'folder': 'data166', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the large rosette.',
              'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s F19 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. Every line of the Fès two rosettes '
            '(MOR0837) is a line of this design too, so its whole construction is shared; one more set of '
            'lines, drawn through a crossing of earlier lines and turned round O, changes the large rosette.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing, which keeps '
               'the colours of Paccard’s plate: black, green, red and light blue, in the Marinid zellige '
               'palette, which has no red: his red takes the palette’s honey and his light blue its blue. '
               'No photograph was checked.',
    'references': 'His reference is André Paccard, Traditional Islamic Craft in Moroccan Architecture (1980), '
                  'volume 1, pages 435 and 424, the Manezeh fountain in Meknes (part of a larger pattern).',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart', 'square', 'pentagon', 'small_arrow'},
    'palette': 'Marinid zellige',
    'repeat': 'Put copies of the square tile side by side. A large rosette sits at the centre of every tile, '
              'and a rosette of eight petals at each corner.',
}
NAMES = {(9, 3.328): ('shield', 'ground'), (11, 3.157): ('eleven', 'a'), (6, 3.0): ('long_hexagon', 'b'),
         (8, 2.657): ('big_eight', 'ground'), (16, 2.343): ('star', 'a'), (8, 2.172): ('wide_eight', 'a'),
         (8, 2.0): ('eight', 'ground'), (6, 2.0): ('petal', 'b'), (6, 1.828): ('hexagon', 'a'),
         (8, 1.828): ('small_eight', 'd'), (4, .586): ('dart', 'ground'), (8, .586): ('small_arrow', 'a'),
         (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground'), (4, .343): ('square', 'ground'),
         (5, .328): ('pentagon', 'a')}
# Wichmann's colours by the player's nth (large/fillnth.py): black a, green b, light blue c (the palette's
# blue), red d (the palette's honey).
FILLS = {
    'long_hexagon': {'d': [0, 3, 4, 9, 10, 27, 30, 35], 'a': [1, 2, 5, 8, 13, 14, 19, 20, 25, 26, 31, 34]},
    'star': {'ground': [7, 8, 9, 11, 13, 14, 15, 16]},
    'eight': {'a': [0, 1, 3, 26]},
    'hexagon': {'b': [1, 2, 5, 8, 10, 11, 14, 15, 16, 17, 20, 21, 23, 26, 29, 30]},
    'small_eight': {'c': [6, 7, 8, 11, 12, 15, 16, 17]},
    'triangle': {'a': [2, 3, 6, 7, 9, 10, 13, 14, 17, 18, 21, 22, 24, 25, 28, 29]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'shield': 16, 'eleven': 8, 'long_hexagon': 36, 'big_eight': 8, 'star': 20, 'wide_eight': 8, 'eight': 28,
          'petal': 8, 'hexagon': 32, 'small_eight': 24, 'dart': 32, 'small_arrow': 8, 'triangle': 32, 'kite': 120,
          'square': 8, 'pentagon': 16}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
