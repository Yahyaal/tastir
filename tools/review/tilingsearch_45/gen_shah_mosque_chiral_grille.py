#!/usr/bin/env python3
"""F38: chiral p6 divided-star grille, plain source boundaries.

O=(350.28,371)pt, OA=30(3+√3)/√2pt, the twelve-star radius.
K is a short edge of its unit three-square star. The free edge lengths
are6K/5 and29K/20. The repeat is framed through a constructed four-star
junction, with normal((158+89√3)/120,(38−9√3)/120).
"""
import math
import sys
import common as cm
from common import g,step
from gen_qawsun_quran_stars import build as opening
from gen_salim_chishti_dodecagons import LETTERS
from gen_agra_twelve_six_stars import REF
from hexagonal import network,clip_poly

UNIT=30*(3+math.sqrt(3))/math.sqrt(2)
K=(3*math.sqrt(2)-math.sqrt(6))/6
BX=(158+89*math.sqrt(3))/120
BY=(38-9*math.sqrt(3))/120
L=math.hypot(BX,BY)
EVENTS=[{'kind': 'parallel', 'i': 0, 'a': 'r165', 'b': 'outer', 'angle': 30, 'branch': 'near'},
 {'kind': 'parallel', 'i': 1, 'a': 'v', 'b': 'gl0', 'angle': 0, 'branch': 'near'},
 {'kind': 'parallel', 'i': 2, 'a': 'v', 'b': 'gl0', 'angle': 15, 'branch': 'near'},
 {'kind': 'parallel', 'i': 3, 'a': 'r105', 'b': 'gl2', 'angle': 150, 'branch': 'near'},
 {'kind': 'parallel', 'i': 4, 'a': 'r45', 'b': 'gl3', 'angle': 30, 'branch': 'near'},
 {'kind': 'parallel', 'i': 5, 'a': 'r150', 'b': 'outer', 'angle': 60, 'branch': 'near'},
 {'kind': 'parallel', 'i': 6, 'a': 'r60', 'b': 'gl0', 'angle': 165, 'branch': 'near'},
 {'kind': 'parallel', 'i': 7, 'a': 'r45', 'b': 'gl2', 'angle': 120, 'branch': 'near'},
 {'kind': 'parallel', 'i': 8, 'a': 'r105', 'b': 'gl5', 'angle': 15, 'branch': 'near'},
 {'kind': 'parallel', 'i': 9, 'a': 'outer', 'b': 'gl8', 'angle': 30, 'branch': 'near'},
 {'kind': 'parallel', 'i': 10, 'a': 'r150', 'b': 'gl9', 'angle': 60, 'branch': 'near'},
 {'kind': 'parallel', 'i': 11, 'a': 'gl2', 'b': 'gl10', 'angle': 90, 'branch': 'near'},
 {'kind': 'frame', 'a': 'gl6@2', 'b': 'gl11'},
 {'kind': 'circle', 'a': 'r45', 'b': 'gl0@8'},
 {'kind': 'parallel', 'i': 14, 'a': 'r45', 'b': 'innerCircle', 'angle': 120, 'branch': 'near'},
 {'kind': 'parallel', 'i': 15, 'a': 'gl1', 'b': 'gl14', 'angle': 60, 'branch': 'near'},
 {'kind': 'parallel', 'i': 16, 'a': 'gl6', 'b': 'gl14', 'angle': 30, 'branch': 'near'},
 {'kind': 'parallel', 'i': 17, 'a': 'gl5', 'b': 'gl14', 'angle': 0, 'branch': 'near'},
 {'kind': 'parallel', 'i': 18, 'a': 'gl6', 'b': 'gl17', 'angle': 150, 'branch': 'near'},
 {'kind': 'parallel', 'i': 19, 'a': 'gl8', 'b': 'gl18', 'angle': 60, 'branch': 'near'}]
ANGLES={e['i']:e['angle'] for e in EVENTS if e['kind']=='parallel'}

PLACEMENTS=[{'piece': 'twelve_kite', 'nth': 1, 'color': '#ffffff'},
 {'piece': 'twelve_kite', 'nth': 2, 'color': '#ffffff'},
 {'piece': 'twelve_kite', 'nth': 5, 'color': '#ffffff'},
 {'piece': 'twelve_kite', 'nth': 6, 'color': '#ffffff'},
 {'piece': 'twelve_kite', 'nth': 9, 'color': '#ffffff'},
 {'piece': 'twelve_kite', 'nth': 10, 'color': '#ffffff'},
 {'piece': 'green_four', 'nth': 0, 'color': 'd'},
 {'piece': 'green_four', 'nth': 3, 'color': 'd'},
 {'piece': 'green_four', 'nth': 4, 'color': 'd'},
 {'piece': 'green_four', 'nth': 7, 'color': 'd'},
 {'piece': 'green_four', 'nth': 8, 'color': 'd'},
 {'piece': 'green_four', 'nth': 11, 'color': 'd'},
 {'piece': 'outer_four', 'nth': 0, 'color': '#ffffff'},
 {'piece': 'outer_four', 'nth': 3, 'color': 'b'},
 {'piece': 'outer_four', 'nth': 4, 'color': 'b'},
 {'piece': 'outer_four', 'nth': 7, 'color': '#ffffff'},
 {'piece': 'outer_four', 'nth': 8, 'color': '#ffffff'},
 {'piece': 'outer_four', 'nth': 11, 'color': 'b'},
 {'piece': 'outer_four', 'nth': 12, 'color': 'b'},
 {'piece': 'outer_four', 'nth': 15, 'color': '#ffffff'},
 {'piece': 'outer_four', 'nth': 16, 'color': '#ffffff'},
 {'piece': 'outer_four', 'nth': 19, 'color': 'b'},
 {'piece': 'outer_four', 'nth': 20, 'color': 'b'},
 {'piece': 'outer_four', 'nth': 23, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 0, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 1, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 2, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 3, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 4, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 5, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 6, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 8, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 9, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 10, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 11, 'color': 'd'},
 {'piece': 'four_kite', 'nth': 12, 'color': 'd'},
 {'piece': 'four_kite', 'nth': 13, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 14, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 16, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 17, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 18, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 19, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 21, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 22, 'color': 'd'},
 {'piece': 'four_kite', 'nth': 23, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 24, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 25, 'color': 'd'},
 {'piece': 'four_kite', 'nth': 26, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 28, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 29, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 30, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 31, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 33, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 34, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 35, 'color': 'd'},
 {'piece': 'four_kite', 'nth': 36, 'color': 'd'},
 {'piece': 'four_kite', 'nth': 37, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 38, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 39, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 41, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 42, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 43, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 44, 'color': '#ffffff'},
 {'piece': 'four_kite', 'nth': 45, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 46, 'color': 'b'},
 {'piece': 'four_kite', 'nth': 47, 'color': 'b'},
 {'piece': 'six_kite', 'nth': 1, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 2, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 5, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 6, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 9, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 10, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 12, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 15, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 16, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 19, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 20, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 23, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 25, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 26, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 29, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 30, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 33, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 34, 'color': '#ffffff'},
 {'piece': 'small_four', 'nth': 2, 'color': 'd'},
 {'piece': 'small_four', 'nth': 3, 'color': 'd'},
 {'piece': 'small_four', 'nth': 5, 'color': 'd'},
 {'piece': 'small_four', 'nth': 6, 'color': 'd'},
 {'piece': 'small_four', 'nth': 8, 'color': 'd'},
 {'piece': 'small_four', 'nth': 9, 'color': 'd'},
 {'piece': 'small_four', 'nth': 14, 'color': 'd'},
 {'piece': 'small_four', 'nth': 15, 'color': 'd'},
 {'piece': 'small_four', 'nth': 17, 'color': 'd'},
 {'piece': 'small_four', 'nth': 18, 'color': 'd'},
 {'piece': 'small_four', 'nth': 20, 'color': 'd'},
 {'piece': 'small_four', 'nth': 21, 'color': 'd'},
 {'piece': 'small_four', 'nth': 26, 'color': 'd'},
 {'piece': 'small_four', 'nth': 27, 'color': 'd'},
 {'piece': 'small_four', 'nth': 29, 'color': 'd'},
 {'piece': 'small_four', 'nth': 30, 'color': 'd'},
 {'piece': 'small_four', 'nth': 33, 'color': 'd'},
 {'piece': 'small_four', 'nth': 34, 'color': 'd'},
 {'piece': 'small_four', 'nth': 37, 'color': 'd'},
 {'piece': 'small_four', 'nth': 38, 'color': 'd'},
 {'piece': 'small_four', 'nth': 41, 'color': 'd'},
 {'piece': 'small_four', 'nth': 42, 'color': 'd'},
 {'piece': 'small_four', 'nth': 44, 'color': 'd'},
 {'piece': 'small_four', 'nth': 45, 'color': 'd'},
 {'piece': 'small_four', 'nth': 50, 'color': 'd'},
 {'piece': 'small_four', 'nth': 51, 'color': 'd'},
 {'piece': 'small_four', 'nth': 53, 'color': 'd'},
 {'piece': 'small_four', 'nth': 54, 'color': 'd'},
 {'piece': 'small_four', 'nth': 56, 'color': 'd'},
 {'piece': 'small_four', 'nth': 57, 'color': 'd'},
 {'piece': 'small_four', 'nth': 62, 'color': 'd'},
 {'piece': 'small_four', 'nth': 63, 'color': 'd'},
 {'piece': 'small_four', 'nth': 65, 'color': 'd'},
 {'piece': 'small_four', 'nth': 66, 'color': 'd'},
 {'piece': 'small_four', 'nth': 68, 'color': 'd'},
 {'piece': 'small_four', 'nth': 69, 'color': 'd'}]

def description(name):
    base,_,copy=name.partition('@')
    if base in ['h','v']:text=('horizontal' if base=='h' else 'vertical')+' line through O'
    elif base.startswith('r') and base[1:].isdigit():text=f'{base[1:]}° line through O'
    elif base.startswith('st'):
        i=int(base[2:]);text=f'line {LETTERS[i]}{LETTERS[(i+3)%12]}'
    elif base=='outer':text='vertical line through P7'
    elif base=='innerCircle':text='circle with centre P9'
    else:
        i=int(base[2:]);angle=ANGLES[i]
        text=(('horizontal' if angle==0 else 'vertical') if angle in [0,90] else f'{angle}°')+f' line through Q{i+1}'
    if copy:text+=f' turned {int(copy)*30}°'
    return text


def build():
    opening(opening_only=True)
    step('The line through A and D crosses line LB at P1, near A. '
         'Draw a circle with centre O and opening from A to P1. '
         'It crosses the horizontal line at N1, right of O.', 'compass')
    g.meet('P1','st0','st10',((3+math.sqrt(3))/6,(3-math.sqrt(3))/6))
    g.circle_from('edgeCircle','O','A','P1');g.meet('N1','edgeCircle','h',(K,0))
    step('Draw a circle with centre N1 through O. It crosses the horizontal line again at N2, right of N1. '
         'Draw a circle with centre N2 and opening from O to N1. It crosses that line at N3, right of N2. '
         'Draw a circle with centre N3 and opening from O to N2. It crosses that line at N4, right of N3.', 'compass')
    g.circle_through('twoEdges','N1','O');g.meet('N2','twoEdges','h',(2*K,0))
    g.circle_from('threeEdges','N2','O','N1');g.meet('N3','threeEdges','h',(3*K,0))
    g.circle_from('fiveEdges','N3','O','N2');g.meet('N4','fiveEdges','h',(5*K,0))
    step('The circle with centre O through N1 crosses the vertical line at P2, above O. '
         'Draw a straight line through N4 and P2. Draw a line through N1 parallel to it. '
         'It crosses the vertical line at P3. Draw a circle with centre O through P3. '
         'It crosses the horizontal line at N5, right of O.', 'compass')
    g.meet('P2','edgeCircle','v',(0,K));g.line_through('intercept','N4','P2');g.line_par('fifth','N1','intercept');g.meet('P3','fifth','v',(0,K/5))
    g.circle_through('fifthCircle','O','P3');g.meet('N5','fifthCircle','h',(K/5,0))
    step('Draw a circle with centre N1 and opening from O to N5. '
         'It crosses the horizontal line at N6, right of N1.', 'compass')
    g.circle_from('firstLength','N1','O','N5');g.meet('N6','firstLength','h',(6*K/5,0))
    for i,(before,after,p,value) in enumerate([('N5','N7','P4',K/10),('N7','N8','P5',K/20),('N1','N9','P6',K/2)]):
        step(f'Draw a line through {before} parallel to the line at 135° from OA. '
             f'It crosses the line at 45° from OA at {p}. Draw a vertical line through {p}. '
             f'It crosses the horizontal line at {after}.')
        g.line_par(f'half{i}',before,'r135');g.meet(p,f'half{i}','r45',(value,value))
        g.line_par(f'project{i}',p,'v');g.meet(after,f'project{i}','h',(value,0))
    step('Draw a circle with centre N1 and opening from O to N9. It crosses the horizontal line at N10, right of N1. '
         'Draw a circle with centre N10 and opening from O to N8. It crosses that line at N11, towards O.', 'compass')
    g.circle_from('threeHalves','N1','O','N9');g.meet('N10','threeHalves','h',(3*K/2,0))
    g.circle_from('secondLength','N10','O','N8');g.meet('N11','secondLength','h',(29*K/20,0))
    step('Draw a circle with centre P1 and opening from O to N11. '
         'It crosses the line at 15° from OA at P7, further from O. '
         'Draw a vertical line through P7. Turn it round O by 30°, eleven times.', 'compass')
    g.circle_from('outerCircle','P1','O','N11');roots=g.crossings('outerCircle','r15')
    g.meet('P7','outerCircle','r15',max(roots,key=lambda p:math.hypot(*p)))
    g.line_par('outer','P7','v');g.repeat('outers',['outer'],'rot12')
    cell=None
    for event in EVENTS:
        a,b=event['a'],event['b']
        if event['kind']=='frame':
            step(f'The {description(a)} crosses the {description(b)} at P8. '
                 'Draw a straight line through O and P8. '
                 'Draw a line through P8 at 90° to the line from O to P8. '
                 'Turn it round O by 60°, five times. The six lines frame the tile, with corners T1 to T6.')
            g.meet('P8',a,b,g.crossings(a,b)[0]);g.line_through('midRay','O','P8');g.line_perp('frame','P8','midRay');g.repeat('frames',['frame'],'rot6')
            frame=lambda i:'frame' if i%6==0 else f'frame@{i%6}'
            cell=[]
            for i in range(6):
                point=g.crossings(frame(i),frame(i+1))[0];cell.append(point);g.meet(f'T{i+1}',frame(i),frame(i+1),point)
        elif event['kind']=='circle':
            step(f'The {description(a)} crosses the {description(b)} at P9. '
                 'Draw a circle with centre P9 and opening from O to N6.', 'compass')
            g.meet('P9',a,b,g.crossings(a,b)[0]);g.circle_from('innerCircle','P9','O','N6')
        else:
            i,angle=event['i'],event['angle'];p=f'Q{i+1}'
            roots=g.crossings(a,b)
            point=(max if event['branch']=='far' else min)(roots,key=lambda p:math.hypot(*p))
            intro=f'The {description(a)} crosses the {description(b)} at {p}. '
            if 'innerCircle' in [a,b]:
                direction='further from' if event['branch']=='far' else 'closer to'
                intro=f'The circle with centre P9 crosses the 45° line through O at {p}, {direction} O. '
            draw=(f'Draw a horizontal line through {p}.' if angle==0 else
                  f'Draw a vertical line through {p}.' if angle==90 else
                  f'Draw a line through {p} at {angle}° from OA.')
            step(intro+draw+' Turn it round O by 30°, eleven times.')
            g.meet(p,a,b,point);g.line_par(f'gl{i}',p,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot12')
    cm.steps[8]['textWithoutHelpers']=(
        'The circle with centre O through N1 crosses the vertical line at P2, above O. '
        'Draw a line through N1 parallel to the line from N4 to P2. '
        'It crosses the vertical line at P3. Draw a circle with centre O through P3. '
        'It crosses the horizontal line at N5, right of O.')
    for number in [18,21,22,24]:
        cm.steps[number-1]['textWithoutHelpers']=cm.steps[number-1]['text'].replace(
            'Turn it round O by 30°, eleven times.',
            'Turn it round O by 60°, 120°, 180°, 240° and 300°.')
    cm.steps[28]['textWithoutHelpers']=cm.steps[28]['text']
    assert cell
    return cell


def drawing(pieces):
    return cm.frame_pieces(pieces,(350.28,371),2*UNIT,0)


def main():
    pieces,out=sys.argv[1:3];cell=build();polys=drawing(pieces)
    u=(cell[0][0]-cell[2][0],cell[0][1]-cell[2][1]);v=(cell[1][0]-cell[3][0],cell[1][1]-cell[3][1])
    polys=[[(x+u[0]*i+v[0]*j,y+u[1]*i+v[1]*j) for x,y in q] for q in polys for i in [-1,0,1] for j in [-1,0,1]]
    edges=[]
    for q in polys:
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    t={'format':0,'id':'shah-mosque-chiral-grille','title':'Chiral divided stars of the Shah Mosque grille',
        'short':'Shah Mosque chiral grille','subtitle':'Shah Mosque, Isfahan, Iran',
        'fold':6,'star':12,'chiral':True,'style':'Persian','level':'advanced',
        'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its point radius.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s F38 drawing. The drawing gives no steps. '
                   'The shared three-square opening locates a unit kite edge. A fifth and twentieth of it set two connector lengths. '
                   'Parallels and one further compass transfer locate the chiral mesh and its angled hexagonal repeat.',
            'changes':'Plain source boundaries are retained. The independent edge lengths use6/5 and29/20 of the unit kite edge, matching the rounded source vertices. '
                      'The steps, order and named points are ours. Colours retain the diagram’s classes and are illustrative; the source states that the wooden original has no colour. '
                      'No monument photograph was independently checked.','reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data153/F38: Shah Mosque wooden grille','creator':'Brian Wichmann',
            'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data153/F38.html',
            'note':'The page cites Dominique Clévenot, Ornament and decoration in Islamic architecture(2000), page45, figure38, photographs by Gérard Degeorge: Shah Mosque, Isfahan(1629AD,1038AH). It describes a wooden grille with no colour in the original. No photograph was independently checked.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the hexagonal tile side by side.'},
        'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    s=math.sqrt(3)
    inventory=[('twelve_kite',.5-s/6,12,'b'),
        ('green_four',661/7200+319*s/14400,12,'c'),
        ('outer_four',-881/4800+1261*s/7200,24,'a'),
        ('three_kite',1003/7200-73*s/4320,24,'ground'),
        ('four_kite',-73/2880+1003*s/14400,48,'c'),
        ('six_kite',-145/576+947*s/4800,36,'b'),
        ('small_four',(6269-2203*s)/28800,72,'c')]
    t['expect']={'pieceTypes':7,'cellArea':round(343/30+25207*s/3600,5),
        'note':'The228 drawn quadrilateral faces sum exactly to343/30+25207√3/3600. '
               'The drawn faces give four kite types and three reflected quadrilateral pairs; the source page lists five kite types.',
        'pieces':[{'name':n,'vertices':4,'area':round(a,5),'perCell':c} for n,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,color in inventory}
    t['pattern']['placements']={'repeat':[1,1],'rules':PLACEMENTS}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
