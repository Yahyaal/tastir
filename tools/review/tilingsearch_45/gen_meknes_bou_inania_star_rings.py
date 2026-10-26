#!/usr/bin/env python3
"""P164, Bou Inania madrasa, Meknes. The 11 pt band centre lines snap to
(a+b*sqrt(2)/2)/2 in OA units, OA=198.17 pt, worst error 0.00078.
The square repeat is 396.34 pt: three equal stars and one smaller star.
The first five steps are shared with the Moulay Idriss interlace. The added
lines come from star corners and the midpoint M; all are intersections of
earlier elements. See the report for independent source-polygon areas.

Usage: gen_meknes_bou_inania_star_rings.py <P164-pieces.json> <tutorial.json>
       gen_meknes_bou_inania_star_rings.py finish <dump.json> <tutorial.json>
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, put, step
import gen_moulay_idriss_interlace as mi

ORIGIN, PERIOD, BAND = (297.5, 373.74), 396.34, 11


def build():
    mi.build_star()
    cm.steps[1]['textWithoutHelpers'] = cm.steps[1]['text']
    step('The vertical line through M crosses the horizontal line through C at N. '
         'Draw a line through M parallel to line AC. Turn it round O by 90°, three times.')
    cm.steps[-1]['textWithoutHelpers'] = (
        'The vertical line through M crosses the horizontal line through C at N. '
        'Draw a line through N parallel to the line from O to K1.')
    g.meet('N', 'ev', 'gy', (.5, 1))
    g.line_par('md', 'M', 'ac')
    g.repeat('mdp', ['md'], 'rot4')

    step('The vertical line through M crosses the star’s lower right side at U. '
         'Draw a line through U parallel to line AC. Turn it round O by 90°, three times.')
    g.meet('U', 'ev', 'td@3', (.5, 1-mi.H))
    g.line_par('ud', 'U', 'ac')
    g.repeat('udp', ['ud'], 'rot4')

    step('The vertical line through M crosses the star’s upper left side at V. '
         'Draw a line through V parallel to line AC. Turn it round O by 90°, three times.')
    g.meet('V', 'ev', 'td@1', (.5, mi.H))
    g.line_par('vd', 'V', 'ac')
    g.repeat('vdp', ['vd'], 'rot4')

    step('The vertical line through S crosses the star’s upper right side at J. '
         'Draw a line through J parallel to the line from O to K1. '
         'Turn it round O by 90°, three times.')
    g.meet('J', 'sv', 'td', (mi.A, mi.R-mi.A))
    g.line_par('jd', 'J', 'd45')
    g.repeat('jdp', ['jd'], 'rot4')

    step('The horizontal line through S crosses line AC at X. Draw a vertical line through X. '
         'Turn it round O by 90°, three times.')
    g.meet('X', 'ac', 'sv@1', (1-mi.A, mi.A))
    g.line_par('xv', 'X', 'v')
    g.repeat('xvp', ['xv'], 'rot4')

    step('The diagonal through J crosses the diagonal through V at F. Draw a horizontal line through F. '
         'Turn it round O by 90°, three times.')
    g.meet('F', 'jd', 'vd', (.5+mi.A, 3*mi.H/2-.5))
    g.line_par('fh', 'F', 'h')
    g.repeat('fhp', ['fh'], 'rot4')

    step('The vertical line through M crosses the horizontal line through C at N. '
         'Draw a line through N parallel to line AC. Turn it round O by 90°, three times.')
    g.line_par('nd', 'N', 'ac')
    g.repeat('ndp', ['nd'], 'rot4')


def main():
    pieces, out = sys.argv[1:3]
    build()
    paths = cm.along_ink(cm.network(cm.frame_pieces(pieces, ORIGIN, PERIOD, BAND)))
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'meknes-bou-inania-star-rings',
        'title': 'Star rings of the Bou Inania madrasa (Meknes)',
        'short': 'Meknes star rings', 'subtitle': 'Bou Inania madrasa, Meknes',
        'fold': 4, 'star': 8, 'style': 'Moroccan', 'level': 'advanced',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s P164 vector drawing. '
                    'The band centre lines were snapped to exact values on a half-OA grid. '
                    'The drawing gives no steps. We devised the construction, sharing its first five steps '
                    'with the Moulay Idriss interlace: the square’s midpoint sets the first star, '
                    'then its inner corners and the midpoint set the remaining lines.',
            'changes': 'The compass steps, their order and the named points are ours. '
                       'The tutorial draws the centre lines of Wichmann’s 11 pt interlaced bands. '
                       'The full square repeat contains three equal stars and one smaller star. '
                       'The palette is illustrative; no photograph was checked.',
            'reviewed': '2026-10-26'},
        'credits': [{
            'source': 'Tiling Search, data153/P164: Bou Inania Madrasah, Meknes',
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': 'https://tilingsearch.mit.edu/HTML/data153/P164.html',
            'note': 'Read from his finished drawing, not construction instructions. '
                    'His references are David Wade photograph MOR 0913 (Bou Inania madrasa, Meknes); '
                    'Clévenot, page 164 (Kasbah, Tiwat, with adapted colouring); '
                    'Wichmann and Wade, Islamic Design: a Mathematical Approach, figures 9.2 and 9.4b; '
                    'and Paccard, Traditional Islamic Craft in Moroccan Architecture, volume 1 page 396.'}],
        'given': {'O': 'The centre of a star between four smaller stars.',
                  'A': 'The next star centre on the horizontal line.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange. They close the two sizes of stars and the pieces round them.',
                'paths': paths},
        'pattern': {'cell': 'tile', 'palette': 'Marinid zellige', 'look': 'interlace',
                    'text': 'Put copies of the square tile side by side. A smaller star sits among each group of three larger stars.',
                    'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]}}
    cm.write(tut, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')


NAMES = {(9, .143): ('ring_arm', 'b'), (6, .129): ('long_hexagon', 'c'),
         (16, .101): ('star', 'd'), (8, .086): ('eight', 'ground'),
         (6, .086): ('short_hexagon', 'a'), (6, .078): ('arrow', 'a'),
         (16, .071): ('small_star', 'd'), (4, .025): ('dart', 'ground'),
         (3, .021): ('triangle', 'ground'), (4, .018): ('kite', 'ground')}
if __name__ == '__main__':
    cm.run(main, NAMES)
