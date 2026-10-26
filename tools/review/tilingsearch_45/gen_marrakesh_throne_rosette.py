#!/usr/bin/env python3
"""C126B, Royal Palace throne room, Marrakesh (Castéra page 126, figure 3).
Plain tiles drawn edge to edge with 6 pt white strokes over the joints; use
1_pieces.py --precision 2, then this generator with <pieces.json>
<tutorial.json>; use finish <dump.json> <tutorial.json>.

OA is the small star's point radius r = 28.97036 pt; the square cell has
half-side L = 4 + 6H (H = √2/2), 238.794 pt, with O at the star inside the
large black rosette. All corners snap to a + bH within 0.0003 r.
Axis lines lie at H, 2 + H, 2 + 3H, 2 + 5H, 4 + 3H and 4 + 5H from O; the
diagonals at the same distances and at 4 + 7H and 6 + 7H.
Areas (r², H = √2/2): octagon 4 + 8H (eight), long hexagon 3 (twelve), star
8 − 8H (two), eight 2 (thirty-six), hexagon −1 + 4H (eight), cross −4 + 8H
(six), dart 2 − 2H (eight), triangle 1/2 (seventy-two), kite −1 + 2H
(forty); together 136 + 192H = 4(4 + 6H)², the cell.
The unit star and the compass transfers to the frame are shared with the
Rabat throne room (C126A) and the Meknes rosette rings (P70).
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import medium  # noqa: E402
import gen_meknes_bou_inania_petals as mp  # noqa: E402
from gen_meknes_bou_inania_rosette_rings import crossing_set  # noqa: E402

H, L = mp.H, 4+6*mp.H
ORIGIN, UNIT = (297.5, 372.934), 238.794/L


def build():
    mp.build_frame(4)
    cm.steps[-1]['textWithoutHelpers'] = (
        'Draw a vertical line through each of T1 and T3. Draw a horizontal line through T2. '
        'They are three sides of the square with corners K1, K2, K3 and K4.')
    step('The circles with centres G1 and G2 cross at U1 and U2. Draw a straight line through U1 and U2. '
         'Draw a circle with centre T1 and radius OE. It crosses the circle with centre G2 at W1 and W2. '
         'Draw a straight line through W1 and W2. Turn both new lines round O by 90°, three times.', 'compass')
    g.meet('U1', 'cg2', 'cg3', (4+3*H, (2-(H)**2)**.5))
    g.meet('U2', 'cg2', 'cg3', (4+3*H, -(2-(H)**2)**.5))
    g.line_through('uv', 'U1', 'U2')
    g.circle_from('ct', 'T1', 'O', 'E')
    g.meet('W1', 'ct', 'cg3', (4+5*H, (2-(H)**2)**.5))
    g.meet('W2', 'ct', 'cg3', (4+5*H, -(2-(H)**2)**.5))
    g.line_through('wv', 'W1', 'W2')
    g.repeat('uwp', ['uv', 'wv'], 'rot4')

    step('The line from S2 to S4 crosses the circle with centre F1 at J, to the right. '
         'Draw a vertical line through J. It crosses the horizontal line at J1. '
         'Keep the compass open to OE. Draw circles with centres J1 and J2 in turn. '
         'Each circle crosses the horizontal line to the right at J2 and J3. '
         'Draw a vertical line through each of J2 and J3. Turn the three new lines round O by 90°, three times.',
         'compass')
    g.meet('J', 'q11', 'cf1', (2+H, H))
    g.line_par('jv1', 'J', 'v')
    g.meet('J1', 'jv1', 'h', (2+H, 0))
    g.circle_from('cj1', 'J1', 'O', 'E')
    g.meet('J2', 'cj1', 'h', (2+3*H, 0))
    g.circle_from('cj2', 'J2', 'O', 'E')
    g.meet('J3', 'cj2', 'h', (2+5*H, 0))
    g.line_par('jv2', 'J2', 'v')
    g.line_par('jv3', 'J3', 'v')
    g.repeat('jvp', ['jv1', 'jv2', 'jv3'], 'rot4')

    step('Keep the compass open to OE. Draw circles with centres A and N in turn. '
         'Each circle crosses the horizontal line to the right at N and M1. '
         'Draw a circle with centre G2 and radius OA. It crosses the horizontal line at M2 and M3. '
         'Draw a line through each of M1, M2 and M3 at 90° to line OE. '
         'Turn the three new lines round O by 90°, three times.', 'compass')
    g.circle_from('cn', 'A', 'O', 'E')
    g.meet('N', 'cn', 'h', (1+2*H, 0))
    g.circle_from('cm2', 'N', 'O', 'E')
    g.meet('M1', 'cm2', 'h', (1+4*H, 0))
    cm.circle_radius_of('cm1', 'G2', 'c')
    g.meet('M2', 'cm1', 'h', (3+4*H, 0))
    g.meet('M3', 'cm1', 'h', (5+4*H, 0))
    for i in (1, 2, 3):
        g.line_perp(f'md{i}', f'M{i}', 'd45')
    g.repeat('mdp', ['md1', 'md2', 'md3'], 'rot4')

    step('The vertical line through T1 crosses the line from S7 to S1 at Y1. '
         'It crosses the lines through M1, M2 and M3, turned by 270°, at Y2, Y3 and Y4. '
         'Draw a line through each of Y1 to Y4 at 90° to line OE. '
         'Turn the four new lines round O by 90°, three times.')
    g.meet('Y1', 'gx', 'q04', (L, L-1))
    g.meet('Y2', 'gx', 'md1@3', (L, 3+2*H))
    g.meet('Y3', 'gx', 'md2@3', (L, 1+2*H))
    g.meet('Y4', 'gx', 'md3@3', (L, -1+2*H))
    for i in (1, 2, 3, 4):
        g.line_perp(f'yd{i}', f'Y{i}', 'd45')
    g.repeat('ydp', [f'yd{i}' for i in (1, 2, 3, 4)], 'rot4')


SPEC = {
    'id': 'marrakesh-throne-rosette', 'title': 'Rosette and octagons of the Royal Palace throne room (Marrakesh)',
    'short': 'Marrakesh throne-room rosette', 'subtitle': 'Royal Palace throne room, Marrakesh',
    'code': 'C126B', 'folder': 'data152', 'frame': (ORIGIN, UNIT, 0, L),
    'given': {'O': 'The centre of the small star inside the large rosette.', 'A': 'A point of that small star.'},
    'note': 'The finished design was read from Wichmann’s C126B drawing. Its tile corners were snapped '
            'to the square-root-of-two grid in small-star-radius units. The unit-star opening and square-diagonal '
            'compass transfers are shared with the Rabat throne-room octagons; different crossings complete '
            'the rosette, the crosses and the octagons.',
    'changes': 'The tile edges follow the plain drawing; its white strokes over the joints are not bands. '
               'The colours follow Wichmann’s drawing, mapped to the Alhambra palette: the teal and blue octagons '
               'turn in a pinwheel, though the lines themselves are mirror-symmetric. No photograph was checked.',
    'references': 'His references are Jean-Marc Castéra, Arabesques: Decorative Art in Morocco (1999), '
                  'page 126, figure 3, Royal Palace throne room, Marrakesh; Wichmann and Wade, Islamic Design: '
                  'a Mathematical Approach (2017), figure 9.8b; and André Paccard, Traditional Islamic Craft in '
                  'Moroccan Architecture (1980), volume 2, page 76, Royal Palace, Ifrane.',
    'look': 'tiles',
    'ink': 'Ink the lines picked out in orange. They close the rosette, the octagons, the crosses and the pieces between them.',
    'small': {'triangle', 'kite'},
    'palette': 'Alhambra',
    # Wichmann's colours: the rosette's eight petals black, the four long hexagons on the sides blue; the star at
    # the corner black, the one at O teal; the octagons teal and blue in a pinwheel (nth counted by the player).
    'placements': {'repeat': [1, 1], 'rules': (
        [{'piece': 'long_hexagon', 'nth': n, 'color': 'd'} for n in (0, 1, 2, 11)]
        + [{'piece': 'star', 'nth': 0, 'color': 'a'}]
        + [{'piece': 'octagon', 'nth': n, 'color': 'b'} for n in (0, 3, 4, 7)])},
    'repeat': 'Put copies of the square tile side by side. A small black star sits at every corner.',
}
NAMES = {(8, 9.657): ('octagon', 'd'), (6, 3.0): ('long_hexagon', 'a'), (16, 2.343): ('star', 'b'),
         (8, 2.0): ('eight', 'd'), (6, 1.828): ('hexagon', 'd'), (16, 1.657): ('cross', 'ground'),
         (4, .586): ('dart', 'a'), (3, .5): ('triangle', 'c'), (4, .414): ('kite', 'a')}
# The finished pieces (checked by hand above and by the engine), so the placement rules can name them.
COUNTS = {'octagon': 8, 'long_hexagon': 12, 'star': 2, 'eight': 36, 'hexagon': 8, 'cross': 6, 'dart': 8,
          'triangle': 72, 'kite': 40}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': a, 'perCell': COUNTS[nm]} for (v, a), (nm, _) in NAMES.items()]}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
