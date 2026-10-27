#!/usr/bin/env python3
"""F17, Royal Residence, Telouet (Paccard, vol. 2, page 315).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 19.314 pt; the square cell has
half-side L = 6 + 8H (H = √2/2), 225.14 pt, as in the Najjarin rosette.
The large rosette sits at the cell's corners; O is the small star at the
middle of the cell, also a centre of four-fold turning, so the unit-star
opening of the other Moroccan reconstructions applies (repeat found by
matching pieces under translation and turning). All corners snap to a + bH
(worst 0.0005); the page holds only part of the cell, so the drawing is
completed by its turns about O (its colours turn with it). Axis lines lie at
H, 2 + H, 2 + 3H, 3 + 3H, 2 + 5H, 4 + 3H, 3 + 5H, 4 + 5H, 3 + 7H, 4 + 7H,
5 + 7H and 6 + 7H; the diagonals at H, 1 + H, 2 + H, 3 + H, 2 + 3H, 2 + 5H,
4 + 3H, 4 + 5H, 4 + 7H, 5 + 7H, 6 + 7H, 5 + 9H and 5 + 11H. After the unit star each line runs
through a crossing of earlier lines (large/greedy.py); where an axis line and
a diagonal share their distance, one line turned by 45° seven times draws
both. The tile's sides come as in the Najjarin rosette.
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
ORIGIN, UNIT = (73.27, 148.06), 225.14/(6+8*nj.H)

PLAN = [
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'd135', 'rot4'),
    ('P2', 'q12', 'm1', (-0.707107, 3.12132), 'd45', 'rot8'),
    ('P3', 'm1', 'm2@1', (-2.707107, 5.12132), 'h', 'rot4'),
    ('P4', 'q02', 'm3', (4.12132, 5.12132), 'v', 'rot8'),
    ('P5', 'q04', 'm3', (6.12132, 5.12132), 'v', 'rot8'),
    ('P6', 'm1', 'm5@3', (-3.12132, 5.535534), 'h', 'rot8'),
    ('P7', 'q04', 'm6', (6.535534, 5.535534), 'v', 'rot4'),
    ('P8', 'q02', 'm7', (6.535534, 7.535534), 'h', 'rot8'),
    ('P9', 'm2', 'm4', (4.12132, 7.949747), 'h', 'rot4'),
    ('P10', 'q04', 'm9', (8.949747, 7.949747), 'v', 'rot8'),
    ('P11', 'q02', 'm10', (8.949747, 9.949747), 'h', 'rot8'),
    ('P12', 'q04', 'm11', (10.949747, 9.949747), 'v', 'rot8'),
    ('P13', 'q14', 'm2', (0.707107, 4.535534), 'd135', 'rot4'),
    ('P14', 'q04', 'm8', (8.535534, 7.535534), 'd135', 'rot4'),
    ('P15', 'm2', 'm12@2', (7.12132, 10.949747), 'd135', 'rot4'),
]
VIA = os.environ.get('VIA', 'm8@5')


def drawing(pieces):
    """The drawing's pieces and their turns about O, which fill the parts of
    the cell beyond the page."""
    polys = cm.frame_pieces(pieces, ORIGIN, 2*UNIT, 0)
    out = []
    for k in range(4):
        c, s = round(math.cos(k*math.pi/2)), round(math.sin(k*math.pi/2))
        out += [[(c*x-s*y, s*x+c*y) for x, y in Q] for Q in polys]
    return out


def build():
    mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))
    for s in cm.steps:      # one sentence over twenty words, said shorter
        s['text'] = s['text'].replace('the line through P2 parallel to line OE, turned by 45°, at P3',
                                      'the turned line through P2 at P3')
    nj.build_tile(VIA)


SPEC = {
    'id': 'telouet-framed-rosette', 'title': 'Framed rosette of the royal residence (Telouet)',
    'short': 'Telouet framed rosette', 'subtitle': 'Royal residence, Telouet',
    'code': 'F17', 'folder': 'data166', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star halfway between four large rosettes.',
              'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s F17 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of earlier lines and turned round O.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing, which keeps '
               'the original colouring, in the Tétouan palette, whose dark navy stands for his black; his blue '
               'and light green, which the palette lacks, are fixed colours. No photograph was checked.',
    'references': 'His reference is André Paccard, Traditional Islamic Craft in Moroccan Architecture (1980), '
                  'volume 2, page 315, the royal residence at Telouet (part of a larger pattern, colours from '
                  'the original).',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart'},
    'palette': 'Tétouan',
    'repeat': 'Put copies of the square tile side by side. A large rosette sits at every corner of the tile.',
}
NAMES = {(16, 5.657): ('big_star', 'c'), (10, 4.243): ('ten', 'ground'), (14, 3.828): ('fourteen', 'ground'),
         (6, 3.0): ('long_hexagon', 'c'), (8, 2.828): ('wide_eight', 'ground'), (16, 2.343): ('star', 'c'),
         (8, 2.0): ('eight', 'c'), (6, 2.0): ('petal', 'c'), (5, 1.914): ('pentagon', 'd'),
         (6, 1.828): ('hexagon', 'a'), (4, 1.414): ('rhombus', 'ground'), (4, .586): ('dart', 'ground'),
         (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground')}
# Wichmann's colours by the player's nth (read with the drawing's turns about O), in the Tétouan
# palette: his black c (its dark navy), red d, dark green a, orange b; his blue and light green,
# which the palette lacks, as fixed colours.
BLUE, LIGHT = '#2b6cb0', '#7cc142'
FILLS = {
    'long_hexagon': {BLUE: [0, 1, 5, 6, 7, 38, 39, 40], 'a': [17, 18, 27, 28]},
    'eight': {'d': [1, 2, 7, 8, 10, 13, 15, 16]},
    'petal': {'b': [0, 1, 2, 5, 6, 19, 20, 23]},
    'hexagon': {'ground': [0, 1, 6, 7, 24, 25, 30, 31],
                LIGHT: [2, 3, 4, 5, 10, 11, 12, 15, 16, 19, 20, 21, 26, 27, 28, 29]},
    'rhombus': {BLUE: [0, 1, 2, 5, 10, 13, 14, 15]},
    'dart': {'c': [0, 1, 4, 5, 26, 27, 30, 31]},
}
SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'big_star': 1, 'ten': 8, 'fourteen': 8, 'long_hexagon': 44, 'wide_eight': 16, 'star': 11, 'eight': 20,
          'petal': 24, 'pentagon': 16, 'hexagon': 32, 'rhombus': 16, 'dart': 32, 'triangle': 24, 'kite': 96}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES, drawing)
