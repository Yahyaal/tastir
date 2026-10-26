#!/usr/bin/env python3
"""C268A: three sizes of stars in the Moulay Idriss zaouia interlace.

The 10 pt bands are reduced to their centre lines. The small stars are
233.14 pt apart, but their surroundings alternate, so OA is 233.14 pt and
the full repeat 466.28 pt. In a half-OA unit all corners have the form
 a + b*sqrt(2)/2 (worst residual 0.0008). With a=(1-sqrt(2)/2)/2, the
axis lines lie at a, 3a, 1-3a, 1-a. Diagonal intercepts are
(sqrt(2)-1)/2, 1/2, (3-sqrt(2))/2, (1+sqrt(2))/2, (5-sqrt(2))/2.
The construction below obtains each from earlier crossings.

Usage: gen_moulay_idriss_interlace.py <C268A-pieces.json> <tutorial.json>
       gen_moulay_idriss_interlace.py finish <dump.json> <tutorial.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, put, step

H = math.sqrt(.5)
A = (1-H)/2
R = (math.sqrt(2)-1)/2
ORIGIN, PERIOD, BAND = (299.78, 373.28), 466.28, 10


def build():
    cm.cell_square(
        'Draw a vertical line through O. The circle crosses the two lines at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'The four corners are K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The circle crosses the two lines at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through C. '
        'It crosses the vertical line through A at K1. Draw a straight line through O and K1.')

    step('Draw a straight line through A and C. It crosses the line from O to K1 at E. '
         'Draw a vertical line through E. It crosses the horizontal line at M. '
         'Draw a line through O at 90° to the line from O to K1.')
    g.line_through('ac', 'A', 'C')
    g.meet('E', 'ac', 'd45', (.5, .5))
    g.line_par('ev', 'E', 'v')
    g.meet('M', 'ev', 'h', (.5, 0))
    g.line_perp('d135', 'O', 'd45')

    step('Draw a circle with centre O through E. It crosses the horizontal line at G. '
         'Draw a circle with centre O and radius MG. '
         'It crosses the horizontal line at T and the line from O to K1 at S.', 'compass')
    g.circle_through('ch', 'O', 'E')
    g.meet('G', 'ch', 'h', (H, 0))
    g.circle_from('cs', 'O', 'M', 'G')
    g.meet('T', 'cs', 'h', (R, 0))
    g.meet('S', 'cs', 'd45', (A, A))

    step('Draw a vertical line through S. Turn it round O by 90°, three times. '
         'Draw a line through T parallel to line AC. Turn it round O by 90°, three times. '
         'The eight lines make the star at O.')
    g.line_par('sv', 'S', 'v')
    g.repeat('svp', ['sv'], 'rot4')
    g.line_par('td', 'T', 'ac')
    g.repeat('tdp', ['td'], 'rot4')

    step('Draw a line through M parallel to line AC. Turn it round O by 90°, three times.')
    g.line_par('md', 'M', 'ac')
    g.repeat('mdp', ['md'], 'rot4')

    step('The vertical line through M crosses the star’s lower right side at U. '
         'Draw a line through U parallel to line AC. Turn it round O by 90°, three times.')
    g.meet('U', 'ev', 'td@3', (.5, 1-H))
    g.line_par('ud', 'U', 'ac')
    g.repeat('udp', ['ud'], 'rot4')

    step('The vertical line through M crosses the star’s upper left side at V. '
         'Draw a line through V parallel to line AC. Turn it round O by 90°, three times.')
    g.meet('V', 'ev', 'td@1', (.5, H))
    g.line_par('vd', 'V', 'ac')
    g.repeat('vdp', ['vd'], 'rot4')

    step('The vertical line through A crosses the star’s lower right side at W. '
         'Draw a line through W parallel to line AC. Turn it round O by 90°, three times.')
    g.meet('W', 'gx', 'td@3', (1, 1-R))
    g.line_par('wd', 'W', 'ac')
    g.repeat('wdp', ['wd'], 'rot4')

    step('The horizontal line through S crosses line AC at X. Draw a vertical line through X. '
         'Turn it round O by 90°, three times.')
    g.meet('X', 'ac', 'sv@1', (1-A, A))
    g.line_par('xv', 'X', 'v')
    g.repeat('xvp', ['xv'], 'rot4')

    step('The vertical line through S crosses the diagonal through M at Y. Draw a horizontal line through Y. '
         'Turn it round O by 90°, three times.')
    cm.steps[-1]['textWithoutHelpers'] = (
        'The horizontal line through the star’s lower corner crosses the diagonal through M at Q. '
        'Draw a vertical line through Q.')
    g.meet('Q', 'sv@3', 'md@3', (H/2, -A))
    g.meet('Y', 'sv', 'md', (A, H/2))
    g.line_par('yh', 'Y', 'h')
    g.repeat('yhp', ['yh'], 'rot4')

    step('The vertical copy of the line through Y crosses the diagonal through U at Z. '
         'Draw a horizontal line through Z. Turn it round O by 90°, three times.')
    g.meet('Z', 'yh@3', 'ud', (H/2, 3*A))
    g.line_par('zh', 'Z', 'h')
    g.repeat('zhp', ['zh'], 'rot4')

    step('The horizontal line through Z crosses line AC at L. Draw a vertical line through L. '
         'Turn it round O by 90°, three times.')
    g.meet('L', 'zh', 'ac', (1-3*A, 3*A))
    g.line_par('lv', 'L', 'v')
    g.repeat('lvp', ['lv'], 'rot4')


def main():
    pieces, out = sys.argv[1:3]
    build()
    paths = cm.along_ink(cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)))
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'moulay-idriss-interlace',
        'title': 'Interlaced stars of the Moulay Idriss zaouia (Fez)',
        'short': 'Moulay Idriss interlace', 'subtitle': 'Moulay Idriss zaouia, Fez',
        'fold': 4, 'star': 8, 'style': 'Moroccan', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s C268A vector drawing. '
                    'The band centre lines were snapped to exact values on a half-OA grid. '
                    'The drawing gives no steps. We devised the construction from the square’s midpoint '
                    'and two squares on the circle of radius MG.',
            'changes': 'The compass steps, their order and the named points are ours. '
                       'The tutorial draws the centre lines of Wichmann’s 10 pt interlaced bands. '
                       'Its square cell spans two small-star spacings because their surroundings alternate. '
                       'The palette is illustrative; no photograph was checked. '
                       'The page heading names Moulay Idriss zaouia, while its Wade references name Moulay Ishmael mosque.',
            'reviewed': '2026-10-26'},
        'credits': [{
            'source': 'Tiling Search, data152/C268A: Moulay Idriss Zaouia, Fez',
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': 'https://tilingsearch.mit.edu/HTML/data152/C268A.html',
            'note': 'Read from his finished drawing, not construction instructions. '
                    'His references are Castéra, Arabesques, page 268 right (Moulay Idriss zaouia, original colouring); '
                    'Wichmann and Wade, Islamic Design: a Mathematical Approach, figure 9.9a; '
                    'and David Wade photographs MOR 0616 and MOR 0329, captioned Moulay Ishmael mosque, Fez.'}],
        'given': {'O': 'The centre of a small star inside a large star.',
                  'A': 'The next small-star centre on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They close the stars, their rings and the small pieces between them.',
                'paths': paths},
        'pattern': {'cell': 'tile', 'palette': 'Marinid zellige', 'look': 'interlace',
                    'text': 'Put copies of the square tile side by side. The stars’ surroundings alternate along each row.',
                    'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]}}
    cm.write(tut, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')


NAMES = {(11, .135): ('ring_arm', 'a'), (6, .129): ('long_hexagon', 'ground'),
         (16, .101): ('star', 'b'), (6, .086): ('short_hexagon', 'c'),
         (8, .086): ('eight', 'ground'), (8, .078): ('arrow', 'a'),
         (3, .021): ('triangle', 'd'), (4, .018): ('kite', 'ground'),
         (4, .015): ('square', 'd'), (5, .014): ('pentagon', 'c')}
if __name__ == '__main__':
    cm.run(main, NAMES)
