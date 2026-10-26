#!/usr/bin/env python3
"""SPA2103X. Extract at precision2. OA=36.2141225526 pt; band7pt;
half-side2+2sqrt(2). Source residual0.000286 OA on a+b*sqrt(2)/2.
Usage: this script pieces.json tutorial.json; then finish dump.json tutorial.json.
The Ben Youssef arrow-band construction supplies all line families except
the axes at 1+3sqrt(2)/2. A unit-radius compass transfer from J supplies them.
"""
import os
import sys
sys.path.insert(0,os.path.dirname(__file__))
import common as cm
from common import g,step
import medium
import gen_ben_youssef_arrow_bands as arrows


def build():
    arrows.build()
    step('Draw a circle with centre J and radius OA. It crosses the horizontal line at Z, beyond J. '
         'Draw a vertical line through Z. Turn it round O by 90°, three times.', 'compass')
    g.circle_from('cz','J','O','A')
    g.meet('Z','cz','h',(1+3*arrows.H,0))
    g.line_par('zv','Z','v');g.repeat('zp',['zv'],'rot4')


SPEC={'id':'cordoba-synagogue-star-bands','title':'Star bands of the synagogue in Córdoba',
    'short':'Córdoba synagogue stars','subtitle':'Synagogue, Córdoba',
    'code':'SPA2103X','folder':'data192','frame':((297.5,373.414375),arrows.UNIT,7,arrows.L),
    'style':'Spanish','palette':'Alhambra','look':'lines',
    'given':{'O':'The centre of an eight-pointed star.','A':'A point of that star.'},
    'note':'The finished design was read from Wichmann’s SPA2103X drawing and snapped to exact '
           'square-root-of-two values. Two radii and two unit-square diagonals set the half-side. '
           'The construction shares the Ben Youssef arrow-band grid, adding a radius transfer from J. '
           'The ink picks out different stars, connecting bands and square knots.',
    'changes':'The 7 pt bands are represented by their centre lines. Wichmann says colour was added because '
              'the original is uncoloured, so the tutorial opens as lines. The palette is illustrative; no photograph was checked.',
    'references':'His reference is David Wade photograph SPA 2103x, Synagogue, Cordova, Spain; '
                 'his page links Wade archive record 4186.',
    'ink':'Ink the lines picked out in orange. They close the stars, the connecting bands and the small square knots.'}
NAMES={(16,2.343):('star','a'),(16,1.828):('cross','d'),(8,1.828):('eight','b'),
       (4,.414):('kite','ground'),(4,.343):('square','c'),(5,.328):('pentagon','ground')}
if __name__=='__main__':medium.run(build,SPEC,NAMES)
