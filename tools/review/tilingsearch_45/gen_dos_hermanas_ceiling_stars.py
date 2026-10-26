#!/usr/bin/env python3
"""NC5, end of a Dos Hermanas side-chamber ceiling. Extract at precision 2.
Usage: this script <pieces.json> <tutorial.json>, then finish <dump.json>
<tutorial.json>. 8 pt bands. OA is the large star's tip radius, 57.99145 pt;
the half-side is 1+sqrt(2). Corners fit (a+b*sqrt(2)/2)/2 within 0.000276 OA.
Every edge is a chord of one of four {8/3} stars of radius OA, continued.
Their centres are (±sqrt(2),±sqrt(2)), constructed by a unit circle transfer
along the diagonal. The small centre star and the other pieces are crossings
of those same lines; no extra measured lengths are needed.
"""
import math
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, step
import medium

H, L = math.sqrt(.5), 1+math.sqrt(2)


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    cm.steps[-1]['textWithoutHelpers'] = 'Draw a circle with centre O through A.'
    g.circle_through('c', 'O', 'A')
    g.line_through('h', 'O', 'A')
    step('Draw a vertical line through O. It crosses the circle at C, above O. '
         'Draw the line through O that halves the angle AOC. It crosses the circle at E, above O. '
         'Draw a circle with centre E through O. It crosses line OE again at B1, beyond E.', 'compass')
    g.line_perp('v', 'O', 'h')
    g.meet('C', 'c', 'v', (0, 1))
    g.line_bisect('d45', 'A', 'O', 'C')
    g.meet('E', 'c', 'd45', (H, H))
    g.circle_through('ce', 'E', 'O')
    g.meet('B1', 'ce', 'd45', (2*H, 2*H))
    step('Draw a circle with centre B1 through E. Draw a horizontal line through B1. '
         'Draw a vertical line through B1. Draw a line through B1 at 90° to line OE. '
         'The circle crosses the four lines through B1 at S1 to S8.', 'compass')
    g.circle_through('cs', 'B1', 'E')
    g.line_par('bh', 'B1', 'h')
    g.line_par('bv', 'B1', 'v')
    g.line_perp('bd', 'B1', 'd45')
    points = []
    for i, (line, angle) in enumerate([('bh', 0), ('d45', 45), ('bv', 90), ('bd', 135),
                                        ('bh', 180), ('d45', 225), ('bv', 270), ('bd', 315)]):
        name = f'S{i+1}'
        a = math.radians(angle)
        g.meet(name, 'cs', line, (2*H+math.cos(a), 2*H+math.sin(a)))
        points.append(name)
    step('Draw the eight-pointed star at B1.')
    current = cm.steps[-1]
    del current['create']
    current['parts'] = []
    for indices, text in [([0, 2, 4, 6], 'Draw a straight line through S1 and S4, S3 and S6, S5 and S8, and S7 and S2.'),
                           ([1, 3, 5, 7], 'Draw a straight line through S2 and S5, S4 and S7, S6 and S1, and S8 and S3.')]:
        part = {'text': text+' Draw each line long.', 'create': {}, 'animate': 'ruler'}
        current['parts'].append(part)
        g.cur = part
        for i in indices:
            g.line_through(f'q{i}', points[i], points[(i+3) % 8])
    step('Turn the eight lines of the last step round O by 90°, three times.')
    g.repeat('qp', [f'q{i}' for i in range(8)], 'rot4')
    step('Draw a vertical line through S1. Turn it round O by 90°, three times. '
         'These four lines make a square with corners K1, K2, K3 and K4.')
    g.line_par('gx', 'S1', 'v')
    g.repeat('grid', ['gx'], 'rot4')
    for i, (a, b, p) in enumerate([('gx', 'gx@1', (L, L)), ('gx@1', 'gx@2', (-L, L)),
                                    ('gx@2', 'gx@3', (-L, -L)), ('gx@3', 'gx', (L, -L))]):
        g.meet(f'K{i+1}', a, b, p)


SPEC = {
    'id': 'alhambra-dos-hermanas-ceiling-stars',
    'title': 'Pointed stars of the Dos Hermanas side-chamber ceiling (Alhambra)',
    'short': 'Dos Hermanas ceiling stars', 'subtitle': 'Sala de las Dos Hermanas, Alhambra',
    'code': 'NC5', 'folder': 'data174', 'frame': ((298.30125, 372.9325), 57.99145, 8, L),
    'given': {'O': 'The centre of a small star.', 'A': 'Sets the point radius of the larger stars.'},
    'style': 'Nasrid', 'level': 'intermediate', 'palette': 'Alhambra', 'look': 'interlace',
    'note': 'The finished design was read from Wichmann’s NC5 vector drawing. Its band centre lines were '
            'snapped to exact half-unit square-root-of-two values. '
            'Every edge is a side of one of four eight-pointed stars with 45-degree tips, continued. '
            'The circle transfer through E locates their centres, and the crossings make the small central star.',
    'changes': 'The 8 pt bands are represented by their centre lines. The palette is illustrative; '
               'no photograph of the ceiling was checked.',
    'references': 'His reference is Nick Crossling’s photograph, personal communication, of wood inlay in a '
                  'side gallery of the Sala de las Dos Hermanas. The page locates the design at the end '
                  'section of a side-chamber ceiling.',
    'ink': 'Ink the lines picked out in orange. They close the pointed stars, the small centre star and the connecting pieces.',
}
NAMES = {(16, 1.657): ('pointed_star', 'a'), (8, 1.222): ('eight', 'b'),
         (16, .686): ('star', 'd'), (6, .536): ('hexagon', 'c'),
         (8, .201): ('four_star', 'd'), (6, .172): ('short_hexagon', 'ground'),
         (4, .172): ('rhombus', 'ground'), (4, .121): ('kite', 'ground')}
if __name__ == '__main__':
    medium.run(build, SPEC, NAMES)
