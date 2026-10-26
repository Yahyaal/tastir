#!/usr/bin/env python3
"""MOR0719, Fès (Wade's photograph MOR 0719). Plain tiles drawn edge to edge;
use 1_pieces.py --precision 2, then this generator with <pieces.json>
<tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the point radius r = 28.9709 pt of the small star at the centre of the
rosette. The rosettes sit on a centred square lattice (the green stars between
them have other surroundings), so the square cell with half-side
L = 6 + 8H (H = √2/2), 337.71 pt, holds two rosettes: one at O and a quarter
at each corner. All corners snap to a + bH within 0.00035 r. The drawing runs
off the page at the cell's left and right sides, so its pieces are also read
turned by 90°, 180° and 270° about O (the design has those turns).
Axis lines lie at H, 1 + H, 2, 1 + 3H, 3 + H, 2 + 3H, 3 + 3H, 5H − 1, 3 + 5H,
4 + 5H, 3 + 7H, 5 + 5H, 4 + 8H, 5 + 7H, 6 + 7H and 7 + 3H from O; the
diagonals at most of the same and at 1 − H, 4 + 7H, 5 + 9H, 7 + 9H, 5 + 11H,
8 + 11H, 9 + 7H and 6 + 12H.
All but two run through crossings of the star's sides, carried on, with the
lines drawn before them (a greedy search over the drawing's missing lines);
where an axis line and a diagonal share their distance from O, one line is
turned by 45° seven times and makes both. The rosettes at the cell's corners
need two compass transfers: the vertical at 7 + 3H is L − (5H − 1) (a circle
with centre T1 and radius OX), and the diagonal at 6 + 12H is two units from
the corner K1 along line OE (a circle with centre K1 and radius OF).
Areas (r², H = √2/2), as the engine and the drawing agree: see expect.
"""
import math
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import medium  # noqa: E402
import parallels as pl  # noqa: E402
import gen_meknes_bou_inania_petals as mp  # noqa: E402

H, L = mp.H, 6+8*mp.H
ORIGIN, UNIT = (297.5, 372.93), 337.71/(6+8*mp.H)

PLAN = [
    ('P1', 'q04', 'q11', (1.707107, 0.707107), 'v', 'rot8'), ('P2', 'ax', 'q02', (1.0, 2.0), 'h', 'rot8'),
    ('P3', 'q11', 'm1@7', (3.12132, 0.707107), 'v', 'rot8'), ('P4', 'q11', 'm3@1', (3.707107, 0.707107), 'v', 'rot8'),
    ('P5', 'q02', 'm3', (3.12132, 4.12132), 'h', 'rot8'), ('P6', 'q04', 'm5', (5.12132, 4.12132), 'v', 'rot8'),
    ('P7', 'q11', 'm5@5', (6.535534, 0.707107), 'v', 'rot8'), ('P8', 'q02', 'm7', (6.535534, 7.535534), 'h', 'rot8'),
    ('P9', 'q11', 'm6@7', (7.949747, 0.707107), 'v', 'rot8'), ('P10', 'q04', 'm8', (8.535534, 7.535534), 'v', 'rot8'),
    ('P11', 'ax', 'm8@7', (1.0, 9.656854), 'h', 'rot4'), ('P12', 'q11', 'm7@7', (9.949747, 0.707107), 'v', 'rot8'),
    ('P13', 'q02', 'm12', (9.949747, 10.949747), 'h', 'rot4'), ('P14', 'q01', 'q11', (0.292893, 0.707107), 'd45', 'rot4'),
    ('P15', 'm2', 'm14', (1.585786, 2.0), 'd135', 'rot8'), ('P16', 'm1', 'm13', (1.707107, 10.949747), 'd135', 'rot4'),
    ('P10', 'q04', 'm8', (8.535534, 7.535534), 'd135', 'rot4'), ('P17', 'q02', 'm10', (8.535534, 9.535534), 'd135', 'rot4'),
    ('P18', 'q04', 'm12', (9.949747, 8.949747), 'd135', 'rot4'), ('P19', 'm11@3', 'm14', (9.656854, 10.071068), 'd135', 'rot4'),
    ('P20', 'm13@3', 'm14', (10.949747, 11.363961), 'd135', 'rot4'),
]


def build():
    mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))
    step(f'The vertical line through A crosses {pl.describe("m16")} at T. Draw a horizontal line through T. '
         'Turn it round O by 90°, three times. The four lines make a square with corners K1, K2, K3 and K4.')
    cm.steps[-1]['textWithoutHelpers'] = (
        f'The vertical line through A crosses {pl.describe("m16")} at T. '
        'T is on the top side of the square tile, whose corners are K1, K2, K3 and K4.')
    g.meet('T', 'ax', 'm16', (1, L))
    g.line_par('gy', 'T', 'h')
    g.repeat('gyr', ['gy'], 'rot4')
    for i, (a, b, p) in enumerate([('gy@3', 'gy', (L, L)), ('gy', 'gy@1', (-L, L)),
                                   ('gy@1', 'gy@2', (-L, -L)), ('gy@2', 'gy@3', (L, -L))]):
        g.meet(f'K{i+1}', a, b, p)
    step(f'The side from K4 to K1 crosses the horizontal line through O at T1. '
         f'{pl.describe("m15@7")[0].upper()}{pl.describe("m15@7")[1:]} crosses the horizontal line through O at X. '
         'Draw a circle with centre T1 and radius OX. It crosses the horizontal line at Y, towards O. '
         'Draw a vertical line through Y. Turn it round O by 90°, three times.', 'compass')
    cm.steps[-1]['textWithoutHelpers'] = cm.steps[-1]['text'].replace(
        'The side from K4 to K1 crosses', 'The side of the tile from K4 to K1 crosses')
    g.meet('T1', 'gy@3', 'h', (L, 0))
    g.meet('X', 'm15@7', 'h', (5*H-1, 0))
    g.circle_from('cx', 'T1', 'O', 'X')
    g.meet('Y', 'cx', 'h', (7+3*H, 0))
    g.line_par('yv', 'Y', 'v')
    g.repeat('yvr', ['yv'], 'rot4')
    step(f'{pl.describe("m2@6")[0].upper()}{pl.describe("m2@6")[1:]} crosses the horizontal line through O at F. '
         'Draw a circle with centre K1 and radius OF. It crosses line OE at Z, towards O. '
         'Draw a line through Z at 90° to line OE. Turn it round O by 90°, three times.', 'compass')
    g.meet('F', 'm2@6', 'h', (2, 0))
    g.circle_from('ck', 'K1', 'O', 'F')
    g.meet('Z', 'ck', 'd45', (L-2*H, L-2*H))
    g.line_perp('zd', 'Z', 'd45')
    g.repeat('zdr', ['zd'], 'rot4')


def drawing(pieces):
    """The drawing's pieces and their turns about O, which fill the parts of
    the cell beyond the page."""
    polys = cm.frame_pieces(pieces, ORIGIN, 2*UNIT, 0)
    out = []
    for k in range(4):
        c, s = round(math.cos(k*math.pi/2)), round(math.sin(k*math.pi/2))
        out += [[(c*x-s*y, s*x+c*y) for x, y in Q] for Q in polys]
    return out


SPEC = {
    'id': 'fes-rosette-rings', 'title': 'Rosettes in octagonal rings (Fès)',
    'short': 'Fès rosette rings', 'subtitle': 'Fès',
    'code': 'MOR0719', 'folder': 'data181', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside a rosette.', 'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s MOR0719 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the '
            'other Moroccan reconstructions. After it almost every line is drawn through a crossing of the star’s '
            'sides, carried on, with earlier lines, and turned round O; two compass transfers set the lines of '
            'the rosettes at the tile’s corners.',
    'changes': 'The tile edges follow the plain drawing. The tile holds two rosettes, one at O and a quarter at '
               'each corner. The colours follow Wichmann’s drawing in the Marinid zellige palette. Wade’s '
               'photograph MOR 0719 was not checked.',
    'references': 'His reference is David Wade’s photograph MOR 0719 (Fès), patterninislamicart.com.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the rings round them and the pieces between.',
    'small': {'triangle', 'kite', 'rhombus'},
    'palette': 'Marinid zellige',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre and at every corner.',
}
NAMES = {(8, 4.172): ('long_eight', 'c'), (6, 3.0): ('hexagon', 'a'), (16, 2.343): ('star', 'a'),
         (12, 2.172): ('twelve', 'a'), (6, 2.0): ('petal', 'a'), (8, 2.0): ('arrow', 'ground'),
         (7, 1.914): ('long_seven', 'c'), (8, 1.757): ('short_eight', 'd'), (16, 1.657): ('cross', 'ground'),
         (10, 1.485): ('ten', 'ground'), (4, 1.414): ('large_rhombus', 'ground'), (7, 1.257): ('seven', 'a'),
         (3, .5): ('triangle', 'ground'), (4, .485): ('rhombus', 'ground'), (4, .414): ('kite', 'ground')}
# Wichmann's colours by the player's nth (read with the batch's fills-by-type script; the
# pieces off the page by the design's quarter turns). His light-blue rings have no slot of
# their own in the Marinid palette: they take its turquoise glaze.
FILLS = {'star': {'b': [1, 2]},
         'arrow': {'b': [5, 6, 7, 8, 9, 10, 11, 12, 21, 22, 23, 24, 25, 26, 27, 28]}}
SPEC['placements'] = pl.placements(FILLS, NAMES)
SPEC['placements']['rules'].insert(0, {'piece': 'long_eight', 'color': '#1d8fa3'})
COUNTS = {'long_eight': 16, 'hexagon': 24, 'star': 4, 'twelve': 16, 'petal': 16, 'arrow': 32, 'long_seven': 32,
          'short_eight': 16, 'cross': 4, 'ten': 16, 'large_rhombus': 16, 'seven': 16, 'triangle': 96,
          'rhombus': 16, 'kite': 112}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES, drawing)
