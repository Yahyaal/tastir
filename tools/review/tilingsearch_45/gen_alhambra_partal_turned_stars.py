#!/usr/bin/env python3
"""SPA0807, Alhambra, Partal (Torre de las Damas): an interlace of eight-
pointed stars, the one at O turned by 22.5° and ringed by long bands at
22.5°, the ones at the cell corners square to the cell (Tiling Search
data191/SPA0807, Wade's photo SPA 0807).

Read from the PDF: bands 9 pt wide, the stars at O and at the corners 211.06 pt
apart along each axis. OA is the star's point radius at the band centre lines
(36.21 pt). Every corner of the centre lines snaps to a + b·H (H = √2/2) in
the four directions of the cell and to the same grid in the four turned
directions; the cell's half side is L = 3 + 4H = (1 + √2)².

Lines, by their distance from O: the turned star's sides (H) and the long
bands parallel to them (2 + H); along the axes and diagonals 1 + 3H, 2 + 3H
and 3 + 3H; along the diagonals also 3 + 5H and 4 + 5H. Seen from the corner
star, the axis lines are at H (its square), 1 + H and 2 + H, and the diagonals
at H and 1 + H. The construction: the turned star; its long bands, 2 out from
its sides (a circle of radius AB on a side's end); the cell from line OS2 and
line OS1 (tan 67.5° = 1 + √2, then once more); the corner star's sides by a
circle of radius OA about K1; then each other line through a crossing of
earlier lines, turned round O.

Usage: gen_alhambra_partal_turned_stars.py <SPA0807-pieces.json> tutorials/alhambra-partal-turned-stars.json
       pnpm review alhambra-partal-turned-stars
       gen_alhambra_partal_turned_stars.py finish docs/review/alhambra-partal-turned-stars/dump.json tutorials/alhambra-partal-turned-stars.json
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import medium  # noqa: E402
import gen_leones_door_stars as le  # noqa: E402

H = math.sqrt(.5)
L = 3 + 4 * H
C22, S22 = math.cos(math.pi / 8), math.sin(math.pi / 8)
ORIGIN, HALF, BAND = (298.2563, 372.8438), 211.0594, 9.0
UNIT = HALF / L


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    g.circle_through('c', 'O', 'A')
    g.line_through('h', 'O', 'A')

    step('Draw a vertical line through O. It crosses the circle at C, at the top. '
         'The horizontal line crosses the circle at B, on the left. '
         'Draw a vertical line through A. Draw a horizontal line through C. They cross at E. '
         'Draw a straight line through O and E. Draw a line through O at 90° to line OE.')
    g.line_perp('v', 'O', 'h')
    g.meet('C', 'c', 'v', (0, 1))
    g.meet('B', 'c', 'h', (-1, 0))
    g.line_perp('ax', 'A', 'h')
    g.line_perp('cy', 'C', 'v')
    g.meet('E', 'ax', 'cy', (1, 1))
    g.line_through('d45', 'O', 'E')
    g.line_perp('d135', 'O', 'd45')

    step('Draw the line through O that halves the angle AOE. Draw the line through O that halves the angle EOC. '
         'Draw a line through O at 90° to each of them. The circle crosses the four new lines at S1 to S8.')
    g.line_bisect('t1', 'A', 'O', 'E')
    g.line_bisect('t2', 'E', 'O', 'C')
    g.line_perp('t3', 'O', 't1')
    g.line_perp('t4', 'O', 't2')
    ss = []
    for k in range(8):
        a = math.radians(22.5 + 45 * k)
        g.meet(f'S{k + 1}', 'c', ['t1', 't2', 't3', 't4'][k % 4], (math.cos(a), math.sin(a)))
        ss.append(f'S{k + 1}')

    step('Draw the turned star at O as two squares.')
    le.two_squares(ss, 'q', le.square_texts(ss, 'Draw each line long, beyond the circle.'))

    step('Draw a circle with centre S1 and radius AB. It crosses the line through S1 and S3 at N, beyond S1. '
         'Draw a line through N at 90° to that line. Turn it round O by 45°, seven times.', 'compass')
    g.circle_from('cn', 'S1', 'A', 'B')
    # q01 is the line through S1 and S3
    g.meet('N', 'cn', 'q01', (C22 + 2 * (C22 - math.cos(math.radians(112.5))) / math.sqrt(2),
                              S22 + 2 * (S22 - math.sin(math.radians(112.5))) / math.sqrt(2)))
    g.line_perp('w', 'N', 'q01')
    g.repeat('wr', ['w'], 'rot8')

    tail = ('Draw a vertical line through Q. Turn it round O by 90°, three times. '
            'The four lines make the square tile, with corners K1, K2, K3 and K4.')
    step('The line from O to S2 crosses the vertical line through A at P. Draw a horizontal line through P. '
         'The line from O to S1 crosses it at Q. ' + tail)
    cm.steps[-1]['textWithoutHelpers'] = ('The line from O to S2 crosses the vertical line through A at P. '
                                          'Q is on the line from O to S1, level with P. ' + tail)
    g.meet('P', 't2', 'ax', (1, 1 + 2 * H))
    g.line_perp('hp', 'P', 'v')
    g.meet('Q', 't1', 'hp', (L, 1 + 2 * H))
    g.line_perp('gx', 'Q', 'h')
    g.repeat('gr', ['gx'], 'rot4')
    for i, (a, b, w) in enumerate([('gx', 'gx@1', (L, L)), ('gx@1', 'gx@2', (-L, L)),
                                   ('gx@2', 'gx@3', (-L, -L)), ('gx@3', 'gx', (L, -L))]):
        g.meet(f'K{i + 1}', a, b, w)

    step('Draw a circle with centre K1 and radius OA. It crosses line OE at X, and the top side of the tile at Y. '
         'Draw a vertical line through X. Turn it round O by 45°, seven times. '
         'Draw a line through Y at 90° to line OE. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('ck', 'K1', 'c')
    g.meet('X', 'ck', 'd45', (L - H, L - H))
    g.meet('Y', 'ck', 'gx@1', (L - 1, L))
    g.line_perp('x3', 'X', 'h')
    g.repeat('x3r', ['x3'], 'rot8')
    g.line_perp('y4', 'Y', 'd45')
    g.repeat('y4r', ['y4'], 'rot4')

    step('The horizontal line through O crosses the right side of the tile at M. '
         'Draw a line through M at 90° to line OE. Turn it round O by 45°, seven times. '
         'A copy crosses the horizontal line through O at G.')
    g.meet('M', 'h', 'gx', (L, 0))
    g.line_perp('m2', 'M', 'd45')
    g.repeat('m2r', ['m2'], 'rot8')
    g.meet('G', 'h', 'm2@7', (2 + 3 * H, 0))

    step('The horizontal line through X crosses the line through M at Z. '
         'Draw a line through Z parallel to line OE. Turn it round O by 45°, seven times.')
    g.meet('Z', 'x3@2', 'm2', (H, L - H))
    g.line_par('z1', 'Z', 'd45')
    g.repeat('z1r', ['z1'], 'rot8')

    step('The vertical line through G crosses the horizontal line through X at W. '
         'Draw a line through W at 90° to line OE. Turn it round O by 90°, three times.')
    g.meet('W', 'm2@7', 'x3@2', (2 + 3 * H, 3 + 3 * H))
    g.line_perp('w5', 'W', 'd45')
    g.repeat('w5r', ['w5'], 'rot4')


SPEC = {
    'id': 'alhambra-partal-turned-stars', 'title': 'Turned stars of the Torre de las Damas, Alhambra',
    'short': 'Partal turned stars', 'subtitle': 'Torre de las Damas, Partal, Alhambra, Granada',
    'code': 'SPA0807', 'folder': 'data191', 'frame': (ORIGIN, UNIT, BAND, L),
    'given': {'O': 'The centre of the turned star.', 'A': 'A point on the star’s circle, level with O.'},
    'note': 'The finished design was read from Wichmann’s SPA0807 drawing, an interlace of bands, by their '
            'centre lines. Its corners were snapped to the square-root-of-two grid in star-radius units, in the '
            'tile’s four directions and in the four directions turned by 22.5°. The tile’s half side is '
            '(1 + √2)² star radii: line OS2 meets the vertical through A at height 1 + √2, and line OS1 '
            'carries that out to the tile’s side. One helper line, the horizontal through P, is not in the '
            'finished pattern.',
    'changes': 'The lines are the centre lines of the drawing’s bands; the over-and-under weave is drawn by '
               'the player’s interlace look. Laid over Wade’s photo SPA 0807, our lines follow the square frames '
               'and the corner stars on the flat jamb; the turned stars lie where the wall curves into the arch, so '
               'the photo could not confirm or correct them, and the drawing is kept.',
    'references': 'Wichmann cites David Wade’s photo SPA 0807 (Torre de las Damas, Partal, Alhambra, '
                  '1302–1309).',
    'look': 'interlace', 'palette': 'Alhambra',
    'ink': 'Ink the lines picked out in orange. They are the middles of the interlaced bands.',
    'repeat': 'Put copies of the square tile side by side. A turned star sits at the centre of every tile, '
              'and a square star at every corner.',
}
NAMES = {(12, 4.828): ('big_twelve', 'c'), (12, 4.43): ('twelve', 'b'), (6, 3.0): ('hexagon', 'ground'),
         (16, 2.343): ('star', 'a'), (8, 1.828): ('eight', 'd'), (8, 1.641): ('arrow', 'd'),
         (4, .586): ('dart', 'c'), (3, .5): ('triangle', 'a'), (4, .414): ('kite', 'a')}
AREAS = {'big_twelve': 4.82843, 'twelve': 4.42996, 'hexagon': 3, 'star': 2.34315, 'eight': 1.82843,
         'arrow': 1.6411, 'dart': 0.58579, 'triangle': 0.5, 'kite': 0.41421}
COUNTS = {'big_twelve': 4, 'twelve': 8, 'hexagon': 14, 'star': 2, 'eight': 4, 'arrow': 8, 'dart': 8,
          'triangle': 12, 'kite': 8}
SPEC['expect'] = {'pieceTypes': len(NAMES), 'pieces': [
    {'name': nm, 'vertices': v, 'area': AREAS[nm], 'perCell': COUNTS[nm]} for (v, _), (nm, _) in NAMES.items()]}
PHOTO = {'source': 'Photograph SPA 0807 (Torre de las Damas, Alhambra)', 'creator': 'David Wade',
         'url': 'https://patterninislamicart.com/', 'kind': 'photo',
         'note': 'The tiled dado beside the door, compared with our lines laid over the photo.'}


def add_photo_credit(path):
    import json
    t = json.load(open(path))
    t['credits'].append(PHOTO)
    t['pattern']['colors'] = {nm: slot for nm, slot in NAMES.values()}
    cm.write(t, path)


def white_centres(pieces):
    return cm.frame_pieces(pieces, ORIGIN, 2 * UNIT, BAND, keep=lambda p: min(p['fill']) > 0.95)


if __name__ == '__main__':
    medium.run(build, SPEC, NAMES, drawing=white_centres)
    if sys.argv[1] != 'finish':
        add_photo_credit(sys.argv[2])
