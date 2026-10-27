#!/usr/bin/env python3
"""IND0403, band-centre reconstruction from the coloured faces.

O=(297.5,374.6375)pt; remove brown/black bevel facets and expand faces5pt.
OA=25(3+√3)/√2pt, a star point radius. Teaching frame turns15°.
The hexagonal apothem is L=√2+(9−3√3)/5. A parallel intercept
constructs the factor3/5; six parallels through crossings complete the net.
"""
import math
import sys

import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening
from hexagonal import network

UNIT=25*(3+math.sqrt(3))/math.sqrt(2)
L=math.sqrt(2)+(9-3*math.sqrt(3))/5
REF={0:'h',15:'r15',30:'r30',45:'r45',60:'r60',75:'r75',90:'v',
     105:'r105',120:'r120',135:'r135',150:'r150',165:'r165'}


def frame(mark, apothem):
    step(f'Draw a vertical line through {mark}. Turn it round O by 60°, five times. '
         'The six lines frame the tile, with corners T1 to T6.')
    g.line_par('frame',mark,'v');g.repeat('frames',['frame'],'rot6')
    corners=[(apothem/math.cos(math.pi/6)*math.cos(math.radians(30+60*k)),
              apothem/math.cos(math.pi/6)*math.sin(math.radians(30+60*k))) for k in range(6)]
    side=lambda k:'frame' if k%6==0 else f'frame@{k%6}'
    for i,p in enumerate(corners):g.meet(f'T{i+1}',side(i),side(i+1),p)
    return corners


def build():
    opening()
    step('Draw the lines through O that halve angles AOB, BOC and COD. '
         'Draw a line through O at 90° to each new line. '
         'The circle’s twelve points on these lines are S1 to S12, counted round it.')
    for n,a,b in [('r15','A','B'),('r45','B','C'),('r75','C','D')]:g.line_bisect(n,a,'O',b)
    for a in [15,45,75]:g.line_perp(f'r{a+90}','O',f'r{a}')
    for i in range(12):
        a=15+30*i;g.meet(f'S{i+1}','c',REF[a%180],g.dirdeg(a))
    step('Draw the three squares that make the twelve-pointed star.')
    current=cm.steps[-1];del current['create'];current['parts']=[]
    for k in range(3):
        names=[f'S{k+1+3*i}' for i in range(4)]
        part={'text':f'Draw a straight line through {names[0]} and {names[1]}, {names[1]} and {names[2]}, '
                     f'{names[2]} and {names[3]}, and {names[3]} and {names[0]}.','create':{},'animate':'ruler'}
        current['parts'].append(part);g.cur=part
        for i in range(4):g.line_through(f'st{k+3*i}',names[i],names[(i+1)%4])
    step('Draw a circle with centre A through O. It crosses the horizontal line at N1, right of A. '
         'Draw a circle with centre N1 and opening OA. It crosses the horizontal line at N2, right of N1. '
         'Draw a circle with centre N2 and opening from O to N1. '
         'It crosses the horizontal line at N3, right of N2.', 'compass')
    g.circle_through('c2','A','O');g.meet('N1','c2','h',(2,0))
    g.circle_from('c3','N1','O','A');g.meet('N2','c3','h',(3,0))
    g.circle_from('c5','N2','O','N1');g.meet('N3','c5','h',(5,0))
    step('Draw a circle with centre O and opening AE. '
         'It crosses the horizontal line at N4, right of A.', 'compass')
    g.circle_from('root3','O','A','E');g.meet('N4','root3','h',(math.sqrt(3),0))
    step('Draw a circle with centre N2 and opening from O to N4. '
         'It crosses the horizontal line at N5, towards O. '
         'Draw a circle with centre O through N5. It crosses the vertical line at N6, above O.', 'compass')
    d=3-math.sqrt(3)
    g.circle_from('difference','N2','O','N4');g.meet('N5','difference','h',(d,0))
    g.circle_through('differenceCircle','O','N5');g.meet('N6','differenceCircle','v',(0,d))
    step('Draw a straight line through N3 and N6. '
         'Draw a line through N2 parallel to line N3N6. It crosses the vertical line at N7, above O.')
    # Name a line between family points in words, to avoid a joined engine name.
    cm.steps[-1]['text']=cm.steps[-1]['text'].replace('line N3N6','the line from N3 to N6')
    g.line_through('ratio','N3','N6');g.line_par('ratio3','N2','ratio');g.meet('N7','ratio3','v',(0,3*d/5))
    step('Draw a vertical line through A. Draw a horizontal line through D. They cross at P1. '
         'Draw a circle with centre O through P1. It crosses the horizontal line at N8, right of A.', 'compass')
    g.line_par('ax','A','v');g.line_par('dy','D','h');g.meet('P1','ax','dy',(1,1))
    g.circle_through('root2','O','P1');g.meet('N8','root2','h',(math.sqrt(2),0))
    step('Draw a circle with centre N8 and opening from O to N7. '
         'It crosses the horizontal line at N9, right of N8.', 'compass')
    g.circle_from('repeatCircle','N8','O','N7');g.meet('N9','repeatCircle','h',(L,0))
    cell=frame('N9',L)
    plan=[('N9',None,None,45,'Draw a line through N9 at 45° from OA.'),
          ('Q1','r120','gl0',15,'The last line crosses line OE at Q1, below O. Draw a line through Q1 at 15° from OA.'),
          ('Q2','r150','gl1',45,'The last line crosses line FM at Q2, below O. Draw a line through Q2 at 45° from OA.'),
          ('Q3','v','gl0',15,'The line through N9 crosses the vertical line through O at Q3, below O. '
               'Draw a line through Q3 at 15° from OA.'),
          ('Q4','frame','gl2',135,'The right tile side crosses the line through Q2 at Q4. Draw a line through Q4 at 135° from OA.'),
          ('Q5','r30','gl4',105,'The last line crosses line BH at Q5, above O. Draw a line through Q5 at 105° from OA.')]
    for i,(pt,a,b,angle,text) in enumerate(plan):
        step(text+' Turn it round O by 60°, five times.')
        if a:g.meet(pt,a,b,g.crossings(a,b)[0])
        g.line_par(f'gl{i}',pt,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot6')
    cm.steps[3]['textWithoutHelpers'] = (
        'The four circles cross the first circle at B, C, E, F, H, J, L and M. '
        'Draw a straight line through B and H, E and L, and F and M.')
    cm.steps[9]['textWithoutHelpers'] = (
        'Draw a line through N2 parallel to the line from N3 to N6. '
        'It crosses the vertical line at N7, above O.')
    cm.steps[10]['textWithoutHelpers'] = (
        'P1 is where the vertical through A crosses the horizontal through D. '
        'Draw a circle with centre O through P1. It crosses the horizontal line at N8, right of A.')
    return cell


def drawing(pieces,origin=(297.5,374.6375),angle=15):
    keep=lambda p:sum(p['fill'])>.1 and not p['fill'][0]>p['fill'][1]>p['fill'][2]
    polygons=cm.frame_pieces(pieces,origin,2*UNIT,10,keep=keep)
    c,s=math.cos(math.radians(angle)),math.sin(math.radians(angle))
    return [[(c*x+s*y,c*y-s*x) for x,y in p] for p in polygons]


def main(filled=False):
    pieces,out=sys.argv[1:3];cell=build()
    polys=drawing(pieces,origin=(225.63,371) if filled else (297.5,374.6375),angle=-15 if filled else 15)
    if filled:cm.steps[3].pop('textWithoutHelpers',None)
    paths=cm.along_ink(network(polys,cell))
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})
    tutorial={'format':0,'id':'agra-twelve-six-stars','title':'Twelve- and six-pointed stars of Agra Fort',
        'short':'Agra twelve and six stars','subtitle':'Agra Fort, Agra, India',
        'fold':6,'star':12,'style':'Mughal','level':'advanced',
        'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its point radius.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s IND0403 drawing. The drawing gives no steps. '
                   'Three squares construct the star. A parallel intercept fixes the repeat length exactly; '
                   'six parallel families through existing crossings supply all remaining lines.',
            'changes':'The teaching frame turns by 15°. Black and brown bevel facets are removed, '
                      'and the coloured faces expanded by 5 pt to recover the 10 pt band centre lines. '
                      'The compass steps, order and named points are ours. The palette is illustrative; '
                      'no fort photograph was independently checked.','reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data174/IND0403: Agra Fort','creator':'Brian Wichmann','kind':'drawing',
            'url':'https://tilingsearch.mit.edu/HTML/data174/IND0403.html',
            'note':'His page cites David Wade’s photograph IND 0403, Agra Fort, India (1550 AD, 957 AH), '
                   'specifying the design without kites in the twelve-pointed star.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','look':'strapwork','palette':'Timurid tile','colors':{},
            'text':'Put copies of the hexagonal tile side by side.'},
        'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    inventory=[
        ('twelve_star',24,(6,0,-2,0),1,'ground'),
        ('six_star',12,(-1914/25,-216/5,1116/25,126/5),3,'ground'),
        ('eight',8,(239/25,27/5,-133/25,-3),6,'b'),
        ('petal',6,(453/50,27/5,-773/150,-3),12,'a'),
        ('three_star',6,(558/25,63/5,-319/25,-36/5),2,'c')]
    if filled:
        inventory=[entry for entry in inventory if entry[0]!='twelve_star']
        inventory.append(('kite',4,(.5,0,-1/6,0),12,'ground'))
        tutorial['construction']['changes']=tutorial['construction']['changes'].replace('by 15°','by −15°')
        tutorial['id']='agra-twelve-six-stars-kites'
        tutorial['title']='Kite-filled twelve-pointed stars of Agra Fort'
        tutorial['short']='Agra kite-filled twelve stars'
        tutorial['credits'][0]['source']='Tiling Search, data214/IND0405: Agra Fort'
        tutorial['credits'][0]['url']='https://tilingsearch.mit.edu/HTML/data214/IND0405.html'
        tutorial['credits'][0]['note']=(
            'His page cites David Wade’s photograph IND 0405, Agra Fort, India (1550 AD, 957 AH), '
            'specifying the design with kites in the twelve-pointed star.')
        tutorial['construction']['note']+=(
            ' This variation shares the complete construction with agra-twelve-six-stars. '
            'The existing lines through O divide its central star into twelve kites.')
    basis=[1,math.sqrt(2),math.sqrt(3),math.sqrt(6)]
    tutorial['expect']={'pieceTypes':len(inventory),'cellArea':round(2*math.sqrt(3)*L*L,5),
        'note':'Independent source-polygon shoelaces and counts sum exactly to '
               '(−324−180√2+316√3+180√6)/25 = 2√3(√2+(9−3√3)/5)². '
               'The exact piece expressions are in the generator and report.',
        'pieces':[{'name':name,'vertices':n,'area':round(sum(a*b for a,b in zip(cs,basis)),5),'perCell':count}
                  for name,n,cs,count,_ in inventory]}
    tutorial['pattern']['colors']={name:color for name,_,_,_,color in inventory}
    tutorial['pattern']['placements']={'repeat':[1,1],'rules':[
        {'piece':'petal','nth':n,'color':'c'} for n in [0,3,4,7,8,11]]}
    if filled:
        tutorial['pattern']['placements']['rules'] += [
            {'piece':'kite','nth':n,'color':'d'} for n in []]  # source-matched order below
        tutorial['expect']['note']+=' Each central kite has area (3−√3)/6; twelve replace the star exactly.'
    cm.write(tutorial,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
