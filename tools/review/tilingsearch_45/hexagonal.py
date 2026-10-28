"""Read a source network against an exact convex-cell construction.

PDF rounding can tilt a source edge that coincides with a cell side. Clipping
that noisy edge first invents an endpoint halfway along the side. Register
each edge with its constructed line before clipping, then resolve endpoints
at exact crossings. This is research registration, not tutorial geometry.
Existing square readers and their defaults remain untouched.
"""
import math
import os
import sys

import common as cm
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'alhambra_wichmann'))
from gen_reyes_dodecagram import clip_poly


def project(p, line):
    q, d = cm.el[line][1]
    t = (p[0]-q[0])*d[0] + (p[1]-q[1])*d[1]
    return q[0]+t*d[0], q[1]+t*d[1]


def network(polygons, cell, tolerance=.003):
    segments = set()
    for polygon in polygons:
        for i, a in enumerate(polygon):
            b = polygon[(i+1) % len(polygon)]
            if not clip_poly([(a, b)], cell):
                continue
            candidates = []
            for name in cm.lines():
                error = max(math.dist(p, project(p, name)) for p in (a, b))
                if error < tolerance:
                    candidates.append((error, name))
            assert candidates, ('source edge on no constructed line', a, b)
            name = min(candidates)[1]
            for p, q in clip_poly([(project(a, name), project(b, name))], cell):
                pp, qq = cm.snap(p, tolerance), cm.snap(q, tolerance)
                assert pp and qq, ('corner off construction', p, q)
                if math.dist(pp, qq) > 1e-6:
                    segments.add(tuple(sorted((tuple(round(v, 9) for v in pp),
                                               tuple(round(v, 9) for v in qq)))))
    return sorted(segments)
