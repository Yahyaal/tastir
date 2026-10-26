#!/usr/bin/env python3
"""data206/SM3, not data205/SM3. Precision2 plain polygons: shared edges
already meet, despite their ochre stroke. O=(303.39,365.11), OA=25/sqrt(2)pt
is half the small-square side. Half-side2+sqrt(2), worst a+bH residual
0.000303 OA. Usage: this script pieces.json tutorial.json; then finish
 dump.json tutorial.json. A circle transfer of the square diagonal sets
the cell, whose four diagonals close four pentagons and four hexagons.
"""
import math
import os
import sys
sys.path.insert(0,os.path.dirname(__file__))
import common as cm
from common import g,step
import medium
L=2+math.sqrt(2)


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    g.circle_through('c','O','A');g.line_through('h','O','A')
    step('Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
         'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
         'The upper-right corner is E. Draw a straight line through O and E. Draw a straight line through A and C.')
    cm.steps[-1]['textWithoutHelpers']=cm.steps[-1]['text'].replace(' Draw a straight line through A and C.','')
    g.line_perp('v','O','h');g.meet('B','c','h',(-1,0));g.meet('C','c','v',(0,1));g.meet('D','c','v',(0,-1))
    for n,p,l in [('ax','A','v'),('bx','B','v'),('cy','C','h'),('dy','D','h')]:g.line_par(n,p,l)
    g.meet('E','ax','cy',(1,1));g.line_through('d45','O','E');g.line_through('ac','A','C')
    step('Draw a circle with centre A through O. It crosses the horizontal line at F, beyond A. '
         'Draw a circle with centre F and radius OE. It crosses the horizontal line at G, to the right.', 'compass')
    g.circle_through('ca','A','O');g.meet('F','ca','h',(2,0));g.circle_from('cf','F','O','E');g.meet('G','cf','h',(L,0))
    step('Draw a circle with centre O through G. It crosses the horizontal and vertical lines at T1 to T4. '
         'Draw a vertical line through each of T1 and T3. Draw a horizontal line through each of T2 and T4. '
         'They make a square with corners K1, K2, K3 and K4.', 'compass')
    g.circle_through('co','O','G')
    for i,(line,p) in enumerate([('h',(L,0)),('v',(0,L)),('h',(-L,0)),('v',(0,-L))]):g.meet(f'T{i+1}','co',line,p)
    for n,p,l in [('gx','T1','v'),('gy','T2','h'),('gxw','T3','v'),('gys','T4','h')]:g.line_par(n,p,l)
    for i,(a,b,p) in enumerate([('gx','gy',(L,L)),('gxw','gy',(-L,L)),('gxw','gys',(-L,-L)),('gx','gys',(L,-L))]):g.meet(f'K{i+1}',a,b,p)
    step('Draw a line through T1 parallel to line AC. Turn it round O by 90°, three times.')
    g.line_par('dd','T1','ac');g.repeat('dp',['dd'],'rot4')


SPEC={'id':'salim-chishti-square-lattice','title':'Square lattice of Salim Chishti’s tomb (Fatehpur Sikri)',
    'short':'Salim Chishti square lattice','subtitle':'Salim Chishti’s tomb, Fatehpur Sikri, lower pattern',
    'code':'SM3','folder':'data206','frame':((303.39,365.11),25/math.sqrt(2),0,L),
    'style':'Mughal','star':None,'level':'intermediate','palette':'Timurid tile','look':'strapwork',
    'given':{'O':'The centre of a small square.','A':'The midpoint of its right-hand side.'},
    'note':'The finished design was read from Wichmann’s data206/SM3 drawing. Its polygon edges already coincide; '
           'the ochre stroke is not a gap between inset tiles. Half the small-square side gives the unit. '
           'Two radii and a unit-square diagonal give the half-side 2 + square root of two; '
           'four diagonals then close the pentagons and hexagons.',
    'changes':'The shared polygon boundaries follow the plain drawing; no band expansion is applied. '
              'The palette is illustrative; no photograph was checked. The lower pattern is the one identified by the source.',
    'references':'His reference is E. W. Smith, The Moghul Architecture of Fathpur-Sikri (1896), '
                 'part II, plate XXVIII, figure 4, Salim Chishti’s tomb, Fatehpur Sikri, India (1581). '
                 'This is data206/SM3, distinct from the related data205/SM3 cited on the IRAN16 page.',
    'ink':'Ink the lines picked out in orange. They close the square, the four pentagons and the four hexagons.'}
NAMES={(6,6.828):('hexagon','a'),(4,4):('square','b'),(5,3.828):('pentagon','c')}
if __name__=='__main__':medium.run(build,SPEC,NAMES)
