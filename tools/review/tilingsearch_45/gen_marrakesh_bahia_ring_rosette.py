#!/usr/bin/env python3
"""C123, Bahia Palace, Marrakesh (Castéra page 123).
Plain tiles drawn edge to edge; use 1_pieces.py --precision 2, then this
generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 19.314 pt; the square cell has
half-side L = 6 + 8H (H = √2/2), 225.14 pt, as in the Najjarin rosette, with
O at the small star inside the large rosette (repeat found by matching pieces
under translation and turning). All corners snap to a + bH (worst 0.0005).
The ring of octagons and hexagons round the rosette has the shapes of the
Dar Si Said window's (L90); the pieces round it differ. After the unit star each line runs
through a crossing of earlier lines (large/greedy.py); where an axis line and
a diagonal share their distance, one line turned by 45° seven times draws
both. The crossings for the last two diagonals lie just outside the tile.
The tile's sides come as in the Najjarin rosette.
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
ORIGIN, UNIT = (297.5, 372.29), 225.14/(6+8*nj.H)

PLAN = [
    ('P1', 'cy', 'q03', (-2.0, 1.0), 'd45', 'rot8'),
    ('P2', 'm1', 'm1@5', (2.12132, 5.12132), 'h', 'rot8'),
    ('P3', 'q02', 'm2', (4.12132, 5.12132), 'v', 'rot8'),
    ('P4', 'q11', 'm2@7', (6.535534, 0.707107), 'v', 'rot8'),
    ('P5', 'm4', 'm4@1', (6.535534, 2.707107), 'h', 'rot8'),
    ('P6', 'q04', 'm4', (6.535534, 5.535534), 'h', 'rot8'),
    ('P7', 'q02', 'm4', (6.535534, 7.535534), 'h', 'rot8'),
    ('P8', 'm2', 'm5@5', (8.949747, 5.12132), 'v', 'rot8'),
    ('P9', 'm2', 'm3@7', (10.949747, 5.12132), 'v', 'rot8'),
    ('P10', 'm2', 'm2@5', (12.363961, 5.12132), 'd135', 'rot4'),
    ('P11', 'm2@1', 'm4', (6.535534, 13.778175), 'd135', 'rot4'),
    ('P12', 'm2@5', 'm7', (14.778175, 7.535534), 'd135', 'rot4'),
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
    for s in cm.steps:      # one sentence over twenty words, said shorter
        s['text'] = s['text'].replace('crosses the line through P1 parallel to line OE, turned by 225°, at P2',
                                      'crosses its copy turned by 225° at P2')
    nj.build_tile(VIA)


SPEC = {
    'id': 'marrakesh-bahia-ring-rosette', 'title': 'Ringed rosette of the Bahia Palace (Marrakesh)',
    'short': 'Bahia Palace ringed rosette', 'subtitle': 'Bahia Palace, Marrakesh',
    'code': 'C123', 'folder': 'data152', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the large rosette.', 'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s C123 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening is shared with the other '
            'Moroccan reconstructions. After it every line, the tile’s sides too, is drawn through a crossing '
            'of earlier lines and turned round O.',
    'changes': 'The tile edges follow the plain drawing. The original is uncoloured; the colours follow '
               'Wichmann’s drawing in the Tétouan palette, whose dark navy stands for his black and whose red '
               'for his dark red. No photograph was checked.',
    'references': 'His reference is Jean-Marc Castéra, Arabesques: Decorative Art in Morocco (1999), page 123, '
                  'the Bahia Palace, Marrakesh (19th century; no colouring in the original).',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosettes, the stars and the pieces between them.',
    'small': {'triangle', 'kite', 'dart'},
    'palette': 'Tétouan',
    'repeat': 'Put copies of the square tile side by side. A rosette sits at the centre of every tile.',
}
NAMES = {(8, 5.828): ('ring_eight', 'c'), (6, 3.414): ('ring_hexagon', 'b'), (9, 3.328): ('shield', 'ground'),
         (6, 3.0): ('long_hexagon', 'a'), (16, 2.343): ('star', 'd'), (8, 2.0): ('eight', 'a'),
         (6, 1.828): ('hexagon', 'a'), (4, 1.414): ('rhombus', 'b'), (4, .586): ('dart', 'ground'),
         (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground')}
# Wichmann's colours by the player's nth (read with the drawing's turns about O), in the Tétouan
# palette: his green a, yellow b (its honey), black c (its dark navy), dark red d.
FILLS = {
    'long_hexagon': {'c': [1, 2, 5, 8, 14, 17, 22, 32, 38, 41, 47, 50]},
    'hexagon': {'c': [14, 15, 18, 19, 20, 21, 24, 25]},
    'triangle': {'b': [12, 15, 16, 17, 19, 20, 26, 27, 28, 29, 35, 36, 38, 39, 40, 43]},
}
SPEC['placements'] = pl.placements(FILLS, NAMES)
COUNTS = {'ring_eight': 8, 'ring_hexagon': 8, 'shield': 16, 'long_hexagon': 52, 'star': 12, 'eight': 20,
          'hexagon': 40, 'rhombus': 8, 'dart': 40, 'triangle': 56, 'kite': 136}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES, drawing)
