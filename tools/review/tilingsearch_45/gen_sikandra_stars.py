#!/usr/bin/env python3
"""Builds the stars and crosses of Akbar's tomb at Sikandra, drawn by Brian
Wichmann in Tiling Search (data172/IND0703, from David Wade's photo).

Read from the PDF (plain tiles, period 362.2 pt), put with O at a cross with
four stars round it and the square cell's corners at the other kind of
cross. The corners do not fit the grid a + b·√2/2 in units of OA, but fit it
to 0.003 in units of OA/3: the stars have their points on circles of radius
1/3 round T = (1/3, 1/3) and its turned copies, as in the star and cross
(their area is that of eight-fold-star-and-cross scaled by 1/3). The line
from K2 to A crosses OK1 at T. Every line is a side of the four stars
(turned round O), or one of two more:
  - through P, the star's inner corner where sides S5S7 and S6S8 cross,
    parallel to OK1 (x − y = (√2 − 1)/3);
  - through Z, where the line through T and S4 (at 90° to OK1) crosses the
    right side of the star to the left, horizontal (y = 1 − √2/6);
each turned round O (found with find_crossings.py, SCALE = 3).

Usage: gen_sikandra_stars.py <IND0703-pieces.json> tutorials/sikandra-stars.json
       pnpm review sikandra-stars
       gen_sikandra_stars.py finish docs/review/sikandra-stars/dump.json tutorials/sikandra-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
from gen_leones_door_stars import square_texts, two_squares  # noqa: E402

H = math.sqrt(2) / 2
ORIGIN, PERIOD = (293.5, 371.0), 362.2
T = (1 / 3, 1 / 3)


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('Draw a straight line through K2 and A. It crosses the line from O to K1 at T.', 'ruler', ['K2', 'A', 'T'])
    g.line_through('ka', 'K2', 'A')
    g.meet('T', 'ka', 'd45', T)

    step('Draw a vertical line through T. Draw a horizontal line through T. '
         'Draw the line through T at 90° to the line from O to K1. '
         'The vertical line through T crosses the horizontal line at N. Draw a circle with centre T through N. '
         'It crosses the four lines through T at S1 to S8.', 'compass', ['T', 'N'])
    g.line_par('tv', 'T', 'v')
    g.line_par('th', 'T', 'h')
    g.line_perp('tp', 'T', 'd45')
    g.meet('N', 'tv', 'h', (1 / 3, 0))
    g.circle_through('ct', 'T', 'N')
    pts = []
    for i, (a, ln) in enumerate(((0, 'th'), (45, 'd45'), (90, 'tv'), (135, 'tp'),
                                 (180, 'th'), (225, 'd45'), (270, 'tv'), (315, 'tp'))):
        nm = f'S{i + 1}'
        g.meet(nm, 'ct', ln, (T[0] + math.cos(math.radians(a)) / 3, T[1] + math.sin(math.radians(a)) / 3))
        pts.append(nm)

    step('Draw the star at T as two squares.', 'ruler', ['ct'])
    two_squares(pts, 'q', square_texts(pts, 'Draw each line long.'))

    step('Turn the eight sides of the star round O by 90°, three times. They make a star round each of the '
         'other three corners of the square round O.')
    star = [f'q{k}{i}' for k in range(2) for i in range(1, 5)]
    g.repeat('qr', star, 'rot4')

    step('The line through S5 and S7 crosses the line through S6 and S8 at P. '
         'Draw a line through P parallel to the line from O to K1.', 'ruler', ['P'])
    g.meet('P', 'q03', 'q13', (math.sqrt(2) / 6, (1 - H) / 3))
    g.line_par('pd', 'P', 'd45')

    step('Look at the star to the left of T. The line through T and S4 crosses its right side at Z. '
         'Draw a horizontal line through Z.', 'ruler', ['Z'])
    g.meet('Z', 'tp', 'q13@1', (-(1 - H) / 3, 1 - H / 3))
    g.line_par('zh', 'Z', 'h')

    step('Turn the lines through P and Z round O by 90°, three times.')
    g.repeat('pz', ['pd', 'zh'], 'rot4')


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, 0))
    paths = cm.along_ink(segs)
    used = {p_['along'].split('@')[0] for p_ in paths}
    print('lines not inked:', [n for n in cm.lines() if n.split('@')[0] not in used])
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'sikandra-stars',
        'title': 'Stars and crosses of Akbar’s tomb, Sikandra',
        'short': 'Sikandra stars', 'subtitle': 'Akbar’s tomb, Sikandra', 'fold': 4, 'star': 8,
        'style': 'Mughal', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s IND0703 drawing, its corners snapped to exact '
                    'values in thirds of OA. We devised the construction: a star at T, a third of the way to K1, '
                    'turned round O, and two more kinds of line through P and Z. The drawing gives no steps.',
            'changes': 'The compass steps, their order and the named points are ours. The comparison with the '
                       'drawing checks the finished lines, not how the design was first laid out. David Wade’s '
                       'photo of the tomb, which Wichmann drew from, was not checked.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data172/IND0703: Akbar’s Tomb, Sikandra', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data172/IND0703.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing, made from David Wade’s photo IND 0703 of Akbar’s '
                     'mausoleum at Sikandra (1613) and shown in Brian Wichmann and David Wade, Islamic Design: a '
                     'Mathematical Approach (Springer, 2017), figure 9.7c. The construction is ours.'}],
        'given': {'O': 'The centre of a cross with four stars round it.',
                  'A': 'Halfway from O to the next cross of the same kind.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the four stars round O and the lines that carry their sides on. They close the crosses, '
                        'the large pieces and the small corner pieces.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. Four stars sit round every centre, and a '
                            'cross sits at every corner.',
                    'palette': 'Timurid tile', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.26): ('star', 'a'), (16, 0.184): ('cross', 'ground'), (16, 0.352): ('large', 'b'),
         (8, 0.111): ('corner', 'ground')}

if __name__ == '__main__':
    cm.run(main, NAMES)
