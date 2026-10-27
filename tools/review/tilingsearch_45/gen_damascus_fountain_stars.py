#!/usr/bin/env python3
"""DM1: Damascus fountain surround, large twelve-pointed stars and chelates.

O=(297.5,373.91)pt; OA=20(3+√3)/√2pt; frame turns−15°.
The hexagonal apothem is (3√2+√6)/2 = √2+2cos15°.
The two additional axial offsets are 3sin15°/2 and its complement in
that apothem. A midpoint constructs the first exactly. Plain boundaries.
"""
import math
import sys

import common as cm
from common import g,step
from gen_agra_twelve_six_stars import build as star, frame
from hexagonal import network

UNIT=20*(3+math.sqrt(3))/math.sqrt(2)
L=(3*math.sqrt(2)+math.sqrt(6))/2
REF={0:'h',30:'r30',90:'v',105:'r105',120:'r120',150:'r150'}


def build():
    star(opening_only=True)
    step('Draw a vertical line through A. Draw a horizontal line through D. They cross at P1. '
         'Draw a circle with centre O through P1. It crosses the horizontal line at N1, right of A.', 'compass')
    g.line_par('ax','A','v');g.line_par('dy','D','h');g.meet('P1','ax','dy',(1,1))
    g.circle_through('root2','O','P1');g.meet('N1','root2','h',(math.sqrt(2),0))
    step('Draw a vertical line through S1. It crosses the horizontal line at N2. '
         'Draw a circle with centre N1 and opening from O to N2. '
         'It crosses the horizontal line at N3, right of N1. '
         'Draw a circle with centre N3, with the same opening. '
         'It crosses the horizontal line at N4, right of N3.', 'compass')
    g.line_par('projection','S1','v');g.meet('N2','projection','h',(math.cos(math.pi/12),0))
    g.circle_from('c3','N1','O','N2');g.meet('N3','c3','h',(math.sqrt(2)+math.cos(math.pi/12),0))
    g.circle_from('c4','N3','O','N2');g.meet('N4','c4','h',(L,0))
    cell=frame('N4',L)
    plan=[('N4',None,None,30,'Draw a line through N4 parallel to line OB.'),
          ('Q1','r105','gl0',0,'The new line crosses the line at105° from OA at Q1, below O. '
               'Draw a horizontal line through Q1.'),
          ('Q2','st9','gl1',30,'The horizontal line through Q1 crosses the line from S10 to S1 at Q2. '
               'Draw a line through Q2 parallel to line OB.'),
          ('Q3','r120','gl2',90,'The new line crosses line OE at Q3, below O. Draw a vertical line through Q3.'),
          ('Q4','frame','gl2',150,'The line through Q2 at30° from OA crosses the right tile side at Q4. '
               'Draw a line through Q4 parallel to line FM.'),
          ('Q5','gl3@5','gl4',90,'The vertical through Q3, turned by300°, crosses the last line at Q5. '
               'Draw a vertical line through Q5.')]
    for i,(point,a,b,angle,text) in enumerate(plan):
        step(text.replace('at105','at 105').replace('at30','at 30').replace('by300','by 300')+' Turn it round O by 60°, five times.')
        if a:g.meet(point,a,b,g.crossings(a,b)[0])
        g.line_par(f'gl{i}',point,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot6')
    step('Draw a horizontal line through S1. It crosses the vertical line through O at N5. '
         'Draw circles with centres O and N5 through each other. '
         'Draw a straight line through their crossings, P2 and P3. '
         'It crosses the vertical line at N6.', 'compass')
    ss=math.sin(math.pi/12)
    g.line_par('sineProjection','S1','h');g.meet('N5','sineProjection','v',(0,ss))
    g.circle_through('sine','O','N5');g.circle_through('halfSine','N5','O')
    g.meet('P2','sine','halfSine',(math.sqrt(3)*ss/2,ss/2))
    g.meet('P3','sine','halfSine',(-math.sqrt(3)*ss/2,ss/2))
    g.line_through('midpoint','P2','P3');g.meet('N6','midpoint','v',(0,ss/2))
    step('Draw a circle with centre N5 through N6. It crosses the vertical line again at N7, above N5. '
         'Draw a circle with centre O through N7. It crosses the horizontal line at N8, right of O.', 'compass')
    g.circle_through('threeHalves','N5','N6');g.meet('N7','threeHalves','v',(0,3*ss/2))
    g.circle_through('cx','O','N7');g.meet('N8','cx','h',(3*ss/2,0))
    step('Draw a vertical line through N8. Turn it round O by 60°, five times.')
    g.line_par('xv','N8','v');g.repeat('xs',['xv'],'rot6')
    step('Draw a circle with centre N4 and opening from O to N8. '
         'It crosses the horizontal line at N9, towards O. '
         'Draw a vertical line through N9. Turn it round O by 60°, five times.', 'compass')
    g.circle_from('cy','N4','O','N8');g.meet('N9','cy','h',(L-3*ss/2,0))
    g.line_par('yv','N9','v');g.repeat('ys',['yv'],'rot6')
    cm.steps[3]['textWithoutHelpers'] = (
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H, E and L, and F and M.')
    cm.steps[6]['textWithoutHelpers'] = (
        'P1 is where the vertical through A crosses the horizontal through D. '
        'Draw a circle with centre O through P1. It crosses the horizontal line at N1, right of A.')
    return cell


def drawing(pieces):
    ps=cm.frame_pieces(pieces,(297.5,373.91),2*UNIT,0)
    c,s=math.cos(-math.pi/12),math.sin(-math.pi/12)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();paths=cm.along_ink(network(drawing(pieces),cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'damascus-fountain-stars','title':'Star surround of a Damascus fountain',
        'short':'Damascus fountain stars','subtitle':'Fountain surround, Damascus',
        'fold':6,'star':12,'style':'Syrian','level':'advanced',
        'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its point radius.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s DM1 drawing. The drawing gives no steps. '
                   'The three-square star opening, a square diagonal, compass transfers and one midpoint '
                   'fix the repeat and every parallel family.',
            'changes':'The teaching frame turns−15°. The plain source boundaries are retained. '
                      'The compass steps, order and named points are ours. The palette is illustrative. '
                      'No fountain photograph was independently checked.','reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data204/DM1: Damascus fountain surround','creator':'Brian Wichmann',
            'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data204/DM1.html',
            'note':'The page credits Richard Henry’s photograph of an exterior fountain surround in Damascus, Syria, described as a six-fold cut-stone pattern, supplied by personal communication. The photograph was not independently checked.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','palette':'Kashan','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
        'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    inventory=[
        ('star',24,6-2*math.sqrt(3),1,'ground'),
        ('chelate',18,-.5+7*math.sqrt(3)/6,6,'d'),
        ('ten',10,23/8-11*math.sqrt(3)/12,12,'ground'),
        ('small_star',12,-27/4+9*math.sqrt(3)/2,2,'c'),
        ('hexagon',6,1.5-2*math.sqrt(3)/3,12,'ground'),
        ('rhombus',4,math.sqrt(3)/6,6,'ground'),
        ('small_hexagon',6,2*math.sqrt(3)/3-1,12,'d'),
        ('kite',4,2*math.sqrt(3)/3-1,12,'c')]
    t['expect']={'pieceTypes':8,'cellArea':round(18+12*math.sqrt(3),5),
        'note':'The chelate’s fourteen-corner outer contour has area −1/2+4√3/3. '
               'Subtract its inset rhombus √3/6 to get the eighteen-corner boundary and area −1/2+7√3/6. '
               'The63 counted pieces sum exactly to18+12√3.',
        'pieces':[{'name':name,'vertices':n,'area':round(area,5),'perCell':count,
                   **({'small':True} if name=='chelate' else {})}
                  for name,n,area,count,_ in inventory]}
    t['pattern']['colors']={name:color for name,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
