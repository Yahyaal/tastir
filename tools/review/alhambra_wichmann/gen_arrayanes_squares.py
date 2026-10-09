#!/usr/bin/env python3
"""Builds the squares and stars of the Patio de los Arrayanes (Alhambra):
large squares in white bands, with a small eight-pointed star where the bands
cross. Brian Wichmann draws the design in Tiling Search (data8/PG299); David
Wade's photo of the dado (SPA 0111) shows the real proportions, which differ:
each square is inscribed in the unit circle about its corner of the cell (so
its corner is √2 − 1 from the star, not on the star's point), and each white
band tile ends in a point, its two seams running along the diagonals from the
square's corner to the star's point. The star's size is Wichmann's: half the
side of its square is (3 − √2)/7, found by one line.

The bands run diagonally at ±45° to match the real wall installation.

Units: OA = 1, A halfway to the next star along the axis; the tile is the square cell.

Usage: gen_arrayanes_squares.py tutorials/<id>.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (circle_through, ensure_point, line_bisect,  # noqa: E402
                          line_par, line_perp, line_through, meet, named_at, put, repeat, step, steps)

S2 = math.sqrt(2)
SQ = (3 - S2) / 7
R = SQ * S2


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A. A star will sit at O and at every point two radii away along the diagonals; the bands run between them along the diagonals.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Rule the vertical through O. At the four points where the circle meets the two lines, rule lines at right angles to them. Draw the circle about O through their corners: it meets the horizontal and vertical at the four corners of the square cell. Rule the cell’s four sides and its two diagonals through O.', highlight=['c', 'h'])
    g.cur['textWithoutHelpers'] = 'Rule the vertical through O. Where the circle meets the two lines, rule lines at right angles to them on the left, the right and the top. Draw the circle about O through their corners: it meets the horizontal and vertical at the four corners of the square cell. Rule the cell’s near side and its two diagonals through O.'
    line_perp('v', 'O', 'h')
    meet('P90', 'c', 'v', (0, 1))
    meet('P180', 'c', 'h', (-1, 0))
    meet('P270', 'c', 'v', (0, -1))
    line_perp('gx', 'A', 'h')
    line_perp('gxw', 'P180', 'h')
    line_perp('gy', 'P90', 'v')
    line_perp('gys', 'P270', 'v')
    meet('K', 'gx', 'gy', (1, 1))
    meet('K2', 'gxw', 'gy', (-1, 1))
    meet('K3', 'gxw', 'gys', (-1, -1))
    meet('K4', 'gx', 'gys', (1, -1))
    line_through('d45', 'O', 'K')
    line_through('d135', 'O', 'K2')
    circle_through('cd', 'O', 'K')
    meet('C0', 'cd', 'h', (S2, 0))
    meet('C90', 'cd', 'v', (0, S2))
    meet('C180', 'cd', 'h', (-S2, 0))
    meet('C270', 'cd', 'v', (0, -S2))
    line_through('w1', 'C0', 'C90')
    line_through('w2', 'C90', 'C180')
    line_through('w3', 'C180', 'C270')
    line_through('w4', 'C270', 'C0')

    step('Halve the angle between the vertical and the diagonal through K: the 67.5° line meets the top of the inner square at T. Join the top and left points of the circle; that line crosses the other diagonal at Z. Rule the line from Z through T: it crosses the vertical at U.', 'ruler', ['P90', 'K'])
    line_bisect('r67', 'P90', 'O', 'K')
    meet('T', 'r67', 'gy', (math.tan(math.pi / 8), 1))
    line_through('f', 'P90', 'P180')
    meet('Z', 'f', 'd135', (-0.5, 0.5))
    line_through('zt', 'Z', 'T')
    meet('U', 'zt', 'v', (0, 1 - SQ))

    step('Draw the circle about P90 through U. It marks two points on the top of the inner square, either side of the vertical. Through them rule lines at right angles to the top.', 'compass', ['P90', 'U'])
    circle_through('cu', 'P90', 'U')
    meet('V1', 'cu', 'gy', (SQ, 1))
    meet('V2', 'cu', 'gy', (-SQ, 1))
    line_perp('x1', 'V1', 'gy')
    line_perp('x2', 'V2', 'gy')

    step('Where the right one meets the diagonal is a point of the star. Draw the circle about O through it, mark where it meets the horizontal, the vertical and the diagonals, and join every other mark: the star’s two squares.', 'compass', ['x1', 'd45'])
    meet('B45', 'x1', 'd45', (SQ, SQ))
    circle_through('cb', 'O', 'B45')
    for a, ln in ((0, 'h'), (90, 'v'), (180, 'h'), (270, 'v'), (135, 'd135'), (225, 'd45'), (315, 'd135')):
        meet(f'B{a}', 'cb', ln, (R * math.cos(math.radians(a)), R * math.sin(math.radians(a))))
    line_through('y1', 'B45', 'B135')
    line_through('y2', 'B225', 'B315')
    line_through('y3', 'B45', 'B315')
    line_through('y4', 'B135', 'B225')
    for k in range(4):
        a, b_ang = 90 * k, 90 * (k + 1) % 360
        line_through(f'bs{a}', f'B{a}', f'B{b_ang}')

    step('Draw the circle about the top corner C90 through where circle c meets diagonal d45. It meets the vertical at Q, the corner of the large square that sits at C90. Through Q rule lines parallel to the two diagonals: two sides of that square, and the edges of the bands.', 'compass', ['C90', 'd45'])
    meet('P45', 'c', 'd45', (1 / S2, 1 / S2))
    circle_through('ck', 'C90', 'P45')
    meet('Q', 'ck', 'v', (0, S2 - 1))
    line_par('e1', 'Q', 'd45')
    line_par('e2', 'Q', 'd135')

    step('Copy the square’s sides to the other three corners of the cell, turning them about O.')
    repeat('cq', ['e1', 'e2'], 'rot4')


def network():
    """The dado's lines in one eighth of the cell, turned and mirrored into
    the rest, and rotated 45° to match the monument dado."""
    b = 1 - 1 / S2
    star = [(R * math.cos(math.radians(22.5 * k)), R * math.sin(math.radians(22.5 * k))) for k in range(16)]
    inner = SQ / math.cos(math.radians(22.5))
    for k in range(1, 16, 2):
        star[k] = (inner * math.cos(math.radians(22.5 * k)), inner * math.sin(math.radians(22.5 * k)))
    W = [(star[0], star[1]), (star[1], star[2]),
         (star[2], (b, b)),
         ((b, b), (1, b))]
    old_segs = set()
    for p, q in W:
        for sx in (1, -1):
            for sy in (1, -1):
                for sw in (False, True):
                    f = lambda z: ((z[1], z[0]) if sw else z)
                    a, c = f((sx * p[0], sy * p[1])), f((sx * q[0], sy * q[1]))
                    old_segs.add(tuple(sorted((tuple(round(v, 9) for v in a), tuple(round(v, 9) for v in c)))))

    def rot45(z):
        return ((z[0] - z[1]) / S2, (z[0] + z[1]) / S2)

    segs = set()
    for a, b_pt in old_segs:
        ra = rot45(a)
        rb = rot45(b_pt)
        segs.add(tuple(sorted((tuple(round(v, 9) for v in ra), tuple(round(v, 9) for v in rb)))))
    return sorted(segs)


def main():
    out = sys.argv[1]
    build()
    segs = network()
    step('Mark the corners of the pattern: every point where the outline of a piece turns.', 'fade')
    names = {}
    for a, b_pt in segs:
        for z in (a, b_pt):
            k = (round(z[0], 7), round(z[1], 7))
            if k not in names:
                names[k] = named_at(z, 1e-7) or ensure_point(z, 'M')
    paths = [{'through': [names[(round(a[0], 7), round(a[1], 7))], names[(round(b_pt[0], 7), round(b_pt[1], 7))]]} for a, b_pt in segs]
    step('The tile is the square cell.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['C0', 'C90', 'C180', 'C270']})
    tut = {
        'format': 0, 'id': 'alhambra-arrayanes-squares', 'title': 'Squares and stars of the Patio de los Arrayanes (Alhambra)', 'fold': 4,
        'style': 'Nasrid', 'level': 'beginner',
        'credits': [
            {'source': 'Tiling Search, data8/PG299: Alhambra, Patio de los Arrayanes', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data8/PG299.html',
             'note': 'The design and the star’s size were read from his line drawing; the construction is ours.'},
            {'source': 'Photograph SPA 0111 (zellige dado, Patio de los Arrayanes)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real dado: the squares’ size and the pointed ends of the band tiles were read from it.'}],
        'photos': [
            {
                'file': 'alhambra-arrayanes-dado.jpg',
                'caption': 'The tiled dado of the Patio de los Arrayanes, Alhambra.',
                'creator': 'gema de la fuente',
                'license': 'CC BY-SA 2.0',
                'url': 'https://commons.wikimedia.org/wiki/File:Mosaico,_la_alhambra_(2).jpg'
            }
        ],
        'given': {'O': 'The centre of a star.', 'A': 'Halfway from O to the next star.'},
        'steps': steps,
        'ink': {'text': 'Ink the star at O, the large squares at the corners, and the seams that run along the horizontal and vertical from each square’s corner to the star’s point.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: a large square in each gap of the band grid, and a small star where the bands cross.', 'palette': 'Alhambra', 'colors': {'square': 'c', 'band': 'ground', 'star': 'd'}},
        'expect': {'pieceTypes': 3, 'pieces': [
            {'name': 'square', 'vertices': 4, 'area': 2.0, 'perCell': 1},
            {'name': 'band', 'vertices': 14, 'area': 0.87975, 'perCell': 2},
            {'name': 'star', 'vertices': 16, 'area': 0.2405, 'perCell': 1}
        ]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(g.el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()

