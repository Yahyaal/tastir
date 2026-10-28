#!/usr/bin/env python3
"""P41: two eight-pointed stars, six-pointed stars and regular hexagons.

Frame O=(297.5,377.91125)pt, OA=50pt, plain polygon boundaries.
R=(1+√2+√3)/2, X=(1+2√2+√3+√6)/2, L=4+√6−√2.
All coordinates below are private generator geometry; the exported tutorial
uses only earlier crossings, compass transfers, parallels and rotations.
"""
import math
import sys

import common as cm
from common import g,step
from gen_salim_chishti_dodecagons import opening

H2, H3, H6 = math.sqrt(2)/2, math.sqrt(3)/2, math.sqrt(6)/2
R = .5+H2+H3
X = R+H2+H6
L = 4+2*(H6-H2)
REF = {0:'h',15:'r15',30:'r30',45:'r45',60:'r60',75:'r75',
       90:'v',105:'r105',120:'r120',135:'r135',150:'r150',165:'r165'}


def transfer(name, centre, a, b, value):
    g.circle_from('c'+name,centre,a,b)
    g.meet(name,'c'+name,'h',(value,0))


def transfers(entries):
    sentences=[]
    values={n:pt[0] for n,(kind,pt) in cm.el.items() if kind=='point'}
    for name,centre,a,b,value in entries:
        opening_word = a+b if len(a)==len(b)==1 else f'from {a} to {b}'
        sentences.append(f'Draw a circle with centre {centre} and opening {opening_word}.')
        direction='right' if value>values[centre] else 'left'
        values[name]=value
        sentences.append(f'It crosses the horizontal line at {name}, {direction} of {centre}.')
    step(' '.join(sentences),'compass')
    for entry in entries:transfer(*entry)


def build():
    opening()
    step('Draw the lines through O that halve angles AOB, BOC and COD. '
         'Draw a line through O at 90° to each new line. '
         'There is now a line through O every 15°.')
    for n,a,b in [('r15','A','B'),('r45','B','C'),('r75','C','D')]:g.line_bisect(n,a,'O',b)
    for a in [15,45,75]:g.line_perp(f'r{a+90}','O',f'r{a}')
    step('The circle crosses the line at 45° from OA at P1, above O. '
         'Draw a vertical line through each of C, P1 and B. '
         'They cross the horizontal line at N1, N2 and N3, respectively.')
    g.meet('P1','c','r45',(H2,H2))
    for i,p,x in [(1,'C',.5),(2,'P1',H2),(3,'B',H3)]:
        g.line_par(f'projection{i}',p,'v');g.meet(f'N{i}',f'projection{i}','h',(x,0))
    step('Draw a circle with centre O and opening AE. '
         'It crosses the line at 45° from OA at P2, above O. '
         'Draw a vertical line through P2. It crosses the horizontal line at N4.', 'compass')
    g.circle_from('root3','O','A','E');g.meet('P2','root3','r45',(H6,H6))
    g.line_par('projection4','P2','v');g.meet('N4','projection4','h',(H6,0))
    transfers([('N5','N1','O','N2',.5+H2),('N6','N5','O','N3',R)])
    transfers([('N7','N6','O','N2',R+H2),('N8','N7','O','N4',X)])
    step('Draw a circle with centre A through O. It crosses the horizontal line again at N9, right of A. '
         'Draw a circle with centre N9 through O. It crosses the horizontal line again at N10, right of N9.', 'compass')
    g.circle_through('twice','A','O');g.meet('N9','twice','h',(2,0))
    g.circle_through('four','N9','O');g.meet('N10','four','h',(4,0))
    transfers([('N11','N10','N2','N4',4+H6-H2),('N12','N11','N2','N4',L)])
    step('Draw a line through N8 at 15° from OA. Turn it round O by 90°, three times.')
    g.line_par('s2','N8','r15');g.repeat('central',['s2'],'rot4')
    step('Draw a vertical line through N12. Turn it round O by 90°, three times. '
         'The four lines frame the tile, with corners U1 to U4.')
    g.line_par('frame','N12','v');g.repeat('frames',['frame'],'rot4')
    for i,(a,b,p) in enumerate([('frame','frame@1',(L,L)),('frame@1','frame@2',(-L,L)),
            ('frame@2','frame@3',(-L,-L)),('frame@3','frame',(L,-L))]):g.meet(f'U{i+1}',a,b,p)
    step('Draw circles with centres O and N12 through each other. '
         'Draw a straight line through their two crossings, P3 and P4. '
         'It crosses the horizontal line at N13. It crosses the line at 45° from OA at Q.', 'compass')
    g.circle_through('half0','O','N12');g.circle_through('half1','N12','O')
    for name,y in [('P3',math.sqrt(3)*L/2),('P4',-math.sqrt(3)*L/2)]:g.meet(name,'half0','half1',(L/2,y))
    g.line_through('half','P3','P4');g.meet('N13','half','h',(L/2,0));g.meet('Q','half','r45',(L/2,L/2))
    step('Draw a circle with centre O through N6. '
         'It crosses the line at 45° from OA at P5, above O. '
         'Draw a circle with centre Q through P5.', 'compass')
    g.circle_through('centralCircle','O','N6');g.meet('P5','centralCircle','r45',(R/math.sqrt(2),R/math.sqrt(2)))
    g.circle_through('sc6','Q','P5')
    step('Draw lines through Q parallel to the lines at 45°, 105° and 165° from OA. '
         'They cross the circle with centre Q at S1 to S6, counted round it.')
    radius=math.dist(cm.P('Q'),cm.P('P5'))
    for a in [45,105,165]:g.line_par(f'c{a}','Q',REF[a])
    for k in range(6):
        a=45+60*k;g.meet(f'S{k+1}','sc6',f'c{a%180}',(L/2+radius*math.cos(math.radians(a)),L/2+radius*math.sin(math.radians(a))))
    step('Draw a straight line through S1 and S3, S3 and S5, and S5 and S1. '
         'Draw a straight line through S2 and S4, S4 and S6, and S6 and S2. '
         'Turn these six lines round O by 90°, three times.')
    names=[]
    for k in range(6):
        n=f's6_{k}';g.line_through(n,f'S{k+1}',f'S{(k+2)%6+1}');names.append(n)
    g.repeat('sixStars',names,'rot4')
    step('Draw a horizontal line through U1. Draw a vertical line through U1. '
         'Draw a circle with centre U1 and opening from O to N1. '
         'It crosses these lines at T1, left of U1, and T2, below U1.', 'compass')
    g.line_par('cornerH','U1','h');g.line_par('cornerV','U1','v')
    g.circle_from('smallCorner','U1','O','N1')
    g.meet('T1','smallCorner','cornerH',(L-.5,L));g.meet('T2','smallCorner','cornerV',(L,L-.5))
    step('Draw a circle with centre U1 and opening from O to N5. '
         'It crosses the horizontal at V1, left of U1, and the vertical at V2, below U1. '
         'Draw vertical lines through T1 and V1. Draw horizontal lines through T2 and V2.', 'compass')
    g.circle_from('largeCorner','U1','O','N5')
    g.meet('V1','largeCorner','cornerH',(L-.5-H2,L));g.meet('V2','largeCorner','cornerV',(L,L-.5-H2))
    for name,p,ref in [('tv','T1','v'),('vv','V1','v'),('th','T2','h'),('vh','V2','h')]:g.line_par(name,p,ref)
    step('The vertical through V1 crosses the horizontal through T2 at W1. '
         'The vertical through T1 crosses the horizontal through V2 at W2. '
         'Draw lines through W1 parallel to the lines at 75° and 150° from OA. '
         'Draw lines through W2 parallel to the lines at 15° and 120° from OA. '
         'Turn these four star lines round O by 90°, three times.')
    g.meet('W1','vv','th',(L-.5-H2,L-.5));g.meet('W2','tv','vh',(L-.5,L-.5-H2))
    for n,p,a in [('cs000','W1',75),('cs001','W1',150),('cs100','W2',15),('cs101','W2',120)]:g.line_par(n,p,REF[a])
    g.repeat('cornerStars',['cs000','cs001','cs100','cs101'],'rot4')
    step('The lines from S1 to S3 and from S2 to S4 cross at Y. '
         'Draw a circle with centre S3 through Y. Draw a circle with centre Y through S3. '
         'Their crossing farther from O is Z.', 'compass')
    point=g.crossings('s6_0','s6_1')[0];g.meet('Y','s6_0','s6_1',point)
    g.circle_through('ha','S3','Y');g.circle_through('hb','Y','S3')
    hc=max(g.crossings('ha','hb'),key=lambda p:math.hypot(*p));g.meet('Z','ha','hb',hc)
    step('Draw a circle with centre Z through S3. '
         'Draw lines through Z parallel to the lines at 15°, 75° and 135° from OA. '
         'Their crossings with the circle are R1 to R6, counted round it.', 'compass')
    g.circle_through('hc','Z','S3');hr=math.dist(hc,cm.P('S3'))
    for a in [15,75,135]:g.line_par(f'hexRay{a}','Z',REF[a])
    for k in range(6):
        a=15+60*k;g.meet(f'R{k+1}','hc',f'hexRay{a%180}',(hc[0]+hr*math.cos(math.radians(a)),hc[1]+hr*math.sin(math.radians(a))))
    step('Draw a straight line through each pair of neighbouring points R1 to R6, including R6 and R1. '
         'Reflect the circle and its three lines across the vertical line through O. Their division points are X1 to X6. '
         'Draw a straight line through each pair of neighbouring copies, including X6 and X1. '
         'Turn the twelve sides round O by 90°, three times.')
    names=[]
    for i in range(6):
        source=cm.P(f'R{i+1}');p=(-source[0],source[1])
        # X aliases come from the mirrored circle and its radial guides.
        # Create those once, then resolve each alias by its exact crossing.
        if i==0:
            g.repeat('reflectCircle',['hc'],'mirror:v')
            for a in [15,75,135]:g.repeat(f'reflectRay{a}',[f'hexRay{a}'],'mirror:v')
        g.meet(f'X{i+1}','hc@1',f'hexRay{(15+60*i)%180}@1',p)
    for j in [0,1]:
        family='R' if j==0 else 'X'
        for i in range(6):
            n=f'hex{j}{i}';g.line_through(n,f'{family}{i+1}',f'{family}{(i+1)%6+1}');names.append(n)
    g.repeat('hexagons',names,'rot4')
    # Remaining connector lines are through already constructed crossings.
    plan=[('N6',None,None,'r30'),('B2','r135','gl0','r60'),
          ('B3','frame','cs101','r60'),('B4','r135','gl2','r30')]
    for i,(pt,a,b,ref) in enumerate(plan):
        p=cm.P(pt) if pt in cm.el else g.crossings(a,b)[0]
        # Wording follows the actual named reference lines; the evaluated
        # descriptions are supplied below after all source lines exist.
        descriptions=[
            'Draw a line through N6 parallel to line OB.',
            'The new line crosses the line at 135° from OA at B2, below O. '
            'Draw a line through B2 parallel to line OC.',
            'The right tile side crosses the line through W2 at 120° from OA at B3. '
            'Draw a line through B3 parallel to line OC.',
            'The new line crosses the line at 135° from OA at B4, below O. '
            'Draw a line through B4 parallel to line OB.']
        step(descriptions[i]+' Turn it round O by 90°, three times.')
        if pt not in cm.el:g.meet(pt,a,b,p)
        g.line_par(f'gl{i}',pt,ref);g.repeat(f'connectors{i}',[f'gl{i}'],'rot4')
    cm.steps[3]['textWithoutHelpers'] = (
        'B, C, E, F, H, J, L and M are where the four new circles cross the first circle. '
        'The first circle is now cut into twelve.')
    cm.steps[4]['textWithoutHelpers'] = (
        'Draw the line through O that halves angle BOC. '
        'Draw a line through O at 90° to this new line.')
    cm.steps[12]['textWithoutHelpers'] = (
        'Draw a vertical line through N12. Draw its copies turned by 90° and 180° round O. '
        'The tile’s upper corners are U1 and U2. Its lower corners are U3 and U4.')
    cm.steps[15]['textWithoutHelpers'] = (
        'Draw lines through Q at 105° and 165° from OA. '
        'S1 to S6 are the circle’s six division points, counted round it.')
    cm.steps[21]['textWithoutHelpers'] = (
        'Draw a circle with centre Z through S3. Draw a line through Z at 135° from OA. '
        'The circle’s six division points are R1 to R6, counted round it.')
    cm.steps[22]['textWithoutHelpers'] = (
        'Draw a straight line through each pair of neighbouring points R1 to R6, including R6 and R1. '
        'Reflect the circle and its line at 135° across the vertical line through O. '
        'Its division points are X1 to X6. '
        'Draw a straight line through each pair of neighbouring copies, including X6 and X1. '
        'Turn the twelve sides round O by 90°, three times.')
    step('Join U1, U2, U3 and U4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':['U1','U2','U3','U4']})


def main():
    pieces,out=sys.argv[1:3];build()
    ps=cm.frame_pieces(pieces,(297.5,377.91125),100,0)
    paths=cm.along_ink(cm.network(ps,hcell=L,reach=4*L))
    tut={'format':0,'id':'turkish-sultana-mixed-stars','title':'Mixed stars of the Turkish Sultana’s House, Fatehpur Sikri',
        'short':'Turkish Sultana mixed stars','subtitle':'Turkish Sultana’s House, Fatehpur Sikri',
        'fold':4,'star':8,'style':'Mughal','level':'advanced',
        'given':{'O':'The centre of a large eight-pointed star.','A':'Sets the common edge length.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s P41 drawing. The drawing gives no steps. '
                   'The twelve-division opening is shared with the Mian lesson. Compass transfers fix both eight-pointed stars, '
                   'the six-pointed stars and the regular hexagons; parallels through their crossings complete the connectors.',
            'changes':'The plain polygon boundaries are retained. The compass operations, step order and named points are ours. '
                      'The palette is illustrative. No building photograph was checked.','reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data186/P41: Turkish Sultana’s House','creator':'Brian Wichmann','kind':'drawing',
            'url':'https://tilingsearch.mit.edu/HTML/data186/P41.html',
            'note':'His page identifies an internet photograph of the ceiling, Turkish Sultana’s House, Fatehpur Sikri, India, '
                   'supplied through personal communication. No photograph was independently checked.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','palette':'Mamluk wood','look':'strapwork','colors':{},'text':'Put copies of the square tile side by side.'},
        'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    inventory=[
        ('large_star',16,(2,2,2,0),1),('small_star',16,(-2,2,2,0),1),
        ('six_star',12,(-4.5,4.5,7.5,-4.5),4),('four_star',8,(426,-300,-240,170),2),
        ('ten',10,(-78.5,56.25,43.5,-30.25),8),
        ('irregular_hexagon',6,(-6,39/8,13/4,-15/8),16),
        ('hexagon',6,(-9/4,9/4,15/4,-9/4),8),('kite',4,(.5,0,0,0),8)]
    basis=[1,math.sqrt(2),math.sqrt(3),math.sqrt(6)]
    tut['expect']={'pieceTypes':8,'cellArea':round(4*L*L,5),
        'note':'The source-polygon shoelaces and per-cell counts sum exactly to '
               '96−32√2−16√3+32√6 = 4(4+√6−√2)². Exact piece expressions are in the generator and report.',
        'pieces':[{'name':name,'vertices':n,'area':round(sum(a*b for a,b in zip(cs,basis)),5),'perCell':count}
                  for name,n,cs,count in inventory]}
    tut['pattern']['colors']={name:'a' for name,_,_,_ in inventory}
    cm.write(tut,out);print(len(cm.steps),'steps',len(paths),'paths')


if __name__=='__main__':main()
