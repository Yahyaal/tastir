#!/usr/bin/env python3
"""L34A, Lindisfarne folio2b. Plain tiles on an exact20pt grid;
O=(290.83,357.67), half-side8, repeat320pt. Source-coordinate residual
below3e-15 OA at precision2. Draw the integer grid to eight radii and
four diagonals through the seventh mark. Usage: this script pieces.json
 tutorial.json; then finish dump.json tutorial.json.
"""
import os
import sys
sys.path.insert(0,os.path.dirname(__file__))
import common as cm
from common import g,step
import medium


def marks(first,last):
    for i in range(first,last+1):
        g.circle_from(f'cb{i}','A' if i==1 else f'B{i-1}','O','A')
        g.meet(f'B{i}',f'cb{i}','h',(i+1,0))


def grid(points,prefix):
    names=[]
    for i,p in enumerate(points):
        n=f'{prefix}{i}';g.line_par(n,p,'v');names.append(n)
    g.repeat(prefix+'p',names,'rot4')


def build():
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    g.circle_through('c','O','A');g.line_through('h','O','A')
    step('Draw a vertical line through O. It crosses the circle at C, above O. Draw a straight line through A and C.')
    cm.steps[-1]['textWithoutHelpers']='Draw a vertical line through O. It crosses the circle at C, above O.'
    g.line_perp('v','O','h');g.meet('C','c','v',(0,1));g.line_through('ac','A','C')
    step('Keep the compass open to OA. Draw circles with centres A, B1 and B2 in turn. '
         'Each circle crosses the horizontal line to the right at B1, B2 and B3.', 'compass')
    marks(1,3)
    step('Draw a vertical line through each of A, B1, B2 and B3. Turn these four lines round O by 90°, three times.')
    grid(['A','B1','B2','B3'],'a')
    step('Keep the compass open to OA. Draw circles with centres B3, B4, B5 and B6 in turn. '
         'Each circle crosses the horizontal line to the right at B4, B5, B6 and B7.', 'compass')
    marks(4,7)
    step('Draw a vertical line through each of B4, B5, B6 and B7. Turn these four lines round O by 90°, three times.')
    grid(['B4','B5','B6','B7'],'b')
    step('Draw a line through B6 parallel to line AC. Turn it round O by 90°, three times.')
    g.line_par('dd','B6','ac');g.repeat('dp',['dd'],'rot4')
    step('The vertical line through B7 and its three turns make a square with corners K1, K2, K3 and K4.')
    for i,(a,b,p) in enumerate([('b3','b3@1',(8,8)),('b3@1','b3@2',(-8,8)),('b3@2','b3@3',(-8,-8)),('b3@3','b3',(8,-8))]):g.meet(f'K{i+1}',a,b,p)


SPEC={'id':'lindisfarne-folio-2b-stepped-bands','title':'Stepped bands from folio 2b of the Lindisfarne Gospels',
    'short':'Lindisfarne stepped bands','subtitle':'Lindisfarne Gospels, folio 2b, pattern 1',
    'code':'L34A','folder':'data1','frame':((290.83,357.67),20,0,8),'style':'Celtic','star':None,
    'small':{'twenty_one','fifteen'},'level':'intermediate','palette':'Alhambra','look':'tiles',
    'given':{'O':'The centre where four small squares meet.','A':'One small-square side to the right of O.'},
    'note':'The finished design was read from Wichmann’s L34A drawing. Its plain tile corners lie exactly on '
           'an integer grid, with a repeat sixteen small-square sides wide. Compass steps give that grid; '
           'four diagonals through the seventh mark close the outer stepped bands. '
           'This is a Celtic manuscript pattern, not an attribution to an Islamic building.',
    'changes':'The finished tile edges follow the plain drawing. The palette is illustrative; '
              'the manuscript page was not independently checked.',
    'references':'His references are Janet Backhouse, The Lindisfarne Gospels (Phaidon, 1981), '
                 'page 34 and pattern 1 from folio 2b.',
    'ink':'Ink the lines picked out in orange. They close the small squares, the stepped crosses and the surrounding bands.'}
NAMES={(26,13):('twenty_six','a'),(21,12.5):('twenty_one','b'),(18,9):('eighteen','c'),
       (15,8.5):('fifteen','d'),(10,5):('ten','a'),(4,1):('square','ground')}
if __name__=='__main__':medium.run(build,SPEC,NAMES)
