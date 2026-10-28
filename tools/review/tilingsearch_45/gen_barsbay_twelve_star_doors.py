#!/usr/bin/env python3
"""EGY1030: cmm door mesh,8pt bands expanded4pt after removing bevels.

O=(297.5,373.2566666667)pt, OA=19(1+√3)pt, no frame turn.
Half-width P=(4−√2+√6)/2, half-height Q=P(4−√3).
S=Q−2P−1/2 sets the small stars and their corner diagonals.
"""
import math
import sys
import common as cm
from common import g,step
from gen_chester_beatty_twelve_stars import build as star_opening
from gen_agra_twelve_six_stars import REF
from hexagonal import network,clip_poly

UNIT=19*(1+math.sqrt(3))
L=(4-math.sqrt(2)+math.sqrt(6))/2
V=L*(4-math.sqrt(3))
S=V-2*L-.5


def build():
    star_opening(opening_only=True)
    r,t=math.sqrt(2),math.sqrt(6)
    step('The first circle crosses the line at 45° from OA at P1, above O. '
         'Draw a circle with centre O and opening AE. It crosses that line at P2, above O. '
         'Draw vertical lines through P1, P2 and C. They cross the horizontal line at N1, N2 and N3.', 'compass')
    g.meet('P1','c','r45',(r/2,r/2));g.circle_from('root3','O','A','E');g.meet('P2','root3','r45',(t/2,t/2))
    for p,n,x in [('P1','N1',r/2),('P2','N2',t/2),('C','N3',.5)]:
        g.line_par(n+'v',p,'v');g.meet(n,n+'v','h',(x,0))
    step('Draw a circle with centre A through O. It crosses the horizontal line at N4, right of A. '
         'Draw a circle with centre N2 and opening from O to N1. It crosses that line at N5, towards O. '
         'Draw a circle with centre N4 and opening from O to N5. It crosses that line at N6, right of N4.', 'compass')
    g.circle_through('two','A','O');g.meet('N4','two','h',(2,0))
    g.circle_from('difference','N2','O','N1');g.meet('N5','difference','h',((t-r)/2,0))
    g.circle_from('width','N4','O','N5');g.meet('N6','width','h',(L,0))
    step('Draw a line through N6 parallel to the line at 165° from OA. '
         'It crosses the vertical line at P3, above O. Draw a circle with centre O through P3. '
         'It crosses the horizontal line at N7, right of O.', 'compass')
    radius=L*math.tan(math.pi/12)
    g.line_par('heightIntercept','N6','r165');g.meet('P3','heightIntercept','v',(0,radius))
    g.circle_through('fourStarRadius','O','P3');g.meet('N7','fourStarRadius','h',(radius,0))
    step('Draw a circle with centre N6 through O. It crosses the horizontal line again at N8, right of N6. '
         'Draw a circle with centre N8 and opening from O to N7. It crosses that line at N9, right of N8. '
         'Draw a circle with centre O through N9. It crosses the vertical line at P4, above O.', 'compass')
    g.circle_through('twiceWidth','N6','O');g.meet('N8','twiceWidth','h',(2*L,0))
    g.circle_from('height','N8','O','N7');g.meet('N9','height','h',(V,0))
    g.circle_through('heightCircle','O','N9');g.meet('P4','heightCircle','v',(0,V))
    step('Draw a vertical line through N6. Draw a horizontal line through P4. '
         'Turn both lines round O by 180°. The four lines frame the tile, with corners T1 to T4.')
    g.line_par('frameX','N6','v');g.line_par('frameY','P4','h');g.repeat('frames',['frameX','frameY'],'rot2')
    cell=[(L,V),(-L,V),(-L,-V),(L,-V)]
    for i,(a,b) in enumerate([('frameX','frameY'),('frameX@1','frameY'),('frameX@1','frameY@1'),('frameX','frameY@1')]):
        g.meet(f'T{i+1}',a,b,cell[i])
    step('Draw a circle with centre N6 and opening from O to N3. It crosses the horizontal line at N10, towards O. '
         'Draw a circle with centre N9 and opening from O to N3. It crosses that line at N11, towards O. '
         'Draw a circle with centre O through N11. It crosses the vertical line at P5, above O.', 'compass')
    g.circle_from('innerWidth','N6','O','N3');g.meet('N10','innerWidth','h',(L-.5,0))
    g.circle_from('innerHeight','N9','O','N3');g.meet('N11','innerHeight','h',(V-.5,0))
    g.circle_through('innerHeightCircle','O','N11');g.meet('P5','innerHeightCircle','v',(0,V-.5))
    step('Draw a vertical line through N10. Draw a horizontal line through P5. Turn both lines round O by 180°.')
    for name,p,ref in [('axisX','N10','v'),('axisY','P5','h')]:
        g.line_par(name,p,ref);g.repeat(name+'Copies',[name],'rot2')
    step('Draw a circle with centre N7 and opening from O to N3. It crosses the horizontal line at N12, towards O. '
         'Draw a circle with centre O through N12. It crosses the line at 165° from OA at P6, above O.', 'compass')
    g.circle_from('smallRadius','N7','O','N3');g.meet('N12','smallRadius','h',(S,0))
    g.circle_through('smallCircle','O','N12');g.meet('P6','smallCircle','r165',(-S*math.cos(math.pi/12),S*math.sin(math.pi/12)))
    step('Draw a vertical line through N12. Draw a line through P6 parallel to the line at 75° from OA. '
         'Turn both lines round O by 30°, eleven times.')
    for name,p,ref in [('small','N12','v'),('small15','P6','r75')]:
        g.line_par(name,p,ref);g.repeat(name+'Copies',[name],'rot12')
    step('Draw a circle with centre O through N6. It crosses the line at 45° from OA at P7, above O. '
         'Draw a vertical line through P7. It crosses the horizontal line at N13. '
         'Draw a circle with centre N13 through O. It crosses that line again at N14, right of N13. '
         'Draw a circle with centre N14 and opening from O to N12. It crosses that line at N15, towards O.', 'compass')
    g.circle_through('widthCircle','O','N6');g.meet('P7','widthCircle','r45',(L/r,L/r))
    g.line_par('diagonalProjection','P7','v');g.meet('N13','diagonalProjection','h',(L/r,0))
    g.circle_through('diagonalDouble','N13','O');g.meet('N14','diagonalDouble','h',(r*L,0))
    g.circle_from('diagonalRadius','N14','O','N12');g.meet('N15','diagonalRadius','h',(r*L-S,0))
    step('Draw a circle with centre O through N15. It crosses the line at 135° from OA at P8, above O. '
         'Draw a line through P8 parallel to the line at 45° from OA. Turn it round O by 90°, three times.', 'compass')
    E=r*L-S;g.circle_through('diagonalCircle','O','N15');g.meet('P8','diagonalCircle','r135',(-E/r,E/r))
    g.line_par('diagonal','P8','r45');g.repeat('diagonals',['diagonal'],'rot4')
    step('Draw a circle with centre N6 and opening OA. It crosses the horizontal line at N16, right of N6, and N17, towards O. '
         'Draw vertical lines through N16 and N17. Turn both lines round O by 180°.', 'compass')
    g.circle_from('topMarks','N6','O','A');g.meet('N16','topMarks','h',(L+1,0));g.meet('N17','topMarks','h',(L-1,0))
    for name,p in [('topRight','N16'),('topLeft','N17')]:g.line_par(name,p,'v');g.repeat(name+'Copies',[name],'rot2')
    step('The vertical lines through N16 and N17 cross the horizontal line through P4 at R1 and R2. '
         'The half-turn copy of the vertical through N17 crosses that horizontal line at R3. '
         'Draw lines through R1, R2 and R3 parallel to line BH. Turn them round O by 30°, eleven times.')
    for k,(vertical,x) in enumerate([('topRight',L+1),('topLeft',L-1),('topLeft@1',1-L)]):
        p=f'R{k+1}';g.meet(p,vertical,'frameY',(x,V));g.line_par(f'top{k}',p,'r30');g.repeat(f'tops{k}',[f'top{k}'],'rot12')
    plan=[('N6',None,None,75,'Draw a line through N6 parallel to the line at 75° from OA.'),
        ('P4',None,None,75,'Draw a line through P4 parallel to the line at 75° from OA.'),
        ('Q1','frameX','small15@9',15,'The line through P6 turned by 270° crosses the right tile side at Q1. Draw a line through Q1 at 15° from OA.'),
        ('Q2','frameX','top0@9',60,'The line through R1 turned by 270° crosses the right tile side at Q2. Draw a line through Q2 parallel to line CJ.'),
        ('Q3','frameX','gl0@9',15,'The line through N6 at 75° turned by 270° crosses the right tile side again at Q3. Draw a line through Q3 at 15° from OA.'),
        ('Q4','frameX','small@7',60,'The vertical line through N12 turned by 210° crosses the right tile side at Q4. Draw a line through Q4 parallel to line CJ.')]
    for i,(p,a,b,angle,text) in enumerate(plan):
        step(text+' Turn it round O by 30°, eleven times.')
        if a:g.meet(p,a,b,g.crossings(a,b)[0])
        g.line_par(f'gl{i}',p,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot12')
    cm.steps[3]['textWithoutHelpers'] = 'The four circles cross the first circle at B, C, E, F, H, J, L and M.'
    cm.steps[4]['textWithoutHelpers'] = (
        'Draw the lines through O that halve angles BOC and FOG. '
        'Draw a line through O at 90° to the bisector of angle BOC.')
    cm.steps[14]['textWithoutHelpers'] = (
        'Draw the copies of the vertical through N12 turned round O by 30°, 150°, 210° and 330°. '
        'Draw a line through P6 parallel to the line at 75° from OA. '
        'Turn it round O by 30°, 180°, 210° and 270°.')
    cm.steps[17]['textWithoutHelpers'] = cm.steps[17]['text'].replace(' Turn both lines round O by 180°.', '')
    cm.steps[18]['textWithoutHelpers'] = (
        'The vertical lines through N16 and N17 cross the horizontal line through P4 at R1 and R2. '
        'The half-turn copy of the vertical through N17 crosses that horizontal line at R3. '
        'Draw a line through R1 parallel to line BH. Turn it round O by 120°, 180°, 270° and 300°. '
        'Draw lines through R2 and R3 parallel to line BH. Turn them round O by 120°, 180° and 300°.')
    for index,degrees in [(20,'30°, 180° and 210°'),(22,'60°, 180° and 240°'),
                          (23,'150°, 180° and 330°'),(24,'60°, 180° and 240°')]:
        cm.steps[index]['textWithoutHelpers'] = cm.steps[index]['text'].replace(
            'Turn it round O by 30°, eleven times.',f'Turn it round O by {degrees}.')
    return cell


SPECIMENS = [[['r75', 'st3'], ['st3', 'gl0@3'], ['r60', 'gl0@2'], ['gl0@2', 'gl2@7'], ['gl0@4', 'gl2@7'], ['gl0@4', 'gl1@7'], ['small15', 'gl1@7'], ['small15', 'gl0@4'], ['v', 'gl0@3'], ['N3v', 'gl0@3']], [['small15@6', 'gl1@1'], ['small15@6', 'gl4@11'], ['diagonal@1', 'gl4@11'], ['diagonal@1', 'gl3'], ['top0@6', 'gl3'], ['diagonal@1', 'top0@6'], ['diagonal@1', 'gl1@1'], ['gl1@1', 'gl4'], ['v', 'gl4'], ['gl1@1', 'gl4@11']]]


def description(name):
    base,_,copy=name.partition('@')
    if base in ['h','v']:text=('horizontal' if base=='h' else 'vertical')+' line through O'
    elif base.startswith('r') and base[1:].isdigit():text=f'{base[1:]}° line through O'
    elif base.startswith('st'):
        letters=['A','B','C','D','E','F','G','H','J','K','L','M'];i=int(base[2:])
        text=f'line {letters[i]}{letters[(i+4)%12]}'
    else:
        descriptions={'N3v':'vertical line through C','small':'vertical line through N12',
            'small15':'75° line through P6','diagonal':'45° line through P8',
            'top0':'line through R1 parallel to BH',
            'gl0':'75° line through N6','gl1':'75° line through P4',
            'gl2':'15° line through Q1','gl3':'line through Q2 parallel to CJ',
            'gl4':'15° line through Q3','gl5':'line through Q4 parallel to CJ'}
        text=descriptions[base]
    if copy:text+=f' turned {int(copy)*(90 if base=="diagonal" else 30)}°'
    return text


def connectors():
    for family,plan,outline in zip(['U','W'],SPECIMENS,['firstConnector','secondConnector']):
        step('Outline a ten-sided connector.')
        current=cm.steps[-1];del current['create'];current['parts']=[]
        for k in range(0,10,2):
            text=' '.join(f'The {description(a)} crosses the {description(b)} at {family}{i+1}.'
                for i,(a,b) in enumerate(plan) if k<=i<k+2)
            part={'text':text,'create':{},'animate':'fade'};current['parts'].append(part);g.cur=part
            for i in range(k,k+2):
                a,b=plan[i];g.meet(f'{family}{i+1}',a,b,g.crossings(a,b)[0])
        names=[f'{family}{i}' for i in range(1,11)]
        part={'text':'Join '+', '.join(names[:-1])+' and '+names[-1]+' to outline the connector.',
              'create':{},'animate':'fade'};current['parts'].append(part);g.cur=part
        g.put(outline,'polygon',None,{'polygon':names})


def drawing(pieces):
    return cm.frame_pieces(pieces,(297.5,373.2566666667),2*UNIT,8,
        keep=lambda p:max(p['fill'])-min(p['fill'])>.05 or min(p['fill'])>.9)


def main():
    pieces,out=sys.argv[1:3];cell=build();polys=drawing(pieces)
    polys=[[(x+2*L*i,y+2*V*j) for x,y in q] for q in polys for i in [-1,0,1] for j in [-1,0,1]]
    edges=[]
    for q in polys:
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    connectors()
    step('Join T1, T2, T3 and T4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,5)]})
    t={'format':0,'id':'barsbay-twelve-star-doors','title':'Twelve-star doors of Sultan Barsbay, Cairo',
        'short':'Barsbay twelve-star doors','subtitle':'Al-Ashraf Barsbay, Cairo, Egypt',
        'fold':2,'star':12,'style':'Egyptian','level':'advanced',
        'given':{'O':'The centre of a twelve-pointed star.','A':'Sets its point radius.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s EGY1030 drawing. The drawing gives no steps. '
                   'The first six steps share the Chester Beatty four-triangle opening. Compass sums construct the centred rectangle, small radius and corner diagonals; parallels through crossings complete the mesh.',
            'changes':'Grey bevel facets are removed and the8pt bands represented by their centre lines. '
                      'Guide families turn more often than the finished cmm pattern. The steps, order and named points are ours. '
                      'The palette is illustrative. No monument photograph was independently checked.','reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data180/EGY1030: al-Ashraf Barsbay','creator':'Brian Wichmann',
            'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data180/EGY1030.html',
            'note':'The page cites David Wade EGY1030, al-Ashraf Barsbay, Cairo(1423AD,826AH); a Thesaurus Islamicus Foundation photograph of the qibla iwan minbar’s north-side door(1425–33AD,828–36AH), through personal communication; and links Wade LOU011. No photograph was independently checked.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','distinguishOutlines':True,'look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the rectangular tile side by side.'},
        'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    r,s,t6=math.sqrt(2),math.sqrt(3),math.sqrt(6)
    inventory=[('twelve_star',24,3*s-3,2,'a'),('kite',4,(3-s)/4,24,'ground'),
        ('hexagon',6,.5-r/2+t6/2,24,'b'),
        ('notched_ten',10,-17+25*r/2+10*s-43*t6/6,8,'ground'),
        ('other_ten',10,-17+25*r/2+10*s-43*t6/6,8,'ground'),
        ('three_star',6,69/4-12*r-39*s/4+7*t6,12,'c'),
        ('four_star',8,46-32*r-26*s+56*t6/3,4,'c'),
        ('ten',10,-35/4+7*r+21*s/4-4*t6,4,'ground')]
    t['expect']={'pieceTypes':8,'cellArea':round(108-56*r-40*s+40*t6,5),
        'note':'The86 counted source-polygon shoelaces sum exactly to108−56√2−40√3+40√6=4P²(4−√3). '
               'The two equal-measure eight-count connector types are identified by their constructed outlines.',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    for piece in t['expect']['pieces']:
        if piece['name'] in ['notched_ten','other_ten']:
            piece['outline']='firstConnector' if piece['name']=='notched_ten' else 'secondConnector'
    for piece in t['expect']['pieces']:
        if piece['vertices']==10:piece['small']=True
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
