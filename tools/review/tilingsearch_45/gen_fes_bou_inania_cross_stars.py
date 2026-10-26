#!/usr/bin/env python3
"""MOR2832X, Bou Inania madrasa, Fez. Read coloured faces only;
grey fills are bevel shading. The 9 pt bands are reduced to centre lines.
OA=68.275 pt, one third of the half-repeat; the square cell has half-side 3.
Source corners snap to (a+b*sqrt(2)/2)/2 within 0.001718 OA.
Axis lines are at odd halves; diagonal intercepts are H,2±H,4±H.
The large cruciform outline has 24 corners in the centre-line tiling.

Usage: gen_fes_bou_inania_cross_stars.py <MOR2832X-pieces.json> <tutorial.json>
       gen_fes_bou_inania_cross_stars.py finish <dump.json> <tutorial.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, put, step

H = math.sqrt(.5)
ORIGIN, UNIT, BAND = (295.4, 371), 68.275, 9


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    g.circle_through('c', 'O', 'A')
    g.line_through('h', 'O', 'A')

    step('Draw a vertical line through O. It crosses the circle at C, above O. '
         'Draw a straight line through A and C. Draw the line through O that halves the angle AOC. '
         'It crosses line AC at M.')
    g.line_perp('v', 'O', 'h')
    g.meet('C', 'c', 'v', (0, 1))
    g.line_through('ac', 'A', 'C')
    g.line_bisect('d45', 'A', 'O', 'C')
    g.meet('M', 'ac', 'd45', (.5, .5))

    step('Draw a vertical line through M. Turn it round O by 90°, three times. '
         'The vertical line through M crosses the horizontal line at P. Draw a circle with centre O through M. '
         'It crosses the horizontal line at S, to the right. '
         'Draw a line through S parallel to line AC. Turn it round O by 90°, three times.', 'compass')
    g.line_par('mv', 'M', 'v')
    g.repeat('mvp', ['mv'], 'rot4')
    g.meet('P', 'mv', 'h', (.5, 0))
    g.circle_through('ch', 'O', 'M')
    g.meet('S', 'ch', 'h', (H, 0))
    g.line_par('sd', 'S', 'ac')
    g.repeat('sdp', ['sd'], 'rot4')

    step('Keep the compass open to OA. Draw circles with centres A, T1 and T2 in turn. '
         'Each circle crosses the horizontal line to the right at T1, T2 and T3.', 'compass')
    prev = 'A'
    for i in range(1, 4):
        cm.circle_radius_of(f'ct{i}', prev, 'c')
        g.meet(f'T{i}', f'ct{i}', 'h', (i+1, 0))
        prev = f'T{i}'

    step('Draw a circle with centre O through T2. It crosses the horizontal and vertical lines at U1 to U4. '
         'Draw a vertical line through each of U1 and U3. Draw a horizontal line through each of U2 and U4. '
         'They make a square with corners K1, K2, K3 and K4.', 'compass')
    g.circle_through('co', 'O', 'T2')
    for i, (line, p) in enumerate([('h', (3, 0)), ('v', (0, 3)), ('h', (-3, 0)), ('v', (0, -3))]):
        g.meet(f'U{i+1}', 'co', line, p)
    for name, p, line in [('gx', 'U1', 'v'), ('gy', 'U2', 'h'), ('gxw', 'U3', 'v'), ('gys', 'U4', 'h')]:
        g.line_par(name, p, line)
    for i, (a, b, p) in enumerate([('gx', 'gy', (3, 3)), ('gxw', 'gy', (-3, 3)),
                                    ('gxw', 'gys', (-3, -3)), ('gx', 'gys', (3, -3))]):
        g.meet(f'K{i+1}', a, b, p)

    step('Draw a circle with centre A and radius OP. It crosses the horizontal line at Q, beyond A. '
         'Draw a vertical line through Q. Turn it round O by 90°, three times.', 'compass')
    g.circle_from('ca', 'A', 'O', 'P')
    g.meet('Q', 'ca', 'h', (1.5, 0))
    g.line_par('qv', 'Q', 'v')
    g.repeat('qvp', ['qv'], 'rot4')

    step('Draw a circle with centre Q and radius OA. It crosses the horizontal line at R, to the right. '
         'Draw a vertical line through R. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('cq', 'Q', 'c')
    g.meet('R', 'cq', 'h', (2.5, 0))
    g.line_par('rv', 'R', 'v')
    g.repeat('rvp', ['rv'], 'rot4')

    for i, centre, value in [(1, 'T1', 2), (3, 'T3', 4)]:
        step(f'Draw a circle with centre {centre} and radius OM. '
             f'It crosses the horizontal line at V{i} and V{i+1}. '
             f'Draw a line through each of V{i} and V{i+1} parallel to line AC. '
             'Turn both lines round O by 90°, three times.', 'compass')
        cm.circle_radius_of(f'cr{i}', centre, 'ch')
        names = []
        for k, sign in enumerate((-1, 1)):
            p = f'V{i+k}'
            g.meet(p, f'cr{i}', 'h', (value+sign*H, 0))
            g.line_par(p.lower()+'d', p, 'ac')
            names.append(p.lower()+'d')
        g.repeat(f'v{i}copies', names, 'rot4')



def main():
    pieces, out = sys.argv[1:3]
    build()
    paths = cm.along_ink(cm.network(cm.frame_pieces(pieces, ORIGIN, 2*UNIT, BAND), hcell=3, reach=9))
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'fes-bou-inania-cross-stars',
        'title': 'Crosses and stars of the Bou Inania madrasa (Fez)',
        'short': 'Fez cross and stars', 'subtitle': 'Bou Inania madrasa, Fez',
        'fold': 4, 'star': 8, 'style': 'Moroccan', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s MOR2832X vector drawing. '
                    'The grey bevel shading was separated from the coloured faces, and the band '
                    'centre lines snapped to exact values. The drawing gives no steps. '
                    'We devised the construction from half-unit lines and circles of radius OM.',
            'changes': 'The compass steps, their order and the named points are ours. '
                       'The 9 pt bevelled bands are represented by their centre lines. '
                       'The large cruciform piece has 24 corners in this centre-line tiling. '
                       'OA is one third of the cell half-side. '
                       'The palette is illustrative; no photograph was checked.',
            'reviewed': '2026-10-26'},
        'credits': [{
            'source': 'Tiling Search, data190/MOR2832X: Bou Inania Madrasah, Fez',
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': 'https://tilingsearch.mit.edu/HTML/data190/MOR2832X.html',
            'note': 'Read from his finished drawing, not construction instructions. '
                    'His reference is David Wade photograph MOR 2832x of the Bou Inania madrasa, Fez.'}],
        'given': {'O': 'The centre of a large cross.', 'A': 'One grid interval from O on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They close the large crosses, the stars, the pentagons and the small squares.',
                'paths': paths},
        'pattern': {'cell': 'tile', 'palette': 'Marinid zellige', 'look': 'strapwork',
                    'text': 'Put copies of the square tile side by side. Stars and small squares fill the spaces between the crosses.',
                    'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]}}
    cm.write(tut, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')


NAMES = {(24, 2.485): ('cross', 'a'), (16, 1.172): ('star', 'b'),
         (4, .172): ('square', 'd'), (5, .164): ('pentagon', 'ground')}
if __name__ == '__main__':
    cm.run(main, NAMES)
