import json
import math
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g
from gen_design_e import (
    P, circle_through, circle_from, dirdeg, el, ensure_point, line_bisect,
    line_perp, line_through, meet, named_at, put, step, steps
)

from test_square_tile import D

# Step 10: mark crossings of the star
step('Mark the inner corners of the ten-pointed star.', 'ruler')
meet('I0', 's0', 's1', (0.618034 * math.cos(18*D), 0.618034 * math.sin(18*D)))
meet('I1', 's1', 's2', (0.618034 * math.cos(54*D), 0.618034 * math.sin(54*D)))
meet('I2', 's2', 's3', (0.0, 0.618034))
meet('I3', 's3', 's4', (-0.618034 * math.cos(54*D), 0.618034 * math.sin(54*D)))
meet('I4', 's4', 's5', (-0.618034 * math.cos(18*D), 0.618034 * math.sin(18*D)))
meet('I5', 's5', 's6', (-0.618034 * math.cos(18*D), -0.618034 * math.sin(18*D)))
meet('I6', 's6', 's7', (-0.618034 * math.cos(54*D), -0.618034 * math.sin(54*D)))
meet('I7', 's7', 's8', (0.0, -0.618034))
meet('I8', 's8', 's9', (0.618034 * math.cos(54*D), -0.618034 * math.sin(54*D)))
meet('I9', 's9', 's0', (0.618034 * math.cos(18*D), -0.618034 * math.sin(18*D)))

# Ink: the 10-pointed star
# and the 10 kites of the decagon
paths = [
    # Star
    {'closed': True, 'through': [
        'P0', 'I0', 'P36', 'I1', 'P72', 'I2', 'P108', 'I3', 'P144', 'I4',
        'P180', 'I5', 'P216', 'I6', 'P252', 'I7', 'P288', 'I8', 'P324', 'I9'
    ]},
    # Decagon outline
    {'closed': True, 'through': [
        'P0', 'P36', 'P72', 'P108', 'P144', 'P180', 'P216', 'P252', 'P288', 'P324'
    ]}
]

tut = {
    'format': 0,
    'id': 'darb-e-imam-decagram',
    'title': 'Darb-e Imam Decagram',
    'fold': 10,
    'style': 'Timurid / Persian',
    'level': 'advanced',
    'credits': [{
        'source': 'Darb-e Imam shrine portal, Isfahan (1453 CE)',
        'creator': 'Lu & Steinhardt (Science 2007)',
        'url': 'https://doi.org/10.1126/science.1135491'
    }],
    'given': {
        'O': 'The centre of the decagram.',
        'A': 'Any point to the right of O. OA is the radius of the decagram’s circle.'
    },
    'steps': g.steps,
    'ink': {
        'text': 'Go over the ten-pointed star and the decagon.',
        'paths': paths
    },
    'pattern': {
        'cell': 'cell',
        'palette': 'Isfahan',
        'colors': {'star': 'a', 'kite': 'b', 'corner': 'ground'}
    },
    'expect': {
        'pieceTypes': 2,
        'pieces': [{'name': 'star', 'vertices': 20, 'area': 1.12257, 'perCell': 1}]
    }
}

with open('tutorials/darb-e-imam-decagram.json', 'w') as f:
    json.dump(tut, f, indent=2)

print('Wrote tutorials/darb-e-imam-decagram.json')
