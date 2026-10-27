#!/usr/bin/env python3
"""P71TL, Bou Inania madrasa, Fès (Degeorge and Porter, page 71 top left;
Wade MOR 0203). An interlace of 7 pt bands; use 1_pieces.py --precision 2,
then this generator with <pieces.json> <tutorial.json> (the band centre
lines are the pieces moved out by half a band); use finish <dump.json>
<tutorial.json>.

OA is the star's point radius r = 16.9 pt (centre lines); the square cell
has half-side L = 6 + 8H (H = √2/2), 197 pt, with O at the star inside the
large rosette (repeat 394 pt, found by matching pieces under translation).
All corners snap to a + bH (worst 0.0017 OA). Every line of the Meknes
throne-room star rosette (gen_meknes_throne_star_rosette.py, the same cell)
is a line of this design, so it shares that whole construction; four more
parallels through crossings of earlier lines (large/greedy.py) add the axis
lines and diagonals at 1 + 3H, 4 + 3H and 3 + 7H and the diagonals at
5 + 7H. The tile's sides come as in that rosette.
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

H, L = nj.H, nj.L
ORIGIN, UNIT, BAND = (297.5, 372.13), 16.9, 7.0

PLAN = [
    ('P14', 'q02', 'm3', (3.12132, 4.12132), 'v', 'rot8'),
    ('P15', 'q02', 'm4', (5.12132, 6.12132), 'h', 'rot8'),
    ('P16', 'q02', 'm8', (7.949747, 8.949747), 'v', 'rot8'),
    ('P7', 'q02', 'm6', (6.535534, 7.535534), 'd135', 'rot4'),
]


def build():
    nj.mp.build_unit_star()
    pl.emit(pl.group(ts.PLAN, 3))
    pl.emit(pl.group(PLAN, 3))
    nj.build_tile('m7@5')


SPEC = {
    'id': 'fes-bou-inania-interlaced-rosette', 'title': 'Interlaced rosette of the Bou Inania madrasa (Fès)',
    'short': 'Bou Inania interlaced rosette', 'subtitle': 'Bou Inania madrasa, Fès',
    'code': 'P71TL', 'folder': 'data166', 'frame': (ORIGIN, UNIT, BAND, L),
    'given': {'O': 'The centre of the star inside the large rosette.', 'A': 'A point of that star.'},
    'note': 'The finished design was read from Wichmann’s P71TL drawing, an interlace of bands, by their '
            'centre lines. Its tile corners were snapped to the square-root-of-two grid in star-radius units. '
            'Every line of the Meknes throne-room star rosette is a line of this design too, so its whole '
            'construction is shared; four more lines follow. After the unit star every line, the tile’s sides '
            'too, is drawn through a crossing of earlier lines and turned round O.',
    'changes': 'The lines are the centre lines of the drawing’s bands; the over-and-under weave is not drawn. '
               'The colours follow Wichmann’s drawing: black, dark red and blue, in the Modern Moroccan palette; '
               'the bands themselves are not pieces. Wade’s photo MOR 0203 was not checked.',
    'references': 'His references are Gérard Degeorge and Yves Porter, The Art of the Islamic Tile (2002), page '
                  '71 top left, the Bou Inania madrasa, Fès (1351-6), and David Wade’s photo MOR 0203 '
                  '(patterninislamicart.com).',
    'look': 'strapwork',
    'ink': 'Ink the lines picked out in orange. They are the middles of the interlaced bands.',
    'small': {'triangle', 'kite', 'dart', 'rhombus'},
    'palette': 'Modern Moroccan',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(9, 3.328): ('shield', 'a'), (6, 3.0): ('long_hexagon', 'b'), (16, 2.343): ('star', 'b'),
         (6, 2.0): ('petal', 'c'), (8, 2.0): ('eight', 'a'), (7, 1.914): ('seven', 'a'),
         (6, 1.828): ('hexagon', 'a'), (4, 1.414): ('rhombus', 'a'), (4, .586): ('dart', 'a'),
         (3, .5): ('triangle', 'a'), (4, .414): ('kite', 'a')}
# Wichmann's colours by the player's nth (large/fillnth.py), in the Modern Moroccan palette: black a,
# dark red b, blue c.
FILLS = {
    'long_hexagon': {'a': [0, 3, 4, 7, 8, 9, 12, 13, 18, 21, 26, 27, 30, 31, 32, 35]},
    'star': {'a': [0, 8]},
    'hexagon': {'c': [4, 5, 8, 9, 14, 15, 18, 19]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'shield': 24, 'long_hexagon': 36, 'star': 12, 'petal': 16, 'eight': 28, 'seven': 48, 'hexagon': 24,
          'rhombus': 16, 'dart': 24, 'triangle': 48, 'kite': 104}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
