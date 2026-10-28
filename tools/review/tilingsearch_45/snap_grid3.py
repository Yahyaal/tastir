#!/usr/bin/env python3
"""Read 30° drawings on a + b√3/2, without changing snap_grid.py.

Use a small denominator only when the geometry calls for it. The residual
is evidence for a unit choice, not proof of the inferred exact construction.
Usage: snap_grid3.py pieces.json unit ox oy radius [--denominator 2]
"""
import argparse
import json
import math
from fractions import Fraction

H = math.sqrt(3) / 2


def snap1(value, denominator=1, bound=16):
    """Return (error, rational part, coefficient of √3/2)."""
    if denominator < 1 or bound < 0:
        raise ValueError('denominator must be positive and bound nonnegative')
    candidates = []
    for b in range(-bound, bound + 1):
        a = Fraction(round((value - b * H) * denominator), denominator)
        candidates.append((abs(value - float(a) - b * H), a, b))
    return min(candidates, key=lambda c: (round(c[0], 9), abs(c[2]), abs(c[1])))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pieces')
    parser.add_argument('unit', type=float)
    parser.add_argument('ox', type=float)
    parser.add_argument('oy', type=float)
    parser.add_argument('radius', type=float)
    parser.add_argument('--denominator', type=int, default=1)
    args = parser.parse_args()
    if args.unit <= 0:
        parser.error('unit must be positive')
    worst, output = 0, []
    with open(args.pieces) as source:
        pieces = json.load(source)
    for piece in pieces:
        if math.dist(piece['c'], (args.ox, args.oy)) > args.radius:
            continue
        corners = []
        for x, y in piece['poly']:
            sx = snap1((x - args.ox) / args.unit, args.denominator)
            sy = snap1((args.oy - y) / args.unit, args.denominator)
            worst = max(worst, sx[0], sy[0])
            corners.append(((str(sx[1]), sx[2]), (str(sy[1]), sy[2])))
        output.append({'corners': corners, 'area': piece['area'] / args.unit ** 2})
    print(json.dumps({'worst': worst, 'tiles': output}, indent=2))


if __name__ == '__main__':
    main()
