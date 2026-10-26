#!/usr/bin/env python3
"""P18B and P18A, Paccard page 222 (Morocco), top left and bottom left: two
variants of one large eight-fold rosette panel. Plain tiles drawn edge to
edge with thin strokes over the joints; use 1_pieces.py --precision 2, then
this generator with <pieces.json> <tutorial.json> [A]; use
finish <dump.json> <tutorial.json> [A].

OA is the small star's point radius, 24.1405 pt; the square cell has
half-side L = 6 + 8H (H = √2/2), 281.4 pt, with O at the small black star in
the middle of the large rosette. All corners snap to a + bH within 0.0008 OA.
Every line in all four directions lies at one of the same distances from O,
so each is a vertical line turned round O by 45°:
H, 1 + H, 2 + H, 2 + 3H, 2 + 5H, 3 + 5H, 4 + 5H, 4 + 7H, 5 + 7H and 6 + 7H
in both, with 3 + 7H and 4 + 3H in P18B (top left) and 5 + 5H in P18A
(bottom left); and three diagonals near the corner, at H, 2 + H and 2 + 3H
from the corner. The last five distances are L minus the first five.
P18B areas (OA², H = √2/2): shield 1/2 + 4H (twenty), long hexagon 3 (sixteen),
star 8 − 8H (eight), eight 2 (twenty), petal 2 (sixty-four), seven 1/2 + 2H
(forty), arrow −1 + 4H (sixteen), triangle 1/2 (twenty), dart 2H (sixty-four),
small dart 2 − 2H (sixteen), kite −1 + 2H (sixty-four); together
272 + 384H = 4(6 + 8H)², the cell. P18A has twelve shields, eight small darts,
twenty-eight eights and triangles, forty-eight petals, fifty-six sevens and
darts, eight hexagons, and two new eight-sided pieces in the ring, −3 + 8H and
5 − 4H (eight each); the same sum. In the code the dart of area 2H is the
rhombus and the small dart is the dart.
"""
import math
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import medium  # noqa: E402
import gen_meknes_bou_inania_petals as mp  # noqa: E402

H, L = mp.H, 6+8*mp.H
ORIGIN, UNIT = (297.5, 372.61), 24.1405
VARIANT = 'A' if sys.argv[-1] == 'A' else 'B'


def build():
    mp.build_unit_star()
    top = VARIANT == 'B'
    step('The vertical side from S8 to S2 crosses the horizontal line at P. '
         'Keep the compass open to OA. Draw circles with centres P and U1 in turn. '
         'Each circle crosses the horizontal line to the right at U1 and U2.', 'compass')
    g.meet('P', 'q14', 'h', (H, 0))
    cm.circle_radius_of('cu1', 'P', 'c')
    g.meet('U1', 'cu1', 'h', (1+H, 0))
    cm.circle_radius_of('cu2', 'U1', 'c')
    g.meet('U2', 'cu2', 'h', (2+H, 0))

    if top:
        step('Keep the compass open to OE. Draw circles with centres U2 and U3 in turn. '
             'Each circle crosses the horizontal line to the right at U3 and U4. '
             'Draw a circle with centre U4 and radius OA. It crosses the horizontal line at U5, to the right. '
             'Draw a circle with centre U5 and radius OE. It crosses the horizontal line at U6, to the right.',
             'compass')
    else:
        step('Keep the compass open to OE. Draw circles with centres U2 and U3 in turn. '
             'Each circle crosses the horizontal line to the right at U3 and U4. '
             'Draw a circle with centre U4 and radius OA. It crosses the horizontal line at U5, to the right.',
             'compass')
    g.circle_from('cu3', 'U2', 'O', 'E')
    g.meet('U3', 'cu3', 'h', (2+3*H, 0))
    g.circle_from('cu4', 'U3', 'O', 'E')
    g.meet('U4', 'cu4', 'h', (2+5*H, 0))
    cm.circle_radius_of('cu5', 'U4', 'c')
    g.meet('U5', 'cu5', 'h', (3+5*H, 0))
    if top:
        g.circle_from('cu6', 'U5', 'O', 'E')
        g.meet('U6', 'cu6', 'h', (3+7*H, 0))

    step('Draw a circle with centre U5 and radius OP. It crosses the horizontal line at V, towards O. '
         'Draw a circle with centre V through O. It crosses the horizontal line at T1. '
         'Draw a circle with centre O through T1. It crosses the horizontal and vertical lines at T2, T3 and T4.',
         'compass')
    g.circle_from('cv', 'U5', 'O', 'P')
    g.meet('V', 'cv', 'h', (3+4*H, 0))
    g.circle_through('ct', 'V', 'O')
    g.meet('T1', 'ct', 'h', (L, 0))
    g.circle_through('co', 'O', 'T1')
    for i, (line, p) in enumerate([('v', (0, L)), ('h', (-L, 0)), ('v', (0, -L))], 2):
        g.meet(f'T{i}', 'co', line, p)

    step('Draw a vertical line through each of T1 and T3. Draw a horizontal line through each of T2 and T4. '
         'They make a square with corners K1, K2, K3 and K4.')
    for name, p, line in [('gx', 'T1', 'v'), ('gy', 'T2', 'h'), ('gxw', 'T3', 'v'), ('gys', 'T4', 'h')]:
        g.line_par(name, p, line)
    for i, (a, b, p) in enumerate([('gx', 'gy', (L, L)), ('gxw', 'gy', (-L, L)),
                                    ('gxw', 'gys', (-L, -L)), ('gx', 'gys', (L, -L))]):
        g.meet(f'K{i+1}', a, b, p)

    ws = [('P', H), ('U1', 1+H), ('U2', 2+H), ('U3', 2+3*H)] + ([('U4', 2+5*H)] if top else [])
    step('Draw {} circles with centre T1. Their radii are the distances from O to {}. '.format(
             'five' if top else 'four', ', '.join(p for p, _ in ws[:-1]) + ' and ' + ws[-1][0])
         + 'They cross the horizontal line at W1 to W{}, towards O.'.format(len(ws)), 'compass')
    for i, (p, r) in enumerate(ws):
        g.circle_from(f'cw{i+1}', 'T1', 'O', p)
        g.meet(f'W{i+1}', f'cw{i+1}', 'h', (L-r, 0))
    if not top:
        step('Draw a circle with centre W4 and radius OA. It crosses the horizontal line at Y, to the right.',
             'compass')
        cm.circle_radius_of('cwy', 'W4', 'c')
        g.meet('Y', 'cwy', 'h', (5+5*H, 0))

    us = ['U1', 'U2', 'U3', 'U4', 'U5'] + (['U6'] if top else [])
    ns = us + [f'W{i+1}' for i in range(len(ws))] + ([] if top else ['Y'])
    step('Draw a vertical line through each of {}. '.format(
             'U1 to U6 and W1 to W5' if top else 'U1 to U5, W1 to W4 and Y')
         + 'Turn the {} new lines round O by 45°, seven times.'.format('eleven' if top else 'ten'))
    for n in ns:
        g.line_par('v' + n, n, 'v')
    g.repeat('vp', ['v' + n for n in ns], 'rot8')

    step('Draw three circles with centre K1. Their radii are the distances from O to P, U2 and U3. '
         'They cross line OE at X1, X2 and X3. '
         'Draw a line through each of X1, X2 and X3 at 90° to line OE. '
         'Turn the three new lines round O by 90°, three times.', 'compass')
    k = L*math.sqrt(2)
    for i, (p, r) in enumerate([('P', H), ('U2', 2+H), ('U3', 2+3*H)]):
        g.circle_from(f'ck{i+1}', 'K1', 'O', p)
        g.meet(f'X{i+1}', f'ck{i+1}', 'd45', ((k-r)*H, (k-r)*H))
        g.line_perp(f'dx{i+1}', f'X{i+1}', 'd45')
    g.repeat('dxp', ['dx1', 'dx2', 'dx3'], 'rot4')


COMMON = {
    'folder': 'data157', 'frame': (ORIGIN, UNIT, 0, L), 'style': 'Moroccan', 'palette': 'Marinid zellige',
    'level': 'advanced', 'look': 'tiles',
    'given': {'O': 'The centre of the small star in the middle of the large rosette.',
              'A': 'A point of that small star.'},
    'references': 'His reference is André Paccard, Traditional Islamic Craft in Moroccan Architecture (1980), '
                  'page 222, which does not name the building.',
}
SPECS = {
    'B': dict(COMMON, **{
        'id': 'paccard-222-rosette', 'title': 'Large rosette of a Moroccan panel (Paccard, page 222)',
        'short': 'Paccard rosette', 'subtitle': 'Morocco, after Paccard, page 222 top left', 'code': 'P18B',
        'note': 'The finished design was read from Wichmann’s P18B drawing. Its tile corners were snapped to the '
                'square-root-of-two grid with the small star’s point radius as the unit. Every line, in all four '
                'directions, lies at one of twelve distances from O, so each is drawn once as a vertical line and '
                'turned round O; three diagonals near the corner of the tile complete the corner rosette.',
        'changes': 'The tile edges follow the plain drawing; its thin strokes over the joints are not bands. '
                   'The colours follow Wichmann’s drawing, mapped to the Marinid zellige palette. '
                   'His drawing of the bottom-left panel of the same page (P18A) changes the large rosette and '
                   'shares the rest. No photograph was checked.',
        'ink': 'Ink the lines picked out in orange. They close the large rosette, the green stars at the corners '
               'and the pieces between them.',
        'repeat': 'Put copies of the square tile side by side. A star rosette sits at every corner.',
    }),
    'A': dict(COMMON, **{
        'id': 'paccard-222-rosette-ring', 'title': 'Ringed rosette of a Moroccan panel (Paccard, page 222)',
        'short': 'Paccard ringed rosette', 'subtitle': 'Morocco, after Paccard, page 222 bottom left',
        'code': 'P18A',
        'note': 'The finished design was read from Wichmann’s P18A drawing. Its tile corners were snapped to the '
                'square-root-of-two grid with the small star’s point radius as the unit. It is the top-left panel '
                'of the same page (P18B) with a different ring round the large rosette: two of its distances '
                'from O are replaced by one, and the rest of the construction is shared.',
        'changes': 'The tile edges follow the plain drawing; its thin strokes over the joints are not bands. '
                   'The colours follow Wichmann’s drawing, mapped to the Marinid zellige palette. '
                   'No photograph was checked.',
        'ink': 'Ink the lines picked out in orange. They close the large rosette and its ring, the green stars at '
               'the corners and the pieces between them.',
        'repeat': 'Put copies of the square tile side by side. A star rosette sits at every corner.',
    }),
}
SPEC = SPECS[VARIANT]
if VARIANT == 'A':
    SPEC['references'] = ('His references are André Paccard, Traditional Islamic Craft in Moroccan Architecture '
                          '(1980), page 222, which does not name the building; and Wichmann and Wade, Islamic '
                          'Design: a Mathematical Approach (2017), figure 9.9c.')
# Wichmann's colours, read by fillnth.py: the commonest colour of each shape is its default, the rest are
# placed by nth (counted as the player counts). Red and orange are not in the palette, so they stay as drawn.
RED, ORANGE = '#c7000f', '#e8820c'
NAMES_B = {
    (9, 3.328): ('shield', 'c'), (6, 3.0): ('long_hexagon', 'b'), (16, 2.343): ('star', 'a'),
    (8, 2.0): ('eight', 'a'), (6, 2.0): ('petal', 'ground'), (7, 1.914): ('seven', 'ground'),
    (6, 1.828): ('hexagon', 'a'), (4, 1.414): ('rhombus', 'ground'), (4, 0.586): ('dart', 'ground'),
    (3, 0.5): ('triangle', 'c'), (4, 0.414): ('kite', 'ground')}
RULES_B = [
    ('shield', 'ground', (0, 1, 2, 19)),
    ('long_hexagon', 'ground', (5, 6, 7, 8, 9, 10, 11, 12)),
    ('star', RED, (0,)),
    ('star', ORANGE, (1, 2, 3, 4, 6, 7)),
    ('eight', 'b', (0, 1, 5, 15)),
    ('eight', RED, (6, 7, 8, 10, 11, 13, 14, 16)),
    ('petal', ORANGE, (1, 2, 6, 7, 14, 15, 26, 40, 52, 53, 60, 61)),
    ('petal', 'a', (4, 5, 10, 13, 16, 17, 28, 31, 36, 39, 50, 51, 54, 57, 62, 63)),
    ('petal', 'd', (21, 23, 24, 32, 35, 43, 44, 47)),
    ('petal', 'c', (27, 29, 30, 33, 34, 37, 38, 41)),
    ('hexagon', 'c', (4, 5, 6, 7, 8, 9, 10, 11)),
    ('rhombus', ORANGE, (0, 3, 12, 15, 48, 51, 60, 63)),
    ('rhombus', 'a', (5, 6, 16, 19, 44, 47, 57, 58)),
    ('rhombus', RED, (13, 14, 17, 18, 25, 26, 28, 31, 32, 35, 37, 38, 45, 46, 49, 50)),
    ('rhombus', 'd', (21, 22, 29, 30, 33, 34, 41, 42)),
    ('triangle', 'a', (0, 1, 3, 17)),
]
COUNTS_B = {'shield': 20, 'long_hexagon': 16, 'star': 8, 'eight': 20, 'petal': 64, 'seven': 40, 'hexagon': 16,
            'rhombus': 64, 'dart': 16, 'triangle': 20, 'kite': 64}
# P18A: Wichmann's yellow takes the honey slot.
NAMES_A = {
    (9, 3.328): ('shield', 'ground'), (6, 3.0): ('long_hexagon', 'b'), (8, 2.657): ('ring_eight', 'd'),
    (16, 2.343): ('star', 'a'), (8, 2.172): ('short_eight', 'a'), (8, 2.0): ('eight', 'd'),
    (6, 2.0): ('petal', 'c'), (7, 1.914): ('seven', 'ground'), (6, 1.828): ('hexagon', 'a'),
    (4, 1.414): ('rhombus', 'ground'), (4, 0.586): ('dart', 'ground'), (3, 0.5): ('triangle', 'ground'),
    (4, 0.414): ('kite', 'ground')}
RULES_A = [
    ('long_hexagon', 'c', (5, 6, 7, 8, 9, 10, 11, 13)),
    ('star', RED, (0,)),
    ('star', ORANGE, (1, 2, 3, 4, 6, 7)),
    ('eight', 'b', (0, 1, 6, 22)),
    ('eight', RED, (7, 10, 11, 14, 15, 18, 19, 23)),
    ('petal', 'ground', (0, 3, 12, 13, 16, 17, 24, 27, 34, 35, 38, 39)),
    ('petal', ORANGE, (1, 2, 4, 5, 6, 9, 18, 32, 42, 45, 46, 47)),
    ('seven', 'a', (2, 3, 6, 7, 10, 11, 22, 25, 30, 33, 44, 45, 48, 49, 52, 53)),
    ('seven', 'c', (4, 5, 8, 9, 16, 17, 23, 24, 31, 32, 38, 39, 46, 47, 50, 51)),
    ('rhombus', ORANGE, (0, 3, 10, 13, 42, 45, 52, 55)),
    ('rhombus', RED, (11, 12, 14, 15, 21, 22, 24, 27, 28, 31, 33, 34, 40, 41, 43, 44)),
    ('triangle', ORANGE, (0, 1, 6, 22)),
    ('triangle', 'a', (7, 10, 11, 14, 15, 18, 19, 23)),
]
COUNTS_A = {'shield': 12, 'long_hexagon': 16, 'ring_eight': 8, 'star': 8, 'short_eight': 8, 'eight': 28,
            'petal': 48, 'seven': 56, 'hexagon': 8, 'rhombus': 56, 'dart': 8, 'triangle': 28, 'kite': 64}
NAMES, RULES, COUNTS = {'B': (NAMES_B, RULES_B, COUNTS_B), 'A': (NAMES_A, RULES_A, COUNTS_A)}[VARIANT]
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if not NAMES:
    del SPEC['expect']
SPEC['small'] = {'dart', 'triangle', 'kite'}
if RULES:
    SPEC['placements'] = {'repeat': [1, 1], 'rules': [
        {'piece': nm, 'nth': n, 'color': col} for nm, col, ns in RULES for n in ns]}

if __name__ == '__main__':
    if VARIANT == 'A':
        sys.argv.pop()
    medium.run(build, SPEC, NAMES)
