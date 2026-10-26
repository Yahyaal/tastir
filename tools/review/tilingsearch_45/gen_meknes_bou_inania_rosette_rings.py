#!/usr/bin/env python3
"""P70, Bou Inania madrasa, Meknes. Plain tiles, repeat 597 pt.
OA is the small star's point radius, 298.5/(4+3*sqrt(2)) PDF points.
Every source corner fits a+b*sqrt(2)/2 within 0.001782 OA. The half-side
is four radii plus three unit-square diagonals. The shared MOR0910 frame
constructs that span; the crossings below supply the remaining lines.
Source shoelace areas and their counts are in the running report.

Usage: gen_meknes_bou_inania_rosette_rings.py <P70-pieces.json> <tutorial.json>
       gen_meknes_bou_inania_rosette_rings.py finish <dump.json> <tutorial.json>
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, put, step
import gen_meknes_bou_inania_petals as mp

H = math.sqrt(.5)
L = 4+6*H
ORIGIN, UNIT = (299.2, 372.7), 298.5/L


def crossing_set(point, first, second, want, lines, text):
    """One ruler move through an earlier crossing and its quarter turns."""
    step(text)
    g.meet(point, first, second, want)
    names = []
    for name, direction in lines:
        g.line_par(name, point, direction)
        names.append(name)
    g.repeat(point.lower()+'copies', names, 'rot4')


def build():
    mp.build_frame(4)
    step('The vertical side from S8 to S2 crosses the horizontal line at P. '
         'Draw a circle with centre P and radius OE. It crosses the horizontal line at J, to the right. '
         'Draw a vertical line through J. Turn it round O by 90°, three times.', 'compass')
    g.meet('P', 'q14', 'h', (H, 0))
    g.circle_from('cp', 'P', 'O', 'E')
    g.meet('J', 'cp', 'h', (3*H, 0))
    g.line_par('jv', 'J', 'v')
    g.repeat('jvp', ['jv'], 'rot4')

    crossing_set('R', 'q14', 'q02', (H, 1+H), [('rh', 'h'), ('rd', 'q01')],
                 'The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
                 'Draw a horizontal line through R. Draw a line through R parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')

    crossing_set('V', 'rh@3', 'q02', (1+H, 2+H), [('vh', 'h')],
                 'The line through R, turned by 270°, crosses the line from S3 to S5 at V. '
                 'Draw a horizontal line through V. Turn it round O by 90°, three times.')

    crossing_set('W', 'rh', 'rd@3', (2+3*H, 1+H), [('wv', 'v'), ('wd', 'q01')],
                 'The horizontal line through R crosses the diagonal through R, turned by 270°, at W. '
                 'Draw a vertical line through W. Draw a line through W parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')

    step('The horizontal line through R crosses the vertical line through O at U. '
         'Draw a circle with centre T1 and radius OU. It crosses the horizontal line at N, towards O. '
         'Draw a vertical line through N. Turn it round O by 90°, three times.', 'compass')
    g.meet('U', 'v', 'rh', (0, 1+H))
    g.circle_from('ct', 'T1', 'O', 'U')
    g.meet('N', 'ct', 'h', (L-1-H, 0))
    g.line_par('nv', 'N', 'v')
    g.repeat('nvp', ['nv'], 'rot4')

    step('Draw a circle with centre N and radius OA. It crosses the horizontal line at P1, towards O. '
         'Draw a vertical line through P1. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('cn', 'N', 'c')
    g.meet('P1', 'cn', 'h', (L-2-H, 0))
    g.line_par('pv', 'P1', 'v')
    g.repeat('pvp', ['pv'], 'rot4')

    step('Draw a circle with centre K1 and radius OA. It crosses line OE at Q, towards O. '
         'Draw a vertical line through Q. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('ck', 'K1', 'c')
    g.meet('Q', 'ck', 'd45', (L-H, L-H))
    g.line_par('qv', 'Q', 'v')
    g.repeat('qvp', ['qv'], 'rot4')

    step('Draw a line through F2 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    g.line_par('fd', 'F2', 'q01')
    g.repeat('fdp', ['fd'], 'rot4')

    crossing_set('X', 'jv', 'rh', (3*H, 1+H), [('xd', 'q01')],
                 'The vertical line through J crosses the horizontal line through R at X. '
                 'Draw a line through X parallel to the line from S1 to S3. Turn it round O by 90°, three times.')

    crossing_set('Y1', 'wv', 'q04', (2+3*H, 1+3*H), [('y1d', 'q01')],
                 'The vertical line through W crosses the line from S7 to S1 at Y1. '
                 'Draw a line through Y1 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')

    crossing_set('Y2', 'vh', 'rd@3', (3+3*H, 2+H), [('y2d', 'q01')],
                 'The horizontal line through V crosses the diagonal through R, turned by 270°, at Y2. '
                 'Draw a line through Y2 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')

    crossing_set('Y3', 'pv', 'rd@3', (2+5*H, 1+3*H), [('y3d', 'q01')],
                 'The vertical line through P1 crosses the diagonal through R, turned by 270°, at Y3. '
                 'Draw a line through Y3 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')

    crossing_set('Y4', 'wv', 'nv@1', (2+3*H, 3+5*H), [('y4d', 'q01')],
                 'The vertical line through W crosses the line through N, turned by 90°, at Y4. '
                 'Draw a line through Y4 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')

    crossing_set('Q2', 'ck', 'gx', (L, L-1), [('q2d', 'q01')],
                 'The circle with centre K1 crosses the vertical line through T1 at Q2, towards T1. '
                 'Draw a line through Q2 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')


def main():
    pieces, out = sys.argv[1:3]
    build()
    paths = cm.along_ink(cm.network(cm.frame_pieces(pieces, ORIGIN, 2*UNIT, 0), hcell=L, reach=3*L))
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'meknes-bou-inania-rosette-rings',
        'title': 'Rosette rings of the Bou Inania madrasa (Meknes)',
        'short': 'Meknes rosette rings', 'subtitle': 'Bou Inania madrasa, Meknes',
        'fold': 4, 'star': 8, 'style': 'Moroccan', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P70 vector drawing. '
                    'The corners were snapped to exact values with the small star’s point radius as the unit. '
                    'The drawing gives no steps. We devised the construction, sharing the unit-star '
                    'and compass-transfer opening with the Meknes petal rosettes. '
                    'The crossings R, V, W, X and Y1 to Y4 set the inner stars and outer pieces.',
            'changes': 'The compass steps, their order and the named points are ours. '
                       'OA is the small star’s point radius; the cell half-side is four radii plus three square diagonals. '
                       'The finished tile edges follow the plain drawing. '
                       'The palette is illustrative; no photograph was checked.',
            'reviewed': '2026-10-26'},
        'credits': [{
            'source': 'Tiling Search, data21/P70: Bou Inania Madrasah, Meknes',
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': 'https://tilingsearch.mit.edu/HTML/data21/P70.html',
            'note': 'Read from his finished drawing, not construction instructions. '
                    'His references are David Wade, Pattern in Islamic Art (Studio Vista, 1976), page 70, '
                    'and Wade photograph MOR 0909 of the Bou Inania madrasa, Meknes.'}],
        'given': {'O': 'The centre of the small star inside a rosette.', 'A': 'A point of that star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They close the centre star, the rings of pieces and the stars between rosettes.',
                'paths': paths},
        'pattern': {'cell': 'tile', 'palette': 'Marinid zellige', 'look': 'tiles',
                    'text': 'Put copies of the square tile side by side. Stars and arrows join the rosettes along the rows.',
                    'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]}}
    cm.write(tut, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')


NAMES = {(11, 3.157): ('eleven', 'ground'), (16, 2.343): ('star', 'd'),
         (12, 2.172): ('twelve', 'ground'), (6, 2.0): ('petal', 'a'),
         (8, 2.0): ('arrow', 'b'), (7, 1.914): ('seven', 'c'),
         (16, 1.657): ('pointed_star', 'd'), (4, 1.414): ('rhombus', 'ground'),
         (3, .5): ('triangle', 'ground'), (4, .414): ('kite', 'ground'),
         (4, .343): ('square', 'd'), (5, .328): ('pentagon', 'ground')}
if __name__ == '__main__':
    if sys.argv[1] == 'finish':
        cm.finish(sys.argv[2], sys.argv[3], NAMES)
        tutorial = json.load(open(sys.argv[3]))
        for piece in tutorial['expect']['pieces']:
            if piece['name'] in {'triangle', 'kite', 'square', 'pentagon'}:
                piece['small'] = True
        cm.write(tutorial, sys.argv[3])
    else:
        main()
