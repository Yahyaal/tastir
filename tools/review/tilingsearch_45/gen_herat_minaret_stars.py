#!/usr/bin/env python3
"""Builds the stars and crosses of the minaret of the Husayn Baykara
madrasa, Herat, drawn by Brian Wichmann in Tiling Search (data8/PG223), as a
variant of the Sala de la Barca stars (alhambra-barca-stars, CM052).

Read from the PDF (plain tiles, stars 229.7 pt apart on the axes). The
corners do not fit the grid a + b·√2/2 in units of half the star spacing
(errors up to 0.009), but fit it to 0.002 in units of the shortest edge e,
with the star spacing 2(1 + 2√2)e; so the star's point is at
(1 + √2)e = 1/(3 − √2) of half the spacing, the large star of the Comares
bath and the Sala de la Barca. Turned by 45° into the Barca frame, every
edge lies on a line of the Barca construction (steps 1 to 10): the design is
the Barca stars with the forks and the corner square left uninked, so that
they make one forty-sided piece. The tutorial copies those steps and inks
along their lines.

(A shorter construction for PG223 on its own: the line from K2 through
(1 + √2/2, 0) crosses the vertical at the star's top point.)

Usage: pnpm review alhambra-barca-stars   (for the Barca construction's geometry)
       gen_herat_minaret_stars.py <PG223-pieces.json> tutorials/herat-minaret-stars.json
       pnpm review herat-minaret-stars
       gen_herat_minaret_stars.py finish docs/review/herat-minaret-stars/dump.json tutorials/herat-minaret-stars.json
"""
import copy
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402

R2 = math.sqrt(2)
H = R2 / 2
ORIGIN, PERIOD = (297.5, 375.8), 229.7
BARCA = 'tutorials/alhambra-barca-stars.json'
BARCA_DUMP = 'docs/review/alhambra-barca-stars/dump.json'
STEPS = 10   # Barca's construction steps used (step 11 marks its ink corners; 12 is the tile)


def load_barca():
    d = json.load(open(BARCA_DUMP))
    for s in d['steps']:
        if s['id'] > STEPS:
            break
        for e in s['elements']:
            if e['name'] in cm.el:
                continue
            if e['kind'] == 'point':
                cm.el[e['name']] = ('point', (e['x'], e['y']))
            elif e['kind'] == 'line':
                n = math.hypot(e['dx'], e['dy'])
                cm.el[e['name']] = ('line', ((e['x'], e['y']), (e['dx'] / n, e['dy'] / n)))
            elif e['kind'] == 'circle':
                cm.el[e['name']] = ('circle', ((e['x'], e['y']), e['r']))
    t = json.load(open(BARCA))
    steps = copy.deepcopy(t['steps'][:STEPS])
    tile = copy.deepcopy(t['steps'][-1])
    tile['id'] = STEPS + 1
    return steps + [tile]


def clip_diamond(p, q):
    """The part of segment pq inside Barca's tile JKLN, |x| + |y| <= √2."""
    t0, t1 = 0.0, 1.0
    for a, b in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        fp = a * p[0] + b * p[1] - R2
        fq = a * q[0] + b * q[1] - R2
        if fp > 1e-12 and fq > 1e-12:
            return None
        if fp > 1e-12:
            t0 = max(t0, fp / (fp - fq))
        elif fq > 1e-12:
            t1 = min(t1, fp / (fp - fq))
    if t1 - t0 < 1e-6:
        return None
    return ((p[0] + t0 * (q[0] - p[0]), p[1] + t0 * (q[1] - p[1])),
            (p[0] + t1 * (q[0] - p[0]), p[1] + t1 * (q[1] - p[1])))


def network(pieces):
    polys = cm.frame_pieces(pieces, ORIGIN, PERIOD, 0)
    polys = [[((x - y) * H, (x + y) * H) for x, y in P] for P in polys]
    segs = set()
    for Q in polys:
        if max(abs(v) for q in Q for v in q) > 3:
            continue
        for i in range(len(Q)):
            r = clip_diamond(Q[i], Q[(i + 1) % len(Q)])
            if not r:
                continue
            sa, sb = cm.snap(r[0]), cm.snap(r[1])
            assert sa and sb, ('corner off the construction', r)
            if math.dist(sa, sb) > 1e-6:
                segs.add(tuple(sorted((tuple(round(v, 9) for v in sa), tuple(round(v, 9) for v in sb)))))
    return sorted(segs)


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    steps = load_barca()
    paths = cm.along_ink(network(pieces))
    tut = {
        'format': 0, 'id': 'herat-minaret-stars',
        'title': 'Stars and crosses of the Husayn Baykara minaret, Herat',
        'short': 'Herat minaret stars', 'subtitle': 'Husayn Baykara madrasa, Herat', 'fold': 4, 'star': 8,
        'style': 'Timurid', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s PG223 drawing, its corners snapped to exact '
                    'values in units of its shortest edge. Every line is a line of the Sala de la Barca stars, so the '
                    'construction is theirs: the same large star, with the forks and the small square between four '
                    'stars left as one large piece. The drawing gives no steps.',
            'changes': 'Wichmann draws the design turned by 45° from the Barca frame; it is turned here so that both '
                       'share their steps. The compass steps, their order and the named points are ours. The '
                       'comparison with the drawing checks the finished lines, not how the design was first laid out. '
                       'No photo of the minaret was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data8/PG223: Minaret, Husayn Baykara Madrasah, Herat', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data8/PG223.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing. He cites S. J. Abas and A. S. Salman, Symmetries of '
                     'Islamic Geometrical Patterns (World Scientific, 1995), page 223, for the minaret of the Husayn '
                     'Baykara madrasa in Herat. The construction is ours.'}],
        'given': {'O': 'The centre of a large star.', 'A': 'Halfway from O to the next large star along the axis.'},
        'steps': steps,
        'ink': {'text': 'Ink the star at O and the lines that carry its sides on. They close the crosses between the '
                        'stars and the large piece at each corner of the cell.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. Large stars sit on the grid, a cross between '
                            'each two, and a large piece where four cells touch.',
                    'palette': 'Timurid tile', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.932): ('star', 'a'), (12, 0.466): ('cross', 'b'), (40, 2.136): ('ground', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
