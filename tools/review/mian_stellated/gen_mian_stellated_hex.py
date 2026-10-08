#!/usr/bin/env python3
"""Builds the tutorial of Samira Mian's stellated twelve-fold rosette in a
hexagonal honeycomb arrangement (Activity 9 of her twelvefold rosette series).

The construction follows:
  Steps 1-8: The stellated twelve-fold rosette (circle, 12 divisions, 2 hexagons H0..H11,
             15° rays, outer circle co, inner circle ci from chord, 12 star lines A0..A11).
  Step 9:    The hexagonal tile (sides g0..g300 touching the circle at 0°, 60°..., corners K1..K6, polygon tile).
  Step 10:   Mark the corners of the pattern (crossings where ink turns or ends).

Usage: gen_mian_stellated_hex.py tutorials/mian-stellated-hex.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g
from gen_design_e import (
    P, circle_through, dirdeg, el, ensure_point, line_bisect,
    line_perp, line_through, meet, named_at, put, step, steps
)

S3 = math.sqrt(3)


def build_steps():
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


def compute_analytical_strokes():
    odd_edges = {
        1: ('g0', 'g120'),
        3: ('g60', 'g180'),
        5: ('g120', 'g240'),
        7: ('g180', 'g300'),
        9: ('g240', 'g0'),
        11: ('g300', 'g60')
    }

    strokes = []

    # 1. 24 strokes on Ak:
    for k in range(12):
        ak = f'A{k}'
        p_out1 = g.crossings(ak, f'H{(k - 1) % 12}')[0]
        p_in1  = g.crossings(ak, f'A{(k - 3) % 12}')[0]
        strokes.append((p_out1, p_in1))
        
        p_in2  = g.crossings(ak, f'A{(k + 3) % 12}')[0]
        p_out2 = g.crossings(ak, f'H{(k + 4) % 12}')[0]
        strokes.append((p_in2, p_out2))

    # 2. 24 strokes on Hk:
    for k in range(12):
        hk = f'H{k}'
        p_in1 = g.crossings(hk, f'A{(k + 1) % 12}')[0]
        p_in2 = g.crossings(hk, f'A{(k + 8) % 12}')[0]
        
        if k % 2 == 0:
            p_out1 = g.el[f'P{30 * k}'][1]
            p_out2 = g.el[f'P{(30 * k + 60) % 360}'][1]
        else:
            e1, e2 = odd_edges[k]
            p_out1 = g.crossings(hk, e1)[0]
            p_out2 = g.crossings(hk, e2)[0]
        
        strokes.append((p_out1, p_in1))
        strokes.append((p_in2, p_out2))

    return strokes


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else 'tutorials/mian-stellated-hex.json'
    build_steps()
    strokes = compute_analytical_strokes()

    # Step 10: Name crossings where ink turns or ends
    step('Mark the corners of the pattern: every point where it turns or ends.', 'fade')
    names = {}
    for a, b in strokes:
        for z in (a, b):
            z_tup = (round(z[0], 7), round(z[1], 7))
            if z_tup not in names:
                n = named_at(z, 1e-5)
                names[z_tup] = n or ensure_point(z, 'M')

    paths = [{'through': [names[(round(a[0], 7), round(a[1], 7))],
                          names[(round(b[0], 7), round(b[1], 7))]]}
             for a, b in strokes]

    tut = {
        'format': 0,
        'id': 'mian-stellated-hex',
        'title': 'Stellated twelve-fold rosette, hexagonal tile (Samira Mian)',
        'fold': 12,
        'style': 'Mamluk',
        'level': 'advanced',
        'credits': [
            {
                'source': 'Twelvefold Islamic Geometric Rosette, activity 9: stellated rosettes in a hexagonal arrangement (challenge)',
                'creator': 'Samira Mian',
                'url': 'https://www.samiramian.uk/twelvefoldrosette',
                'note': 'The construction combines her stellated rosette (activity 8) with the honeycomb hexagonal tile of activity 5. The wording is ours.',
                'steps': list(range(1, len(steps) + 1))
            },
            {
                'source': 'Lantern slide of the minbar of the al-Maridani mosque, Cairo (14th century): detail of the wooden panelling (Wikimedia Commons, GDE002950)',
                'url': 'https://commons.wikimedia.org/wiki/File:Ca%C3%AFro._Amir_al-Maridani-moskee_Minbar_Detail_van_het_houten_maaswerk,_GDE002950.jpg',
                'note': 'The same twelvefold stellated rosette motif carved into historic Cairo woodwork.'
            }
        ],
        'given': {
            'O': 'The centre of the rosette.',
            'A': 'Any point to the right of O. OA is the radius of the rosette’s circle.'
        },
        'steps': steps,
        'ink': {
            'text': 'Ink the twelve-pointed star, its surrounding petals and kites, and the hexagon sides that continue across the tile to join neighbouring rosettes.',
            'paths': paths
        },
        'pattern': {
            'cell': 'tile',
            'text': 'Repeat the hexagon side to side like honeycomb: rosettes meet on the sides, and star tips interlace across the hexagonal joints.',
            'palette': 'Fès tile',
            'colors': {}
        },
        'expect': {
            'pieceTypes': 1,
            'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]
        }
    }

    with open(out, 'w', encoding='utf-8') as f:
        json.dump(tut, f, ensure_ascii=False, indent=2)

    print(f'Generated {out}: {len(steps)} steps, {len(el)} elements, {len(paths)} ink paths.')


if __name__ == '__main__':
    main()
