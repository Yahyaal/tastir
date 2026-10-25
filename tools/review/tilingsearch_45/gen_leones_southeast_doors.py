#!/usr/bin/env python3
"""Builds the south-east doors of the Patio de los Leones (Alhambra), drawn by
Brian Wichmann in Tiling Search (data190/SPA0417X): a small eight-pointed star
at O, a large star with notched points at each corner of the square cell, a
twelve-sided piece at A, bows on the diagonals, diamonds and pentagons.

Read from the PDF: the drawing is bevelled, so its coloured tiles were moved
out by half the gap between them (18 pt), and every corner snapped to the grid
a + b·√2/2 in units of half the star spacing (123.65 pt, worst error 0.0007).
Wichmann draws the design turned by 45° from this frame (stars above each other
as on the doors); it is turned here so that the tile is the square cell.

Every line comes from the star at O, whose tip radius is √2 − 1 (as in
alhambra-leones-door-stars), and from the circle with centre K1 through F:
- the star's two squares, each side carried on;
- the vertical line through F (x = √2/2);
- through U, where the vertical line through Q (x = 2 − √2) crosses a side of
  the star, a line at 135° (x + y = 5 − 3√2); it crosses the vertical line
  through A at W, and the line through W at 45° gives x − y = 3√2 − 3;
and these turned round O by 90°.

Units: OA = 1; the large stars at the corners of the cell.

Usage: gen_leones_southeast_doors.py <SPA0417Xc-pieces.json> tutorials/alhambra-leones-southeast-doors.json
       pnpm review alhambra-leones-southeast-doors
       gen_leones_southeast_doors.py finish docs/review/alhambra-leones-southeast-doors/dump.json tutorials/alhambra-leones-southeast-doors.json
(SPA0417Xc-pieces.json: the coloured pieces of SPA0417X-pieces.json, from
0_vectors.py and 1_pieces.py in tools/review/alhambra_wichmann/.)
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, put, step  # noqa: E402
from gen_leones_door_stars import square_texts, star_points, two_squares  # noqa: E402

R2 = math.sqrt(2)
R = R2 - 1
H = R2 / 2


def build():
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'These lines make the square cell, with corners K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. They cross at K1, a corner of the cell. '
        'Draw a straight line through O and K1.')

    step('The circle crosses the line from O to K1 at F. Draw a circle with centre K1 through F. '
         'It crosses the horizontal line through C at Q. '
         'Draw a circle with centre O and the same radius.', 'compass', ['K1'])
    g.meet('F', 'c', 'd45', (H, H))
    g.circle_through('ck', 'K1', 'F')
    g.meet('Q', 'ck', 'gy', (2 - R2, 1))
    cm.circle_radius_of('cs', 'O', 'ck')

    step('Draw the line through O at 90° to the line from O to K1. '
         'The small circle with centre O crosses the four lines through O at S1 to S8.', 'ruler', ['cs'])
    g.line_perp('d135', 'O', 'd45')
    pts = star_points('S', 'cs', R)

    step('Draw the small star at O as two squares.', 'ruler', ['cs'])
    two_squares(pts, 'q', square_texts(pts, 'Draw each line long, to the sides of the cell.'))

    step('Draw a vertical line through F. Draw a vertical line through Q. '
         'It crosses the side of the star through S7 and S1 at U. '
         'Draw a line through U parallel to the line from S4 to S8. It crosses the vertical line through A at W.',
         'ruler', ['F', 'Q'])
    g.line_par('fv', 'F', 'v')
    g.line_par('qv', 'Q', 'v')
    g.meet('U', 'qv', 'q04', (2 - R2, 3 - 2 * R2))
    g.line_par('ul', 'U', 'd135')
    g.meet('W', 'ul', 'gx', (1, 4 - 3 * R2))

    step('Draw a line through W parallel to the line from O to K1.', 'ruler', ['W'])
    g.line_par('wl', 'W', 'd45')

    step('Turn the lines through F, U and W round O by 90°, three times.')
    g.repeat('cp', ['fv', 'ul', 'wl'], 'rot4')


def drawing(pieces):
    """Wichmann's tiles moved out to the middles of the bands, turned by 45°
    into the tutorial's frame (his neighbouring large star (2, 0) goes to K4)."""
    polys = cm.frame_pieces(pieces, (297.5, 375.8), 247.3, 18.0)
    return [[((x + y) / 2, (y - x) / 2) for x, y in P] for P in polys]


def main():
    pieces, out = sys.argv[1], sys.argv[2]
    build()
    segs = cm.network(drawing(pieces))
    paths = cm.along_ink(segs)
    step('Join K1, K2, K3 and K4 to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': ['K1', 'K2', 'K3', 'K4']})
    tut = {
        'format': 0, 'id': 'alhambra-leones-southeast-doors',
        'title': 'Stars and diamonds of the Patio de los Leones south-east doors (Alhambra)',
        'short': 'Leones south-east doors', 'subtitle': 'Patio de los Leones, Alhambra', 'fold': 4, 'star': 8,
        'style': 'Nasrid', 'level': 'intermediate',
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': 'The finished design was read from Brian Wichmann’s SPA0417X drawing, its corners snapped to '
                    'exact values. We devised the construction: a small star at O with the tip radius of the Leones '
                    'door stars, its sides carried on, and lines at 45° through two points that follow from the circle with '
                    'centre K1. The drawing gives no steps.',
            'changes': 'Wichmann draws the design turned by 45°, with the stars above each other as on the doors; '
                       'it is turned here so that the tile is the square cell. His bevelled bands are drawn as '
                       'single lines along their middles. The compass steps, their order and the named points are '
                       'ours. The comparison with the drawing checks the finished lines, not how the design was '
                       'first laid out.',
            'reviewed': '2026-10-25'},
        'credits': [
            {'source': 'Tiling Search, data190/SPA0417X: Alhambra, Patio de los Leones', 'creator': 'Brian Wichmann',
             'url': 'https://tilingsearch.mit.edu/HTML/data190/SPA0417X.html', 'kind': 'drawing',
             'note': 'The design was read from his drawing of the south-east doors in the corners of the Patio de los '
                     'Leones (1370–76). The construction is ours.'},
            {'source': 'Photograph SPA 0417x (Patio de los Leones)', 'creator': 'David Wade',
             'url': 'https://patterninislamicart.com/', 'kind': 'photo',
             'note': 'The real doors, compared with our lines laid over the photo.'}],
        'given': {'O': 'The centre of a small eight-pointed star.',
                  'A': 'The centre of a twelve-sided piece, halfway to the next small star.'},
        'steps': cm.steps,
        'ink': {'text': 'Ink the small star at O and the bands that carry its sides on. The bands turn round the '
                        'diamonds and close the large stars at the corners, the bows and the pentagons.',
                'paths': paths},
        'pattern': {'cell': 'tile',
                    'text': 'Put copies of the square cell side by side. A large star sits at every corner of every '
                            'cell, and a small star at every centre.',
                    'palette': 'Alhambra', 'look': 'strapwork', 'colors': {}},
        'expect': {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]},
    }
    cm.write(tut, out)
    print(len(cm.steps), 'steps,', len(cm.el), 'elements,', len(paths), 'ink paths')


NAMES = {(16, 0.402): ('small_star', 'a'), (24, 0.853): ('large_star', 'ground'), (12, 0.451): ('twelve', 'b'),
         (10, 0.23): ('bow', 'c'), (5, 0.056): ('pentagon', 'd'), (4, 0.059): ('diamond', 'a')}

if __name__ == '__main__':
    cm.run(main, NAMES)
