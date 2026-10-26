#!/usr/bin/env python3
"""CM006A: frame turned 45 degrees, O=(312.5,356), OA=45sqrt(2) pt.

OA is half a whole square's diagonal. Full source polygons lie exactly on
the integer grid after this turn; the square cell has half-side two.
Four squares of area two and eight triangles of area one fill its area 16.
Source edge fragments are outside that cell and are not independent tiles.
"""
import math

import common as cm
from common import g, step
from half_turn import run


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'They cross at K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through each of C and D. '
        'The lines through A and C cross at K1. Draw a straight line through O and K1.')
    step('Draw a straight line through A and C. '
         'Turn it round O by 90°, three times. These lines are the sides of the square at O.', 'ruler', ['A', 'C'])
    g.line_through('ac', 'A', 'C')
    g.repeat('square', ['ac'], 'rot4')
    step('Draw a circle with centre A through O. '
         'It crosses the horizontal line through O again at E, right of A. '
         'Draw a circle with centre O through E. It crosses the vertical line through O at F, above O.',
         'compass', ['A', 'E', 'F'])
    g.circle_through('ce', 'A', 'O')
    g.meet('E', 'ce', 'h', (2, 0))
    g.circle_through('cf', 'O', 'E')
    g.meet('F', 'cf', 'v', (0, 2))
    step('Draw a vertical line through E. Draw a horizontal line through F. '
         'Turn both lines round O by 180°. They cross at N1, N2, N3 and N4.', 'ruler', ['E', 'F'])
    g.line_par('sideX', 'E', 'v')
    g.line_par('sideY', 'F', 'h')
    g.repeat('frame', ['sideX', 'sideY'], 'rot2')
    for name, x, y, a, b in [('N1', 1, 1, 'sideX', 'sideY'), ('N2', -1, 1, 'sideX@1', 'sideY'),
                              ('N3', -1, -1, 'sideX@1', 'sideY@1'), ('N4', 1, -1, 'sideX', 'sideY@1')]:
        g.meet(name, a, b, (2*x, 2*y))
    step('Draw a circle with centre E and opening OA. '
         'It crosses the horizontal line through O at G, right of E. '
         'Draw a line through G at 90° to the line from O to K1. '
         'Turn it round O by 90°, three times.', 'compass', ['E', 'G', 'K1'])
    g.circle_from('cg', 'E', 'O', 'A')
    g.meet('G', 'cg', 'h', (3, 0))
    g.line_perp('gd', 'G', 'd45')
    g.repeat('outer', ['gd'], 'rot4')


SPEC = {
    'code': 'CM006A', 'folder': 'data6', 'id': 'pompeii-squares-and-triangles',
    'title': 'Squares and triangles of a Roman mosaic, Pompeii',
    'short': 'Pompeii squares and triangles', 'subtitle': 'Roman mosaic, Pompeii',
    'style': 'Roman', 'palette': 'Mamluk wood', 'level': 'beginner',
    'frame': (312.5, 356, 45*math.sqrt(2), 0, 2, 2), 'angle': 45,
    'given': {'O': 'The centre of a whole square.', 'A': 'Its right corner.'},
    'note': 'The finished design was read from Brian Wichmann’s CM006A drawing. '
            'The frame is turned by 45° so OA follows a mirror line and is half a square diagonal. '
            'The square and its compass transfers give every corner exactly.',
    'changes': 'The plain boundaries are retained. The palette is illustrative. '
               'This is a Roman mosaic, not an Islamic building attribution. No photograph was checked.',
    'references': 'Cahier and Martin, 376 Decorative Allover Patterns from Historic Tilework and Textiles, '
                  'page 6, top left; Balmelle et al., Le décor géométrique de la mosaïque romaine, '
                  'plate 118(d), Pompeii; Dawes and Wichmann, A New Class of Tilings with Two Prototiles '
                  '(Visual Mathematics 3(4), 2001), PP class 27, IH class 65.',
    'pieces': [('square', 4, 2, 0, 4, 'ground'), ('triangle', 3, 1, 0, 8, 'a')],
    'placements': {'repeat': [1, 1], 'rules':
        [{'piece': 'square', 'nth': i, 'color': 'a'} for i in [0, 1]] +
        [{'piece': 'triangle', 'nth': i, 'color': 'ground'} for i in [0, 1, 6, 7]]},
}

if __name__ == '__main__':
    run(build, SPEC)
