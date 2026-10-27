#!/usr/bin/env python3
"""P144. Precision2 pieces, band3pt. Source small-star radius R=48.2854967367pt.
Its primitive cell is turned22.5 degrees. OA=R*cos(pi/8); half-side2+2sqrt(2).
Transform source-radius coordinates by (x+t*y,y-t*x), t=sqrt(2)-1. All
corners then fit a+b*sqrt(2)/2 within0.000301 OA. The star is drawn from
vertices of the octagon tangent to the unit circle. Seven compass-set
axis marks supply its remaining parallel families. Exact areas in report.
Usage: this script pieces.json tutorial.json; then finish dump.json tutorial.json.
Overlay with true period2*R*cos(pi/8) and angle=22.5.
"""
import math
import os
import sys
sys.path.insert(0,os.path.dirname(__file__))
import common as cm
from common import g,step
import medium
import gen_leones_door_stars as le
H,T,L=math.sqrt(.5),math.sqrt(2)-1,2+2*math.sqrt(2)
R=48.2854967367


def parallels(points,prefix,fold=4):
    names=[]
    for i,p in enumerate(points):
        for j,line in enumerate(['q01','q11']):
            n=f'{prefix}{i}{j}';g.line_par(n,p,line);names.append(n)
    g.repeat(prefix+'p',names,f'rot{fold}')


def build(opening_only=False):
    g.given()
    step('Draw a horizontal straight line through O and A. Draw a circle with centre O through A.', 'compass')
    g.circle_through('c','O','A');g.line_through('h','O','A')
    step('Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
         'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
         'The lines through A and C cross at J. '
         'Draw the line through O that halves the angle AOC. It crosses the circle at E, above O.')
    g.line_perp('v','O','h');g.meet('C','c','v',(0,1));g.meet('B','c','h',(-1,0));g.meet('D','c','v',(0,-1))
    for n,p,l in [('ax','A','v'),('cy','C','h'),('bx','B','v'),('dy','D','h')]:g.line_par(n,p,l)
    g.meet('J','ax','cy',(1,1));g.line_bisect('d45','A','O','C');g.meet('E','c','d45',(H,H))
    step('Draw a line through E at 90° to line OE. Turn it round O by 90°, three times. '
         'With the four sides of the square, these lines make an octagon with corners S1 to S8.')
    g.line_perp('tt','E','d45');g.repeat('ttp',['tt'],'rot4')
    coords=[(1,T),(T,1),(-T,1),(-1,T),(-1,-T),(-T,-1),(T,-1),(1,-T)]
    ss=[]
    for i,(a,b) in enumerate([('ax','tt'),('cy','tt'),('cy','tt@1'),('bx','tt@1'),('bx','tt@2'),('dy','tt@2'),('dy','tt@3'),('ax','tt@3')]):
        n=f'S{i+1}';g.meet(n,a,b,coords[i]);ss.append(n)
    step('Draw the star at O as two squares.')
    le.two_squares(ss,'q',le.square_texts(ss,'Draw each line long.'))
    step('Draw a circle with centre A through O. It crosses the horizontal line at F, beyond A. '
         'Keep the compass open to OJ. Draw circles with centres F and G1 in turn. '
         'They cross the horizontal line at G1 and G2, to the right.', 'compass')
    g.circle_through('ca','A','O');g.meet('F','ca','h',(2,0))
    g.circle_from('cg1','F','O','J');g.meet('G1','cg1','h',(2+2*H,0))
    g.circle_from('cg2','G1','O','J');g.meet('G2','cg2','h',(L,0))
    if opening_only:
        return
    step('Draw a circle with centre O through G2. It crosses the horizontal and vertical lines at T1 to T4. '
         'Draw a vertical line through each of T1 and T3. Draw a horizontal line through each of T2 and T4. '
         'They make a square with corners K1, K2, K3 and K4.', 'compass')
    g.circle_through('co','O','G2')
    for i,(line,p) in enumerate([('h',(L,0)),('v',(0,L)),('h',(-L,0)),('v',(0,-L))]):g.meet(f'T{i+1}','co',line,p)
    for n,p,l in [('gx','T1','v'),('gy','T2','h'),('gxw','T3','v'),('gys','T4','h')]:g.line_par(n,p,l)
    for i,(a,b,p) in enumerate([('gx','gy',(L,L)),('gxw','gy',(-L,L)),('gxw','gys',(-L,-L)),('gx','gys',(L,-L))]):g.meet(f'K{i+1}',a,b,p)
    step('The lines from S7 to S1 and from S8 to S2 cross at P. '
         'Draw lines through P parallel to the lines from S1 to S3 and from S2 to S4. '
         'Turn both lines round O by 90°, three times. '
         'The first new line crosses the vertical line through O at Z, above O.')
    g.meet('P','q04','q14',(2*T,0));parallels(['P'],'p')
    g.meet('Z','p00','v',(0,2*T*T))
    step('Draw a circle with centre O and radius OF. It crosses the vertical line at N, above O. '
         'Draw circles with centres N and M in turn, keeping radius OF. '
         'They cross the vertical line at M and V, above their centres. '
         'Draw lines through N and V parallel to the lines from S1 to S3 and from S2 to S4. '
         'Turn these four lines round O by 90°, three times.', 'compass')
    g.circle_from('cn','O','O','F');g.meet('N','cn','v',(0,2))
    g.circle_from('cm','N','O','F');g.meet('M','cm','v',(0,4))
    g.circle_from('cv','M','O','F');g.meet('V','cv','v',(0,6));parallels(['N','V'],'n')
    step('Draw a circle with centre M and radius OP. It crosses the vertical line at U1 and U2. '
         'Draw lines through both points parallel to the lines from S1 to S3 and from S2 to S4. '
         'Turn these four lines round O by 90°, three times.', 'compass')
    g.circle_from('cu','M','O','P');g.meet('U1','cu','v',(0,4-2*T));g.meet('U2','cu','v',(0,4+2*T));parallels(['U1','U2'],'u')
    step('Draw a circle with centre M and radius OZ. It crosses the vertical line at W1 and W2. '
         'Draw lines through both points parallel to the lines from S1 to S3 and from S2 to S4. '
         'Turn these four lines round O by 90°, three times.', 'compass')
    g.circle_from('cw','M','O','Z');g.meet('W1','cw','v',(0,4-2*T*T));g.meet('W2','cw','v',(0,4+2*T*T));parallels(['W1','W2'],'w')
    step('Draw a circle with centre T2 through O. It crosses the vertical line again at X, beyond T2. '
         'Draw a circle with centre X and radius from O to W2. '
         'It crosses the vertical line at Y, towards O. '
         'Draw lines through Y parallel to the lines from S1 to S3 and from S2 to S4. '
         'Turn both lines round O by 90°, three times.', 'compass')
    g.circle_through('cx','T2','O');g.meet('X','cx','v',(0,2*L))
    g.circle_from('cy2','X','O','W2');g.meet('Y','cy2','v',(0,2*L-4-2*T*T));parallels(['Y'],'y')


def drawing(pieces):
    return [[(x+T*y,y-T*x) for x,y in q]
            for q in cm.frame_pieces(pieces,(297.5,374.22),2*R,3)]


SPEC={'id':'bourgoin-144-octagon-bands','title':'Octagon bands of Bourgoin plate 144',
    'short':'Bourgoin 144 octagons','subtitle':'Bourgoin, plate 144','code':'P144','folder':'data12',
    'frame':((297.5,374.22),R*math.cos(math.pi/8),3,L),'style':'Islamic','palette':'Alhambra','look':'interlace',
    'given':{'O':'The centre of an eight-pointed star.','A':'Sets the circle inside the guide octagon.'},
    'note':'The finished design was read from Wichmann’s P144 drawing. A 22.5-degree frame turn reveals its '
           'primitive square repeat. The guide octagon touches the unit circle, and its corners give the star. '
           'The star-side crossing P and compass transfers set the remaining parallels at exact square-root-of-two values. '
           'An axis-aligned cell chosen from neighbouring source stars would give a false repeat.',
    'changes':'The frame is turned by 22.5 degrees. The 3 pt bands are represented by their centre lines. '
              'The palette is illustrative; no photograph was checked.',
    'references':'His references are Bourgoin plate 144 (using the same tiles as plate 52); '
                 'Keith Critchlow, Islamic Patterns (1976), page 187; and Abas and Salman, '
                 'Symmetries of Islamic Geometrical Patterns (1995), page 250. His page links Wade BOU 144.',
    'ink':'Ink the lines picked out in orange. They close the stars, the two sizes of octagons and the connecting bands.'}
NAMES={(16,2.745):('star','a'),(18,2.142):('eighteen','b'),(8,1.941):('octagon','c'),
       (14,1.456):('fourteen','d'),(8,.686):('small_octagon','ground')}
if __name__=='__main__':medium.run(build,SPEC,NAMES,drawing=drawing)
