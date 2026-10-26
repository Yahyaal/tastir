#!/usr/bin/env python3
"""IRAN2, Seyyed mosque (Masjid-e Sayyed), Isfahan: the low-level pattern.
Plain tiles drawn edge to edge with white strokes over the joints; use
1_pieces.py --precision 2, then this generator with <pieces.json>
<tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the star's point radius, 36.2141225526 pt; the stars stand two apart.
The square cell has half-side L = 4 + 4H (H = √2/2), 247.3 pt, with O at a
blue star; a blue star also sits at every corner. All corners snap to
a + bH within 0.0004 OA.
The lines come in two sets with the same offsets: round O and round the
corner K1. Axis lines lie at H, 3H, 2 − H and 2 + H from O, and at the same
distances from the corner; diagonals lie at H, 3H, 2 − H, 2 + H and 2 + 3H
from O, and at the same distances from the corner.
Areas (OA², H = √2/2): star 8 − 8H (forty), ten 1 (sixteen), square 6 − 8H
(forty), pentagon −5/2 + 4H (192); together 96 + 128H = 4(4 + 4H)², the cell.
IRAN4 (data209) is the same drawing with the two-level lines laid over it:
the same pieces in the same colours, so it is not built separately.
"""
import math
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import medium  # noqa: E402
import gen_meknes_bou_inania_petals as mp  # noqa: E402

H, L = mp.H, 4+4*mp.H
ORIGIN, UNIT = (297.5, 373.41), 36.2141225526


def part(text, animate='ruler'):
    p = {'text': text, 'create': {}, 'animate': animate}
    cm.steps[-1]['parts'].append(p)
    g.cur = p


def build_lines():
    """The frame and every line of the two-level Seyyed designs (shared with
    IRA1617, which inks other pieces of the same lines)."""
    mp.build_frame(4, 2)
    step('The vertical side from S8 to S2 crosses the horizontal line at P. '
         'Draw a circle with centre F1 and radius OP. It crosses the horizontal line at M and N. '
         'Draw a circle with centre P and radius OE. It crosses the horizontal line at J, beyond P. '
         'Draw a vertical line through each of J, M and N. Turn the three new lines round O by 90°, three times.',
         'compass')
    g.meet('P', 'q14', 'h', (H, 0))
    g.circle_from('cx', 'F1', 'O', 'P')
    g.meet('M', 'cx', 'h', (2-H, 0))
    g.meet('N', 'cx', 'h', (2+H, 0))
    g.circle_from('cp', 'P', 'O', 'E')
    g.meet('J', 'cp', 'h', (3*H, 0))
    for n in ('J', 'M', 'N'):
        g.line_par('v' + n, n, 'v')
    g.repeat('vp', ['vJ', 'vM', 'vN'], 'rot4')

    step('Draw four circles with centre K1. Their radii are OP, OJ, OM and ON. '
         'They cross the vertical side through T1 at Z1, Z2, Z3 and Z4. '
         'Draw a horizontal line through each of Z1 to Z4. Turn the four new lines round O by 90°, three times.',
         'compass')
    for i, (p, r) in enumerate([('P', H), ('J', 3*H), ('M', 2-H), ('N', 2+H)]):
        g.circle_from(f'ck{i+1}', 'K1', 'O', p)
        g.meet(f'Z{i+1}', f'ck{i+1}', 'gx', (L, L-r))
        g.line_par(f'hz{i+1}', f'Z{i+1}', 'h')
    g.repeat('hzp', [f'hz{i}' for i in (1, 2, 3, 4)], 'rot4')

    step('Draw the diagonals at the same distances from O and from K1.', 'compass')
    cm.steps[-1].pop('create')
    cm.steps[-1]['parts'] = []
    part('The vertical line through Z4, turned by 270°, crosses the horizontal line at Q. '
         'Draw circles with centre O through J, M, N and Q. They cross line OE at R1 to R4. '
         'Draw a line through each of R1 to R4 at 90° to line OE. '
         'Turn the four new lines round O by 90°, three times.', 'compass')
    g.meet('Q', 'hz4@3', 'h', (2+3*H, 0))
    ns = []
    for i, (p, r) in enumerate([('J', 3*H), ('M', 2-H), ('N', 2+H), ('Q', 2+3*H)]):
        g.circle_through(f'co{i+1}', 'O', p)
        g.meet(f'R{i+1}', f'co{i+1}', 'd45', (r*H, r*H))
        g.line_perp(f'dr{i+1}', f'R{i+1}', 'd45')
        ns.append(f'dr{i+1}')
    g.repeat('drp', ns, 'rot4')
    part('Draw a circle with centre K1 and radius OQ. '
         'It and the four other circles with centre K1 cross line OE at W1 to W5. '
         'Draw a line through each of W1 to W5 at 90° to line OE. '
         'Turn the five new lines round O by 90°, three times.', 'compass')
    ns = []
    g.circle_from('ck5', 'K1', 'O', 'Q')
    for i, r in enumerate([H, 3*H, 2-H, 2+H, 2+3*H]):
        g.meet(f'W{i+1}', f'ck{i+1}', 'd45', ((L*math.sqrt(2)-r)*H, (L*math.sqrt(2)-r)*H))
        g.line_perp(f'dw{i+1}', f'W{i+1}', 'd45')
        ns.append(f'dw{i+1}')
    g.repeat('dwp', ns, 'rot4')


SPEC = {
    'id': 'isfahan-seyyed-stars', 'title': 'Stars and pentagons of the Seyyed mosque (Isfahan)',
    'short': 'Seyyed mosque stars', 'subtitle': 'Masjid-e Sayyed, Isfahan',
    'code': 'IRAN2', 'folder': 'data209', 'frame': (ORIGIN, UNIT, 0, L),
    'style': 'Persian', 'palette': 'Timurid tile',
    'given': {'O': 'The centre of a blue star.', 'A': 'A point of that star.'},
    'note': 'The finished design was read from Wichmann’s IRAN2 drawing. Its tile corners were snapped '
            'to the square-root-of-two grid with the star’s point radius as the unit. The stars stand two apart '
            'along the lines of a larger pattern, so every line is at one of four distances from O, or at the '
            'same distances from the corner of the tile.',
    'changes': 'The tile edges follow the plain drawing; its white strokes over the joints are not bands. '
               'The colours follow Wichmann’s drawing: blue stars and blue ten-sided crosses mark the larger pattern '
               'among the gold stars. His second drawing of the panel (IRAN4) draws that larger pattern as lines '
               'over the same pieces; the lines are not inked here. No photograph was checked.',
    'references': 'His reference is a Flickr photograph, IranD47, of a low-level pattern at the Seyyed mosque, Isfahan '
                  '(personal communication).',
    'look': 'tiles', 'level': 'advanced',
    'ink': 'Ink the lines picked out in orange. They close the stars, the squares, the ten-sided crosses and the pentagons.',
    'repeat': 'Put copies of the square tile side by side. A blue star sits at every corner.',
    'small': {'square', 'pentagon'},
    # Wichmann's colours: gold stars, with blue ones at O, at the corner and at the middles of the sides.
    'placements': {'repeat': [1, 1], 'rules': [{'piece': 'star', 'nth': n, 'color': 'd'} for n in (0, 2, 19, 22)]},
}
NAMES = {(16, 2.343): ('star', 'c'), (10, 1.0): ('ten', 'd'), (4, .343): ('square', 'ground'), (5, .328): ('pentagon', 'a')}
COUNTS = {'star': 40, 'ten': 16, 'square': 40, 'pentagon': 192}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}


def build():
    build_lines()


if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
