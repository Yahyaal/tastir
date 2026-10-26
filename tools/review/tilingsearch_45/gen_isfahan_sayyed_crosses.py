#!/usr/bin/env python3
"""IRA1617, Masjid-e Sayyed, Isfahan: the low-level pattern of Wade's photo
IRA 1617. Plain tiles drawn edge to edge with white strokes over the joints;
use 1_pieces.py --precision 2, then this generator with <pieces.json>
<tutorial.json>; use finish <dump.json> <tutorial.json>.

The same frame as IRAN2 (gen_isfahan_seyyed_stars.py): OA is the star's point
radius, 36.2141225526 pt, and the stars stand two apart. Here a star at the
corner (L, L), L = 4 + 4H, has the same surroundings as the star at O, so the
tile is the square with its corners T1 to T4 on the axes at distance L, half
the area of IRAN2's tile. All corners snap to a + bH within 0.0004 OA.
Inside this tile, axis lines lie at H, 3H, 1 − H, 1 + H, 2 − H, 2 + H and
3 − H from O, and at H, 3H, 2 − H and 2 + H from the tile's corner T1;
diagonals lie at H, 3H, 2 + H and 2 + 3H from O.
Areas (OA², H = √2/2): star 8 − 8H (sixteen), ten 1 (eight), short ten
−2 + 4H (sixteen), square 6 − 8H (twenty-four), pentagon −5/2 + 4H (eighty);
together 48 + 64H = 2(4 + 4H)², the tile.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import medium  # noqa: E402
import gen_meknes_bou_inania_petals as mp  # noqa: E402

H, L = mp.H, 4+4*mp.H
ORIGIN, UNIT = (297.5, 373.41), 36.2141225526


def build():
    mp.build_frame(4, 2)
    # This tile is the square T1 T2 T3 T4, so the frame's last step (the square
    # through K1 to K4) is not drawn.
    for n in cm.steps.pop()['create']:
        del g.el[n]
    step('The vertical side from S8 to S2 crosses the horizontal line at P. '
         'Keep the compass open to OP. Draw circles with centres A, F1 and F2 in turn. '
         'They cross the horizontal line at U and V, at M and N, and at Y, towards O. '
         'Draw a circle with centre P and radius OE. It crosses the horizontal line at J, beyond P. '
         'Draw a vertical line through each of J, U, V, M, N and Y. '
         'Turn the six new lines round O by 90°, three times.', 'compass')
    g.meet('P', 'q14', 'h', (H, 0))
    for c, pts in (('A', (('U', 1-H), ('V', 1+H))), ('F1', (('M', 2-H), ('N', 2+H))), ('F2', (('Y', 3-H),))):
        g.circle_from('c' + c, c, 'O', 'P')
        for n, x in pts:
            g.meet(n, 'c' + c, 'h', (x, 0))
    g.circle_from('cp', 'P', 'O', 'E')
    g.meet('J', 'cp', 'h', (3*H, 0))
    ns = ['J', 'U', 'V', 'M', 'N', 'Y']
    for n in ns:
        g.line_par('v' + n, n, 'v')
    g.repeat('vp', ['v' + n for n in ns], 'rot4')

    step('Draw four circles with centre T1. Their radii are OP, OJ, OM and ON. '
         'They cross the horizontal line at Z1, Z2, Z3 and Z4, towards O. '
         'Draw a vertical line through each of Z1 to Z4. Turn the four new lines round O by 90°, three times.',
         'compass')
    for i, (p, r) in enumerate([('P', H), ('J', 3*H), ('M', 2-H), ('N', 2+H)]):
        g.circle_from(f'ct{i+1}', 'T1', 'O', p)
        g.meet(f'Z{i+1}', f'ct{i+1}', 'h', (L-r, 0))
        g.line_par(f'vz{i+1}', f'Z{i+1}', 'v')
    g.repeat('vzp', [f'vz{i}' for i in (1, 2, 3, 4)], 'rot4')

    step('Draw circles with centre O through J, N and Z4. They cross line OE at R1, R2 and R3. '
         'Draw a line through each of R1, R2 and R3 at 90° to line OE. '
         'Turn the three new lines round O by 90°, three times.', 'compass')
    ns = []
    for i, (p, r) in enumerate([('J', 3*H), ('N', 2+H), ('Z4', 2+3*H)]):
        g.circle_through(f'co{i+1}', 'O', p)
        g.meet(f'R{i+1}', f'co{i+1}', 'd45', (r*H, r*H))
        g.line_perp(f'dr{i+1}', f'R{i+1}', 'd45')
        ns.append(f'dr{i+1}')
    g.repeat('drp', ns, 'rot4')


SPEC = {
    'id': 'isfahan-sayyed-crosses', 'title': 'Stars and crosses of the Masjid-e Sayyed (Isfahan)',
    'short': 'Masjid-e Sayyed crosses', 'subtitle': 'Masjid-e Sayyed, Isfahan',
    'code': 'IRA1617', 'folder': 'data201', 'frame': (ORIGIN, UNIT, 0, L), 'diamond': True,
    'style': 'Persian', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a star.', 'A': 'A point of that star.'},
    'note': 'The finished design was read from Wichmann’s IRA1617 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid with the star’s point radius as the unit. The stars stand two apart '
            'along the lines of a larger pattern, so every line is at one of a few distances from O, or at the '
            'same distances from the corner of the tile. The opening is shared with the Seyyed mosque stars (IRAN2), '
            'drawn in the same frame.',
    'changes': 'The tile edges follow the plain drawing; its white strokes over the joints are not bands. '
               'Wichmann also draws the larger pattern as lines over the pieces; those lines are not inked here. '
               'The colours follow his drawing. Wade’s photograph was not overlaid.',
    'references': 'His references are David Wade’s photograph IRA 1617 (Masjid-e Sayyed, Isfahan, 1840) and '
                  'Wichmann and Wade, Islamic Design: a Mathematical Approach (2017), figures 15.1a and 15.1b.',
    'look': 'tiles', 'level': 'advanced',
    'ink': 'Ink the lines picked out in orange. They close the stars, the crosses, the squares and the pentagons.',
    'repeat': 'Put copies of the square tile side by side, corner to corner along the horizontal and vertical lines.',
    # Wichmann's colours, by place in the tile (nth counted as the player counts).
    'placements': {'repeat': [1, 1], 'rules': (
        [{'piece': 'star', 'nth': 0, 'color': 'ground'}]
        + [{'piece': 'ten', 'nth': n, 'color': 'b'} for n in (3, 4, 5, 7)]
        + [{'piece': 'square', 'nth': n, 'color': 'd'} for n in (0, 3, 4, 22)]
        + [{'piece': 'square', 'nth': n, 'color': 'a'} for n in (9, 11, 17, 19)]
        + [{'piece': 'pentagon', 'nth': n, 'color': 'a'} for n in (
            9, 10, 14, 15, 17, 18, 21, 22, 36, 37, 38, 39, 40, 41, 42, 43, 57, 58, 61, 62, 64, 65, 69, 70)])},
}
NAMES = {(16, 2.343): ('star', 'c'), (10, 1.0): ('ten', 'a'), (10, .828): ('short_ten', 'a'),
         (4, .343): ('square', 'ground'), (5, .328): ('pentagon', 'b')}
COUNTS = {'star': 16, 'ten': 8, 'short_ten': 16, 'square': 24, 'pentagon': 80}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}

if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
