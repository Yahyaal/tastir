#!/usr/bin/env python3
import json, math, sys, os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g
from gen_design_e import (
    P, circle_from, circle_through, crossings, dirdeg, el,
    ensure_point, line_bisect, line_par, line_perp,
    line_through, meet, named_at, put, repeat, step, steps
)

S3 = math.sqrt(3)

def build_hex():
    g.el.clear()
    g.steps.clear()
    g.given()
    
    # Step 1: Circle and horizontal
    step('Rule a horizontal line through O and A and draw a circle about O through A: the circle of one rosette.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    # Step 2: Vertical and four points
    step('Rule the vertical through O at right angles to the horizontal, marking where the circle crosses the two lines.', 'ruler', highlight=['c', 'h'])
    line_perp('v', 'O', 'h')
    meet('P0', 'c', 'h', (1, 0))
    meet('P180', 'c', 'h', (-1, 0))
    meet('P90', 'c', 'v', (0, 1))
    meet('P270', 'c', 'v', (0, -1))

    # Step 3: Divide into 12
    step('Keep the compass open to the radius. Put its point on each of the four points on the circle and draw a circle through O: they cut the circle at eight more points, so it is divided into twelve.', 'compass', ['P0', 'P90', 'P180', 'P270'])
    circle_through('cE', 'P0', 'O')
    circle_through('cW', 'P180', 'O')
    circle_through('cN', 'P90', 'O')
    circle_through('cS', 'P270', 'O')
    for a, other in ((60, 'cE'), (300, 'cE'), (120, 'cW'), (240, 'cW'), (30, 'cN'), (150, 'cN'), (210, 'cS'), (330, 'cS')):
        meet(f'P{a}', 'c', other, dirdeg(a))

    # Step 4: Two hexagons
    step('Join each of the twelve points to the one 60° round: two hexagons. Their twelve sides, carried on as full lines, cross the tile and run into neighbouring tiles.')
    for k in range(12):
        line_through(f'H{k}', f'P{30 * k}', f'P{(30 * k + 60) % 360}')

    # Step 5: 15° rays
    rays = {0: 'h', 90: 'v'}
    step('Rule the lines through O and opposite points, and halve the angles between them: a line through O every 15°.')
    for a in (30, 60, 120, 150):
        line_through(f'r{a}', f'P{a}', f'P{a + 180}')
        rays[a] = f'r{a}'
    for a in (15, 45, 75, 105, 135, 165):
        if a == 45:
            # line through bisector of 30 and 60
            line_bisect('r45', 'P30', 'O', 'P60')
        elif a == 135:
            line_bisect('r135', 'P120', 'O', 'P150')
        else:
            line_bisect(f'r{a}', f'P{a - 15}', 'O', f'P{a + 15}')
        rays[a] = f'r{a}'

    # Step 6: Outer proportioning circle
    step('The hexagon sides cross each other on the 15°, 45°, 75°… lines. Draw the circle about O through one of these crossings; it touches all twelve sides.', 'compass')
    Ro = (S3 / 2) / math.cos(math.radians(15))
    meet('X45', 'H0', 'H1', (Ro * math.cos(math.pi / 4), Ro * math.sin(math.pi / 4)))
    circle_through('co', 'O', 'X45')

    # Step 7: Chord and inner circle
    step('Mark where this circle meets the vertical and the 195° line, and join the two marks. Where the chord crosses the horizontal, draw a circle about O: the inner circle the star is built on.', 'compass')
    meet('U90', 'co', 'v', (0, Ro))
    meet('U195', 'co', 'r15', (Ro * math.cos(math.radians(195)), Ro * math.sin(math.radians(195))))
    line_through('chord', 'U90', 'U195')
    ri = Ro * math.tan(math.radians(37.5))
    meet('T', 'chord', 'h', (-ri, 0))
    circle_through('ci', 'O', 'T')

    # Step 8: Star lines
    step('Mark where the inner circle meets the lines at 0°, 30°, 60° and so on, and join each mark to the one 150° round: twelve lines, the twelve-pointed star.')
    for a in range(0, 360, 30):
        meet(f'Q{a}', 'ci', rays[a % 180], (ri * math.cos(math.radians(a)), ri * math.sin(math.radians(a))))
    for k in range(12):
        line_through(f'A{k}', f'Q{30 * k}', f'Q{(30 * k + 150) % 360}')

    # Step 9: Hexagonal Tile
    step('Draw the hexagon whose sides touch the first circle at 0°, 60°, 120° and so on: it is the tile that repeats like honeycomb.', 'ruler')
    line_perp('g0', 'P0', 'h')
    line_perp('g60', 'P60', 'r60')
    line_perp('g120', 'P120', 'r120')
    line_perp('g180', 'P180', 'h')
    line_perp('g240', 'P240', 'r60')
    line_perp('g300', 'P300', 'r120')

    meet('K1', 'g0', 'g60', (1, 1 / S3))
    meet('K2', 'g60', 'g120', (0, 2 / S3))
    meet('K3', 'g120', 'g180', (-1, 1 / S3))
    meet('K4', 'g180', 'g240', (-1, -1 / S3))
    meet('K5', 'g240', 'g300', (0, -2 / S3))
    meet('K6', 'g300', 'g0', (1, -1 / S3))
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4', 'K5', 'K6']})

if __name__ == '__main__':
    build_hex()
    print("Steps count:", len(g.steps))
    print("Elements count:", len(g.el))
