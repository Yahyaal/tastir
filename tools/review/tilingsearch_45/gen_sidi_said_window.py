#!/usr/bin/env python3
"""L90, a pierced plaster window in the Dar Si Said museum, Marrakesh
(data181). The drawing shows bevelled 12.8 pt bands between light-blue
openings; keep only the openings (fill 0.4, 0.8, 1.0) of 1_pieces.py
--precision 2 and drop the specks under 10 pt² at the band crossings, then run
this generator with <pieces.json> <tutorial.json>; use finish <dump.json> <tutorial.json>.

The repeat is a square of side 397.98 pt with a small eight-pointed star (90°
points) at O and another at each corner. OA is a quarter of the side,
99.495 pt, so the half-side is 2; the band centre lines snap to a + bH
(H = √2/2) within 0.00013 OA. The lines are those of the Seville octagon
rings (RAY7, gen_seville_octagon_rings.py) without the axis lines at t³
(t = √2 − 1) and with diagonals at 2 + 2√2t² as well, so the two share
their opening: the circle, the octagon round it and the lines at height t.
The library's alhambra-star-and-arrows only names a line L90; it is not this
design.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import medium  # noqa: E402
import parallels as pl  # noqa: E402
import gen_seville_octagon_rings as sv  # noqa: E402

L = sv.L
ORIGIN, UNIT = (297.5, 372.61), 198.99/2

PLAN = [
    ('P1', 'vt@7', 'vt', (0.171573, 0.414214), 'v', 'rot8'), ('P2', 'vt', 'm1@7', (0.656854, 0.414214), 'v', 'rot8'),
    ('P3', 'ax', 'm1@3', (1.0, 1.242641), 'h', 'rot8'), ('P4', 'vt', 'm2@7', (1.343146, 0.414214), 'v', 'rot4'),
    ('P5', 'ax', 'vt@1', (1.0, 1.585786), 'h', 'rot8'), ('P6', 'ax@7', 'vt', (1.828427, 0.414214), 'v', 'rot8'),
    ('E', 'ax', 'd45', (1.0, 1.0), 'd135', 'rot4'), ('P7', 'm3', 'm6', (1.828427, 1.242641), 'd135', 'rot4'),
    ('P8', 'vt@5', 'm5', (2.171573, 1.585786), 'd135', 'rot4'),
]


def build():
    sv.opening('by 45°, 225° and 315°')
    pl.emit(pl.group(PLAN, 3))
    sv.tile('m7')


SPEC = {
    'id': 'sidi-said-window', 'title': 'Pierced plaster window of the Dar Si Said museum (Marrakesh)',
    'short': 'Dar Si Said window', 'subtitle': 'Dar Si Said museum, Marrakesh',
    'code': 'L90', 'folder': 'data181', 'frame': (ORIGIN, UNIT, 12.8, L),
    'given': {'O': 'The centre of a small eight-pointed star.', 'A': 'A point halfway from O to the side of the tile.'},
    'note': 'The finished design was read from Wichmann’s L90 drawing, its bevelled bands reduced to their '
            'centre lines and snapped to the square-root-of-two grid. It shares every construction line but one '
            'with the Seville octagon rings: the circle, the octagon round it and the lines at height V, then lines '
            'through crossings of earlier lines, turned round O.',
    'changes': 'The plaster bands are drawn as their centre lines; the pieces are the window’s openings, in one '
               'colour, and the small kites and triangles where the bands cross, which are solid plaster. No photograph was checked.',
    'references': 'His reference is Rom Landau and Wim Swaan, Morocco: Marrakesh, Fez, Rabat (1967), figure 90, '
                  'page 142: a pierced plaster window, without colour, in the Museum of Dar Si Said, Marrakesh.',
    'look': 'strapwork',
    'ink': 'Ink the lines picked out in orange. They close the stars, the octagonal rings and the openings between them.',
    'small': {'triangle', 'small_kite'},
    'palette': 'Chefchaouen',
    'repeat': 'Put copies of the square tile side by side. A small star sits at the centre and at every corner.',
}
# The openings take the palette's light blue; the kites and triangles where the bands cross are solid
# plaster in the drawing (no opening), so they take the ground.
NAMES = {(8, .343): ('ring_eight', 'b'), (6, .201): ('hexagon', 'b'), (9, .196): ('nine', 'b'),
         (6, .177): ('arrow', 'b'), (7, .172): ('seven', 'b'), (6, .142): ('short_hexagon', 'b'),
         (16, .138): ('star', 'b'), (8, .118): ('eight', 'b'), (6, .108): ('small_hexagon', 'b'),
         (4, .083): ('rhombus', 'b'), (4, .034): ('kite', 'ground'), (3, .029): ('triangle', 'ground'),
         (4, .024): ('small_kite', 'ground')}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
