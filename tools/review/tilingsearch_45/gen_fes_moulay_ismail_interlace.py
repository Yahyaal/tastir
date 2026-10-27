#!/usr/bin/env python3
"""MOR0331, Moulay Ismail mosque, Fès (Wade MOR 0331; Wichmann and Wade,
figure 9.11). An interlace of 7 pt bands; use 1_pieces.py --precision 2,
then this generator with <pieces.json> <tutorial.json> (the band centre
lines are the pieces moved out by half a band); use finish <dump.json>
<tutorial.json>.

OA is the star's point radius r = 20.5208 pt (centre lines); the square cell
has half-side L = 7 + 10H (H = √2/2), 288.75 pt, with O at the centre of the
large rosette. The repeat (577.5 pt) was found by matching pieces under
translation. All corners snap to a + bH (worst 0.001 OA). Axis lines lie at
H, 1 + H, 1 + 3H, 2 + 3H, 1 + 5H, 3 + 3H, 4 + 3H, 3 + 5H, 4 + 5H, 3 + 7H,
5 + 5H, 4 + 7H, 5 + 7H, 5 + 9H, 7 + 7H, 6 + 9H and 7 + 9H; the diagonals at
H, 1 + H, 3H, 2 + H, 1 + 3H, 2 + 3H, 1 + 5H, 3 + 3H, 2 + 5H, 4 + 3H, 3 + 5H,
4 + 5H, 4 + 7H, 5 + 7H, 6 + 7H, 6 + 9H, 6 + 11H, 8 + 9H, 8 + 11H, 8 + 13H
and 10 + 13H. After the unit star every line runs through a crossing of
earlier lines (large/greedy.py); the last diagonal's crossing lies outside
the tile. The tile's sides run through the crossing of the horizontal line
through O with the vertical at 5 + 7H turned by 45°.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402,F401
from common import g, step  # noqa: E402,F401
import medium  # noqa: E402
import parallels as pl  # noqa: E402
import gen_meknes_bou_inania_petals as mp  # noqa: E402

H = mp.H
L = 7+10*H
ORIGIN, UNIT, BAND = (297.5, 372.37), 20.5208, 7.0

PLAN = [
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'v', 'rot8'),
    ('P2', 'q11', 'm1@7', (3.12132, 0.707107), 'v', 'rot8'),
    ('P3', 'q02', 'm2', (3.12132, 4.12132), 'h', 'rot8'),
    ('P4', 'q04', 'm3', (5.12132, 4.12132), 'v', 'rot8'),
    ('P5', 'q02', 'm4', (5.12132, 6.12132), 'h', 'rot8'),
    ('P6', 'm3', 'm5@7', (4.535534, 4.12132), 'v', 'rot8'),
    ('P7', 'q11', 'm3@5', (6.535534, 0.707107), 'v', 'rot8'),
    ('P8', 'q02', 'm7', (6.535534, 7.535534), 'h', 'rot8'),
    ('P9', 'q11', 'm4@7', (7.949747, 0.707107), 'v', 'rot4'),
    ('P10', 'q04', 'm8', (8.535534, 7.535534), 'v', 'rot4'),
    ('P11', 'q02', 'm9', (7.949747, 8.949747), 'h', 'rot8'),
    ('P12', 'q04', 'm11', (9.949747, 8.949747), 'v', 'rot8'),
    ('P13', 'q11', 'm8@5', (11.363961, 0.707107), 'v', 'rot4'),
    ('P14', 'q11', 'm11@7', (11.949747, 0.707107), 'v', 'rot4'),
    ('P15', 'q02', 'm13', (11.363961, 12.363961), 'h', 'rot8'),
    ('P16', 'q04', 'm15', (13.363961, 12.363961), 'v', 'rot4'),
    ('P17', 'cy', 'q03', (-2.0, 1.0), 'd45', 'rot4'),
    ('P2', 'q11', 'm2', (3.12132, 0.707107), 'd135', 'rot4'),
    ('P18', 'q11', 'm10', (8.535534, 0.707107), 'd45', 'rot4'),
    ('P19', 'm2', 'm15', (3.12132, 12.363961), 'd135', 'rot4'),
    ('P20', 'm5', 'm16', (13.363961, 6.12132), 'd135', 'rot4'),
    ('P21', 'm9', 'm15', (7.949747, 12.363961), 'd135', 'rot4'),
    ('P22', 'm11', 'm16', (13.363961, 8.949747), 'd135', 'rot4'),
    ('P23', 'm14', 'm15', (11.949747, 12.363961), 'd135', 'rot4'),
    ('P24', 'm1@7', 'm15', (14.778175, 12.363961), 'd135', 'rot4'),
]


def build_tile(via):
    step(f'The horizontal line through O crosses {pl.describe(via)} at T. Draw a vertical line through T. '
         'Turn it round O by 90°, three times. The four lines make a square with corners K1, K2, K3 and K4.')
    g.meet('T', 'h', via, (L, 0))
    g.line_par('gs', 'T', 'v')
    g.repeat('gsr', ['gs'], 'rot4')
    for i, (a, b, p) in enumerate([('gs', 'gs@1', (L, L)), ('gs@1', 'gs@2', (-L, L)),
                                   ('gs@2', 'gs@3', (-L, -L)), ('gs@3', 'gs', (L, -L))]):
        g.meet(f'K{i+1}', a, b, p)


def build():
    mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))
    build_tile('m12@1')


SPEC = {
    'id': 'fes-moulay-ismail-interlace', 'title': 'Interlaced rosette of the Moulay Ismail mosque (Fès)',
    'short': 'Moulay Ismail mosque interlace', 'subtitle': 'Moulay Ismail mosque, Fès',
    'code': 'MOR0331', 'folder': 'data189', 'frame': (ORIGIN, UNIT, BAND, L),
    'given': {'O': 'The centre of the star inside the large rosette.', 'A': 'A point of that star.'},
    'note': 'The finished design was read from Wichmann’s MOR0331 drawing, an interlace of bands, by their '
            'centre lines. Its tile corners were snapped to the square-root-of-two grid in star-radius units. '
            'The unit-star opening is shared with the other Moroccan reconstructions. After it every line, the '
            'tile’s sides too, is drawn through a crossing of earlier lines and turned round O.',
    'changes': 'The lines are the centre lines of the drawing’s bands; the over-and-under weave is not drawn. '
               'The colours follow Wichmann’s drawing: black, red and green, in the Tétouan palette, whose dark '
               'navy stands for his black; the bands themselves are not pieces. Wade’s photo MOR 0331 was not '
               'checked.',
    'references': 'His references are David Wade’s photo MOR 0331, the Moulay Ismail mosque, Fès '
                  '(patterninislamicart.com), and Wichmann and Wade, Islamic Design: a Mathematical Approach '
                  '(2017), figure 9.11.',
    'look': 'strapwork',
    'ink': 'Ink the lines picked out in orange. They are the middles of the interlaced bands.',
    'small': {'triangle', 'kite', 'dart', 'square', 'pentagon', 'small_eight', 'rhombus'},
    'palette': 'Tétouan',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(11, 3.157): ('eleven', 'c'), (6, 3.0): ('long_hexagon', 'c'), (8, 2.657): ('wide_eight', 'c'),
         (16, 2.343): ('star', 'c'), (8, 2.172): ('short_eight', 'c'), (8, 2.0): ('eight', 'c'),
         (10, 2.0): ('ten', 'a'), (6, 2.0): ('petal', 'c'), (7, 1.914): ('seven', 'd'),
         (6, 1.828): ('hexagon', 'c'), (4, 1.414): ('rhombus', 'c'), (8, .686): ('small_eight', 'c'),
         (4, .586): ('dart', 'c'), (3, .5): ('triangle', 'c'), (4, .414): ('kite', 'c'),
         (4, .343): ('square', 'c'), (5, .328): ('pentagon', 'c')}
# Wichmann's colours by the player's nth (large/fillnth.py), in the Tétouan palette: green a, red d,
# black c (its dark navy).
FILLS = {
    'star': {'d': [12, 13, 21, 22]},
    'eight': {'a': [0, 1, 3, 6, 7, 46, 47, 50], 'd': [17, 20, 21, 26, 27, 32, 33, 36]},
    'seven': {'c': [12, 13, 17, 18, 21, 22, 25, 26, 29, 30, 33, 34, 37, 38, 42, 43]},
    'rhombus': {'d': [5, 6, 9, 10, 13, 14, 17, 18]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'eleven': 8, 'long_hexagon': 34, 'wide_eight': 8, 'star': 30, 'short_eight': 8, 'eight': 52, 'ten': 8,
          'petal': 28, 'seven': 56, 'hexagon': 48, 'rhombus': 24, 'small_eight': 8, 'dart': 24, 'triangle': 28,
          'kite': 264, 'square': 8, 'pentagon': 16}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
