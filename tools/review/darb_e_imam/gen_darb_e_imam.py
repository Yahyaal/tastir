#!/usr/bin/env python3
"""Builds the tutorial of the Darb-e Imam decagram pattern.
Centered on a 10-pointed star with decagon and Girih star lines,
tiling in the historic Persian centered-rectangular cell.
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g
from gen_design_e import (
    P, circle_through, circle_from, dirdeg, el, ensure_point, line_bisect,
    line_perp, line_through, meet, named_at, put, step, steps
)

D = math.pi / 180.0


def build_steps():
    g.el.clear()
    g.steps.clear()
    g.given()

    # Step 1: Circle and horizontal line
    step('Rule a horizontal line through O and A and draw a circle about O through A: the circle of the decagram.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')
    meet('P0', 'c', 'h', (1.0, 0.0))
    meet('P180', 'c', 'h', (-1.0, 0.0))

    # Step 2: Vertical axis
    step('Rule the vertical through O at right angles to the horizontal.', 'ruler', highlight=['c', 'h'])
    line_perp('v', 'O', 'h')
    meet('N', 'c', 'v', (0.0, 1.0))
    meet('S', 'c', 'v', (0.0, -1.0))

    # Step 3: Midpoint of radius
    step('Draw a circle about the left point through the centre; rule the line through where the two circles cross to find the midpoint of the radius.', 'compass', ['P180'])
    circle_through('cW', 'P180', 'O')
    meet('Y1', 'c', 'cW', (-0.5, math.sqrt(3)/2))
    meet('Y2', 'c', 'cW', (-0.5, -math.sqrt(3)/2))
    line_through('m', 'Y1', 'Y2')
    meet('M', 'm', 'h', (-0.5, 0.0))

    # Step 4: Golden section
    step('Put the compass point on the midpoint and open it to the top of the circle. Draw an arc to cut the horizontal line: the distance from the centre is the chord of 36°.', 'compass', ['M'])
    circle_through('cM', 'M', 'N')
    r_cM = math.hypot(0.5, 1.0)
    meet('F', 'cM', 'h', (-0.5 + r_cM, 0.0))

    # Step 5: The ten division points
    step('Step the compass open to OF around the circle to divide it into ten equal parts.', 'compass', ['F'])
    circle_from('cF0', 'P0', 'O', 'F')
    meet('P36', 'c', 'cF0', (math.cos(36*D), math.sin(36*D)))
    meet('P324', 'c', 'cF0', (math.cos(36*D), -math.sin(36*D)))

    circle_from('cF1', 'P36', 'O', 'F')
    meet('P72', 'c', 'cF1', (math.cos(72*D), math.sin(72*D)))

    circle_from('cF2', 'P72', 'O', 'F')
    meet('P108', 'c', 'cF2', (math.cos(108*D), math.sin(108*D)))

    circle_from('cF3', 'P108', 'O', 'F')
    meet('P144', 'c', 'cF3', (math.cos(144*D), math.sin(144*D)))

    circle_from('cF9', 'P324', 'O', 'F')
    meet('P288', 'c', 'cF9', (math.cos(72*D), -math.sin(72*D)))

    circle_from('cF8', 'P288', 'O', 'F')
    meet('P252', 'c', 'cF8', (math.cos(108*D), -math.sin(108*D)))

    circle_from('cF7', 'P252', 'O', 'F')
    meet('P216', 'c', 'cF7', (math.cos(144*D), -math.sin(144*D)))

    # Step 6: The 10 Star lines
    step('Join each of the ten points to the one three places round: ten lines, the ten-pointed star.', 'ruler')
    line_through('s0', 'P0', 'P108')
    line_through('s1', 'P36', 'P144')
    line_through('s2', 'P72', 'P180')
    line_through('s3', 'P108', 'P216')
    line_through('s4', 'P144', 'P252')
    line_through('s5', 'P180', 'P288')
    line_through('s6', 'P216', 'P324')
    line_through('s7', 'P252', 'P0')
    line_through('s8', 'P288', 'P36')
    line_through('s9', 'P324', 'P72')

    # Step 7: Decagon polygon
    step('Join the ten points on the circle in order: the regular decagon.', 'ruler')
    put('decagon', 'polygon', None, {'polygon': ['P0', 'P36', 'P72', 'P108', 'P144', 'P180', 'P216', 'P252', 'P288', 'P324']})

    # Step 8: The Rectangular Tile
    # The rectangle corners are the crossings of the star lines at 54°, 126°, 234°, 306°:
    step('The star lines cross outside the circle to mark four outer corners. Draw the rectangle through them: the tile that repeats.', 'ruler')
    r_tip = 1.90211303259
    meet('C1', 's2', 's8', (r_tip * math.cos(54*D), r_tip * math.sin(54*D)))
    meet('C2', 's0', 's4', (r_tip * math.cos(126*D), r_tip * math.sin(126*D)))
    meet('C3', 's3', 's7', (r_tip * math.cos(234*D), r_tip * math.sin(234*D)))
    meet('C4', 's5', 's9', (r_tip * math.cos(306*D), r_tip * math.sin(306*D)))
    put('tile', 'polygon', None, {'polygon': ['C1', 'C2', 'C3', 'C4']})


def compute_strokes():
    # Let's compute all strokes inside and across the tile:
    # First, the 10 star lines s0..s9:
    # Each line s_k has crossings.
    strokes = []
    # Inks for the 10-pointed star:
    # Inner valleys of the star are crossings of s0..s9 on the 36°*k rays:
    valleys = [
        ('I0', 's8', 's9', (0.618034, 0.0)),
        ('I1', 's0', 's9', (0.618034 * math.cos(36*D), 0.618034 * math.sin(36*D))),
        ('I2', 's0', 's1', (0.618034 * math.cos(72*D), 0.618034 * math.sin(72*D))),
        ('I3', 's1', 's2', (0.618034 * math.cos(108*D), 0.618034 * math.sin(108*D))),
        ('I4', 's2', 's3', (0.618034 * math.cos(144*D), 0.618034 * math.sin(144*D))),
        ('I5', 's3', 's4', (-0.618034, 0.0)),
        ('I6', 's4', 's5', (0.618034 * math.cos(216*D), 0.618034 * math.sin(216*D))),
        ('I7', 's5', 's6', (0.618034 * math.cos(252*D), 0.618034 * math.sin(252*D))),
        ('I8', 's6', 's7', (0.618034 * math.cos(288*D), 0.618034 * math.sin(288*D))),
        ('I9', 's7', 's8', (0.618034 * math.cos(324*D), 0.618034 * math.sin(324*D))),
    ]
    
    # Mid-star crossings at radius 0.72654:
    # At 18°, 54°, 90°, 126°, 162°, 198°, 234°, 270°, 306°, 342°
    r_mid = 0.7265425
    mids = [
        ('M0', 's0', 's8', (r_mid * math.cos(18*D), r_mid * math.sin(18*D))),
        ('M1', 's1', 's9', (r_mid * math.cos(54*D), r_mid * math.sin(54*D))),
        ('M2', 's0', 's2', (0.0, r_mid)),
        ('M3', 's1', 's3', (r_mid * math.cos(126*D), r_mid * math.sin(126*D))),
        ('M4', 's2', 's4', (r_mid * math.cos(162*D), r_mid * math.sin(162*D))),
        ('M5', 's3', 's5', (r_mid * math.cos(198*D), r_mid * math.sin(198*D))),
        ('M6', 's4', 's6', (r_mid * math.cos(234*D), r_mid * math.sin(234*D))),
        ('M7', 's5', 's7', (0.0, -r_mid)),
        ('M8', 's6', 's8', (r_mid * math.cos(306*D), r_mid * math.sin(306*D))),
        ('M9', 's7', 's9', (r_mid * math.cos(342*D), r_mid * math.sin(342*D))),
    ]
    return valleys, mids


def main():
    build_steps()
    valleys, mids = compute_strokes()

    step('Mark the inner crossings of the star.', 'ruler')
    for nm, l1, l2, want in valleys:
        meet(nm, l1, l2, want)
    for nm, l1, l2, want in mids:
        meet(nm, l1, l2, want)

    # Let's create ink paths for:
    # 1. The central 10-pointed star: through M0..M9 and I0..I9:
    # M0 -> I1 -> M1 -> I2 -> M2 -> I3 -> M3 -> I4 -> M4 -> I5 -> M5 -> I6 -> M6 -> I7 -> M7 -> I8 -> M8 -> I9 -> M9 -> I0 -> M0
    # 2. Outer points to circle points P:
    # M0 -> P0, M0 -> P36, M1 -> P36, M1 -> P72, etc.
    # 3. Decagon sides:
    # P0 -> P36 -> P72 -> P108 -> P144 -> P180 -> P216 -> P252 -> P288 -> P324 -> P0
    paths = [
        # Star inner core
        {
            'closed': True,
            'through': [
                'M0', 'I1', 'M1', 'I2', 'M2', 'I3', 'M3', 'I4', 'M4', 'I5',
                'M5', 'I6', 'M6', 'I7', 'M7', 'I8', 'M8', 'I9', 'M9', 'I0'
            ]
        },
        # Kites to circle tips
        {'through': ['P0', 'M0', 'P36']},
        {'through': ['P36', 'M1', 'P72']},
        {'through': ['P72', 'M2', 'P108']},
        {'through': ['P108', 'M3', 'P144']},
        {'through': ['P144', 'M4', 'P180']},
        {'through': ['P180', 'M5', 'P216']},
        {'through': ['P216', 'M6', 'P252']},
        {'through': ['P252', 'M7', 'P288']},
        {'through': ['P288', 'M8', 'P324']},
        {'through': ['P324', 'M9', 'P0']},
        # Decagon outline
        {
            'closed': True,
            'through': ['P0', 'P36', 'P72', 'P108', 'P144', 'P180', 'P216', 'P252', 'P288', 'P324']
        },
        # From circle tips to rectangle corners C1..C4:
        # C1 is at 54°: meet of s2 (P72..P180) and s8 (P288..P36)
        {'through': ['P72', 'C1', 'P36']},
        # C2 is at 126°: meet of s0 (P0..P108) and s4 (P144..P252)
        {'through': ['P108', 'C2', 'P144']},
        # C3 is at 234°: meet of s3 (P108..P216) and s7 (P252..P0)
        {'through': ['P216', 'C3', 'P252']},
        # C4 is at 306°: meet of s5 (P180..P288) and s9 (P324..P72)
        {'through': ['P288', 'C4', 'P324']},
    ]

    tut = {
        'format': 0,
        'id': 'darb-e-imam-decagram',
        'title': 'Darb-e Imam Decagram & Girih Tiling',
        'fold': 10,
        'style': 'Timurid / Persian',
        'level': 'advanced',
        'credits': [
            {
                'source': 'Darb-e Imam shrine portal, Isfahan (1453 CE)',
                'creator': 'Lu & Steinhardt (Science 2007)',
                'url': 'https://doi.org/10.1126/science.1135491',
                'note': 'The classic 10-fold Girih decagram and decagon tiling of the Isfahan shrine portal.'
            }
        ],
        'given': {
            'O': 'The centre of the decagram.',
            'A': 'Any point to the right of O. OA is the radius of the decagram’s circle.'
        },
        'steps': steps,
        'ink': {
            'text': 'Go over the ten-pointed star, the surrounding kites, the decagon, and the star points extending to the rectangular tile corners.',
            'paths': paths
        },
        'pattern': {
            'cell': 'tile',
            'text': 'Repeat the rectangle edge to edge: the decagrams meet at their corners and interlace across the Persian Girih tilework.',
            'palette': 'Isfahan',
            'colors': {
                'star': 'c',
                'hexagon': 'a',
                'bowtie': 'b',
                'kite': 'd',
                'dart': 'b',
                'corner': 'a'
            }
        },
        'expect': {
            'pieceTypes': 6,
            'pieces': [
                {'name': 'hexagon', 'vertices': 6, 'area': 1.6776, 'perCell': 1},
                {'name': 'star', 'vertices': 20, 'area': 1.38757, 'perCell': 1},
                {'name': 'bowtie', 'vertices': 8, 'area': 1.08981, 'perCell': 1},
                {'name': 'corner', 'vertices': 3, 'area': 0.29389, 'perCell': 4},
                {'name': 'kite', 'vertices': 4, 'area': 0.08576, 'perCell': 10},
                {'name': 'dart', 'vertices': 3, 'area': 0.06938, 'perCell': 10}
            ]
        }
    }

    out = 'tutorials/darb-e-imam-decagram.json'
    with open(out, 'w') as f:
        json.dump(tut, f, indent=2)
    print(f"Generated {out}")


if __name__ == '__main__':
    main()
