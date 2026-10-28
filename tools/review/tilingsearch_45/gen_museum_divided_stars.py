#!/usr/bin/env python3
"""TAI1: divided stars; remove bevels and expand20pt bands to their centres.

O=(211.26,371)pt, OA=30(3+√3)/√2pt, frame turns15°.
The hexagonal apothem L=√2/2+2√6/3 is a compass sum and third.
"""
import math
import sys
import common as cm
from common import g,step
from gen_agra_twelve_six_stars import build as star_opening,frame,REF
from hexagonal import network,clip_poly

UNIT=30*(3+math.sqrt(3))/math.sqrt(2)
L=math.sqrt(2)/2+2*math.sqrt(6)/3


def build():
    star_opening(opening_only=True)
    step('Draw a vertical line through S2. It crosses the horizontal line at N1. '
         'Draw a circle with centre O and opening AE. It crosses the line at 45° from OA at P1, above O. '
         'Draw a vertical line through P1. It crosses the horizontal line at N2.', 'compass')
    g.line_par('projection1','S2','v');g.meet('N1','projection1','h',(math.sqrt(2)/2,0))
    g.circle_from('root3','O','A','E');g.meet('P1','root3','r45',(math.sqrt(6)/2,math.sqrt(6)/2))
    g.line_par('projection2','P1','v');g.meet('N2','projection2','h',(math.sqrt(6)/2,0))
    step('Draw a circle with centre A through O. It crosses the horizontal line at N3, right of A. '
         'Draw a circle with centre N3 and opening OA. It crosses that line at N4, right of N3. '
         'Draw a circle with centre O through N2. It crosses the vertical line at P2, above O.', 'compass')
    g.circle_through('two','A','O');g.meet('N3','two','h',(2,0))
    g.circle_from('three','N3','O','A');g.meet('N4','three','h',(3,0))
    g.circle_through('projectionCircle','O','N2');g.meet('P2','projectionCircle','v',(0,math.sqrt(6)/2))
    step('Draw a straight line through N4 and P2. Draw a line through A parallel to it. '
         'It crosses the vertical line at P3. Draw a circle with centre O through P3. '
         'It crosses the horizontal line at N5, right of O.', 'compass')
    g.line_through('intercept','N4','P2');g.line_par('third','A','intercept');g.meet('P3','third','v',(0,math.sqrt(6)/6))
    g.circle_through('thirdCircle','O','P3');g.meet('N5','thirdCircle','h',(math.sqrt(6)/6,0))
    step('Draw a circle with centre N2 and opening from O to N5. '
         'It crosses the horizontal line at N6, right of N2. '
         'Draw a circle with centre N6 and opening from O to N1. '
         'It crosses that line at N7, right of N6.', 'compass')
    g.circle_from('fourThirds','N2','O','N5');g.meet('N6','fourThirds','h',(2*math.sqrt(6)/3,0))
    g.circle_from('apothem','N6','O','N1');g.meet('N7','apothem','h',(L,0))
    cell=frame('N7',L)
    plan=[('N7',None,None,45,'Draw a line through N7 at 45° from OA.'),
        ('Q1','r120','gl0',15,'Line OE crosses the last line at Q1, below O. Draw a line through Q1 at 15° from OA.'),
        ('Q2','r60','gl1',0,'Line CJ crosses the last line at Q2, below O. Draw a horizontal line through Q2.'),
        ('Q3','r75','gl2',45,'The line at 75° from OA crosses the last line at Q3, below O. Draw a line through Q3 at 45° from OA.'),
        ('Q4','r150','gl3',75,'Line FM crosses the last line at Q4, below O. Draw a line through Q4 at 75° from OA.'),
        ('Q5','r120','gl2',45,'Line OE crosses the horizontal line through Q2 at Q5. Draw a line through Q5 at 45° from OA.'),
        ('Q6','v','gl0',15,'The vertical line through O crosses the line through N7 at Q6, below O. Draw a line through Q6 at 15° from OA.')]
    for i,(p,a,b,angle,text) in enumerate(plan):
        step(text+' Turn it round O by 60°, five times.')
        if a:g.meet(p,a,b,g.crossings(a,b)[0])
        g.line_par(f'gl{i}',p,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot6')
    cm.steps[8]['textWithoutHelpers'] = (
        'Draw a line through A parallel to the line from N4 to P2. '
        'It crosses the vertical line at P3. Draw a circle with centre O through P3. '
        'It crosses the horizontal line at N5, right of O.')
    return cell


def drawing(pieces):
    keep=lambda p:max(p['fill'])-min(p['fill'])>.05 or min(p['fill'])>.9
    ps=cm.frame_pieces(pieces,(211.26,371),2*UNIT,20,keep=keep)
    c,s=math.cos(math.pi/12),math.sin(math.pi/12)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();polys=drawing(pieces)
    polys=[[(x+2*L*i+L*j,y+math.sqrt(3)*L*j) for x,y in q] for q in polys
           for i in [-1,0,1] for j in [-1,0,1]]
    edges=[]
    for q in polys:
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'museum-divided-stars','title':'Divided stars of the Turkish and Islamic Arts Museum',
        'short':'Museum divided stars','subtitle':'Minbar balustrade, Turkish and Islamic Arts Museum, Istanbul',
        'fold':6,'star':12,'style':'Turkish','level':'advanced',
        'given':{'O':'The centre of a divided twelve-pointed star.','A':'Sets its point radius.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s TAI1 drawing. The drawing gives no steps. '
                   'The three-square opening is shared with the Agra star lesson. A third-part construction and compass sum set the repeat; parallels through crossings complete the divided stars.',
            'changes':'Grey bevel facets are removed and the20pt bands represented by their centre lines. '
                      'The teaching frame turns15°. The steps, order and named points are ours. '
                      'The palette is illustrative. No monument photograph was independently checked.','reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data193/TAI1: Turkish and Islamic museum','creator':'Brian Wichmann',
            'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data193/TAI1.html',
            'note':'The page cites Archnet for the lower screen panel at Takht-e Fulad, Isfahan; Dick Osseman for a minbar balustrade at the Turkish and Islamic museum, Istanbul; and M Sakkal for a Junblat House window lattice, Aleppo. All are personal communications. No photograph was independently checked.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
        'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    s=math.sqrt(3)
    inventory=[('twelve_kite',.5-s/6,12,'a'),('outer_four',1/3-s/24,24,'c'),
        ('blue_four',7/24-s/16,24,'b'),('six_kite',-23/24+17*s/24,18,'d'),
        ('small_kite',17/24-23*s/72,6,'ground')]
    t['expect']={'pieceTypes':5,'cellArea':round(8+19*s/3,5),
        'note':'The84 counted source-polygon shoelaces sum exactly to8+19√3/3=2√3(√2/2+2√6/3)².',
        'pieces':[{'name':n,'vertices':4,'area':round(a,5),'perCell':c} for n,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
