#!/usr/bin/env python3
"""P142: cmm mesh on a conventional rectangular repeat, frame45°.

O=(297.5,373.3795833333)pt; OA=20(1+√3)pt. No bands.
Half-sides2√2+√6 and√2+√6. The four-triangle opening is P141’s.
Carrier guides may turn more often than the finished twofold mesh.
"""
import math
import sys
import common as cm
from common import g,step
from gen_bourgoin_141_mixed_stars import build as star
from gen_agra_twelve_six_stars import REF
from hexagonal import network,clip_poly

UNIT=20*(1+math.sqrt(3))
L=2*math.sqrt(2)+math.sqrt(6)
V=math.sqrt(2)+math.sqrt(6)
PLAN=[('r60','st4',90),('v','st4',15),('gl0','gl1',30),('st5','gl2',45),
      ('r135','gl3',90),('st9','gl4',150),('st10','gl0',30),('st7','gl2',90),
      ('st0','gl1',75),('frameX','gl2',150),('gl7','gl9',75),('gl2','gl10',120),
      ('r60','gl11',15),('st6','frameX',75),('r135','gl7',45),('st8','gl7@3',90)]


def description(ref):
    base,_,turn=ref.partition('@')
    if base=='h':text='horizontal line through O'
    elif base=='v':text='vertical line through O'
    elif base=='frameX':text='right tile side'
    elif base=='frameY':text='top tile side'
    elif base.startswith('st'):
        i=int(base[2:]);text=f'line from S{i+1} to S{(i+4)%12+1}'
    elif base.startswith('gl'):text=f'line through Q{int(base[2:])+1}'
    else:
        a=int(base[1:]);text={30:'line OB',60:'line OC',120:'line OE',150:'line FM'}.get(a,f'line at {a}° from OA')
    return text+(f', turned round O by {30*int(turn)}°,' if turn else '')


def build():
    star(opening_only=True)
    step('The first circle crosses the line at 45° from OA at P1, above O. '
         'Draw a circle with centre O and opening AE. It crosses that line at P2, above O. '
         'Draw vertical lines through P1 and P2. They cross the horizontal line at N1 and N2.', 'compass')
    g.meet('P1','c','r45',(math.sqrt(2)/2,math.sqrt(2)/2))
    g.circle_from('root3','O','A','E');g.meet('P2','root3','r45',(math.sqrt(6)/2,math.sqrt(6)/2))
    for p,n,x in [('P1','N1',math.sqrt(2)/2),('P2','N2',math.sqrt(6)/2)]:
        g.line_par(n+'v',p,'v');g.meet(n,n+'v','h',(x,0))
    step('Draw a circle with centre N1 through O. It crosses the horizontal line again at N3, right of N1. '
         'Draw a circle with centre N2 through O. It crosses that line again at N4, right of N2.', 'compass')
    g.circle_through('root2','N1','O');g.meet('N3','root2','h',(math.sqrt(2),0))
    g.circle_through('root6','N2','O');g.meet('N4','root6','h',(math.sqrt(6),0))
    step('Draw a circle with centre N3 and opening from O to N4. '
         'It crosses the horizontal line at N5, right of N3. '
         'Draw a circle with centre N5 and opening from O to N3. '
         'It crosses that line at N6, right of N5.', 'compass')
    g.circle_from('height','N3','O','N4');g.meet('N5','height','h',(V,0))
    g.circle_from('width','N5','O','N3');g.meet('N6','width','h',(L,0))
    step('Draw a circle with centre O through N5. It crosses the vertical line at N7, above O. '
         'Draw a vertical line through N6. Draw a horizontal line through N7. '
         'Turn both lines round O by 180°. They frame the tile, with corners T1 to T4.', 'compass')
    g.circle_through('frameCircle','O','N5');g.meet('N7','frameCircle','v',(0,V))
    g.line_par('frameX','N6','v');g.line_par('frameY','N7','h');g.repeat('frames',['frameX','frameY'],'rot2')
    cell=[(L,V),(-L,V),(-L,-V),(L,-V)]
    for i,(a,b) in enumerate([('frameX','frameY'),('frameX@1','frameY'),('frameX@1','frameY@1'),('frameX','frameY@1')]):
        g.meet(f'T{i+1}',a,b,cell[i])
    for i,(a,b,angle) in enumerate(PLAN):
        point=f'Q{i+1}'
        draw=(f'Draw a vertical line through {point}.' if angle==90 else
              f'Draw a horizontal line through {point}.' if angle==0 else
              f'Draw a line through {point} parallel to the {description(REF[angle])}.')
        step(f'The {description(a)} crosses the {description(b)} at {point}. '+draw+
             ' Turn it round O by 30°, eleven times.')
        g.meet(point,a,b,g.crossings(a,b)[0]);g.line_par(f'gl{i}',point,REF[angle])
        g.repeat(f'copies{i}',[f'gl{i}'],'rot12')
    cm.steps[3]['textWithoutHelpers']='The four circles cross the first circle at B, C, E, F, H, J, L and M.'
    cm.steps[4]['textWithoutHelpers']=(cm.steps[3]['textWithoutHelpers']+' '+cm.steps[4]['text'])
    cm.steps[6]['textWithoutHelpers']=(
        'The first circle crosses the line at 45° from OA at P1, above O. '
        'Draw a circle with centre O and opening AE. It crosses that line at P2, above O. '
        'N1 is where the vertical through P1 crosses the horizontal line. '
        'Draw a vertical line through P2. It crosses the horizontal line at N2.')
    hidden={1:[1,2,3,4,7,8,9,10],2:[1,2,3,7,8,9],3:[1,2,4,5,7,8,10,11],
        4:[1,3,5,7,9,11],6:[5,11],7:[2,4,8,9,10],8:[5,8,11],
        9:[1,3,4,5,7,9,10,11],10:[2,3,4,5,8,9,10,11],
        11:[1,3,5,7,9,11],12:[1,2,3,4,7,8,9,10],
        13:[2,3,4,5,8,9,10,11],15:[1,2,3,4,5,7,8,9,10,11]}
    for i,omitted in hidden.items():
        current=cm.steps[10+i]
        degrees=[f'{30*k}°' for k in range(1,12) if k not in omitted]
        turns=degrees[0] if len(degrees)==1 else ', '.join(degrees[:-1])+' and '+degrees[-1]
        current['textWithoutHelpers']=current['text'].replace(
            'Turn it round O by 30°, eleven times.',f'Turn it round O by {turns}.')
    return cell


def drawing(pieces):
    ps=cm.frame_pieces(pieces,(297.5,373.3795833333),2*UNIT,0)
    c,s=math.cos(math.pi/4),math.sin(math.pi/4)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    pieces,out=sys.argv[1:3];cell=build();ps=drawing(pieces)
    ps=[[(x+2*L*i,y+2*V*j) for x,y in q] for q in ps for i in [-1,0,1] for j in [-1,0,1]]
    edges=[]
    for q in ps:
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3 and T4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,5)]})
    t={'format':0,'id':'bourgoin-142-star-rows','title':'Star rows of Bourgoin’s Plate 142',
       'short':'Bourgoin 142 star rows','subtitle':'Bourgoin, Plate142',
       'fold':2,'star':12,'style':'Islamic','level':'advanced',
       'given':{'O':'The centre of a twelve-pointed star, where two mirror lines cross.','A':'Sets its point radius.'},
       'construction':{'basis':'reconstruction','fidelity':'not-applicable',
           'note':'The finished design was read from Wichmann’s P142 drawing. The drawing gives no steps. '
                  'The four-triangle opening is shared with P141. Compass transfers set a rectangular repeat; '
                  'parallels through earlier crossings complete its mesh.',
           'changes':'Plain polygon boundaries are retained. The teaching frame turns45°. '
                     'The conventional centred rectangle contains two twelve-pointed stars. '
                     'The guide families turn more often than the finished cmm pattern. '
                     'The steps, order and named points are ours. The palette is illustrative. '
                     'No historical photograph was independently checked.','reviewed':'2026-10-27'},
       'credits':[{'source':'Tiling Search, data12/P142: Bourgoin Plate142','creator':'Brian Wichmann',
           'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data12/P142.html',
           'note':'The page cites Critchlow, page177(1976); Abas and Salman, page313(1995); and Bourgoin, Plate142(1879), with no known source. It links Wade BOU142. No photograph was independently checked.'}],
       'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
       'pattern':{'cell':'tile','palette':'Kashan','colors':{},'text':'Put copies of the rectangular tile side by side.'},
       'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    s=math.sqrt(3)
    inventory=[('twelve_star',24,3*s-3,2,'ground'),('kite',4,(3-s)/4,24,'c'),
        ('hexagon',6,s/2,24,'b'),('notched_hexagon',6,.25,24,'c'),
        ('eight',8,5*s/12,24,'b'),('regular_hexagon',6,s/4,24,'c'),
        ('four_star',8,3-s,8,'a'),('ten',10,-.5+3*s/4,4,'b'),
        ('six_star',12,s/2,2,'ground')]
    t['expect']={'pieceTypes':9,'cellArea':round(40+24*s,5),
        'note':'The136 counted source-polygon shoelaces sum exactly to40+24√3=4(2√2+√6)(√2+√6). '
               'This conventional centred rectangle contains two twelve-pointed stars.',
        'pieces':[{'name':n,'vertices':v,'area':round(a,5),'perCell':c} for n,v,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,_,color in inventory}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
