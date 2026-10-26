#!/usr/bin/env python3
"""P052 uses P144's guide construction, in a narrower cmm repeat.

O=(297.5,375.024375), source star radius=25(1+sqrt(2)) pt. The frame
turns -22.5 degrees and OA=R*cos(pi/8), giving half-sides 2,2+2sqrt(2).
Independent source-polygon areas/counts are in SPEC; they sum to 16+32H.
"""
import math

import common as cm
from common import g, step
import gen_bourgoin_144_octagon_bands as plate144
from half_turn import rectangle, run

H = math.sqrt(.5)
L = 2+4*H


def build():
    plate144.build(opening_only=True)
    step('Draw a circle with centre O through G2. '
         'It crosses the vertical line through O at T2, above O.', 'compass', ['G2', 'T2'])
    g.circle_through('co', 'O', 'G2')
    g.meet('T2', 'co', 'v', (0, L))
    rectangle('F', 'T2', 2, L)
    step('The lines from S7 to S1 and from S8 to S2 cross at P. '
         'Draw lines through P parallel to the lines from S1 to S3 and from S2 to S4. '
         'Turn both lines round O by 90°, three times. '
         'The first new line crosses the vertical line through O at Z, above O.', 'ruler', ['P', 'Z'])
    g.meet('P', 'q04', 'q14', (2*plate144.T, 0))
    plate144.parallels(['P'], 'p')
    g.meet('Z', 'p00', 'v', (0, 2*plate144.T**2))
    step('Draw a circle with centre O and opening OF. '
         'It crosses the vertical line through O at N, above O. '
         'Draw a circle with centre N, with the same opening. '
         'It crosses the vertical line through O at M, above N. '
         'Draw lines through N parallel to the lines from S1 to S3 and from S2 to S4. '
         'Turn both lines round O by 90°, three times.', 'compass', ['F', 'N', 'M'])
    g.circle_from('cn', 'O', 'O', 'F')
    g.meet('N', 'cn', 'v', (0, 2))
    g.circle_from('cm', 'N', 'O', 'F')
    g.meet('M', 'cm', 'v', (0, 4))
    plate144.parallels(['N'], 'n')
    step('Draw a circle with centre M and opening OP. It crosses the vertical line through O at U1 and U2. '
         'Draw lines through both points parallel to the lines from S1 to S3 and from S2 to S4. '
         'Turn the two lines through U1 round O by 90°, three times. '
         'Turn the two lines through U2 round O by 180°.', 'compass', ['M', 'P', 'U1', 'U2'])
    g.circle_from('cu', 'M', 'O', 'P')
    g.meet('U1', 'cu', 'v', (0, 4-2*plate144.T))
    g.meet('U2', 'cu', 'v', (0, 4+2*plate144.T))
    plate144.parallels(['U1'], 'u')
    plate144.parallels(['U2'], 'u2', fold=2)
    step('Draw a circle with centre M and opening OZ. It crosses the vertical line through O at W1 and W2. '
         'Draw lines through both points parallel to the lines from S1 to S3 and from S2 to S4. '
         'Turn all four lines round O by 180°.', 'compass', ['M', 'Z', 'W1', 'W2'])
    g.circle_from('cw', 'M', 'O', 'Z')
    g.meet('W1', 'cw', 'v', (0, 4-2*plate144.T**2))
    g.meet('W2', 'cw', 'v', (0, 4+2*plate144.T**2))
    plate144.parallels(['W1', 'W2'], 'w', fold=2)



SPEC = {
    'code': 'P052', 'folder': 'data11', 'id': 'bourgoin-52-octagon-rows',
    'title': 'Octagon rows of Bourgoin plate 52', 'short': 'Bourgoin 52 octagon rows',
    'subtitle': 'Bourgoin, plate 52', 'style': 'Book pattern', 'palette': 'Alhambra', 'star': 8,
    'frame': (297.5, 375.024375, 25*(1+2*H)*math.cos(math.pi/8), 0, 2, L), 'angle': -22.5,
    'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Sets the circle inside the guide octagon.'},
    'note': 'The finished design was read from Brian Wichmann’s P052 drawing and its corners snapped to exact values. '
            'The frame turns by −22.5°. OA is the radius of the circle inside the octagon through the star’s points. '
            'The guide construction is shared with plate 144; the narrower rectangle gives this different arrangement.',
    'changes': 'The plain boundaries are retained. The palette is illustrative. '
               'The page identifies no building, and none is assigned here. No building photograph was checked.',
    'references': 'Jules Bourgoin, Arabic Geometrical Pattern and Design, plate 52 (1879; Dover edition). '
                  'His page links Wade BOU 052 and plate 144 for the same irregular tile shapes.',
    'pieces': [('star', 16, 48, -64, 2, 'ground'), ('eighteen', 18, -12, 20, 4, 'b'),
               ('octagon', 8, -32, 48, 4, 'ground'), ('fourteen', 14, -24, 36, 4, 'a'),
               ('small_octagon', 8, 12, -16, 16, 'c')],
}

if __name__ == '__main__':
    run(build, SPEC)
