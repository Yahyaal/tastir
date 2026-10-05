#!/usr/bin/env python3
"""Builds the tutorial of Samira Mian's stellated twelve-fold rosettes
(activity 8 of her twelvefold rosette tutorial), from her video's steps:

  the rosette's circle and its square cell; the circle divided into twelve;
  the twelve lines joining points 60° apart (two hexagons); the circle
  through their crossings and, from one chord, the inner circle; the star
  lines joining its points 150° apart; then at each corner of the cell, four hexagons and an
  octagon, found with a small compass.

Units: OA = 1 (the rosette's circle); the tile is the square cell, side 2.
The ink is chosen from her screenshots (see choose_ink.py).

Usage: gen_mian_stellated.py ink.json tutorials/<id>.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (P, circle_from, circle_through, crossings, dirdeg, el,  # noqa: E402
                          ensure_point, line_bisect, line_par, line_perp,
                          line_through, meet, named_at, put, repeat, step, steps)

S3 = math.sqrt(3)


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A: the circle of one rosette.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Rule the vertical through O. At the four points where the circle meets the two lines, rule lines at right angles to them: the square cell the rosette sits in. Its sides are where this rosette meets its neighbours.', highlight=['c', 'h'])
    line_perp('v', 'O', 'h')
    meet('P0', 'c', 'h', (1, 0))
    meet('P180', 'c', 'h', (-1, 0))
    meet('P90', 'c', 'v', (0, 1))
    meet('P270', 'c', 'v', (0, -1))
    line_perp('gx', 'P0', 'h')
    line_perp('gxw', 'P180', 'h')
    line_perp('gy', 'P90', 'v')
    line_perp('gys', 'P270', 'v')
    meet('K', 'gx', 'gy', (1, 1))
    meet('K2', 'gxw', 'gy', (-1, 1))
    meet('K3', 'gxw', 'gys', (-1, -1))
    meet('K4', 'gx', 'gys', (1, -1))
    line_through('r45', 'O', 'K')

    step('Keep the compass open to the radius. Put its point on each of the four points on the circle and draw a circle through O: they cut the circle at eight more points, so it is divided into twelve.', 'compass', ['P0', 'P90', 'P180', 'P270'])
    circle_through('cE', 'P0', 'O')
    circle_through('cW', 'P180', 'O')
    circle_through('cN', 'P90', 'O')
    circle_through('cS', 'P270', 'O')
    for a, other in ((60, 'cE'), (300, 'cE'), (120, 'cW'), (240, 'cW'), (30, 'cN'), (150, 'cN'), (210, 'cS'), (330, 'cS')):
        meet(f'P{a}', 'c', other, dirdeg(a))

    step('Join each of the twelve points to the one 60° round: two hexagons. Their twelve sides, carried on as full lines, cross the cell and run into the neighbouring cells.')
    for k in range(12):
        line_through(f'H{k}', f'P{30 * k}', f'P{(30 * k + 60) % 360}')

    rays = {0: 'h', 90: 'v', 45: 'r45'}
    step('Rule the lines through O and opposite points, and halve the angles between them: a line through O every 15°.')
    for a in (30, 60, 120, 150):
        line_through(f'r{a}', f'P{a}', f'P{a + 180}')
        rays[a] = f'r{a}'
    for a in (15, 75, 105, 165):
        line_bisect(f'r{a}', f'P{a - 15}', 'O', f'P{a + 15}')
        rays[a] = f'r{a}'
    line_perp('r135', 'O', 'r45')
    rays[135] = 'r135'

    step('The hexagon sides cross each other on the 15°, 45°, 75°… lines. Draw the circle about O through one of these crossings; it touches all twelve sides.', 'compass')
    Ro = (S3 / 2) / math.cos(math.radians(15))
    meet('X45', 'H0', 'H1', (Ro * math.cos(math.pi / 4), Ro * math.sin(math.pi / 4)))
    circle_through('co', 'O', 'X45')

    step('Mark where this circle meets the vertical and the 195° line, and join the two marks. Where the chord crosses the horizontal, draw a circle about O: the inner circle the star is built on.', 'compass')
    meet('U90', 'co', 'v', (0, Ro))
    meet('U195', 'co', 'r15', (Ro * math.cos(math.radians(195)), Ro * math.sin(math.radians(195))))
    line_through('chord', 'U90', 'U195')
    ri = Ro * math.tan(math.radians(37.5))
    meet('T', 'chord', 'h', (-ri, 0))
    circle_through('ci', 'O', 'T')

    step('Mark where the inner circle meets the lines at 0°, 30°, 60° and so on, and join each mark to the one 150° round: twelve lines, the twelve-pointed star.')
    for a in range(0, 360, 30):
        meet(f'Q{a}', 'ci', rays[a % 180], (ri * math.cos(math.radians(a)), ri * math.sin(math.radians(a))))
    for k in range(12):
        line_through(f'A{k}', f'Q{30 * k}', f'Q{(30 * k + 150) % 360}')

    step('Four small hexagons sit round each corner of the cell. Where the 60° line from O crosses the top of the cell is the centre of one. Open the compass to where a hexagon side crosses the top of the cell, and draw the circle: it marks the hexagon’s inner corner on the top of the cell. Do the same on the right side of the cell with the 30° line.', 'compass', ['K'])
    meet('Hc', 'r60', 'gy', (1 / S3, 1))
    meet('Ho', 'H0', 'gy', ((S3 / 2 - 0.5) / (S3 / 2), 1))
    circle_through('ch', 'Hc', 'Ho')
    meet('Hi', 'ch', 'gy', (S3 - 1, 1))
    meet('Hc2', 'r30', 'gx', (1, 1 / S3))
    meet('Ho2', 'H1', 'gx', (1, (S3 / 2 - 0.5) / (S3 / 2)))
    circle_through('ch2', 'Hc2', 'Ho2')
    meet('Hi2', 'ch2', 'gx', (1, S3 - 1))

    step('Through each inner corner, rule the hexagon’s two missing sides and carry them on to the diagonal of the cell: at 60° and 120° through the corner on the top, at 30° and 150° through the corner on the side. Where they meet the diagonal, they close the octagon at the corner.')
    line_par('G1', 'Hi', 'r60')
    line_par('G2', 'Hi', 'r120')
    line_par('G3', 'Hi2', 'r30')
    line_par('G4', 'Hi2', 'r150')

    step('Copy the corner’s hexagons and octagon to the other three corners of the cell, turning them about O.')
    repeat('Gr', ['G1', 'G2', 'G3', 'G4'], 'rot4')

def main():
    ink_path, out = sys.argv[1], sys.argv[2]
    build()
    segs = json.load(open(ink_path))
    step('Mark the corners of the pattern: every point where it turns or ends.', 'fade')
    names = {}
    for a, b in segs:
        for z in (tuple(a), tuple(b)):
            if z not in names:
                n = named_at(z, 1e-7)
                names[z] = n or ensure_point(z, 'M')
    paths = [{'through': [names[tuple(a)], names[tuple(b)]]} for a, b in segs]
    step('The tile is the square cell.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'mian-stellated-rosettes', 'title': 'Stellated twelve-fold rosettes (Samira Mian)', 'fold': 4,
        'style': 'Mamluk', 'level': 'advanced',
        'credits': [{'source': 'Twelvefold Islamic Geometric Rosette, activity 8: stellated rosettes in a square arrangement (video)',
                     'creator': 'Samira Mian', 'url': 'https://www.samiramian.uk/twelvefoldrosette',
                     'note': 'The construction follows her video step by step; the wording is ours.',
                     'steps': list(range(1, len(steps) + 1))}],
        'given': {'O': 'The centre of a rosette.', 'A': 'Any point to the right of O. OA is the radius of the rosette’s circle.'},
        'steps': steps,
        'ink': {'text': 'Ink the twelve-pointed star and its petals, the stellated points where the hexagon sides cross, and the hexagons and octagons at the corners.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: rosettes meet on the sides, and an octagon ringed by four hexagons opens at every corner.', 'palette': 'Fès tile', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()
