#!/usr/bin/env python3
"""Finds the translations of a Tiling Search drawing (batch T4, 27 October
2026): for every two pieces of the same shape and turn, the vector from one
to the other; the vectors shared by the most pairs are the lattice. Also
lists the edge directions, to find the turn that puts them at multiples of
18° (or 22.5°).

Usage: lattice_t4.py <pieces.json> [min corners] [fill r,g,b to skip ...]
"""
import collections
import json
import math
import sys


def sig(p):
    """Shape and turn: the corners about the centre, sorted, rounded."""
    cx = sum(q[0] for q in p['poly']) / len(p['poly'])
    cy = sum(q[1] for q in p['poly']) / len(p['poly'])
    return (len(p['poly']), round(p['area'] / 4),
            tuple(sorted((round(q[0] - cx), round(q[1] - cy)) for q in p['poly']))), (cx, cy)


def main():
    ps = json.load(open(sys.argv[1]))
    mink = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    skip = [tuple(float(v) for v in s.split(',')) for s in sys.argv[3:]]
    ps = [p for p in ps if len(p['poly']) >= mink
          and not any(max(abs(a - b) for a, b in zip(p['fill'], f)) < 0.02 for f in skip)]
    groups = collections.defaultdict(list)
    for p in ps:
        s, c = sig(p)
        groups[s].append(c)
    vec = collections.Counter()
    for cs in groups.values():
        for a in cs:
            for b in cs:
                if b is a:
                    continue
                v = (round(b[0] - a[0], 0), round(b[1] - a[1], 0))
                if v[1] > 0 or (v[1] == 0 and v[0] > 0):
                    vec[v] += 1
    print('pieces', len(ps), 'shapes', len(groups))
    for v, n in vec.most_common(12):
        print('  ', v, n, round(math.hypot(*v), 2), round(math.degrees(math.atan2(v[1], v[0])), 2))
    dirs = collections.Counter()
    for p in ps:
        Q = p['poly']
        for i in range(len(Q)):
            a, b = Q[i], Q[(i + 1) % len(Q)]
            if math.dist(a, b) > 3:
                dirs[round(math.degrees(math.atan2(-(b[1] - a[1]), b[0] - a[0])) % 180, 1)] += 1
    print('edge directions', sorted(dirs.most_common(24)))


if __name__ == '__main__':
    main()
