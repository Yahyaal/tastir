#!/usr/bin/env python3
"""MET1 (Tiling Search data193/MET1, a Mughal jali screen in the Met, 1993.67.2)
and SM27 (data206/SM27, Salim Chishti's tomb, Fatehpur Sikri), sixteen-fold
batch S4. Two drawings of one design that differ only in the four pieces round
the centre of the cell: MET1 has hooked octagons there, SM27 a pinwheel of
hexagons. Both are on Wichmann's list of two-level patterns, but each drawing
is one edge-to-edge tiling (thick and thin bands only), so it is built as one.

Reading the drawing (27 October 2026): the pieces are drawn edge to edge, with
no band gap. The square repeat is 267.06 pt. Every piece turns into itself by
90° about the pinwheel at the cell's centre, but the four pieces round it have
no mirror, so the design is p4 (chiral), not p4m as the page says. O is that
centre and OA half the repeat, so the cell is |x|, |y| <= 1.
Every edge runs at a multiple of 22.5°, on these lines (distances from O):
- the sides of the octagon inscribed in the circle through A (cos 22.5° =
  0.9239; drawing 0.9238);
- P is the incentre of the triangle O A S3: on the 22.5° line OS2, where the
  line through A halving the angle OAS3 crosses it. rho = OP = tan 33.75° =
  0.66818 (drawing 0.6681); the eight lines at 90° to OS2 and its turns
  through P (drawing 0.6681);
- the horizontal and 45° lines through P, turned, at rho·sin 22.5° = 0.25570
  (drawing 0.2557);
- MET1 only: horizontals 0.1059 from O, through the crossing of the vertical
  and the 135° line through P's turns (drawing 0.1059);
- SM27 only: the 22.5° lines through O.
Every other line runs through a crossing of these (the greedy plan).

Use: gen_mughal_jali_octagons.py <met1|sm27> <pieces.json> <tutorial.json>, then
pnpm review <id>, then gen_mughal_jali_octagons.py <met1|sm27> finish <dump.json> <tutorial.json>.
Lab: gen_mughal_jali_octagons.py <met1|sm27> lab <pieces.json>
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import common as cm  # noqa: E402
from common import g, step  # noqa: E402
import snap16_s2 as s16  # noqa: E402

C22, S22 = math.cos(math.pi / 8), math.sin(math.pi / 8)
RHO = math.tan(math.radians(33.75))
SP = RHO * S22
L = 1.0
VARIANT = sys.argv[1]
del sys.argv[1]
FRAMES = {'met1': ((271.97, 366.07), 133.53), 'sm27': ((267.37, 364.17), 133.53)}
ORIGIN, UNIT = FRAMES[VARIANT]


def opening():
    """The steps both drawings share: the circle in sixteen, the octagon, P,
    the lines through P and the tile."""
    s16.opening(odd=False)
    step('Join S1, S3, S5, S7, S9, S11, S13 and S15 with straight lines. They make an octagon.')
    g.line_through('o1', 'S1', 'S3')
    g.repeat('o1r', ['o1'], 'rot8')
    step('Draw the line through A that halves the angle between the horizontal line and the octagon’s side through S3. '
         'It crosses the line from O to S2 at P.')
    g.line_bisect('b1', 'O', 'A', 'S3')
    g.meet('P', 'b1', 'r2', (RHO * C22, RHO * S22))
    step('Draw a line through P at 90° to the line from O to S2. Turn it round O by 45°, seven times. '
         'These eight lines make a smaller octagon.')
    g.line_perp('p8', 'P', 'r2')
    g.repeat('p8r', ['p8'], 'rot8')
    step('Draw a horizontal line through P. Draw a line through P parallel to the line from O to S3. '
         'Turn the two new lines round O by 90°, three times.')
    g.line_par('ph', 'P', 'h')
    g.line_par('pd', 'P', 'd45')
    g.repeat('pr', ['ph', 'pd'], 'rot4')
    step('Draw a vertical line through A. Turn it round O by 90°, three times. '
         'The four lines make the square tile, with corners K1, K2, K3 and K4.')
    g.line_perp('gx', 'A', 'h')
    g.repeat('gr', ['gx'], 'rot4')
    for i, (a, b, w) in enumerate([('gx', 'gx@1', (L, L)), ('gx@1', 'gx@2', (-L, L)),
                                   ('gx@2', 'gx@3', (-L, -L)), ('gx@3', 'gx', (L, -L))]):
        g.meet(f'K{i + 1}', a, b, w)


DESCS = {
    'o1': 'line S1S3', 'p8': 'the line through P at 90° to line OS2', 'ph': 'the horizontal line through P',
    'pd': 'the 45° line through P', 'gx': 'the right side of the tile', 'b1': 'the line halving the angle OAS3',
    'h': 'the horizontal line through O', 'v': 'the vertical line through O',
    'd45': 'line OS3', 'd135': 'line OS7'}
ORDERS = {'o1': 8, 'p8': 8, 'ph': 4, 'pd': 4, 'gx': 4}


def seeds():
    opening()


def lab():
    import json
    seeds()
    polys = cm.frame_pieces(sys.argv[2], ORIGIN, 2 * UNIT, 0)
    s16.HAVE_TOL[0] = 2e-3
    nd = s16.need(polys, L)
    left = s16.missing(nd)
    print('needed', len(nd), 'missing', [(k * 11.25, round(o, 4)) for k, o in left])
    s16.DESC.update(DESCS)
    s16.ORDER.update(ORDERS)
    pl = s16.plan(polys, L, tol=1.5e-3, verbose=True)
    print(json.dumps(pl))


WITHOUT2 = ('Draw a vertical line through O. It crosses the circle at S5. '
            'Draw the line through O that halves the angle between the horizontal and the vertical line. '
            'It crosses the circle at S3. Draw a line through O at 90° to it. '
            'Draw the line through O that halves the angle between the horizontal line and the line through S3. '
            'It crosses the circle at S2.')


def build():
    opening()
    if VARIANT == 'met1':
        cm.steps[1]['textWithoutHelpers'] = WITHOUT2
    if VARIANT == 'met1':
        step('The horizontal line through P crosses a 135° line from step 6 at Q, near the vertical line through O. '
             'Draw a vertical line through Q. Turn it round O by 90°, three times.')
        g.meet('Q', 'ph', 'pd@1', (SP * (math.sqrt(2) - 1), SP))
        g.line_perp('qv', 'Q', 'h')
        g.repeat('qr', ['qv'], 'rot4')


COMMON_NOTE = (
    'The finished design was read from Wichmann’s {code} drawing, whose pieces are drawn edge to edge. '
    'O is the centre of the four pieces that turn round the middle of the tile, and OA is half the repeat. '
    'Every edge runs at a multiple of 22.5° and lies on one of a few lines: the sides of the octagon in the '
    'circle through A (drawing 0.9238 from O, cos 22.5° = 0.9239), the sides of a smaller octagon through P '
    '(drawing 0.6681, tan 33.75° = 0.6682), where P is the centre of the circle inside the triangle OAS3, and the '
    'horizontal, vertical and 45° lines through P and its turns (drawing 0.2557, 0.2557 exactly). {extra}')
EXTRA = {
    'met1': 'The four hooked pieces round O need one more line each way, through the crossing Q '
            '(drawing 0.1059 from O, 0.1059 exactly).',
    'sm27': 'The four pinwheel pieces round O lie on the 22.5° lines through O.'}
SPECS = {
    'met1': {
        'id': 'mughal-jali-octagons', 'title': 'Octagons of a Mughal jali screen',
        'short': 'Jali screen octagons', 'subtitle': 'Jali screen, India (Metropolitan Museum of Art)',
        'code': 'MET1', 'folder': 'data193',
        'given': {'O': 'The centre of the tile, where four hooked pieces turn round one point.',
                  'A': 'A corner of the large octagon round O, halfway to the next tile’s centre.'},
        'references': 'His references are the Metropolitan Museum of Art’s jali screen 1993.67.2 (India), and '
                      'Fig. 15.2 of Wichmann and Wade, Islamic Design: a Mathematical Approach (Springer, 2017), '
                      'with David Wade’s photo IND 0820 of the same design at Salim Chishti’s tomb, Fatehpur Sikri.',
    },
    'sm27': {
        'id': 'salim-chishti-octagons', 'title': 'Octagons of Salim Chishti’s tomb (Fatehpur Sikri)',
        'short': 'Salim Chishti octagons', 'subtitle': 'Tomb of Salim Chishti, Fatehpur Sikri',
        'code': 'SM27', 'folder': 'data206',
        'given': {'O': 'The centre of the tile, where four pieces turn round one point like a pinwheel.',
                  'A': 'A corner of the large octagon round O, halfway to the next tile’s centre.'},
        'references': 'His references are David Wade’s photo IND 0820 and a photo by Richard Henry, both of '
                      'Salim Chishti’s tomb, Fatehpur Sikri (1571).',
    },
}
SPEC = dict(SPECS[VARIANT])
SPEC.update({
    'frame': (ORIGIN, UNIT, 0, L), 'star': None, 'style': 'Mughal', 'palette': 'Timurid tile',
    'look': 'strapwork', 'chiral': True,
    'note': COMMON_NOTE.format(code=SPEC['code'], extra=EXTRA[VARIANT]),
    'changes': 'Wichmann’s page gives the symmetry as p4m, but the four pieces round the centre of the tile '
               'turn without a mirror, so the design is a pinwheel; we follow the drawing. His thick and thin '
               'bands (the two levels of the design) are drawn as plain lines. Colours follow the shapes, not his '
               'drawing, which is one colour. No photograph was checked.',
    'ink': 'Ink the lines picked out in orange. They close the octagons, the stars between them and the '
           'pieces round O.',
    'repeat': 'Put copies of the square tile side by side. The large octagons touch at the middles of the '
              'tile’s sides.',
})
NAMES = {(10, 0.226): ('decagon', 'ground'), (4, 0.121): ('corner_kite', 'a'), (4, 0.092): ('kite', 'c'),
         (4, 0.071): ('rhombus', 'b'), (4, 0.054): ('small_kite', 'd'),
         (8, 0.077): ('hook', 'a'), (6, 0.077): ('pinwheel', 'a')}

if __name__ == '__main__':
    if sys.argv[1] == 'lab':
        lab()
    else:
        import medium
        medium.run(build, SPEC, NAMES, drawing=lambda pcs: cm.frame_pieces(pcs, ORIGIN, 2 * UNIT, 0))
