#!/usr/bin/env python3
"""F169, Alhambra, Salón de Comares, the west wall's alicatado dado between the
window alcoves (Fernández-Puertas, The Alhambra I, page 345, figure 169).
An interlace of 6 pt bands; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json> (the band centre lines are the
pieces moved out by half a band); use finish <dump.json> <tutorial.json>.

OA is the star's point radius r = 19.3141 pt (centre lines); the square cell
has half-side L = 8 + 10H (H = √2/2), 291.08 pt, with O at the star in the
middle of the rosette. The drawing shows a single repeat: its other centres
of four-fold turning are the cell's corners, of another kind, so the page
holds no translation (found by testing turns about piece centres). All
corners snap to a + bH. Every line lies at 2a + (2b + 1)H from O, axis
lines and diagonals alike: the sides of unit stars set on a grid of steps
2 and √2. No crossing of two such lines lies on a third, so the greedy
search (large/greedy.py) needs two helper lines: a vertical at 1 + 5H, and
a horizontal at 1 - H through an inner corner of the unit star, both turned
by 45°. Every other line runs through a crossing of earlier lines.
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
L = 8+10*H
ORIGIN, UNIT, BAND = (297.5, 372.2871), 19.3141, 6.0

PLAN = [
    ('P1', 'cy', 'q03', (-2.0, 1.0), 'd45', 'rot8'),
    ('P2', 'cy', 'm1@2', (-4.0, 1.0), 'd45', 'rot8'),
    ('P3', 'q04', 'm2@7', (4.535534, 3.535534), 'v', 'rot8'),  # helper
    ('P4', 'q02', 'm3@1', (2.707107, 3.707107), 'v', 'rot8'),
    ('P5', 'q02', 'm3', (4.535534, 5.535534), 'h', 'rot8'),
    ('P6', 'm1', 'm3', (4.535534, 7.535534), 'h', 'rot8'),
    ('P7', 'm3', 'm6@7', (4.535534, 6.12132), 'h', 'rot8'),
    ('P8', 'm3', 'm7@7', (4.535534, 4.12132), 'h', 'rot8'),
    ('P9', 'm2', 'm3', (4.535534, 9.535534), 'h', 'rot8'),
    ('P10', 'm3', 'm9@7', (4.535534, 8.949747), 'h', 'rot8'),
    ('P11', 'm3', 'm8@1', (4.535534, 10.363961), 'h', 'rot8'),
    ('P12', 'm3', 'm3@3', (4.535534, 10.949747), 'h', 'rot8'),
    ('P13', 'm3', 'm5@1', (4.535534, 12.363961), 'h', 'rot8'),
    ('P14', 'm3', 'm13@7', (4.535534, 12.949747), 'h', 'rot8'),
    ('P15', 'cy', 'm5@3', (-8.828427, 1.0), 'd45', 'rot8'),
    ('P16', 'm3', 'm15', (4.535534, 14.363961), 'h', 'rot8'),
    ('P17', 'm3@3', 'm16', (7.949747, 14.363961), 'd135', 'rot4'),
    ('P18', 'm3@7', 'm10', (15.363961, 8.949747), 'd135', 'rot4'),
    ('P19', 'm3@7', 'm11', (16.778175, 10.363961), 'd135', 'rot4'),
    ('P20', 'q01', 'q14', (0.707107, 0.292893), 'h', 'rot8'),  # helper
    ('P21', 'm14', 'm20@5', (13.363961, 12.949747), 'd135', 'rot4'),
    ('P22', 'm16', 'm20@5', (14.778175, 14.363961), 'd135', 'rot4'),
]
HELPERS = ('m3', 'm20')       # lines the finished pattern does not use


def build_lines():
    mp.build_unit_star()
    pl.emit(pl.group(PLAN, 3))


def build_tile(a='q04', via='m16', y=None):
    da, dv = pl.describe(a), pl.describe(via)
    step(f'{da[0].upper()}{da[1:]} crosses {dv} at T. Draw a vertical line through T. '
         'Turn it round O by 90°, three times. The four lines make a square with corners K1, K2, K3 and K4.')
    g.meet('T', a, via, (L, y))
    g.line_par('gs', 'T', 'v')
    g.repeat('gsr', ['gs'], 'rot4')
    for i, (p, q, w) in enumerate([('gs', 'gs@1', (L, L)), ('gs@1', 'gs@2', (-L, L)),
                                   ('gs@2', 'gs@3', (-L, -L)), ('gs@3', 'gs', (L, -L))]):
        g.meet(f'K{i+1}', p, q, w)


TILE = ('q04', 'm22', L - 1)


def helper_texts():
    """With helper lines off, the player shows only the copies of the two
    helper lines that later steps cross (large/hidden.ts)."""
    for s in cm.steps:
        t = s['text']
        if 'Draw a vertical line through P3.' in t:
            s['textWithoutHelpers'] = t.replace('Turn it round O by 45°, seven times.',
                                                'Turn copies of it round O by 45°, by 135° and by 315°.')
        if 'Draw a horizontal line through P20.' in t:
            s['textWithoutHelpers'] = t.replace('Draw a horizontal line through P20. Turn it round O by 45°, '
                                                'seven times.', 'Draw a horizontal line through P20. '
                                                'Turn it round O by 225°.')


def build():
    build_lines()
    helper_texts()
    build_tile(*TILE)


SPEC = {
    'id': 'alhambra-comares-west-dado', 'title': 'Rosette dado of the Salón de Comares west wall, Alhambra',
    'short': 'Comares west dado', 'subtitle': 'Salón de Comares, Alhambra, Granada',
    'code': 'F169', 'folder': 'data150', 'frame': (ORIGIN, UNIT, BAND, L),
    'given': {'O': 'The centre of the star in the middle of the rosette.', 'A': 'A point of that star.'},
    'note': 'The finished design was read from Wichmann’s F169 drawing, an interlace of bands, by their '
            'centre lines. Its tile corners were snapped to the square-root-of-two grid in star-radius units. '
            'After the unit star every line, the tile’s sides too, is drawn through a crossing of earlier lines '
            'and turned round O. Two of those lines are helpers that the finished pattern does not use: no '
            'crossing of the pattern’s own lines lies on another of its lines.',
    'changes': 'The lines are the centre lines of the drawing’s bands; the over-and-under weave is not drawn. '
               'The colours follow Wichmann’s drawing, which keeps the panel’s own: black, teal, honey and '
               'blue, in the Alhambra palette; the bands themselves are not pieces. No photograph was checked.',
    'references': 'He drew it from Antonio Fernández-Puertas, The Alhambra, volume I (1997), page 345, '
                  'figure 169: one of a pair of square alicatado panels on the west wall of the Salón de '
                  'Comares, between the three window alcoves (1350s).',
    'look': 'strapwork',
    'ink': 'Ink the lines picked out in orange. They are the middles of the interlaced bands.',
    'small': {'seven', 'small_eight', 'octagon', 'small_hexagon', 'triangle', 'kite', 'square', 'pentagon'},
    'palette': 'Alhambra',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(16, 3.828): ('big_star', 'a'), (16, 3.414): ('wide_star', 'a'), (12, 3.243): ('twelve', 'a'),
         (13, 3.157): ('thirteen', 'a'), (6, 3.0): ('long_hexagon', 'a'), (16, 2.343): ('star', 'a'),
         (16, 2.314): ('pointed_star', 'a'), (12, 2.172): ('cross', 'c'), (8, 2.0): ('eight', 'c'),
         (6, 1.828): ('hexagon', 'b'), (7, 1.086): ('seven', 'a'), (8, 1.0): ('small_eight', 'a'),
         (8, .686): ('octagon', 'a'), (6, .586): ('small_hexagon', 'a'), (3, .5): ('triangle', 'a'),
         (4, .414): ('kite', 'a'), (4, .343): ('square', 'a'), (5, .328): ('pentagon', 'a')}
# Wichmann's colours by the player's nth (large/fillnth.py), in the Alhambra palette: black a, teal b,
# honey c, blue d.
FILLS = {
    'star': {'c': [6, 8, 11, 20, 22, 31, 34, 36],
             'b': [9, 10, 12, 13, 15, 16, 18, 19, 24, 25, 26, 27, 29, 30, 32, 33]},
    'cross': {'b': [0, 1, 2, 3, 4, 5, 10, 11, 20, 21, 26, 27, 28, 29, 30, 31]},
    'eight': {'d': [0, 1, 2, 3, 4, 5, 6, 9, 10, 11, 14, 15, 16, 30, 31, 32, 35, 37, 38, 40, 43, 44, 45, 59, 60, 61,
                    62, 65, 66, 69, 70, 71]},
    'hexagon': {'d': [0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 28, 29, 30, 31, 32, 33, 34, 35, 44, 45, 46, 47, 56,
                      57, 58, 59, 60, 61, 62, 63]},
}
if FILLS:
    SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'big_star': 8, 'wide_star': 8, 'twelve': 16, 'thirteen': 16, 'long_hexagon': 20, 'star': 38,
          'pointed_star': 8, 'cross': 32, 'eight': 72, 'hexagon': 64, 'seven': 32, 'small_eight': 24, 'octagon': 8,
          'small_hexagon': 16, 'triangle': 40, 'kite': 296, 'square': 30, 'pentagon': 72}
if COUNTS:
    SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
        {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
