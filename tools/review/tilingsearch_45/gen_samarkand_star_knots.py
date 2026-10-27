#!/usr/bin/env python3
"""SAM1: square p4g mesh; four-star radius60pt, 10pt bands.

O=(156.90125,234.12875)pt, no frame turn. Half-side(3+√3)/2.
Fourfold turns preserve the handed arrangement around each four-star.
"""
import math
import sys

import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening
from hexagonal import network,clip_poly

UNIT=60
L=(3+math.sqrt(3))/2
REF={0:'h',30:'r30',60:'r60',90:'v',120:'r120',150:'r150'}


def build():
    opening()
    step('Draw lines through A parallel to lines OC and OE. '
         'Turn them round O by 90°, three times. These eight lines make the four-pointed star.')
    for i,a in enumerate([60,120]):
        g.line_par(f'st{i}','A',REF[a]);g.repeat(f'starCopies{i}',[f'st{i}'],'rot4')
    step('Draw vertical lines through B and C. They cross the horizontal line at N1 and N2. '
         'Draw a circle with centre A and opening from O to N1. '
         'It crosses that line at N3, right of A.', 'compass')
    for p,n,x in [('B','N1',math.sqrt(3)/2),('C','N2',.5)]:
        g.line_par(n+'v',p,'v');g.meet(n,n+'v','h',(x,0))
    g.circle_from('sum','A','O','N1');g.meet('N3','sum','h',(1+math.sqrt(3)/2,0))
    step('Draw a circle with centre N3 and opening from O to N2. '
         'It crosses the horizontal line at N4, right of N3.', 'compass')
    g.circle_from('cellRadius','N3','O','N2');g.meet('N4','cellRadius','h',(L,0))
    step('Draw a vertical line through N4. Turn it round O by 90°, three times. '
         'The four lines frame the tile, with corners T1 to T4.')
    g.line_par('frame','N4','v');g.repeat('frames',['frame'],'rot4')
    cell=[(L,L),(-L,L),(-L,-L),(L,-L)]
    for i,p in enumerate(cell):g.meet(f'T{i+1}','frame' if i==0 else f'frame@{i}',f'frame@{(i+1)%4}' if i<3 else 'frame',p)
    step('Draw a vertical line through C. Turn it round O by 90°, three times.')
    g.line_par('gl0','C','v');g.repeat('copies0',['gl0'],'rot4')
    plan=[('Q1','r150','frame',120,(L,-(1+math.sqrt(3))/2),
           'Line FM crosses the right tile side at Q1, below O. Draw a line through Q1 parallel to line OE.'),
          ('Q2','h','gl1',60,((3+math.sqrt(3))/3,0),
           'The new line crosses the horizontal line at Q2. Draw a line through Q2 parallel to line OC.'),
          ('Q3','gl0','gl0@3',120,(.5,-.5),
           'The vertical through C crosses its copy turned by 270° at Q3. '
           'Draw a line through Q3 parallel to line OE.'),
          ('Q3',None,None,150,None,'Draw a line through Q3 parallel to line FM.'),
          ('Q4','st1','gl4',90,((5+math.sqrt(3))/4,-(3+math.sqrt(3))/4),
           'The line through A parallel to line OE crosses the last line at Q4. Draw a vertical line through Q4.'),
          ('Q5','gl1','gl5',60,((5+math.sqrt(3))/4,(1-math.sqrt(3))/4),
           'The line through Q1 parallel to line OE crosses the vertical through Q4 at Q5. '
           'Draw a line through Q5 parallel to line OC.'),
          ('Q6','frame','gl6',120,(L,1),
           'The new line crosses the right tile side at Q6. Draw a line through Q6 parallel to line OE.'),
          ('Q7','h','gl7',60,((9+5*math.sqrt(3))/6,0),
           'The new line crosses the horizontal line at Q7. Draw a line through Q7 parallel to line OC.')]
    for i,(p,a,b,angle,xy,text) in enumerate(plan,1):
        step(text+' Turn it round O by 90°, three times.')
        if a:g.meet(p,a,b,xy)
        g.line_par(f'gl{i}',p,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot4')
    cm.steps[3]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through F and M.')
    cm.steps[11]['textWithoutHelpers']=(
        'The vertical through C crosses its copy turned by 270° at Q3. '
        'Draw a line through Q3 parallel to line OE. Turn it round O by 180°.')
    cm.steps[12]['textWithoutHelpers']=(
        'Draw a line through Q3 parallel to line FM. Turn it round O by 180°.')
    cm.steps[14]['textWithoutHelpers']=(
        'The line through Q1 parallel to line OE crosses the vertical through Q4 at Q5. '
        'Draw a line through Q5 parallel to line OC.')
    return cell


def drawing(pieces):
    return cm.frame_pieces(pieces,(156.90125,234.12875),2*UNIT,10)


def main():
    pieces,out=sys.argv[1:3];cell=build();ps=drawing(pieces)
    ps=[[(x+2*L*i,y+2*L*j) for x,y in q] for q in ps for i in [-1,0,1] for j in [-1,0,1]]
    edges=[]
    for q in ps:
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.001:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3 and T4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,5)]})
    t={'format':0,'id':'samarkand-star-knots','title':'Four- and six-pointed star knots, Samarkand',
       'short':'Samarkand star knots','subtitle':'Samarkand, after Tony Lee’s drawing',
       'fold':4,'chiral':True,'star':6,'style':'Central Asian','level':'advanced',
       'given':{'O':'The centre of a four-pointed star.','A':'Sets its point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s SAM1 drawing. The drawing gives no steps. '
                  'A four-pointed star, two compass transfers and parallels through earlier crossings fix the mesh.',
           'changes':'The 10pt bands are represented by their centre lines. '
                     'The square repeat preserves the p4g pattern’s handed arrangement round its fourfold centres. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No historical photograph was checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data184/SAM1: Samarkand','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data184/SAM1.html',
           'note':'The page credits Tony Lee through personal communication, describing Samarkand, Central Asia, with the original source unrecorded.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the square tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    inventory=[('four_star',8,6-2*math.sqrt(3),1,'c'),
        ('six_star',12,3*(1+math.sqrt(3))/4,1,'c'),
        ('seven',7,(1+math.sqrt(3))/2,4,'d'),('eight',8,(2+math.sqrt(3))/4,6,'b'),
        ('three_star',6,-.5+3*math.sqrt(3)/4,4,'a'),
        ('six',6,(3+math.sqrt(3))/8,6,'ground')]
    t['expect']={'pieceTypes':6,'cellArea':round(12+6*math.sqrt(3),5),
        'note':'The22 counted source-polygon areas sum exactly to12+6√3, the square cell area.',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
