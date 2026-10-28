#!/usr/bin/env python3
"""ASU2: a dodecagon and six pentagons on a hexagonal repeat.

The expanded dodecagon has side45pt, radius45/(2sin15°). The repeat's
apothem is one radius plus half a side. It uses Mian's established four-step
circle division opening, with the identical compass operations and wording.
"""
import json
import math
import os
import sys

import common as cm
from common import g,step
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','alhambra_wichmann'))
from gen_reyes_dodecagram import clip_poly

L = 1 + math.sin(math.pi/12)
UNIT = 45/(2*math.sin(math.pi/12))
HEX = [(L/math.cos(math.pi/6)*math.cos(math.radians(30+60*k)),
        L/math.cos(math.pi/6)*math.sin(math.radians(30+60*k))) for k in range(6)]
LETTERS = ['A','B','C','D','E','F','G','H','J','K','L','M']


def opening():
    """Reuse the current tutorial JSON so that this is the same opening."""
    base = json.load(open(os.path.join(os.path.dirname(__file__),'..','..','..','tutorials','twelve-fold-rosette-mian.json')))
    g.given()
    for source in base['steps'][:4]:
        step(source['text'],source.get('animate','ruler'),source.get('highlight'))
        for name,spec in source['create'].items():
            if 'line' in spec:
                x=spec['line']
                if 'perpendicularTo' in x:g.line_perp(name,x['through'],x['perpendicularTo'])
                else:g.line_through(name,*x['through'])
            elif 'circle' in spec:
                x=spec['circle']
                if 'radiusOf' in x:cm.circle_radius_of(name,x['centre'],x['radiusOf'])
                else:g.circle_through(name,x['centre'],x['through'])
            else:
                # These four steps only pick points on the unit circle.
                a=spec['point']['pick']['angle'];g.meet(name,*spec['point']['meet'],g.dirdeg(a))


def build():
    opening()
    step('Draw a straight line through A and B, B and C, C and D, and D and E. '
         'Draw a straight line through E and F, F and G, G and H, and H and J. '
         'Draw a straight line through J and K, K and L, L and M, and M and A. '
         'These lines outline the twelve-sided shape.')
    for i,a in enumerate(LETTERS):g.line_through(f'edge{i}',a,LETTERS[(i+1)%12])
    step('Draw a straight line through O and C. Draw a straight line through O and E. '
         'Draw the line through O that halves angle AOB. It crosses the circle at N, above OA.')
    g.line_through('r0','O','C');g.line_through('r1','O','E')
    g.line_bisect('r15','A','O','B');g.meet('N','c','r15',g.dirdeg(15))
    step('Draw a horizontal line through N. It crosses the vertical line through O at P. '
         'Draw a circle with centre A and opening OP. '
         'It crosses the horizontal line at Q, right of A.', 'compass')
    g.line_par('nh','N','h');g.meet('P','nh','v',(0,math.sin(math.pi/12)))
    g.circle_from('cq','A','O','P');g.meet('Q','cq','h',(L,0))
    step('Draw a vertical line through Q. Turn it round O by 60°, five times. '
         'These six lines frame the hexagonal tile. Its corners are T1 to T6.')
    g.line_par('side','Q','v');g.repeat('sides',['side'],'rot6')
    side=lambda k:'side' if k%6==0 else f'side@{k%6}'
    for i,p in enumerate(HEX):g.meet(f'T{i+1}',side(i),side(i+1),p)
    step('Join T1, T2, T3, T4, T5 and T6 to mark the tile that repeats.', 'fade')
    g.put('tile','polygon',None,{'polygon':[f'T{i}' for i in range(1,7)]})


def main():
    pieces,out=sys.argv[1:3];build()
    ps=cm.frame_pieces(pieces,(305.4016666666667,371),2*UNIT,12)
    segs=set()
    for q in ps:
        for i,p in enumerate(q):
            for a,b in clip_poly([(p,q[(i+1)%len(q)])],HEX):
                aa,bb=cm.snap(a),cm.snap(b)
                assert aa and bb,('corner off construction',a,b)
                if math.dist(aa,bb)>1e-6:segs.add(tuple(sorted((tuple(round(x,9) for x in aa),tuple(round(x,9) for x in bb)))))
    paths=cm.along_ink(sorted(segs))
    pentagon=(2*math.sqrt(3)*L*L-3)/6
    tut={'format':0,'id':'salim-chishti-dodecagons','title':'Dodecagons of Salim Chishti’s tomb, Fatehpur Sikri',
        'short':'Salim Chishti dodecagons','subtitle':'Salim Chishti’s tomb, Fatehpur Sikri',
        'fold':6,'style':'Mughal','level':'intermediate',
        'given':{'O':'The centre of a dodecagon.','A':'Its right point.'},
        'construction':{'basis':'reconstruction','fidelity':'not-applicable',
            'note':'The finished design was read from Wichmann’s ASU2 drawing. The drawing gives no construction steps. '
                   'The standard twelve-division opening is shared with the existing Mian rosette lesson. '
                   'The pentagon boundaries and the hexagonal repeat were reconstructed from the drawing.',
            'changes':'The 12 pt bands are represented by their centre lines. The compass steps, order and named points are ours. '
                      'The palette is illustrative; no photograph was checked.','reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data216/ASU2: Salim Chishti’s tomb','creator':'Brian Wichmann',
            'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data216/ASU2.html',
            'note':'His page attributes the design to Aslam Qureshi’s photograph of Salim Chishti’s tomb, '
                   'Fatehpur Sikri, India (1581 AD, 989 AH), supplied by personal communication. '
                   'The photograph was not independently checked.'}],
        'steps':cm.steps,'ink':{'text':'Ink the lines picked out in orange. They close the dodecagon and its surrounding pentagons.','paths':paths},
        'pattern':{'cell':'tile','look':'strapwork','palette':'Mamluk wood','colors':{'dodecagon':'a','pentagon':'a'},
            'text':'Put copies of the hexagonal tile side by side.'},
        'expect':{'pieceTypes':2,'cellArea':round(2*math.sqrt(3)*L*L,5),
            'note':'The unit dodecagon has area 3. Six pentagons of area (6√2+6√3−2√6−9)/12 fill the rest. '
                   'Their sum is 2√3(1+sin15°)², the hexagonal cell area.',
            'pieces':[{'name':'dodecagon','vertices':12,'area':3,'perCell':1},
                {'name':'pentagon','vertices':5,'area':round(pentagon,5),'perCell':6}]}}
    cm.write(tut,out)
    print(len(cm.steps),'steps;',len(paths),'paths')


if __name__=='__main__':main()
