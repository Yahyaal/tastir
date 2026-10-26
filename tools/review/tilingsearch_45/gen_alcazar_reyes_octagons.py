#!/usr/bin/env python3
"""NC7. Precision2 pieces; OA=24.1427483684pt, band6pt, half-side4+3sqrt(2).
Source residual0.000495 OA on a+b*sqrt(2)/2. Reuse the Rabat octagon grid,
omitting its Y1 diagonal and adding three exact crossing/compass steps.
Usage: this script pieces.json tutorial.json; then finish dump.json tutorial.json.
"""
import os
import sys
sys.path.insert(0,os.path.dirname(__file__))
import common as cm
from common import g,step
import medium
import gen_rabat_throne_octagons as throne
from gen_meknes_bou_inania_rosette_rings import crossing_set
H,L=throne.H,throne.L


def build():
    throne.build(include_y1=False)
    step('The vertical side from S8 to S2 crosses the horizontal line at J. '
         'Draw a circle with centre J and radius OE. It crosses the horizontal line at M, to the right. '
         'Draw a vertical line through M. Draw a line through F2 parallel to the line from S1 to S3. '
         'Turn both lines round O by 90°, three times.', 'compass')
    g.meet('J','q14','h',(H,0));g.circle_from('cj','J','O','E')
    g.meet('M','cj','h',(3*H,0));g.line_par('mv','M','v');g.line_par('fd','F2','q01')
    g.repeat('mfp',['mv','fd'],'rot4')
    step('Draw a circle with centre T1 and radius OM. It crosses the horizontal line at N, towards O. '
         'Draw a vertical line through N. Turn it round O by 90°, three times. '
         'It crosses the horizontal line through R at U1. '
         'Draw a line through U1 parallel to the line from S1 to S3. Turn it round O by 90°, three times.', 'compass')
    g.circle_from('cn','T1','O','M');g.meet('N','cn','h',(4+3*H,0))
    g.line_par('nv','N','v');g.repeat('np',['nv'],'rot4')
    g.meet('U1','nv','rh',(4+3*H,1+H));g.line_par('u1d','U1','q01');g.repeat('u1p',['u1d'],'rot4')
    crossing_set('U2','pv','rd@3',(2+5*H,1+3*H),[('u2d','q01')],
                 'The vertical line through P1 crosses the diagonal through R, turned by 270°, at U2. '
                 'Draw a line through U2 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')


SPEC={'id':'alcazar-reyes-octagon-bands','title':'Octagons of the Dormitorio de Reyes Moros (Alcázar, Seville)',
    'short':'Alcázar Reyes octagons','subtitle':'Dormitorio de Reyes Moros, Alcázar Real, Seville',
    'code':'NC7','folder':'data174','frame':((297.5,372.61),199/L,6,L),
    'style':'Spanish','palette':'Alhambra','look':'interlace',
    'given':{'O':'The centre of a small eight-pointed star.','A':'A point of that star.'},
    'note':'The finished design was read from Wichmann’s NC7 drawing. Its band centre lines fit exact '
           'square-root-of-two values. The opening shares the Rabat throne-room octagon grid; '
           'three further crossing and compass steps complete the different stars and octagonal bands.',
    'changes':'The 6 pt bands are represented by their centre lines. The palette is illustrative; no photograph was checked.',
    'references':'His references are Nick Crossling’s photograph, personal communication, of wood inlay in the '
                 'Dormitorio de Reyes Moros and vestibule of the Alcázar, Seville; and V&A tin-glazed earthenware tile '
                 '308:100-1866 from Toledo, fifteenth century, record O160017.',
    'small':{'triangle','kite','square'},
    'ink':'Ink the lines picked out in orange. They close the octagons, the two sizes of stars and the small square knots.'}
NAMES={(8,9.657):('octagon','a'),(18,4.899):('eighteen','b'),(14,4.657):('fourteen','b'),
       (16,4.485):('large_star','d'),(6,3):('hexagon','c'),(16,2.343):('star','d'),
       (8,2):('eight','b'),(3,.5):('triangle','ground'),(4,.414):('kite','ground'),(4,.343):('square','a')}
if __name__=='__main__':medium.run(build,SPEC,NAMES)
