#!/usr/bin/env python3
"""F80 shares the Charbagh opening, but its connectors keep one direction.

O=(302.05375,375.55375), OA=40(3+2sqrt(2)) pt. The cell is a square of
half-side one. Independent source areas and counts are listed in SPEC.
An extra vertical through W, and diagonals at three star radii,
construct corners absent from the Charbagh design. No existing generator changes.
"""
import math

import common as cm
from common import g, step
import gen_charbagh_stars as charbagh
from half_turn import run

H = math.sqrt(.5)
R = 2*H-1


def build():
    charbagh.build()
    cm.steps[-1]['textWithoutHelpers'] = cm.steps[-1]['text'] + ' Leave out the horizontal line below O.'
    step('Draw a vertical line through W. Turn it round O by 180°.', 'ruler', ['W'])
    g.line_par('wx', 'W', 'v')
    g.repeat('verticals', ['wx'], 'rot2')
    step('Draw a circle with centre S1 through O. '
         'It crosses the horizontal line through O again at J, right of S1. '
         'Draw a circle with centre J and opening from O to S1. '
         'It crosses the horizontal line through O at Z, right of J.', 'compass', ['S1', 'J', 'Z'])
    g.circle_through('cj', 'S1', 'O')
    g.meet('J', 'cj', 'h', (2*R, 0))
    cm.circle_radius_of('cz', 'J', 'cs')
    g.meet('Z', 'cz', 'h', (3*R, 0))
    step('Draw a line through Z at 90° to the line from O to K1. '
         'Turn it round O by 90°, three times.', 'ruler', ['Z', 'K1'])
    g.line_perp('zd', 'Z', 'd45')
    g.repeat('diagonals', ['zd'], 'rot4')



SPEC = {
    'code': 'F80', 'folder': 'data16', 'id': 'iranian-star-columns',
    'title': 'Stars and upright connectors from an Iranian collection',
    'short': 'Iranian star columns', 'subtitle': 'Al-Naqsh, volume 3, figure 80',
    'style': 'Persian', 'star': 8, 'corners': ['K1', 'K2', 'K3', 'K4'],
    'frame': (302.05375, 375.55375, 40*(3+4*H), 0, 1, 1),
    'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Halfway to the next star on the horizontal line.'},
    'note': 'The finished design was read from Brian Wichmann’s F80 drawing and its corners snapped to exact values. '
            'It shares the Charbagh star construction, then adds verticals and diagonals for connectors that keep one direction.',
    'changes': 'The plain tile boundaries are retained. The palette is illustrative. The source names no building; none is assigned here.',
    'references': 'Mahmood Maher al-Naqsh, Design and execution of drawing in Iranian tilework, Islamic period '
                  '(Reza Abbasi Museum, 1983), volume 3, figure 80, page 33; Iran, no specific location.',
    'pieces': [('star', 16, 40, -56, 2, 'a'), ('upright_ten', 10, 3, -4, 2, 'a'),
               ('ten', 10, -14, 20, 8, 'b'), ('eight', 8, 10, -14, 8, 'c'),
               ('square', 4, 34, -48, 4, 'ground'), ('pentagon', 5, -15.5, 22, 12, 'ground')],
}

if __name__ == '__main__':
    run(build, SPEC)
