#!/usr/bin/env python3
"""MOR0323: Attarine madrasa, Fez. Plain tiles, repeat 506.6 pt,
OA=253.3 pt. Corners snap to a+b*sqrt(2)/2 with worst error 0.000315 OA.
The Charbagh construction supplies most lines. With H=sqrt(2)/2, the
remaining lines come from W=(3H-2,3-3H), Y=(H,5H-3), Z=(H,3H-1).
Axis distances are 3H-2,1-H,5H-3,H,3-3H; diagonal distances add 3H-1,2-H.
The central star therefore has tip radius 3-2*sqrt(2).

Usage: gen_attarine_star_rosettes.py <MOR0323-pieces.json> <tutorial.json>
       gen_attarine_star_rosettes.py finish <dump.json> <tutorial.json>
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, put, step
import gen_charbagh_stars as cb

ORIGIN, PERIOD, BAND = (297.5, 373.9), 506.6, 0


def build():
    cb.build()
    cm.steps[1]['textWithoutHelpers'] = cm.steps[1]['text']
    cm.steps[4]['text'] = 'Draw two squares.'
    cm.steps[5]['text'] = (
        'Draw a vertical line through F. '
        'The circle with centre K1 crosses the vertical line through A at P. '
        'It crosses the horizontal line through C at Q. Draw a straight line through P and Q.')
    cm.steps[6]['text'] = 'Turn the two lines of the last step round O by 90°, three times.'

    step('Draw a vertical line through W. Turn it round O by 90°, three times.')
    g.line_par('wv', 'W', 'v')
    g.repeat('wvp', ['wv'], 'rot4')

    step('The vertical line through F crosses the diagonal through V, turned by 180°, at Y. '
         'Draw a horizontal line through Y. Draw a line through Y parallel to line AC. '
         'Turn both lines round O by 90°, three times.')
    g.meet('Y', 'fv', 'vd@2', (cb.H, 5*cb.H-3))
    g.line_par('yh', 'Y', 'h')
    g.line_par('yd', 'Y', 'ac')
    g.repeat('yp', ['yh', 'yd'], 'rot4')

    step('The vertical line through F crosses the line from S3 to S5 at Z. Draw a line through Z parallel to line AC. '
         'Turn it round O by 90°, three times.')
    g.meet('Z', 'fv', 'q02', (cb.H, 3*cb.H-1))
    g.line_par('zd', 'Z', 'ac')
    g.repeat('zp', ['zd'], 'rot4')


def main():
    pieces, out = sys.argv[1:3]
    build()
    paths = cm.along_ink(cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)))
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'attarine-star-rosettes',
        'title': 'Star rosettes of the Attarine madrasa (Fez)',
        'short': 'Attarine star rosettes', 'subtitle': 'Attarine madrasa, Fez',
        'fold': 4, 'star': 8, 'style': 'Moroccan', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s MOR0323 vector drawing. '
                    'The corners were snapped to exact values on the square-root-of-two grid. '
                    'The drawing gives no steps. We devised the construction, sharing the Charbagh '
                    'opening as two guide squares and their continued sides. Lines through W, Y and Z '
                    'complete the rosettes and their surrounding stars.',
            'changes': 'The compass steps, their order and the named points are ours. '
                       'The finished tile edges follow the plain drawing. '
                       'The palette is illustrative; no photograph was checked.',
            'reviewed': '2026-10-26'},
        'credits': [{
            'source': 'Tiling Search, data172/MOR0323: Attarine Madrasah, Fez',
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': 'https://tilingsearch.mit.edu/HTML/data172/MOR0323.html',
            'note': 'Read from his finished drawing, not construction instructions. '
                    'His references are David Wade photographs MOR 0323 (Attarine madrasa, Fez, 1325), '
                    'MOR 1209 (Saadian tombs, Marrakesh, 1603), MOR 0421 (Fez) '
                    'and MOR 1227 (Ben Youssef madrasa, Marrakesh). '
                    'The page links LEON7 as a design using the same irregular tiles.'}],
        'given': {'O': 'The centre of a rosette.',
                  'A': 'Halfway to the next rosette on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They close the rosette, the surrounding stars and the pieces between them.',
                'paths': paths},
        'pattern': {'cell': 'tile', 'palette': 'Marinid zellige', 'look': 'tiles',
                    'text': 'Put copies of the square tile side by side. Stars fill the spaces between the rosettes.',
                    'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]}}
    cm.write(tut, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')


NAMES = {(16, .069): ('star', 'b'), (6, .088): ('long_hexagon', 'd'),
         (6, .059): ('petal', 'd'), (8, .059): ('eight', 'ground'),
         (7, .056): ('seven', 'a'), (8, .054): ('arrow', 'c'),
         (4, .042): ('rhombus', 'ground'), (3, .015): ('triangle', 'ground'),
         (4, .012): ('kite', 'ground')}
if __name__ == '__main__':
    cm.run(main, NAMES)
