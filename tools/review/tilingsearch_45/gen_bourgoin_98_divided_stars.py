#!/usr/bin/env python3
"""A192: Bourgoin98, plain polygons with white outline strokes.

OA=25(√6+√2)pt, O=(109.78,502.95)pt, no frame turn.
The source stars are divided: twelve kites at O and six at the corners.
The apothem is(3+√3)/2. Periodic copies complete the off-centre source cell.
"""
import math
import sys

import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening,LETTERS
from gen_agra_twelve_six_stars import frame,REF
from hexagonal import network,clip_poly

UNIT=25*(math.sqrt(6)+math.sqrt(2))
L=(3+math.sqrt(3))/2


def build():
    opening()
    step('Draw the lines through O that halve angles AOB, BOC and COD. '
         'Draw a line through O at 90° to each new line.')
    for n,a,b in [('r15','A','B'),('r45','B','C'),('r75','C','D')]:g.line_bisect(n,a,'O',b)
    for a in [15,45,75]:g.line_perp(f'r{a+90}','O',f'r{a}')
    step('Draw the three squares round the divided star.')
    current=cm.steps[-1];del current['create'];current['parts']=[]
    for k in range(3):
        names=[LETTERS[k+3*i] for i in range(4)]
        part={'text':f'Draw a straight line through {names[0]} and {names[1]}, {names[1]} and {names[2]}, '
              f'{names[2]} and {names[3]}, and {names[3]} and {names[0]}.','create':{},'animate':'ruler'}
        current['parts'].append(part);g.cur=part
        for i in range(4):g.line_through(f'st{k+3*i}',names[i],names[(i+1)%4])
    step('Draw vertical lines through B and C. They cross the horizontal line at N1 and N2. '
         'Draw a circle with centre A and opening from O to N1. '
         'It crosses that line at N3, right of A.', 'compass')
    for p,n,x in [('B','N1',math.sqrt(3)/2),('C','N2',.5)]:
        g.line_par(n+'v',p,'v');g.meet(n,n+'v','h',(x,0))
    g.circle_from('sum','A','O','N1');g.meet('N3','sum','h',(1+math.sqrt(3)/2,0))
    step('Draw a circle with centre N3 and opening from O to N2. '
         'It crosses the horizontal line at N4, right of N3.', 'compass')
    g.circle_from('cellRadius','N3','O','N2');g.meet('N4','cellRadius','h',(L,0))
    cell=frame('N4',L)
    plan=[('Q1','r60','st4',15,(-1.3660254037844384,-2.3660254037844384),
           'Line OC crosses the line through E and H at Q1, below O. '
           'Draw a line through Q1 parallel to the line at 15° from OA.'),
          ('Q2','v','gl0',165,(0,-2),
           'The line through Q1 at 15° from OA crosses the vertical line through O at Q2. '
           'Draw a line through Q2 parallel to the line at 165° from OA.')]
    for i,(p,a,b,angle,xy,text) in enumerate(plan):
        step(text+' Turn it round O by 60°, five times.')
        g.meet(p,a,b,xy);g.line_par(f'gl{i}',p,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot6')
    cm.steps[3]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H. Draw a straight line through F and M.')
    return cell


def drawing(pieces):
    return cm.frame_pieces(pieces,(109.78,502.95),2*UNIT,0)


def main():
    pieces,out=sys.argv[1:3];cell=build();ps=drawing(pieces)
    ps=[[(x+2*L*i+L*j,y+math.sqrt(3)*L*j) for x,y in q] for q in ps
        for i in [-1,0,1] for j in [-1,0,1]]
    # Ignore rounded edges which only graze a cell corner for less than.001OA.
    # Registering them needs unused exterior lines; the resulting ink is identical.
    edges=[]
    for q in ps:
        for i,p in enumerate(q):
            z=q[i-1];clipped=clip_poly([(p,z)],cell)
            if clipped and math.dist(*clipped[0])>.001:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'bourgoin-98-divided-stars','title':'Divided stars of Bourgoin’s Plate 98',
       'short':'Bourgoin 98 divided stars','subtitle':'Bourgoin, Plate 98, upper design',
       'fold':6,'star':12,'style':'Islamic','level':'advanced',
       'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s A192 drawing. The drawing gives no steps. '
                  'Three squares and two parallel families construct the divided stars and their connectors.',
           'changes':'Plain polygon boundaries are retained. The white strokes are outlines centred on those boundaries. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No historical photograph was checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data15/A192: Bourgoin Plate 98','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data15/A192.html',
           'note':'The page cites S. J. Abas and A. S. Salman, page192 (1995), and Jules Bourgoin, Plate98, upper design (1879). No location is known.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','palette':'Kashan','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    inventory=[('six_kite',4,(math.sqrt(3)-1)/2,12,'b'),
        ('eight',8,1,3,'ground'),('hexagon',6,(3-math.sqrt(3))/2,12,'c'),
        ('kite',4,2*math.sqrt(3)/3-1,12,'a'),('twelve_kite',4,.5-math.sqrt(3)/6,12,'d')]
    t['expect']={'pieceTypes':5,'cellArea':round(9+6*math.sqrt(3),5),
        'note':'Twelve six-star kites, twelve twelve-star kites, twelve hexagons, twelve outer kites '
               'and three eight-sided pieces sum exactly to9+6√3.',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    t['pattern']['placements']={'repeat':[1,1],'rules':[
        {'piece':piece,'nth':nth,'color':color}
        for piece,indices,color in [
            ('hexagon',[1,2,5,6,9,10],'#757f40'),
            ('six_kite',[0,3,4,7,8,11],'#9cc9b0'),
            ('twelve_kite',[0,3,4,7,8,11],'#4cb27f')]
        for nth in indices]}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
