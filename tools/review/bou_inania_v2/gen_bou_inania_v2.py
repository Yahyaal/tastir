#!/usr/bin/env python3
"""Builds the simpler Bou Inania tutorial (owner, 2026-10-05).

Samira Mian's twelve-fold rosette, then sets of lines each drawn through a
crossing already on the paper and turned round (a quarter turn for the
frame and the lines across the diagonals, an eighth for the corner octagon,
a twelfth otherwise). The sets were read from the clear drawing by
@aslam.geometricpatterns (tools 1-5 in this folder). Units: OA = 1, the
first circle; the tile is the square frame.

Usage: gen_bou_inania_v2.py <ink.json> tutorials/<id>.json
  ink.json: the ink segments (from 6_choose_ink.py), in OA units.
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402  (shared ruler-and-compass helpers)

from gen_design_e import (P, ang, circle_through, crossings, dirdeg, el,  # noqa: E402
                          ensure_point, line_par, line_perp, line_bisect,
                          line_through, meet, named_at, put, repeat, step, steps)

ink_path, out = sys.argv[1], sys.argv[2]
c15 = math.cos(math.radians(15))
rho = math.tan(math.radians(37.5))


def pt_at(p, prefix):
    """Name a crossing at p (made from two drawn lines)."""
    n = named_at(p, 1e-7)
    return n or ensure_point(p, prefix)


def ray(a):
    """The line through O at angle a (mod 180), drawn earlier."""
    return RAYS[round(a % 180, 3)]


def set_through(name, p, normal, turns, text, highlight=None):
    """One line through the crossing at p with the given normal direction,
    turned round O `turns` times."""
    step(text, highlight=highlight)
    X = pt_at(p, 'X')
    line_perp(name, X, ray(normal))
    repeat(f'{name}s', [name], f'rot{turns}')
    return X


g.given()
step('Rule a horizontal line through O and A and draw the first circle about O through A. Keep this opening.', 'compass')
put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
line_through('h', 'O', 'A')

step('Put the compass point where the circle meets the line on the right, and draw a circle through O; do the same on the left. Rule the vertical through O, and draw the same circle about its top and bottom points.', 'compass', ['c', 'h'])
meet('P0', 'c', 'h', (1, 0))
meet('P180', 'c', 'h', (-1, 0))
circle_through('cE', 'P0', 'O')
circle_through('cW', 'P180', 'O')
line_perp('v', 'O', 'h')
meet('P90', 'c', 'v', (0, 1))
meet('P270', 'c', 'v', (0, -1))
circle_through('cN', 'P90', 'O')
circle_through('cS', 'P270', 'O')

step('The four circles cut the first one at eight more points: it is divided into twelve. Rule the lines through O and opposite points, then halve every angle between them, so there is a line through O every 15°.', 'ruler', ['cE', 'cW', 'cN', 'cS'])
for a, other in ((60, 'cE'), (300, 'cE'), (120, 'cW'), (240, 'cW'), (30, 'cN'), (150, 'cN'), (210, 'cS'), (330, 'cS')):
    meet(f'P{a}', 'c', other, dirdeg(a))
RAYS = {0.0: 'h', 90.0: 'v'}
for a in (30, 60, 120, 150):
    line_through(f'r{a}', f'P{a}', f'P{a + 180}')
    RAYS[float(a)] = f'r{a}'
for a in range(15, 180, 30):
    line_bisect(f'r{a}', f'P{a - 15}', 'O', f'P{a + 15}')
    RAYS[float(a)] = f'r{a}'

step('Halve the angles between the lines at 0° and 15°, and at 15° and 30°: two more lines through O, at 7.5° and 22.5°.')
meet('P15', 'c', 'r15', dirdeg(15))
line_bisect('r7h', 'P0', 'O', 'P15')
line_bisect('r22h', 'P15', 'O', 'P30')
RAYS[7.5] = 'r7h'
RAYS[22.5] = 'r22h'
line_perp('r97h', 'O', 'r7h')
RAYS[97.5] = 'r97h'
line_perp('r112h', 'O', 'r22h')
RAYS[112.5] = 'r112h'
meet('P165', 'c', 'r165', dirdeg(165))
line_bisect('r172h', 'P165', 'O', 'P180')
RAYS[172.5] = 'r172h'

# Samira Mian's star lines (set A): the inner circle from one chord.
step('Mark where the 75° line cuts the circle and join that point to the point on the left of the horizontal. Where this chord crosses the vertical, draw a circle about O: Samira Mian’s inner circle.', 'compass', ['P180'])
meet('P75', 'c', 'r75', dirdeg(75))
line_through('ch', 'P180', 'P75')
meet('T', 'ch', 'v', crossings('ch', 'v')[0])
circle_through('ci', 'O', 'T')

step('Mark where the inner circle meets the lines at 0°, 30°, 60° and so on, and join each of these points to the one 150° round. The twelve lines make the twelve-pointed star (set A).')
for a in range(0, 360, 30):
    meet(f'Q{a}', 'ci', RAYS[float(a % 180)], tuple(rho * v for v in dirdeg(a)))
for k in range(12):
    a = 30 * k
    line_through(f'A{k}', f'Q{a}', f'Q{(a + 150) % 360}')

# The bigger circle and its twelve-sided figure (set E).
step('Draw circles of the first size about the points at 0° and 30°. They cross outside the first circle on the 15° line: the bigger circle about O passes through that crossing. Through it, rule the line at right angles to the horizontal, and turn it round: the big twelve-sided figure (set E).', 'compass', ['P0', 'P30'])
circle_through('c30', 'P30', 'O')
meet('BIG15', 'cE', 'c30', (2 * c15 * math.cos(math.radians(15)), 2 * c15 * math.sin(math.radians(15))))
circle_through('cb', 'O', 'BIG15')
line_perp('E', 'BIG15', 'h')
repeat('Es', ['E'], 'rot12')


def crossing_of(*names):
    """The crossing of two named families nearest a target, as a point."""
    raise NotImplementedError


def C(names, p, normal, turns, label, text, mirror=False):
    X = pt_at(p, 'X')
    line_perp(label, X, ray(normal))
    repeat(f'{label}s', [label], f'rot{turns}')
    if mirror:
        q = pt_at((p[0], -p[1]), 'X')
        line_perp(f'{label}w', q, ray(-normal))
        repeat(f'{label}ws', [f'{label}w'], f'rot{turns}')


SETS = json.load(open(os.path.join(os.path.dirname(__file__), 'sets.json')))
for s in SETS:
    step(s['text'], highlight=s.get('highlight'))
    C(None, tuple(s['through']), s['normal'], s['turns'], s['label'], s['text'], s.get('mirror', False))

# Ink: every stretch, named by the crossings at its ends.
segs = json.load(open(ink_path))
step('Mark the corners of the pattern: every point where the pattern turns or ends.', 'fade')
names = {}
for a, b in segs:
    for z in (tuple(a), tuple(b)):
        if z not in names:
            names[z] = pt_at(z, 'M')
paths = [{'through': [names[tuple(a)], names[tuple(b)]]} for a, b in segs]
step('The tile is the square inside the frame.', 'fade')
F = SETS_FRAME = [s for s in SETS if s['label'] == 'F'][0]['d']
corners = [pt_at((sx * F, sy * F), 'K') for sx, sy in ((1, 1), (-1, 1), (-1, -1), (1, -1))]
put('tile', 'polygon', None, {'polygon': corners})

tut = {
    'format': 0, 'id': 'bou-inania-rosette', 'title': 'Bou Inania rosette', 'fold': 4,
    'style': 'Marinid zellige (Fès)', 'level': 'advanced',
    'credits': [
        {'source': 'Twelvefold Islamic Geometric Rosette (online tutorial)', 'creator': 'Samira Mian',
         'url': 'https://www.samiramian.uk/twelvefoldrosette',
         'note': 'The rosette at the centre (inner circle from one chord, star lines joining its points 150° apart) follows her construction.',
         'steps': [5, 6]},
        {'source': 'Drawing of the Bou Inania pattern', 'creator': '@aslam.geometricpatterns',
         'url': 'https://www.instagram.com/aslam.geometricpatterns/',
         'note': 'Every line beyond the rosette was read from this drawing; the construction through crossings is our own reconstruction.'},
        {'source': 'Zellige of the Bou Inania madrasa, Fès (photograph, Wikimedia Commons)',
         'url': 'https://commons.wikimedia.org/wiki/File:Bou_inania_DSCF2978.jpg'},
    ],
    'given': {'O': 'The centre of the rosette.', 'A': 'Any point to the right of O. OA is the radius of the first circle.'},
    'steps': steps,
    'ink': {'text': 'Ink the twelve-pointed star and its petals, the ring of small stars and pentagons, the ring round the shields, and the bands and corner stars out to the frame.', 'paths': paths},
    'pattern': {'cell': 'tile', 'text': 'Repeat the square edge to edge: neighbouring tiles share the frame band, and the corner pieces of four tiles meet in an eight-pointed star.', 'palette': 'Fès tile', 'colors': {}},
    'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
}
json.dump(tut, open(out, 'w'), ensure_ascii=False)
print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')
