#!/usr/bin/env python3
"""FR1, Grande Mosquée de Paris (from a Flickr photo sent to Wichmann).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 21.7274 pt; the square cell has
half-side L = 6 + 8H (H = √2/2), 253.3 pt, with O at the small star in the
middle of the large rosette (repeat found by matching pieces under
translation). All corners snap to a + bH (worst 0.0005). Axis lines lie at
1 + H, 1 + 3H, 2 + 3H, 3 + 3H, 2 + 5H, 3 + 5H, 4 + 5H, 4 + 7H, 5 + 7H and
6 + 7H, each with its diagonal; more diagonals at 2 + H, 6 + 9H, 6 + 11H and
8 + 11H. The frame is that of the Najjarin and Meknes throne-room rosettes,
but the lines differ, so it is a design of its own. After the unit star each
line runs through a crossing of earlier lines (large/greedy.py); the tile's
sides come through the crossing of the horizontal through C with a
diagonal, as in the Najjarin rosette.
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
ORIGIN, UNIT = (297.5, 372.45), 284/(6+10*H)

PLAN = [
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'v', 'rot8'),
    ('P2', 'q11', 'm1@7', (3.12132, 0.707107), 'v', 'rot8'),
    ('P3', 'q02', 'm2', (3.12132, 4.12132), 'h', 'rot8'),
    ('P4', 'q04', 'm3', (5.12132, 4.12132), 'v', 'rot8'),
    ('P5', 'm1', 'm4@1', (1.707107, 5.535534), 'h', 'rot8'),
    ('P6', 'q04', 'm5', (6.535534, 5.535534), 'v', 'rot8'),
    ('P7', 'q02', 'm6', (6.535534, 7.535534), 'h', 'rot8'),
    ('P8', 'm1', 'm4@3', (1.707107, 8.949747), 'h', 'rot8'),
    ('P9', 'q04', 'm8', (9.949747, 8.949747), 'v', 'rot8'),
    ('P10', 'q02', 'm9', (9.949747, 10.949747), 'h', 'rot8'),
    ('P2', 'q11', 'm2', (3.12132, 0.707107), 'd135', 'rot4'),
    ('P11', 'm6', 'm10', (6.535534, 10.949747), 'd135', 'rot4'),
    ('P12', 'm1@3', 'm10', (8.535534, 10.949747), 'd135', 'rot4'),
    ('P13', 'm1@3', 'm9', (9.949747, 12.363961), 'd135', 'rot4'),
]


def build():
    nj.mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))
    nj.build_tile('m7@5')


SPEC = {
    'id': 'paris-mosque-rosette', 'title': 'Rosette of the Grande Mosquée (Paris)',
    'short': 'Paris mosque rosette', 'subtitle': 'Grande Mosquée de Paris',
    'code': 'FR1', 'folder': 'data200', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star in the middle of the large rosette.',
              'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s FR1 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of earlier lines and turned round O.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing in the Alhambra '
               'palette, which has his black, light blue, brown and dark blue: his light blue takes the palette’s '
               'teal. No photograph was checked.',
    'references': 'His reference is a Flickr photo of the Grande Mosquée de Paris, sent to him by a '
                  'correspondent; the page names no photographer.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart'},
    'palette': 'Alhambra',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(6, 3.0): ('long_hexagon', 'c'), (16, 2.343): ('star', 'a'), (8, 2.0): ('eight', 'ground'),
         (6, 2.0): ('petal', 'a'), (7, 1.914): ('seven', 'b'), (6, 1.828): ('hexagon', 'a'),
         (4, 1.414): ('rhombus', 'ground'), (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'ground'),
         (4, .414): ('kite', 'ground')}
# Wichmann's colours by the player's nth (large/fillnth.py): black a, light blue b (the palette's teal),
# brown c, dark blue d.
FILLS = {
    'long_hexagon': {'a': [1, 2, 5, 6, 9, 10, 14, 17, 21, 22, 25, 26]},
    'star': {'c': [6, 7, 9, 10, 13, 14, 16, 17]},
    'eight': {'a': [0, 1, 7, 30]},
    'petal': {'b': [0, 5, 6, 14, 17, 25, 26, 31], 'd': [11, 12, 13, 15, 16, 18, 19, 20]},
    'seven': {'a': [8, 9, 12, 13, 16, 17, 18, 19, 20, 21, 24, 25, 28, 29, 30, 31, 32, 33, 34, 35, 38, 39, 42, 43,
                    44, 45, 46, 47, 50, 51, 54, 55]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'long_hexagon': 28, 'star': 20, 'eight': 36, 'petal': 32, 'seven': 64, 'hexagon': 8, 'rhombus': 32,
          'dart': 8, 'triangle': 40, 'kite': 168}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
