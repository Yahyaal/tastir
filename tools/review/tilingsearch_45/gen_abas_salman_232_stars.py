#!/usr/bin/env python3
"""PG232. Plain pieces, precision2. OA=36.2141225526pt; half-side2+sqrt(2).
Source corners fit a+bH within0.000235 OA. Use the shared unit-star frame,
then axis parallels through R,V and three diagonal families from exact
crossings/compass transfers. Usage: this script pieces.json tutorial.json;
then finish dump.json tutorial.json.
"""
import os
import sys
sys.path.insert(0,os.path.dirname(__file__))
import common as cm
from common import g,step
import medium
import gen_meknes_bou_inania_petals as mp
from gen_meknes_bou_inania_rosette_rings import crossing_set
H,L=mp.H,2+2*mp.H
UNIT=298.5/(4+6*H)


def build():
    mp.build_frame(2,1)
    step('The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
         'Draw a horizontal line through R. Draw a line through R parallel to the line from S1 to S3. '
         'Turn both lines round O by 90°, three times. '
         'The line through R, turned by 270°, crosses the line from S3 to S5 at V. '
         'Draw a horizontal line through V. Turn it round O by 90°, three times. '
        'The line from S2 to S4 crosses the line from S5 to S7 at R1. '
        'Draw a line through R1 parallel to line OE.')
    g.meet('R','q14','q02',(H,1+H));g.line_par('rh','R','h');g.line_par('rd','R','q01');g.repeat('rp',['rh','rd'],'rot4')
    g.meet('V','rh@3','q02',(1+H,2+H));g.line_par('vh','V','h');g.repeat('vp',['vh'],'rot4')
    g.meet('R1','q11','q03',(-1-H,H))
    cm.steps[-1]['textWithoutHelpers']=(
        'Draw a horizontal line through R. Turn it round O by 90°, three times. '
        'Draw a horizontal line through V. Turn it round O by 90°, three times.')
    crossing_set('X','q14','rd@1',(H,1+3*H),[('xd','q01')],
                 'The vertical side from S8 to S2 crosses the diagonal through R, turned by 90°, at X. '
                 'Draw a line through X parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    step('Draw a circle with centre F and radius OA. It crosses the horizontal line at Z, beyond F. '
         'Draw a line through Z parallel to the line from S1 to S3. Turn it round O by 90°, three times.', 'compass')
    g.circle_from('cz','F','O','A');g.meet('Z','cz','h',(3,0));g.line_par('zd','Z','q01');g.repeat('zp',['zd'],'rot4')



SPEC={'id':'abas-salman-232-star-bands','title':'Star bands from Abas and Salman, page 232',
    'short':'Abas and Salman 232 stars','subtitle':'Abas and Salman, page 232',
    'code':'PG232','folder':'data8','frame':((297.5,373.414375),UNIT,0,L),
    'style':'Islamic','level':'intermediate','palette':'Alhambra',
    'given':{'O':'The centre of the star with 90° tips.','A':'A point of that star.'},
    'note':'The finished design was read from Wichmann’s PG232 drawing and snapped to exact square-root-of-two values. '
           'Two radii and one unit-square diagonal set the half-side. The shared unit-star opening supplies the smaller '
           'star; the continued lines and exact parallels also close the larger star with 45-degree tips.',
    'changes':'The finished tile edges follow the plain drawing. The palette is illustrative; no photograph was checked. '
              'The page gives no building attribution, so none is added.',
    'references':'His reference is S. J. Abas and A. S. Salman, Symmetries of Islamic Geometrical Patterns '
                 '(World Scientific, 1995), page 232.',
    'ink':'Ink the lines picked out in orange. They close both kinds of stars and the connecting pieces.'}
NAMES={(16,5.657):('pointed_star','a'),(16,2.343):('star','a'),(8,2):('eight','b'),
       (5,1.914):('pentagon','c'),(10,1.828):('ten','d'),(8,1.172):('bowtie','ground'),
       (8,.828):('short_eight','c'),(4,.414):('kite','ground')}
if __name__=='__main__':medium.run(build,SPEC,NAMES)
