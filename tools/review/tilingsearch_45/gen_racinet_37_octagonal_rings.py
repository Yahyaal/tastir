#!/usr/bin/env python3
"""R37D. Precision2 pieces, band7pt; O=(298.751875,374.021875),
OA=218.89375/(4+3sqrt(2))pt. Half-side4+3sqrt(2); exact a+bH source
residual0.000351 OA. Reuse the Rabat octagon grid, then two compass/crossing
steps supply axis offsets3+3H,3+5H and diagonal offset3+5H.
Usage: this script pieces.json tutorial.json; then finish dump.json tutorial.json.
"""
import os
import sys
sys.path.insert(0,os.path.dirname(__file__))
import common as cm
from common import g,step
import medium
import gen_rabat_throne_octagons as rt
H,L=rt.H,rt.L


def build():
    rt.build(include_q2=False)
    cm.steps[2]['text']='Draw two guide squares.'
    step('The vertical line through W crosses the horizontal line at U1. '
         'Draw a circle with centre U1 and radius OA. It crosses the horizontal line at J1, to the right. '
         'Draw a circle with centre J1 and radius OE. It crosses the horizontal line at J2, to the right. '
         'Draw a vertical line through each new point. Turn both lines round O by 90°, three times.', 'compass')
    g.meet('U1','wv','h',(2+3*H,0))
    g.circle_from('cj1','U1','O','A');g.meet('J1','cj1','h',(3+3*H,0))
    g.circle_from('cj2','J1','O','E');g.meet('J2','cj2','h',(3+5*H,0))
    g.line_par('j1v','J1','v');g.line_par('j2v','J2','v');g.repeat('jp',['j1v','j2v'],'rot4')
    step('The vertical line through W crosses the line through J1, turned by 90°, at N. '
         'Draw a line through N parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    g.meet('N','wv','j1v@1',(2+3*H,3+3*H));g.line_par('nd','N','q01');g.repeat('np',['nd'],'rot4')


SPEC={'id':'racinet-37-octagonal-rings','title':'Octagonal rings from Racinet plate 37',
    'short':'Racinet 37 octagonal rings','subtitle':'Algerian motifs in Racinet, plate 37',
    'code':'R37D','folder':'data202','frame':((298.751875,374.021875),218.89375/L,7,L),
    'style':'Algerian','palette':'Alhambra','look':'interlace',
    'given':{'O':'The centre of a pointed star inside an octagonal ring.','A':'Sets the radius of the guide circle.'},
    'note':'The finished design was read from Wichmann’s R37D drawing. Its band centres fit exact square-root-of-two '
           'values. The construction shares the Rabat throne-room octagon grid, adding two compass and crossing steps '
           'for the different rims and connecting pieces. The first two squares are guides for the larger pointed star.',
    'changes':'The 7 pt bands are represented by their centre lines. The palette is illustrative; no photograph was checked. '
              'The source identifies Algerian architectural motifs but gives no individual building.',
    'references':'His reference is Auguste Racinet, Full-Color Picture Sourcebook of Historic Ornament, '
                 'plate 37, described as motifs from Algerian public architecture of the thirteenth and fourteenth centuries.',
    'small':{'triangle'},
    'ink':'Ink the lines picked out in orange. They close the pointed stars, the octagonal rings and their connecting pieces.'}
NAMES={(12,6.828):('long_twelve','a'),(8,5.828):('eight','b'),(16,5.657):('pointed_star','a'),
       (12,4.828):('twelve','c'),(6,3.414):('long_hexagon','d'),(9,3.328):('shield','b'),
       (6,3):('hexagon','c'),(5,1.914):('pentagon','ground'),(6,1.828):('short_hexagon','ground'),
       (4,1.414):('rhombus','ground'),(4,.586):('dart','ground'),(3,.5):('triangle','ground')}
if __name__=='__main__':medium.run(build,SPEC,NAMES)
