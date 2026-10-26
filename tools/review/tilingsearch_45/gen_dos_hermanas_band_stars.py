#!/usr/bin/env python3
"""MUL128K. Extract with precision 2. OA=36.2141225526 pt, band 7 pt;
half-side 4+2sqrt(2). Corners fit a+b*sqrt(2)/2 within 0.000359 OA.
Usage: this script pieces.json tutorial.json; then finish dump.json tutorial.json.
The opening frame is shared; the extra offsets are compass transfers and
intersections of the unit-star sides. Exact source areas are in the report.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import common as cm
from common import g, step
import medium
import gen_meknes_bou_inania_petals as mp
from gen_meknes_bou_inania_rosette_rings import crossing_set
H, L = mp.H, 4+4*mp.H
UNIT = 298.5/(4+6*H)


def build():
    mp.build_frame(4, 2)
    step('The vertical side from S8 to S2 crosses the horizontal line at P. '
         'Keep the compass open to OE. Draw circles with centres P and J1 in turn. '
         'They cross the horizontal line at J1 and J2, to the right. '
         'Draw a vertical line through each point. Turn both lines round O by 90°, three times.', 'compass')
    g.meet('P', 'q14', 'h', (H, 0))
    for i in (1, 2):
        g.circle_from(f'cj{i}', 'P' if i==1 else 'J1', 'O', 'E')
        g.meet(f'J{i}', f'cj{i}', 'h', ((2*i+1)*H, 0))
        g.line_par(f'jv{i}', f'J{i}', 'v')
    g.repeat('jp', ['jv1', 'jv2'], 'rot4')
    crossing_set('R', 'q14', 'q02', (H, 1+H), [('rh', 'h'), ('rd', 'q01')],
                 'The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
                 'Draw a horizontal line through R. Draw a line through R parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')
    g.meet('R3', 'q13', 'q01', (1+H, -H))
    cm.steps[-1]['textWithoutHelpers'] = (
        'The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
        'Draw a horizontal line through R. Turn it round O by 270°. '
        'The line from S6 to S8 crosses the line from S1 to S3 at R3. '
        'Draw a line through R3 parallel to line OE.')
    crossing_set('V', 'rh@3', 'q02', (1+H, 2+H), [('vh', 'h')],
                 'The line through R, turned by 270°, crosses the line from S3 to S5 at V. '
                 'Draw a horizontal line through V. Turn it round O by 90°, three times.')
    crossing_set('W', 'rh', 'rd@3', (2+3*H, 1+H), [('wv', 'v'), ('wd', 'q01')],
                 'The horizontal line through R crosses the diagonal through R, turned by 270°, at W. '
                 'Draw a vertical line through W. Draw a line through W parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')
    crossing_set('X', 'jv1', 'rh', (3*H, 1+H), [('xd', 'q01')],
                 'The vertical line through J1 crosses the horizontal line through R at X. '
                 'Draw a line through X parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    step('The vertical line through W crosses the horizontal line at U. '
         'Draw a circle with centre U and radius OE. It crosses the horizontal line at N, to the right. '
         'Draw a vertical line through N. Turn it round O by 90°, three times.', 'compass')
    g.meet('U', 'wv', 'h', (2+3*H, 0))
    g.circle_from('cu', 'U', 'O', 'E')
    g.meet('N', 'cu', 'h', (2+5*H, 0))
    g.line_par('nv', 'N', 'v');g.repeat('np', ['nv'], 'rot4')
    step('Draw a circle with centre K1 and radius OA. It crosses line OE at Q, towards O. '
         'Draw a vertical line through Q. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('ck', 'K1', 'c')
    g.meet('Q', 'ck', 'd45', (L-H, L-H))
    g.line_par('qv', 'Q', 'v');g.repeat('qp', ['qv'], 'rot4')
    step('Draw a circle with centre F and radius OA. It crosses the horizontal line at Z, beyond F. '
         'Draw a line through each of F2 and Z parallel to the line from S1 to S3. '
         'Turn both lines round O by 90°, three times.', 'compass')
    g.circle_from('cz', 'F', 'O', 'A');g.meet('Z', 'cz', 'h', (5, 0))
    for name, p in [('fd', 'F2'), ('zd', 'Z')]:g.line_par(name, p, 'q01')
    g.repeat('fz', ['fd', 'zd'], 'rot4')
    step('Draw circles with centre K1 and radii OA, the distance from O to F2, and OZ. '
         'They cross the vertical line through T1 at Q1, Q2 and Q3, towards T1. '
         'Draw a line through each crossing parallel to the line from S1 to S3. '
         'Turn these three lines round O by 90°, three times.', 'compass')
    for i, (p,r) in enumerate([('A',1),('F2',3),('Z',5)], 1):
        g.circle_from(f'ck{i}', 'K1', 'O', p)
        g.meet(f'Q{i}', f'ck{i}', 'gx', (L,L-r))
        g.line_par(f'qd{i}', f'Q{i}', 'q01')
    g.repeat('qdp', ['qd1','qd2','qd3'], 'rot4')


SPEC = {'id':'alhambra-dos-hermanas-band-stars',
    'title':'Star bands of the Sala de las Dos Hermanas (Alhambra)',
    'short':'Dos Hermanas star bands','subtitle':'Sala de las Dos Hermanas, Alhambra',
    'code':'MUL128K','folder':'data175','frame':((297.5,373.414375),UNIT,7,L),
    'given':{'O':'The centre of the small eight-pointed star.','A':'A point of that star.'},
    'style':'Nasrid','palette':'Alhambra','look':'interlace',
    'note':'The finished design was read from Wichmann’s MUL128K drawing. Its band centre lines fit exact '
           'square-root-of-two values. The shared unit-star opening sets the smaller stars. '
           'Four radii and two square diagonals set the half-side; compass transfers and star-side crossings set the bands.',
    'changes':'The 7 pt bands are represented by their centre lines. The palette is illustrative; no photograph was checked.',
    'references':'His reference is Edith Müller, Gruppentheoretische … der Maurischen '
                 'Ornamente aus der Alhambra … (1944), illustration 36, Sala de las Dos Hermanas.',
    'ink':'Ink the lines picked out in orange. They close the small stars, the larger stars and their connecting bands.'}
NAMES={(12,4.343):('twelve','a'),(16,4.243):('large_star','b'),(16,2.343):('star','d'),
       (8,2):('eight','c'),(14,1.828):('fourteen','ground'),(6,1.828):('hexagon','ground'),
       (8,1):('short_eight','ground'),(5,.5):('pentagon','ground'),(4,.414):('kite','ground')}
if __name__=='__main__':medium.run(build,SPEC,NAMES)
