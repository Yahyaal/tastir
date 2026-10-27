#!/usr/bin/env python3
"""SYR0222: plain six-star mosaic, OA=30√3pt, frame turns30°.

The cell apothem is3. Successive diagonal intercepts construct3/16
and9/16; compass doubling and complements give the six axial families.
"""
import math
import sys

import common as cm
from common import g, step
from gen_salim_chishti_dodecagons import opening
from gen_agra_twelve_six_stars import frame
from hexagonal import network

UNIT=30*math.sqrt(3)
L=3


def build():
    opening()
    step('Draw the line through O that halves angle BOC. Draw a line through O at 90° to it.')
    g.line_bisect('r45','B','O','C');g.line_perp('r135','O','r45')
    step('Draw a straight line through A and E, E and J, and J and A. '
         'Draw a straight line through C and G, G and L, and L and C. The two triangles make the star.')
    pts=['A','C','E','G','J','L']
    for i,p in enumerate(pts):g.line_through(f'st{i}',p,pts[(i+2)%6])
    step('Draw a circle with centre A through O. It crosses the horizontal line at N1, right of A. '
         'Draw a circle with centre N1 and opening OA. It crosses that line at N2, right of N1.', 'compass')
    g.circle_through('c2','A','O');g.meet('N1','c2','h',(2,0))
    g.circle_from('c3','N1','O','A');g.meet('N2','c3','h',(3,0))
    cell=frame('N2',L)
    step('Draw a vertical line through C. It crosses the horizontal line at N3. '
         'Draw a line through N3 parallel to the line at 135° from OA. '
         'It crosses the line at 45° from OA at P1. '
         'Draw a vertical line through P1. It crosses the horizontal line at N4.')
    g.line_par('halfProjection','C','v');g.meet('N3','halfProjection','h',(.5,0))
    g.line_par('halfDiagonal','N3','r135');g.meet('P1','halfDiagonal','r45',(.25,.25))
    g.line_par('quarterProjection','P1','v');g.meet('N4','quarterProjection','h',(.25,0))
    step('Draw a line through N4 parallel to the line at 135° from OA. '
         'It crosses the line at 45° from OA at P2. '
         'Draw a vertical line through P2. It crosses the horizontal line at N5.')
    g.line_par('quarterDiagonal','N4','r135');g.meet('P2','quarterDiagonal','r45',(.125,.125))
    g.line_par('eighthProjection','P2','v');g.meet('N5','eighthProjection','h',(.125,0))
    step('Draw a line through N5 parallel to the line at 45° from OA. '
         'It crosses the line through N4 at P3. Draw a vertical line through P3. '
         'It crosses the horizontal line at N6.')
    g.line_par('eighthDiagonal','N5','r45');g.meet('P3','eighthDiagonal','quarterDiagonal',(3/16,1/16))
    g.line_par('xProjection','P3','v');g.meet('N6','xProjection','h',(3/16,0))
    step('Draw a line through A parallel to the line at 135° from OA. '
         'It crosses the line through N5 at P4. Draw a vertical line through P4. '
         'It crosses the horizontal line at N7.')
    g.line_par('unitDiagonal','A','r135');g.meet('P4','unitDiagonal','eighthDiagonal',(9/16,7/16))
    g.line_par('yProjection','P4','v');g.meet('N7','yProjection','h',(9/16,0))
    step('Draw a circle with centre N7 through O. It crosses the horizontal line again at N8, right of N7.', 'compass')
    g.circle_through('double','N7','O');g.meet('N8','double','h',(9/8,0))
    step('Draw a circle with centre N2 and opening from O to N8. '
         'It crosses the horizontal line at N9, towards O.', 'compass')
    g.circle_from('oppositeDouble','N2','O','N8');g.meet('N9','oppositeDouble','h',(15/8,0))
    step('Draw a circle with centre N2 and opening from O to N7. '
         'It crosses the horizontal line at N10, towards O. '
         'Draw a circle with centre N2 and opening from O to N6. '
         'It crosses that line at N11, towards O.', 'compass')
    g.circle_from('oppositeY','N2','O','N7');g.meet('N10','oppositeY','h',(39/16,0))
    g.circle_from('oppositeX','N2','O','N6');g.meet('N11','oppositeX','h',(45/16,0))
    for pair in [('N6','N11'),('N7','N10'),('N8','N9')]:
        step(f'Draw vertical lines through {pair[0]} and {pair[1]}. Turn them round O by 60°, five times.')
        for n in pair:g.line_par(n+'v',n,'v');g.repeat(n+'copies',[n+'v'],'rot6')
    step('Draw a line through N2 parallel to line OB. Turn it round O by 60°, five times.')
    g.line_par('connector','N2','r30');g.repeat('connectors',['connector'],'rot6')
    step('The line through L and C crosses the new line at Q, below O. '
         'Draw a horizontal line through Q. Turn it round O by 60°, five times.')
    g.meet('Q','st5','connector',(.5,-5*math.sqrt(3)/6))
    g.line_par('qh','Q','h');g.repeat('qhs',['qh'],'rot6')
    cm.steps[3]['textWithoutHelpers']=(
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H. Draw a straight line through F and M.')
    cm.steps[4]['textWithoutHelpers']='Draw the line through O that halves angle BOC.'
    return cell


def drawing(pieces):
    ps=cm.frame_pieces(pieces,(297.5,375.7208333333),2*UNIT,0)
    c,s=math.cos(math.pi/6),math.sin(math.pi/6)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();paths=cm.along_ink(network(drawing(pieces),cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'ibn-arabi-six-stars','title':'Six-pointed stars of Ibn al-Arabi’s mausoleum',
       'short':'Ibn al-Arabi stars','subtitle':'Ibn al-Arabi mausoleum, Damascus',
       'fold':6,'star':6,'style':'Syrian','level':'advanced',
       'given':{'O':'The centre of a six-pointed star.','A':'Sets its point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s SYR0222 drawing. The drawing gives no steps. '
                  'Two triangles, diagonal intercepts and compass transfers fix every parallel family.',
           'changes':'The teaching frame turns 30°. Plain source boundaries are retained. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No monument photograph was independently checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data197/SYR0222: Ibn al-Arabi mausoleum','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data197/SYR0222.html',
           'note':'The page cites Wade SYR0222, Ibn al-Arabi Mausoleum, Damascus, Syria.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','palette':'Kashan','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    inventory=[('fork',24,243*math.sqrt(3)/128,2,'c'),
        ('star',12,math.sqrt(3),1,'ground'),('chelate',18,529*math.sqrt(3)/576,6,'ground'),
        ('ten',10,75*math.sqrt(3)/128,6,'a'),('hexagon',6,math.sqrt(3)/2,6,'c'),
        ('kite',4,math.sqrt(3)/9,6,'a'),('small_kite',4,49*math.sqrt(3)/576,6,'a')]
    t['expect']={'pieceTypes':7,'cellArea':round(18*math.sqrt(3),5),
        'note':'The chelate’s fourteen-corner outer contour has area289√3/288. '
               'Subtract its inset kite49√3/576 to get529√3/576 and eighteen boundary corners. '
               'The33 counted pieces sum exactly to18√3.',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
