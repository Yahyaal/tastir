#!/usr/bin/env python3
"""C176A, Royal Palace throne room, Meknes (Castéra page 176, top left).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 26.5559 pt; the square cell has
half-side L = 6 + 8H (H = √2/2), 309.56 pt, with O at the star inside the
large rosette; the page shows one rosette per 619.1 pt square (found by
matching pieces under translation: the 437.78 pt spacing of the small stars
round the rosette is not a period). All corners snap to a + bH within 0.0003 r.
Axis lines lie at H, 1 + H, 2 + H, 1 + 3H, 2 + 3H, 2 + 5H, 3 + 3H, 3 + 5H,
3 + 7H, 4 + 3H, 4 + 5H, 4 + 7H, 5 + 7H, 6 + 5H and 6 + 7H from O; the
diagonals at the same and at 3H, 6 + 9H, 6 + 11H, 8 + 9H and 8 + 11H.
Every one runs through a crossing of the star's sides, carried on, with the
lines drawn before it (found by a greedy search over the drawing's missing
lines), so after the unit star each step is a parallel through a crossing,
turned round O. The cell's sides come the same way, through a crossing of a
star side with the last diagonal.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402,F401
from common import g, step  # noqa: E402
import medium  # noqa: E402
import parallels as pl  # noqa: E402
import gen_meknes_bou_inania_petals as mp  # noqa: E402

H, L = mp.H, 6+8*mp.H
ORIGIN, UNIT = (297.5, 372.77), 218.89/(4+6*mp.H)

PLAN = [
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'v'), ('P2', 'q02', 'm1', (1.707107, 2.707107), 'h'),
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'd135'), ('P3', 'q12', 'm3', (-0.707107, 3.12132), 'h'),
    ('P4', 'q04', 'm4', (4.12132, 3.12132), 'v'), ('P5', 'q02', 'm5', (4.12132, 5.12132), 'h'),
    ('P6', 'm3@3', 'm4', (5.535534, 3.12132), 'v'), ('P7', 'q04', 'm6', (6.12132, 5.12132), 'v'),
    ('P8', 'q02', 'm7', (5.535534, 6.535534), 'h'), ('P9', 'q04', 'm9', (7.535534, 6.535534), 'v'),
    ('P10', 'm3@1', 'm7', (5.535534, 7.949747), 'h'), ('P11', 'q04', 'm11', (8.949747, 7.949747), 'v'),
    ('P12', 'q02', 'm12', (8.949747, 9.949747), 'h'), ('P13', 'q04', 'm13', (10.949747, 9.949747), 'v'),
    ('P14', 'cy', 'q03', (-2.0, 1.0), 'd45'), ('P15', 'm9@3', 'm15', (6.535534, 9.535534), 'h'),
    ('P16', 'q14', 'm4', (0.707107, 3.12132), 'd135'), ('P17', 'q14', 'm6', (0.707107, 5.12132), 'd45'),
    ('P18', 'q14', 'm9', (0.707107, 6.535534), 'd45'), ('P19', 'q14', 'm11', (0.707107, 7.949747), 'd45'),
    ('P20', 'm1', 'm16', (1.707107, 9.535534), 'd45'), ('P19', 'q14', 'm11', (0.707107, 7.949747), 'd135'),
    ('P21', 'q14', 'm13', (0.707107, 9.949747), 'd45'), ('P21', 'q14', 'm13', (0.707107, 9.949747), 'd135'),
    ('P7', 'q04', 'm6', (6.12132, 5.12132), 'd135'), ('P22', 'q12', 'm25', (-0.707107, 11.949747), 'd45'),
    ('P9', 'q04', 'm9', (7.535534, 6.535534), 'd135'), ('P23', 'm5', 'm20', (4.12132, 11.363961), 'd135'),
    ('P24', 'm9', 'm14', (10.949747, 6.535534), 'd135'), ('P25', 'm10', 'm18', (7.535534, 11.949747), 'd135'),
    ('P26', 'm11@3', 'm18', (7.949747, 12.363961), 'd135'), ('P27', 'm3@3', 'm13', (12.363961, 9.949747), 'd135'),
]


def build():
    mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))
    m = f'm{len(pl.LINES)}'
    step(f'The line from S3 to S5 crosses {pl.describe(m)} at T. Draw a horizontal line through T. '
         'Turn it round O by 90°, three times. The four lines make a square with corners K1, K2, K3 and K4.')
    g.meet('T', 'q02', m, (L-1, L))
    g.line_par('gy', 'T', 'h')
    g.repeat('gyr', ['gy'], 'rot4')
    for i, (a, b, p) in enumerate([('gy@3', 'gy', (L, L)), ('gy', 'gy@1', (-L, L)),
                                   ('gy@1', 'gy@2', (-L, -L)), ('gy@2', 'gy@3', (L, -L))]):
        g.meet(f'K{i+1}', a, b, p)


SPEC = {
    'id': 'meknes-throne-rosette', 'title': 'Rosette of the Royal Palace throne room (Meknes)',
    'short': 'Meknes throne-room rosette', 'subtitle': 'Royal Palace throne room, Meknes',
    'code': 'C176A', 'folder': 'data152', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the large rosette.', 'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s C176A drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of the star’s sides, carried on, with earlier lines, and turned round O.',
    'changes': 'The tile edges follow the plain drawing. The colours follow Wichmann’s drawing: red, black and '
               'white, in the Modern Moroccan palette. No photograph was checked. Wichmann notes that his drawing omits '
               'the panel’s central 24-pointed star; this repeat follows his drawing.',
    'references': 'His reference is Jean-Marc Castéra, Arabesques: Decorative Art in Morocco (1999), page 176, '
                  'top left, Royal Palace throne room, Meknes.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosette, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart'},
    'palette': 'Modern Moroccan',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(9, 3.328): ('shield', 'a'), (6, 3.0): ('long_hexagon', 'a'), (16, 2.343): ('star', 'a'),
         (12, 2.172): ('twelve', 'a'), (6, 2.0): ('petal', 'ground'), (8, 2.0): ('eight', 'b'),
         (7, 1.914): ('seven', 'b'), (6, 1.828): ('hexagon', 'a'), (16, 1.657): ('cross', 'ground'),
         (4, 1.414): ('rhombus', 'a'), (4, .586): ('dart', 'ground'), (3, .5): ('triangle', 'a'),
         (4, .414): ('kite', 'ground')}
# Wichmann's colours by the player's nth, read with the batch's fills-by-type script.
FILLS = {
    'shield': {'ground': [6, 7, 8, 11, 12, 15, 16, 17]},
    'long_hexagon': {'ground': [4, 7, 8, 13, 16, 21, 22, 25], 'b': [10, 11, 12, 14, 15, 17, 18, 20]},
    'eight': {'a': [1, 2, 12, 27], 'ground': [6, 7, 10, 11, 15, 16, 17, 18, 21, 22, 23, 24, 28, 29, 32, 33]},
    'seven': {'ground': [6, 7, 10, 11, 14, 15, 22, 23, 24, 25, 32, 33, 36, 37, 40, 41]},
    'rhombus': {'ground': [0, 1, 4, 5, 10, 11, 14, 15]},
    'triangle': {'ground': [0, 1, 2, 3, 4, 5, 7, 8, 10, 11, 19, 20, 27, 28, 36, 37, 39, 40, 42, 43, 44, 45, 46, 47]},
}
SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'shield': 24, 'long_hexagon': 28, 'star': 12, 'twelve': 8, 'petal': 16, 'eight': 36, 'seven': 48,
          'hexagon': 16, 'cross': 8, 'rhombus': 16, 'dart': 16, 'triangle': 48, 'kite': 96}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
