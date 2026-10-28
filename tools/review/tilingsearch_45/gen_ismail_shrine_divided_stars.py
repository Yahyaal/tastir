#!/usr/bin/env python3
"""SHAF18: divided3/4/6-stars,10pt bevel bands expanded5pt.

O=(130.77,548.19)pt, a crossing of the mirrors. No frame turn.
OA=35(1+√2+√3)/2pt, the four-star radius; cell half-diagonal2√2+√6.
The pale-grey pieces are real kites, above the0..0.5 bevel shades.
"""
import math
import sys
import common as cm
from common import g,step
from gen_bourgoin_142_star_rows import build as opening
from gen_agra_twelve_six_stars import REF
from hexagonal import network,clip_poly

UNIT=35*(1+math.sqrt(2)+math.sqrt(3))/2
L=2*math.sqrt(2)+math.sqrt(6)
PLAN=[('r75', 'st4', 15),
 ('v', 'st4', 0),
 ('v', 'st4', 15),
 ('h', 'st0', 30),
 ('v', 'st10', 30),
 ('h', 'st0', 45),
 ('r135', 'gl1', 45),
 ('r15', 'gl5', 90),
 ('st9', 'N2v', 15),
 ('h', 'gl0', 45),
 ('h', 'gl0', 60),
 ('h', 'gl0', 90),
 ('v', 'gl9', 15),
 ('r15', 'gl3', 120),
 ('r30', 'frame0', 45),
 ('st4', 'N1v', 15),
 ('h', 'c', 45),
 ('st10', 'gl16', 165),
 ('st7', 'gl17', 45),
 ('st9', 'gl16', 105),
 ('st0', 'gl18', 105),
 ('st4', 'gl16', 165),
 ('st10', 'gl21', 45),
 ('gl2', 'gl22', 165),
 ('st10', 'gl23', 45),
 ('gl4', 'gl17', 75),
 ('st4', 'gl24', 165),
 ('gl7', 'gl16', 135),
 ('gl7', 'gl18', 135),
 ('gl13', 'gl28', 105)]
OMITTED={0: [1, 4, 7, 10],
 1: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
 2: [1, 4, 7, 10],
 3: [2, 5, 8, 11],
 4: [1, 2, 3, 5, 7, 8, 9, 11],
 5: [1, 2, 4, 5, 7, 8, 10, 11],
 6: [1, 2, 4, 5, 7, 8, 10, 11],
 7: [1, 2, 4, 5, 7, 8, 10, 11],
 8: [1, 2, 3, 4, 7, 8, 9, 10],
 9: [1, 2, 4, 5, 7, 8, 10, 11],
 10: [1, 3, 4, 5, 7, 9, 10, 11],
 11: [1, 2, 3, 4, 5, 7, 8, 9, 10, 11],
 12: [1, 2, 3, 4, 7, 8, 9, 10],
 13: [2, 5, 8, 11],
 14: [1, 2, 4, 5, 7, 8, 10, 11],
 15: [1, 4, 7, 10],
 16: [1, 2, 4, 5, 7, 8, 10, 11],
 17: [2, 3, 4, 5, 8, 9, 10, 11],
 18: [1, 2, 4, 5, 7, 8, 10, 11],
 19: [1, 2, 3, 4, 7, 8, 9, 10],
 20: [1, 2, 3, 4, 7, 8, 9, 10],
 21: [2, 5, 8, 11],
 22: [1, 2, 4, 5, 7, 8, 10, 11],
 23: [2, 3, 4, 5, 8, 9, 10, 11],
 24: [1, 2, 4, 5, 7, 8, 10, 11],
 25: [2, 5, 8, 11],
 26: [2, 3, 4, 5, 8, 9, 10, 11],
 27: [1, 2, 4, 5, 7, 8, 10, 11],
 28: [1, 2, 4, 5, 7, 8, 10, 11],
 29: [1, 2, 3, 4, 7, 8, 9, 10]}

PLACEMENTS=[{'piece': 'four_kite', 'nth': 0, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 1, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 3, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 5, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 8, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 9, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 11, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 14, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 15, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 17, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 19, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 22, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 24, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 26, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 27, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 30, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 32, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 33, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 36, 'color': '#c28c24'},
 {'piece': 'four_kite', 'nth': 38, 'color': '#c28c24'},
 {'piece': 'connector_kite', 'nth': 2, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 3, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 4, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 5, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 10, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 12, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 13, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 14, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 15, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 20, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 21, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 22, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 23, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 25, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 30, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 31, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 32, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 33, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 38, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 39, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 40, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 41, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 46, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 48, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 49, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 50, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 51, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 56, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 57, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 58, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 59, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 61, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 66, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 67, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 68, 'color': '#009c85'},
 {'piece': 'connector_kite', 'nth': 69, 'color': '#009c85'},
 {'piece': 'six_kite', 'nth': 0, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 5, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 6, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 11, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 12, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 15, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 20, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 23, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 24, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 29, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 30, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 35, 'color': '#798fbd'},
 {'piece': 'six_kite', 'nth': 1, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 4, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 7, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 10, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 13, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 16, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 19, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 22, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 25, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 28, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 31, 'color': '#ffffff'},
 {'piece': 'six_kite', 'nth': 34, 'color': '#ffffff'}]

def point_of(i):return 'A' if i==16 else f'Q{i+1}'


def description(name):
    base,_,copy=name.partition('@')
    if base in ['h','v']:text=('horizontal' if base=='h' else 'vertical')+' line through O'
    elif base.startswith('r') and base[1:].isdigit():text=f'{base[1:]}° line through O'
    elif base.startswith('st'):
        i=int(base[2:]);text=f'line from S{i+1} to S{(i+4)%12+1}'
    elif base.startswith('N'):text=f'vertical line through {base[:-1]}'
    elif base.startswith('frame'):
        i=int(base[5:]);text=f'line from T{i+1} to T{(i+1)%4+1}'
    else:
        i=int(base[2:]);angle=PLAN[i][2]
        text=(('horizontal' if angle==0 else 'vertical') if angle in [0,90] else f'{angle}°')+' line through '+point_of(i)
    if copy:text+=f' turned {int(copy)*30}°'
    return text


def build():
    opening(width_only=True)
    cm.steps[5]['text']='Draw the four triangles.'
    step('Draw a circle with centre O through N6. It crosses the horizontal and vertical lines at T1 to T4, counted round it. '
         'Draw a straight line through T1 and T2, T2 and T3, T3 and T4, and T4 and T1.', 'compass')
    g.circle_through('frameCircle','O','N6')
    cell=[(L,0),(0,L),(-L,0),(0,-L)]
    for i,p in enumerate(cell):g.meet(f'T{i+1}','frameCircle','h' if i%2==0 else 'v',p)
    for i in range(4):g.line_through(f'frame{i}',f'T{i+1}',f'T{(i+1)%4+1}')
    for i,(a,b,angle) in enumerate(PLAN):
        p=point_of(i)
        intro='' if p=='A' else f'The {description(a)} crosses the {description(b)} at {p}. '
        draw=(f'Draw a horizontal line through {p}.' if angle==0 else
              f'Draw a vertical line through {p}.' if angle==90 else
              f'Draw a line through {p} at {angle}° from OA.')
        step(intro+draw+' Turn it round O by 30°, eleven times.')
        if p!='A':g.meet(p,a,b,g.crossings(a,b)[0])
        g.line_par(f'gl{i}',p,REF[angle]);g.repeat(f'copies{i}',[f'gl{i}'],'rot12')
    cm.steps[3]['textWithoutHelpers']='The four circles cross the first circle at B, C, E, F, H, J, L and M.'
    cm.steps[4]['textWithoutHelpers']=cm.steps[3]['textWithoutHelpers']+' '+cm.steps[4]['text']
    cm.steps[5]['textWithoutHelpers']='Draw the triangle sides that are needed.'
    cm.steps[5]['parts'][2]['textWithoutHelpers']=(
        'Draw a straight line through S7 and S11, and S11 and S3.')
    cm.steps[9]['textWithoutHelpers']=(
        'Draw a circle with centre O through N6. '
        'It crosses the horizontal and vertical lines at T1 to T4, counted round it. '
        'Draw a straight line through T1 and T2, T2 and T3, and T4 and T1.')
    for i,hidden in OMITTED.items():
        turns=[f'{30*k}°' for k in range(1,12) if k not in hidden]
        words=turns[0] if len(turns)==1 else ', '.join(turns[:-1])+' and '+turns[-1]
        cm.steps[10+i]['textWithoutHelpers']=cm.steps[10+i]['text'].replace(
            'Turn it round O by 30°, eleven times.',f'Turn it round O by {words}.')
    return cell


def drawing(pieces):
    return cm.frame_pieces(pieces,(130.77,548.19),2*UNIT,10,
        keep=lambda p:max(p['fill'])-min(p['fill'])>.05 or min(p['fill'])>.6)


def main():
    pieces,out=sys.argv[1:3];cell=build();polys=drawing(pieces)
    polys=[[(x+L*(i+j),y+L*(i-j)) for x,y in q] for q in polys for i in [-1,0,1] for j in [-1,0,1]]
    edges=[]
    for q in polys:
        for i,p in enumerate(q):
            z=q[i-1];cl=clip_poly([(p,z)],cell)
            if cl and math.dist(*cl[0])>.003:edges.append([p,z])
    paths=cm.along_ink(network(edges,cell))
    step('Join T1, T2, T3 and T4 to mark the tile that repeats.','fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,5)]})
    t={'format':0,'id':'ismail-shrine-divided-stars','title':'Divided stars of Imamzadeh Ismail, Isfahan',
        'short':'Ismail shrine divided stars','subtitle':'Imamzadeh Ismail shrine, Isfahan, Iran',
        'fold':2,'star':6,'style':'Persian','level':'advanced',
        'given':{'O':'The centre of a four-pointed star, at the crossing of the mirrors.','A':'Sets its point radius.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s SHAF18 drawing. The drawing gives no steps. '
                   'The first nine construction operations share the P142 opening. Compass sums set the diamond repeat; parallels through crossings complete the divided stars.',
            'changes':'Grey bevel facets below0.6 are removed; the pale-grey kites are retained. The10pt bands are represented by their centre lines. '
                      'Guide families turn more often than the finished pattern. The steps, order and named points are ours. '
                      'The palette is illustrative. No monument photograph was independently checked.','reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data200/SHAF18: Imamzadeh Ismail shrine','creator':'Brian Wichmann',
            'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data200/SHAF18.html',
            'note':'The page cites Javad Shafai, On decoration in Persian architecture and wood carving, Tehran(1977), page110, in Persian: Imamzadeh Ismail shrine, Isfahan, Iran. It calls the group pmm. No monument photograph was independently checked.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','look':'strapwork','palette':'Kashan','colors':{},'text':'Put copies of the diamond tile side by side.'},
        'expect':{'pieceTypes':1,'pieces':[{'name':'x','vertices':3,'area':1,'perCell':1}]}}
    r,s=math.sqrt(2),math.sqrt(3)
    inventory=[('six_kite',s-r,36,'b'),('connector_kite',(1+r-s)/2,72,'d'),
        ('four_kite',(s-1)/2,40,'c'),('three_kite',1-s/3,12,'ground')]
    t['expect']={'pieceTypes':4,'cellArea':round(28+16*s,5),
        'note':'The160 counted source-kite shoelaces sum exactly to28+16√3=2(2√2+√6)².',
        'pieces':[{'name':n,'vertices':4,'area':round(a,5),'perCell':c} for n,a,c,_ in inventory]}
    t['pattern']['colors']={n:color for n,_,_,color in inventory}
    t['pattern']['placements']={'repeat':[1,1],'rules':PLACEMENTS}
    cm.write(t,out);print(len(cm.steps),'steps',len(paths),'paths')

if __name__=='__main__':main()
