#!/usr/bin/env python3
"""Computes the line sets of the simpler Bou Inania tutorial exactly, each
through a crossing of the sets before it, and writes sets.json for the
generator. The approximate crossings come from 4_candidate_lines.py and the
residual search (owner's drawing, R = 369.6 px)."""
import json, math, itertools, os
c15 = math.cos(math.radians(15)); rho = math.tan(math.radians(37.5))
L = []   # (nx, ny, d, family)
def N(a): return (math.cos(math.radians(a)), math.sin(math.radians(a)))
def add(fam, normals, d):
    for a in normals:
        n = N(a); L.append((n[0], n[1], d, fam))
add('A', [15 + 30*k for k in range(12)], rho*math.cos(math.radians(75)))
add('E', [30*k for k in range(12)], 2*c15*c15)
def through(target, fams=None):
    best = None
    for (a0, a1, c, f), (b0, b1, e, g) in itertools.combinations(L, 2):
        if fams and not ({f, g} <= set(fams)): continue
        det = a0*b1 - a1*b0
        if abs(det) < 1e-9: continue
        p = ((c*b1 - e*a1)/det, (a0*e - b0*c)/det)
        dd = math.dist(p, target)
        if best is None or dd < best[0]: best = (dd, p, f, g)
    assert best[0] < 0.02, (target, best)
    return best
SETS = []
def new_set(label, target, normal, turns, text, fams=None, mirror=False, helper=False):
    dd, p, f, g = through(target, fams) if target is not None else (0, None, None, None)
    n = N(normal); d = p[0]*n[0] + p[1]*n[1]
    if d < 0: normal += 180; n = N(normal); d = -d
    normals = [normal + 360/turns*k for k in range(turns)]
    if mirror: normals += [-normal + 360/turns*k for k in range(turns)]
    add(label, normals, d)
    SETS.append({'label': label, 'through': [p[0], p[1]], 'normal': normal % 180, 'turns': turns, 'mirror': mirror, 'd': d, 'helper': helper, 'text': text, 'from': [f, g]})
    print(f'{label:3s} normal {normal:6.1f} d {d:.6f} through ({p[0]:.4f},{p[1]:.4f}) = {f} x {g}  (moved {dd:.4f})')
new_set('C', (1.263, -1.544), 7.5, 12, 'Where a star line crosses a side of the big figure, rule a line at right angles to the 7.5° line, and its mirror image in the horizontal; turn both round. These 24 lines make the small five-pointed stars.', ['A', 'E'], mirror=True)
# helper tangents at the twelve points of the first circle: through P30, normal 30
L.append((N(30)[0], N(30)[1], 1.0, 'Tg')); SETS.append({'label': 'Tg', 'through': [N(30)[0], N(30)[1]], 'normal': 30.0, 'turns': 12, 'mirror': False, 'd': 1.0, 'helper': True, 'text': 'Through the point of the first circle at 30°, rule the line at right angles to the 30° line: it just touches the circle. Turn it round (helper lines).', 'from': ['P30', None]})
add('Tg', [30*k for k in range(1, 12)], 1.0)
print('T   helper tangents d 1')
new_set('B', (2/math.sqrt(3), 0), 0, 12, 'Where the lines touching the circle at 30° and −30° cross the horizontal, rule a line at right angles to it; turn it round. These lines close the brown pentagons.', ['Tg'])
new_set('G', (1.866, 0.706), 22.5, 8, 'Where a side of the big figure crosses one of the 24 lines, rule a line at right angles to the 22.5° line; turn it round in eighths: the octagon of the corner stars.', ['E', 'C'])
new_set('F', (2.262, -1.221), 0, 4, 'Where an octagon side crosses one of the 24 lines, rule a line at right angles to the horizontal; turn it round in quarters: the frame, and the edge of the tile.', ['C', 'G'])
new_set('D', (1.7178, 0.666), 0, 12, 'Where a star line crosses one of the pentagon lines, rule a line at right angles to the horizontal; turn it round: the inner side of the ring round the shields.', ['A', 'B'])
new_set('K', (1.3246, 0.0), 15, 12, 'Where two of the 24 lines cross on the horizontal, rule a line at right angles to the 15° line; turn it round: the points of the ring round the shields.', ['C'])
new_set('S', (0.2035, 1.866), 0, 12, 'Where a side of the big figure crosses one of the last-but-one set, rule a line at right angles to the horizontal; turn it round. These carry the star lines on into the corners.', ['E', 'D'])
new_set('H', (1.6082, 2.2618), 45, 4, 'Where the frame crosses a pentagon line, rule a line at right angles to the 45° line; turn it round in quarters: the lines across the corners.', ['B', 'F'])
new_set('M', (1.866, -0.256), 15, 12, 'Where a side of the big figure crosses a pentagon line, rule a line at right angles to the 15° line; turn it round.', ['E', 'B'])
new_set('N', (1.2207, 1.2207), 15, 12, 'Where two of the 24 lines cross on the 45° line, rule a line at right angles to the 15° line; turn it round. This is the last set.', ['C'])
json.dump(SETS, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sets.json'), 'w'), ensure_ascii=False, indent=1)
