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

Units: OA = 1, A halfway to the next star; the tile is the square cell.

Usage: gen_arrayanes_squares.py tutorials/<id>.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (crossings, circle_through, el, ensure_point, line_bisect,  # noqa: E402
                          line_par, line_perp, line_through, meet, named_at, put, repeat, step, steps)

sys.path.insert(0, os.path.dirname(__file__))
from gen_bath_stars import clip  # noqa: E402

S2 = math.sqrt(2)
SQ = (3 - S2) / 7
R = SQ * S2


def build():
    g.given()
    step('Rule a horizontal line through O and A and draw a circle about O through A. A star will sit at O and at every point of the grid two radii away; the bands run between them along the grid.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Rule the vertical through O. At the four points where the circle meets the two lines, rule lines at right angles to them: the square cell. Rule its two diagonals through O.', highlight=['c', 'h'])
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

    step('Halve the angle between the vertical and the diagonal through K: the 67.5° line meets the top of the cell at T. Join the top and left points of the circle; that line crosses the other diagonal halfway to K2, at Z. Rule the line from Z through T: it crosses the vertical at U, a little below the top of the cell.', 'ruler', ['P90', 'K'])
    line_bisect('r67', 'P90', 'O', 'K')
    meet('T', 'r67', 'gy', (math.tan(math.pi / 8), 1))
    line_through('f', 'P90', 'P180')
    meet('Z', 'f', 'd135', (-0.5, 0.5))
    line_through('zt', 'Z', 'T')
    meet('U', 'zt', 'v', (0, 1 - SQ))

    step('Draw the circle about the top of the circle, P90, through U. It marks two points on the top of the cell, either side of the vertical. Through them rule lines at right angles to the top.', 'compass', ['P90', 'U'])
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
        a, b = 90 * k, 90 * (k + 1) % 360
        line_through(f'bs{a}', f'B{a}', f'B{b}')

    step('Draw the circle about the corner K through A. It meets the diagonal at Q, the corner of the large square that sits at K. Through Q rule a horizontal and a vertical: two sides of that square, and the edges of the bands.', 'compass', ['K', 'A'])
    circle_through('ck', 'K', 'A')
    meet('Q', 'ck', 'd45', (1 - 1 / S2, 1 - 1 / S2))
    line_par('e1', 'Q', 'h')
    line_par('e2', 'Q', 'v')

    step('Copy the square’s sides to the other three corners of the cell, turning them about O.')
    repeat('cq', ['e1', 'e2'], 'rot4')


def network():
    """The dado's lines in one eighth of the cell (between the horizontal and
    the diagonal), turned and mirrored into the rest."""
    b = 1 - 1 / S2
    star = [(R * math.cos(math.radians(22.5 * k)), R * math.sin(math.radians(22.5 * k))) for k in range(16)]
    inner = SQ / math.cos(math.radians(22.5))
    for k in range(1, 16, 2):
        star[k] = (inner * math.cos(math.radians(22.5 * k)), inner * math.sin(math.radians(22.5 * k)))
    W = [(star[0], star[1]), (star[1], star[2]),            # the star's outline
         (star[2], (b, b)),                                 # the seam along the diagonal
         ((b, b), (1, b))]                                  # the square's side, the band's edge
    out = set()
    for p, q in W:
        for sx in (1, -1):
            for sy in (1, -1):
                for sw in (False, True):
                    f = lambda z: ((z[1], z[0]) if sw else z)
                    a, c = f((sx * p[0], sy * p[1])), f((sx * q[0], sy * q[1]))
                    out.add(tuple(sorted((tuple(round(v, 9) for v in a), tuple(round(v, 9) for v in c)))))
    return sorted(out)


def main():
    out = sys.argv[1]
    build()
    segs = network()
    step('Mark the corners of the pattern: every point where the outline of a piece turns.', 'fade')
    names = {}
    for a, b in segs:
        for z in (a, b):
            k = (round(z[0], 7), round(z[1], 7))
            if k not in names:
                names[k] = named_at(z, 1e-7) or ensure_point(z, 'M')
    paths = [{'through': [names[(round(a[0], 7), round(a[1], 7))], names[(round(b[0], 7), round(b[1], 7))]]} for a, b in segs]
    step('The tile is the square cell.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-arrayanes-squares', 'title': 'Squares and stars of the Patio de los Arrayanes (Alhambra)', 'fold': 4,
        'style': 'Nasrid', 'level': 'beginner',
        'credits': [
            {'source': 'Tiling Search, data8/PG299: Alhambra, Patio de los Arrayanes', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data8/PG299.html',
             'note': 'The design and the star’s size were read from his line drawing; the construction is ours.'},
            {'source': 'Photograph SPA 0111 (zellige dado, Patio de los Arrayanes)', 'creator': 'David Wade', 'url': 'https://patterninislamicart.com/',
             'note': 'The real dado: the squares’ size and the pointed ends of the band tiles were read from it.'}],
        'given': {'O': 'The centre of a star.', 'A': 'Halfway from O to the next star.'},
        'steps': steps,
        'ink': {'text': 'Ink the star at O, the large squares at the corners, and the seams that run along the diagonals from each square’s corner to the star’s point.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the square cell edge to edge: a large square in each gap of the band grid, and a small star where the bands cross.', 'palette': 'Alhambra', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()
