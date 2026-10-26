#!/usr/bin/env python3
"""MOR2615: Sakkala, Tetouan. Band 5 pt; repeat 233.13 pt; OA=116.565 pt.
Every source corner fits a+b*sqrt(2)/2 within 0.00069 OA. The central star
has radius sqrt(2)-1, as in the Leones doors. Its sides and the corner
circles give diagonals x+y=2-(sqrt(2)-1); crossing them with the vertical
through F gives the square-knot sides at x,y=3-3*sqrt(2)/2.

Usage: gen_tetouan_sakkala_knots.py <MOR2615-pieces.json> <tutorial.json>
       gen_tetouan_sakkala_knots.py finish <dump.json> <tutorial.json>
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, put, step
import gen_leones_door_stars as leones

ORIGIN, PERIOD, BAND = (297.5, 374.23), 233.13, 5


def build():
    leones.build()
    cm.steps[1]['textWithoutHelpers'] = cm.steps[1]['text']
    cm.steps[5]['text'] = (
        'Draw a vertical line through F. '
        'The circle with centre K1 crosses the vertical line through A at P. '
        'It crosses the horizontal line through C at Q. Draw a straight line through P and Q.')
    cm.steps[6]['text'] = 'Turn the two lines of the last step round O by 90°, three times.'
    cm.steps[6]['textWithoutHelpers'] = 'Turn line PQ round O by 90°, three times.'
    step('The vertical line through F crosses line PQ at V. Draw a horizontal line through V. '
         'Turn it round O by 90°, three times.')
    g.meet('V', 'fv', 'pq', (leones.H, 3-3*leones.H))
    g.line_par('vh', 'V', 'h')
    g.repeat('vp', ['vh'], 'rot4')


def main():
    pieces, out = sys.argv[1:3]
    build()
    paths = cm.along_ink(cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)))
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'tetouan-sakkala-knots',
        'title': 'Stars and square knots of the Sakkala (Tetouan)',
        'short': 'Sakkala square knots', 'subtitle': 'Sakkala, Tetouan',
        'fold': 4, 'star': 8, 'style': 'Moroccan', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s MOR2615 vector drawing. '
                    'The band centre lines were snapped to exact values. The drawing gives no steps. '
                    'We devised the construction, reusing the star of the Leones doors. '
                    'The crossing V sets the small square at each cell corner.',
            'changes': 'The compass steps, their order and the named points are ours. '
                       'The tutorial draws the centre lines of Wichmann’s 5 pt bands. '
                       'The palette is illustrative; no photograph was checked.',
            'reviewed': '2026-10-26'},
        'credits': [{
            'source': 'Tiling Search, data173/MOR2615: Sakkala, Tetouan',
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': 'https://tilingsearch.mit.edu/HTML/data173/MOR2615.html',
            'note': 'Read from his finished drawing, not construction instructions. '
                    'His reference is David Wade photograph MOR 2615x of the Sakkala, Tetouan. '
                    'His page also links Wade photograph EPC 039.'}],
        'given': {'O': 'The centre of an eight-pointed star.',
                  'A': 'Halfway to the next star on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They close the stars and the small square knots between them.',
                'paths': paths},
        'pattern': {'cell': 'tile', 'palette': 'Marinid zellige', 'look': 'interlace',
                    'text': 'Put copies of the square tile side by side. A square knot sits at every corner between four stars.',
                    'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]}}
    cm.write(tut, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')


NAMES = {(6, .515): ('hexagon', 'a'), (16, .402): ('star', 'b'),
         (8, .343): ('eight', 'ground'), (3, .086): ('triangle', 'c'),
         (4, .071): ('kite', 'ground'), (4, .059): ('square', 'd'),
         (5, .056): ('pentagon', 'c')}
if __name__ == '__main__':
    cm.run(main, NAMES)
