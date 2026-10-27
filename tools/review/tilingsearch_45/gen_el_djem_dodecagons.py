#!/usr/bin/env python3
"""BON1: El Djem mosaic, plain outlines under centred8pt green strokes.

O=(204.25,277.75)pt; OA=30√6pt, the dodecagon radius.
No frame turn. Square half-side√2/2+√6/4.
"""
import math
import sys

import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening,LETTERS
from gen_agra_twelve_six_stars import frame,REF
from hexagonal import network,clip_poly

UNIT=30*math.sqrt(6)
L=(math.sqrt(6)+2*math.sqrt(2))/4


def build():
    opening()
    step('Draw the lines through O that halve angles AOB, BOC and COD. '
         'Draw a line through O at 90° to each new line. '
         'The circle’s twelve points on these lines are S1 to S12, counted round it.')
    for n,a,b in [('r15','A','B'),('r45','B','C'),('r75','C','D')]:g.line_bisect(n,a,'O',b)
    for a in [15,45,75]:g.line_perp(f'r{a+90}','O',f'r{a}')
    for i in range(12):
        a=15+30*i;g.meet(f'S{i+1}','c',REF[a%180],g.dirdeg(a))
    step('Join the twelve points to outline the dodecagon.')
    current=cm.steps[-1];del current['create'];current['parts']=[]
    for k in range(3):
        indices=list(range(4*k,4*k+4))
        part={'text':' '.join(f'Draw a straight line through S{i+1} and S{(i+1)%12+1}.' for i in indices),
              'create':{},'animate':'ruler'}
        current['parts'].append(part);g.cur=part
        for i in indices:g.line_through(f'st{i}',f'S{i+1}',f'S{(i+1)%12+1}')
    step('Draw a circle with centre O and opening AE. It crosses the line at 45° from OA at P1, above O. '
         'The first circle crosses that line at P2, above O. '
         'Draw vertical lines through P1 and P2. They cross the horizontal line at N1 and N2.', 'compass')
    g.circle_from('root3','O','A','E');g.meet('P1','root3','r45',(math.sqrt(6)/2,math.sqrt(6)/2))
    g.meet('P2','c','r45',(math.sqrt(2)/2,math.sqrt(2)/2))
    for p,n,x in [('P1','N1',math.sqrt(6)/2),('P2','N2',math.sqrt(2)/2)]:
        g.line_par(n+'v',p,'v');g.meet(n,n+'v','h',(x,0))
    step('Draw a line through N1 parallel to the line at 135° from OA. '
         'It crosses the line at 45° from OA at P3. '
         'Draw a vertical line through P3. It crosses the horizontal line at N3. '
         'Draw a circle with centre N2 and opening from O to N3. '
         'It crosses that line at N4, right of N2.', 'compass')
    g.line_par('halfDiagonal','N1','r135');g.meet('P3','halfDiagonal','r45',(math.sqrt(6)/4,math.sqrt(6)/4))
    g.line_par('halfProjection','P3','v');g.meet('N3','halfProjection','h',(math.sqrt(6)/4,0))
    g.circle_from('sum','N2','O','N3');g.meet('N4','sum','h',(L,0))
    step('Draw a vertical line through N4. Turn it round O by 90°, three times. '
         'The four lines frame the tile, with corners T1 to T4.')
    g.line_par('frame','N4','v');g.repeat('frames',['frame'],'rot4')
    cell=[(L,L),(-L,L),(-L,-L),(L,-L)]
    for i,p in enumerate(cell):g.meet(f'T{i+1}','frame' if i==0 else f'frame@{i}',f'frame@{i+1}' if i<3 else 'frame',p)
    step('The line at 15° from OA crosses the line through S5 and S6 at Q1, below O. '
         'Draw a line through Q1 parallel to line OB. Turn it round O by 90°, three times.')
    g.meet('Q1','r15','st4',(-L,-math.sqrt(2)/4));g.line_par('gl0','Q1','r30');g.repeat('copies0',['gl0'],'rot4')
    step('The new line crosses the vertical line through O at Q2. '
         'Draw a line through Q2 parallel to line FM. Turn it round O by 90°, three times.')
    g.meet('Q2','v','gl0',(0,1/math.sqrt(6)));g.line_par('gl1','Q2','r150');g.repeat('copies1',['gl1'],'rot4')
    cm.steps[3]['textWithoutHelpers']='The four circles cross the first circle at B, C, E, F, H, J, L and M.'
    cm.steps[4]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        +cm.steps[4]['text'])
    return cell


def drawing(pieces):
    return cm.frame_pieces(pieces,(204.25,277.75),2*UNIT,0)


def main():
    pieces,out=sys.argv[1:3];cell=build();ps=drawing(pieces)
    ps=[[(x+2*L*i,y+2*L*j) for x,y in q] for q in ps
        for i in [-1,0,1] for j in [-1,0,1]]
    # Ignore rounded edges which only graze a cell corner for less than.001OA.
    # Registering them needs unused exterior lines; the resulting ink is identical.
    edges=[]
    for q in ps:
        for i,p in enumerate(q):
            z=q[i-1];clipped=clip_poly([(p,z)],cell)
            if clipped and math.dist(*clipped[0])>.001:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3 and T4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,5)]})
    t={'format':0,'id':'el-djem-dodecagons','title':'Dodecagons of a Roman mosaic, El Djem',
       'short':'El Djem dodecagons','subtitle':'Roman mosaic, El Djem, Tunisia',
       'fold':4,'style':'Roman','level':'intermediate',
       'given':{'O':'The centre of a dodecagon.','A':'Sets its point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s BON1 drawing. The drawing gives no steps. '
                  'A regular dodecagon, a diagonal intercept and two parallel families construct the mesh.',
           'changes':'The 8pt green strokes are centred outlines; the original polygon boundaries are retained. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No historical photograph was checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data209/BON1: Roman mosaic, El Djem, Tunisia','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data209/BON1.html',
           'note':'The page cites Jay Bonner, Islamic Geometric Patterns, page13, photograph4(2016): a third-century Roman mosaic, El Djem, Tunisia. The photograph was not independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','look':'strapwork','palette':'Mamluk wood','colors':{},'text':'Put copies of the square tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    s=math.sqrt(3)
    inventory=[('dodecagon',12,3,1,'a'),('hexagon',6,s/4,4,'a'),
        ('four_star',8,.5-s/6,1,'a'),('rhombus',4,.25-s/12,12,'a'),
        ('triangle',3,-.25+s/6,12,'a'),('kite',4,s/12,2,'a')]
    t['expect']={'pieceTypes':6,'cellArea':round(3.5+2*s,5),
        'note':'The32 counted source-polygon shoelaces sum exactly to7/2+2√3=4(√2/2+√6/4)².',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c,**({'small':True} if n=='four_star' else {})} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
