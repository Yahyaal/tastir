#!/usr/bin/env python3
"""F8785: Cairo house mosaic, plain piece boundaries.

O=(297.5,377.3)pt; OA=40√3pt; no frame turn.
The cell apothem is3. Large and small stars occupy different lattice sites.
The small stars have radius2√3−3. No band expansion is applied.
"""
import math
import sys

import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening
from gen_agra_twelve_six_stars import frame
from hexagonal import network

UNIT=40*math.sqrt(3)
L=3


def build():
    opening()
    step('Draw a straight line through B and F, F and K, and K and B. '
         'Draw a straight line through D and H, H and M, and M and D. '
         'The two triangles make the star at O.')
    points=['B','D','F','H','K','M']
    for i,p in enumerate(points):g.line_through(f'st{i}',p,points[(i+2)%6])
    step('Draw a circle with centre A through O. It crosses the horizontal line at N1, right of A. '
         'Draw a circle with centre N1 and opening OA. '
         'It crosses the horizontal line at N2, right of N1.', 'compass')
    g.circle_through('c2','A','O');g.meet('N1','c2','h',(2,0))
    g.circle_from('c3','N1','O','A');g.meet('N2','c3','h',(3,0))
    cell=frame('N2',L)
    step('Draw a circle with centre O through N2. It crosses line OB at P, towards T1. '
         'Draw a circle with centre T1 through P.', 'compass')
    g.circle_through('frameCircle','O','N2');g.meet('P','frameCircle','r30',(3*math.sqrt(3)/2,1.5))
    g.circle_through('small','T1','P')
    step('Draw a vertical line through T1. Draw lines through T1 parallel to lines OB and FM. '
         'Their crossings with the small circle are V1 to V6, counted round it.')
    for a,ref in [(30,'r30'),(90,'v'),(150,'r150')]:g.line_par(f'cornerRay{a}','T1',ref)
    r=2*math.sqrt(3)-3
    for k in range(6):
        a=30+60*k;g.meet(f'V{k+1}','small',f'cornerRay{a%180}',
            (3+r*math.cos(math.radians(a)),math.sqrt(3)+r*math.sin(math.radians(a))))
    step('Draw a straight line through V1 and V3, V3 and V5, and V5 and V1. '
         'Draw a straight line through V2 and V4, V4 and V6, and V6 and V2. '
         'Turn these six lines round O by 60°, five times.')
    names=[]
    for k in range(6):
        n=f'smallStar{k}';g.line_through(n,f'V{k+1}',f'V{(k+2)%6+1}');names.append(n)
    g.repeat('cornerStars',names,'rot6')
    step('Draw a vertical line through C. It crosses the horizontal line at N3. '
         'Draw a circle with centre A and opening from O to N3. '
         'It crosses the horizontal line at N4, right of A.', 'compass')
    g.line_par('projection','C','v');g.meet('N3','projection','h',(.5,0))
    g.circle_from('cHalf','A','O','N3');g.meet('N4','cHalf','h',(1.5,0))
    step('Draw a circle with centre N4 and the same opening as the small circle at T1. '
         'It crosses the horizontal line at N5, right of N4. '
         'Draw a vertical line through N5. Turn it round O by 60°, five times.', 'compass')
    cm.circle_radius_of('cX','N4','small');g.meet('N5','cX','h',(2*math.sqrt(3)-1.5,0))
    g.line_par('xv','N5','v');g.repeat('xs',['xv'],'rot6')
    step('Draw a circle with centre N2 and opening from O to N5. '
         'It crosses the horizontal line at N6, towards O. '
         'Draw a vertical line through N6. Turn it round O by 60°, five times.', 'compass')
    g.circle_from('cY','N2','O','N5');g.meet('N6','cY','h',(4.5-2*math.sqrt(3),0))
    g.line_par('yv','N6','v');g.repeat('ys',['yv'],'rot6')
    step('Draw a line through N2 parallel to line OB. Turn it round O by 60°, five times.')
    g.line_par('connector','N2','r30');g.repeat('connectors',['connector'],'rot6')
    cm.steps[3]['textWithoutHelpers'] = (
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H. Draw a straight line through F and M.')
    cm.steps[9]['textWithoutHelpers'] = (
        'V1 to V6 are the small circle’s six division points. '
        'Draw a straight line through V1 and V3, V3 and V5, and V5 and V1. '
        'Draw a straight line through V2 and V4, and V4 and V6. '
        'Turn these five lines round O by 60°, five times.')
    cm.steps[12]['textWithoutHelpers'] = (
        'Draw a circle with centre N2 and opening from O to N5. '
        'It crosses the horizontal line at N6, towards O.')
    return cell


def drawing(pieces):
    return cm.frame_pieces(pieces,(297.5,377.3),2*UNIT,0)


def main():
    pieces,out=sys.argv[1:3];cell=build();paths=cm.along_ink(network(drawing(pieces),cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    tut={'format':0,'id':'dhahabi-house-six-stars','title':'Six-pointed stars of the al-Dhahabi house, Cairo',
        'short':'Al-Dhahabi house stars','subtitle':'Jamal al-Din al-Dhahabi house, Cairo',
        'fold':6,'star':6,'style':'Egyptian','level':'advanced',
        'given':{'O':'The centre of a six-pointed star.','A':'Sets its point radius.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s F8785 drawing. The drawing gives no steps. '
                   'The large unit star, small stars at the cell corners and three parallel families construct every boundary.',
            'changes':'The plain polygon boundaries are retained. The full repeat distinguishes large and small stars. '
                      'The compass steps, order and named points are ours. '
                      'The palette is illustrative; no house photograph was independently checked.','reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data201/F8785: Jamal al-Din al-Dhahabi, Cairo',
            'creator':'Brian Wichmann','kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data201/F8785.html',
            'note':'The page cites Thesaurus Islamicus: the first floor of the east side, north area of the qa’a, west wall, panel detail (1637 AD, 1047 AH); and Wichmann and Wade (2017), figure 11.1a.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','palette':'Mamluk wood','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
        'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    inventory=[
        ('star',12,math.sqrt(3),1,'a'),('chelate',12,18-19*math.sqrt(3)/2,6,'b'),
        ('hexagon',6,math.sqrt(3)/2,6,'ground'),('eight',8,4.5-13*math.sqrt(3)/6,6,'c'),
        ('kite',4,3*math.sqrt(3)-4.5,12,'ground'),('small_star',12,21*math.sqrt(3)-36,2,'c'),
        ('small_kite',4,math.sqrt(3)-1.5,6,'c')]
    tut['expect']={'pieceTypes':7,'cellArea':round(18*math.sqrt(3),5),
        'note':'The chelate’s eight-corner outer contour has area (33−17√3)/2. '
               'Subtract its inset kite √3−3/2 to give 18−19√3/2 and twelve boundary corners. '
               'All counted piece areas sum exactly to 18√3.',
        'pieces':[{'name':name,'vertices':n,'area':round(area,5),'perCell':count}
                  for name,n,area,count,_ in inventory]}
    tut['pattern']['colors']={name:color for name,_,_,_,color in inventory}
    cm.write(tut,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
