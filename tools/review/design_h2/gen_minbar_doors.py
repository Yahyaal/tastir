#!/usr/bin/env python3
"""Builds Design H2, the pair of minbar doors from Cairo in the Metropolitan
Museum (91.1.2064, about 1325–30), read from the Met's photo (see README.md).

The rosette is Samira Mian's first twelve-fold rosette (her inner circle from
one chord, the star lines joining its points 150° apart), on her hexagonal
tile. The doors ink it differently: a small twelve-pointed star ringed by
kites, shields that run out along the 15° lines to meet the lines touching the
circle at its twelve points, and a triangle between every three rosettes.

Units: OA = 1, A halfway to the next rosette; the tile is the hexagon whose
sides touch the circle at 0°, 60°, 120° and so on.

Usage: gen_minbar_doors.py tutorials/<id>.json
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'bou_inania'))
import gen_design_e as g  # noqa: E402

from gen_design_e import (circle_through, dirdeg, el, ensure_point, line_bisect,  # noqa: E402
                          line_perp, line_through, meet, named_at, put, step, steps)

S3 = math.sqrt(3)
RI = math.tan(math.radians(37.5))            # the inner circle
R2 = RI * math.cos(math.radians(75))         # the star lines' distance from O


def build():
    g.given()
    step('Rule a horizontal line and draw a circle on it about the centre O, through A. Keep this opening for the next steps.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    line_through('h', 'O', 'A')

    step('Put the compass point where the circle crosses the line on the right, and draw a circle through O; do the same on the left.', 'compass', ['c', 'h'])
    meet('P0', 'c', 'h', (1, 0))
    meet('P180', 'c', 'h', (-1, 0))
    circle_through('cE', 'P0', 'O')
    circle_through('cW', 'P180', 'O')

    step('Rule the vertical through O, at right angles to the horizontal, and draw the same circle about its top and bottom points.', 'compass')
    line_perp('v', 'O', 'h')
    meet('P90', 'c', 'v', (0, 1))
    meet('P270', 'c', 'v', (0, -1))
    circle_through('cN', 'P90', 'O')
    circle_through('cS', 'P270', 'O')

    step('The four new circles cut the first one at eight more points, so it is divided into twelve. Rule the lines joining opposite points through O.')
    for a, other in ((60, 'cE'), (300, 'cE'), (120, 'cW'), (240, 'cW'), (30, 'cN'), (150, 'cN'), (210, 'cS'), (330, 'cS')):
        meet(f'P{a}', 'c', other, dirdeg(a))
    rays = {0: 'h', 90: 'v'}
    for a in (30, 60, 120, 150):
        line_through(f'r{a}', f'P{a}', f'P{a + 180}')
        rays[a] = f'r{a}'

    step('Halve each of the twelve angles at O with a line, so there is a line through O every 15°.')
    for a in (15, 45, 75):
        line_bisect(f'r{a}', f'P{a - 15}', 'O', f'P{a + 15}')
        rays[a] = f'r{a}'
    for a in (105, 135, 165):
        line_perp(f'r{a}', 'O', rays[a - 90])
        rays[a] = f'r{a}'

    step('Mark where the 75° line cuts the circle, and join that point to the point on the left of the horizontal. Where this line crosses the vertical, draw a circle about O: it is the inner circle the rosette is built on.', 'compass')
    meet('P75', 'c', 'r75', dirdeg(75))
    line_through('ch', 'P75', 'P180')
    meet('T', 'ch', 'v', (0, RI))
    circle_through('ci', 'O', 'T')

    step('Mark the twelve points where the inner circle meets the lines at 15°, 45°, 75° and so on. Each will be the tip of a small kite.')
    for k in range(12):
        a = 15 + 30 * k
        meet(f'Q{a}', 'ci', rays[a % 180], (RI * math.cos(math.radians(a)), RI * math.sin(math.radians(a))))

    step('Join each of these points to the one five places round, 150° away. The twelve lines make a twelve-pointed star in the middle and the sides of the kites and shields round it.')
    for k in range(12):
        a = 15 + 30 * k
        line_through(f's{k}', f'Q{a}', f'Q{(a + 150) % 360}')

    step('At each of the twelve points on the first circle, rule the line at right angles to its line through O: these lines touch the circle. The six at 0°, 60°, 120° and so on make the hexagonal tile; the six between them close the shields that point between two neighbours.')
    for k in range(12):
        a = 30 * k
        line_perp(f't{a}', f'P{a}', rays[a % 180])
    for i, a in enumerate((30, 90, 150, 210, 270, 330)):
        meet(f'K{i + 1}', f't{(a - 30) % 360}', f't{(a + 30) % 360}', (2 / S3 * math.cos(math.radians(a)), 2 / S3 * math.sin(math.radians(a))))


# ---- the ink, read from the photo ------------------------------------------

def pt(r, deg):
    t = math.radians(deg)
    return (r * math.cos(t), r * math.sin(t))


def d6(p):
    out = []
    for k in range(6):
        t = math.radians(60 * k)
        for m in (1, -1):
            x, y = p[0], m * p[1]
            out.append((x * math.cos(t) - y * math.sin(t), x * math.sin(t) + y * math.cos(t)))
    return out


def ink_segments():
    """One 30° wedge (0° to 30° about O), then its twelve copies."""
    notch = pt(R2 * math.sqrt(2), 15)              # between two points of the star
    sp0, sp30 = pt(2 * R2, 0), pt(2 * R2, 30)      # points of the star
    q = pt(RI, 15)                                 # a kite's outer tip
    b = pt(1 / math.cos(math.radians(15)), 15)     # where the touching lines at 0° and 30° meet
    W = [(notch, sp0), (notch, sp30), (sp0, q), (sp30, q),
         (q, b),                                   # two shields meet along the 15° line
         (b, (1.0, 0.0)),                          # the flat end of a shield, on the tile's side
         (b, pt(1, 30))]                           # the flat end of the next shield
    out = set()
    for p, r in W:
        for a, c in zip(d6(p), d6(r)):
            out.add(tuple(sorted((tuple(round(v, 9) for v in a), tuple(round(v, 9) for v in c)))))
    return sorted(out)


def main():
    out = sys.argv[1]
    build()
    segs = ink_segments()
    step('Mark the corners of the pattern: every point where it turns or ends.', 'fade')
    names = {}
    for a, b in segs:
        for z in (a, b):
            if z not in names:
                names[z] = named_at(z, 1e-7) or ensure_point(z, 'M')
    paths = [{'through': [names[a], names[b]]} for a, b in segs]
    step('The tile is the hexagon whose sides touch the circle at 0°, 60°, 120° and so on.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4', 'K5', 'K6']})
    tut = {
        'format': 0, 'id': 'minbar-doors-cairo', 'title': 'Minbar doors from Cairo (Metropolitan Museum)', 'fold': 12,
        'style': 'Mamluk', 'level': 'intermediate',
        'credits': [
            {'source': 'Twelvefold Islamic Geometric Rosette (online tutorial)', 'creator': 'Samira Mian',
             'url': 'https://www.samiramian.uk/twelvefoldrosette',
             'note': 'The construction of the rosette (the inner circle from one chord and the star lines joining its points 150° apart) and the hexagonal tile follow her tutorial; the wording is ours.',
             'steps': list(range(1, 9))},
            {'source': 'Pair of Minbar Doors, Egypt, probably Cairo, ca. 1325–30 (The Metropolitan Museum of Art, 91.1.2064, public domain photo)',
             'url': 'https://www.metmuseum.org/art/collection/search/444812',
             'note': 'The design was read from the museum’s photo: the inlays were measured and every band traced back to a line of the construction.'}],
        'given': {'O': 'The centre of a rosette.', 'A': 'Halfway from O to the next rosette. OA is the radius of the rosette’s circle.'},
        'steps': steps,
        'ink': {'text': 'Ink the small twelve-pointed star and the kites round it, then each shield: from its point along the star lines to the kites’ tips, out along the 15° lines, and across its flat end on a line that touches the circle.', 'paths': paths},
        'pattern': {'cell': 'tile', 'text': 'Repeat the hexagon side to side: the shields meet back to back on the tile’s sides, and a triangle opens between every three rosettes. On the doors a small five-pointed star is inlaid at each corner of the triangles.', 'palette': 'Fès tile', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    json.dump(tut, open(out, 'w'), ensure_ascii=False)
    print(len(steps), 'steps,', len(el), 'elements,', len(paths), 'ink stretches')


if __name__ == '__main__':
    main()
