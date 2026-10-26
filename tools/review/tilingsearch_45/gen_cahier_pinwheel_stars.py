#!/usr/bin/env python3
"""Builds the pinwheel of eight-pointed stars from Cahier and Martin, page 36,
drawn by Brian Wichmann in Tiling Search (data15/CM036).

The drawing is plain tiles: stars of two equal squares, a five-sided tile
and a thirteen-sided tile that turns round the points between the stars
(p4, no mirror). OA is the side of a star's square (85.4 pt), so the stars sit
on the lattice spanned by (2, 1) and (1, −2): their rows run at a slope of
one in two to the stars' own sides. Every line is a side of a star at O or at
one of its four nearest neighbours, carried on. The repeating tile is the
square of side √5 with its corners at the pinwheel points (±1.5, ∓0.5),
(±0.5, ±1.5), turned with the lattice. Corners land within 0.002 of OA.

Usage: gen_cahier_pinwheel_stars.py <CM036-pieces.json> tutorials/cahier-pinwheel-stars.json
       pnpm review cahier-pinwheel-stars
       gen_cahier_pinwheel_stars.py finish docs/review/cahier-pinwheel-stars/dump.json tutorials/cahier-pinwheel-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402

H = math.sqrt(2) / 2
S10 = math.sqrt(10)
ORIGIN, PERIOD = (300.4, 373.9), 170.8


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    put('c', 'circle', ((0, 0), 1.0), {'circle': {'centre': 'O', 'through': 'A'}})
    g.line_through('h', 'O', 'A')

    step('Draw a vertical line through O. It crosses the circle at C, above O. '
         'Draw a horizontal line through C.', 'ruler', ['c', 'h'])
    g.line_perp('v', 'O', 'h')
    g.meet('C', 'c', 'v', (0, 1))
    g.line_par('ch', 'C', 'h')

    step('Draw a circle with centre A through O. It crosses the first circle at P and Q, '
         'and the horizontal line at E. Draw a straight line through P and Q.', 'compass', ['A', 'O'])
    g.circle_through('ca', 'A', 'O')
    g.meet('P', 'ca', 'c', (0.5, math.sqrt(3) / 2))
    g.meet('Q', 'ca', 'c', (0.5, -math.sqrt(3) / 2))
    g.meet('E', 'ca', 'h', (2, 0))
    g.line_through('pq', 'P', 'Q')

    step('Turn line PQ round O by 90°, three times. The four lines make a square. '
         'F is its corner above A.', 'ruler', ['pq'])
    g.repeat('cp1', ['pq'], 'rot4')
    g.meet('F', 'pq', 'pq@1', (0.5, 0.5))

    step('Draw a circle with centre O through F. It crosses the horizontal line at T, right of O, '
         'and the vertical line at U, above O. Draw a straight line through T and U.', 'compass', ['F'])
    g.circle_through('cs', 'O', 'F')
    g.meet('T', 'cs', 'h', (H, 0))
    g.meet('U', 'cs', 'v', (0, H))
    g.line_through('tu', 'T', 'U')

    step('Turn line TU round O by 90°, three times. With the square, it makes the star at O.', 'ruler', ['tu'])
    g.repeat('cp2', ['tu'], 'rot4')

    step('Draw a vertical line through E. It crosses the horizontal line through C at Z1, '
         'the centre of the next star.', 'ruler', ['E', 'ch'])
    g.line_par('ev', 'E', 'v')
    g.meet('Z1', 'ev', 'ch', (2, 1))

    step('Draw the star at Z1, the same size as the star at O.', 'compass', ['Z1'])
    steps_ = cm.steps
    steps_[-1]['parts'] = []
    del steps_[-1]['create']
    part(steps_[-1], 'Draw a circle with centre Z1 and the same radius as the circle through F. '
         'It crosses the horizontal line through C at W and Y. It crosses the vertical line through E at V and X.',
         'compass', ['cs', 'Z1'])
    cm.circle_radius_of('cz', 'Z1', 'cs')
    g.meet('W', 'cz', 'ch', (2 - H, 1))
    g.meet('Y', 'cz', 'ch', (2 + H, 1))
    g.meet('V', 'cz', 'ev', (2, 1 + H))
    g.meet('X', 'cz', 'ev', (2, 1 - H))
    part(steps_[-1], 'Draw a straight line through W and X, W and V, and X and Y. '
         'They are three sides of the turned square of the star at Z1.', 'ruler', ['W', 'X', 'V', 'Y'])
    g.line_through('wx', 'W', 'X')
    g.line_through('wv', 'W', 'V')
    g.line_through('xy', 'X', 'Y')
    part(steps_[-1], 'The circle with centre Z1 crosses the top side of the square at O at R, left of Z1. '
         'Draw a vertical line through R. It crosses the circle again at S. Draw a horizontal line through S. '
         'They are two sides of the square of the star at Z1.', 'ruler', ['cz', 'pq@1'])
    g.meet('R', 'cz', 'pq@1', (1.5, 0.5))
    g.line_par('rv', 'R', 'v')
    g.meet('S', 'cz', 'rv', (1.5, 1.5))
    g.line_par('sh', 'S', 'h')

    step('Turn the lines through W, X, R and S round O by 90°, three times. '
         'They are the sides of the stars next to O.', 'ruler', ['wx', 'wv', 'xy', 'rv', 'sh'])
    g.repeat('cp3', ['wx', 'wv', 'xy', 'rv', 'sh'], 'rot4')

    # the tile: its corners are the four stars next to O
    step('Turn the vertical line through E and the horizontal line through C round O by 90°, three times. '
         'They cross at Z2, Z3 and Z4, the centres of the other stars next to O.', 'ruler', ['ev', 'ch'])
    g.repeat('cpz', ['ev', 'ch'], 'rot4')
    g.meet('Z2', 'ev@1', 'ch@1', (-1, 2))
    g.meet('Z3', 'ev@2', 'ch@2', (-2, -1))
    g.meet('Z4', 'ev@3', 'ch@3', (1, -2))
    step('Join Z1, Z2, Z3 and Z4 with straight lines to mark the tile that repeats.', 'ruler', ['Z1', 'Z2', 'Z3', 'Z4'])
    g.line_through('k12', 'Z1', 'Z2')
    g.line_through('k23', 'Z2', 'Z3')
    g.line_through('k34', 'Z3', 'Z4')
    g.line_through('k41', 'Z4', 'Z1')
    put('tile', 'polygon', None, {'polygon': ['Z1', 'Z2', 'Z3', 'Z4']})


def part(st, text, animate, highlight):
    p_ = {'text': text, 'create': {}, 'highlight': highlight, 'animate': animate}
    st['parts'].append(p_)
    g.cur = p_
    cm.g.cur = p_


def to_cell(p):
    return ((3 * p[0] - p[1]) / S10, (p[0] + 3 * p[1]) / S10)


def from_cell(q):
    return ((3 * q[0] + q[1]) / S10, (-q[0] + 3 * q[1]) / S10)


def network(polys):
    segs = set()
    for Q in polys:
        if max(abs(v) for q in Q for v in q) > 4:
            continue
        for i in range(len(Q)):
            a, b = to_cell(Q[i]), to_cell(Q[(i + 1) % len(Q)])
            for ca, cb in cm.clip([(a, b)], S10 / 2):
                sa, sb = cm.snap(from_cell(ca)), cm.snap(from_cell(cb))
                assert sa and sb, ('corner off the construction', from_cell(ca), from_cell(cb))
                if math.dist(sa, sb) > 1e-6:
                    segs.add(tuple(sorted((tuple(round(v, 9) for v in sa), tuple(round(v, 9) for v in sb)))))
    return sorted(segs)


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = network(cm.frame_pieces(pieces, ORIGIN, PERIOD, 0))
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    tut = {
        'format': 0, 'id': 'cahier-pinwheel-stars',
        'title': 'Pinwheel of eight-pointed stars (Cahier and Martin)',
        'short': 'Pinwheel stars', 'subtitle': 'After Cahier and Martin, page 36', 'fold': 4, 'chiral': True,
        'star': 8, 'style': 'Moroccan', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s CM036 drawing, its corners snapped to exact '
                    'values. We devised the construction: each star is two equal squares, and every line is a side '
                    'of the star at O or of one of the four stars nearest to it. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. The source names '
                       'no building, and no photo was checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data15/CM036: Cahier and Martin, page 36', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data15/CM036.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, after Charles Cahier and Arthur Martin, 376 Decorative '
                     'Allover Patterns from Historic Tilework and Textiles (Dover), page 36. '
                     'The construction is ours.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'A point on a line through two points of the star. OA is as long as a side of the '
                       'star’s square.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the star at O and the parts of the four stars next to it inside the tile. '
                        'Ink the lines that carry their sides on. They close the five- and thirteen-sided tiles.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the tile side by side. The stars run in rows that climb one step in two. '
                            'The thirteen-sided tiles turn round the points between them.',
                    'palette': 'Marinid zellige', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 1.172): ('star', 'ground'), (5, 0.543): ('shield', 'a'), (13, 1.371): ('sail', 'b')}

if __name__ == '__main__':
    cm.run(main, NAMES)
