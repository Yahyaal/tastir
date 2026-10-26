#!/usr/bin/env python3
"""P058. Band12pt, OA=48.2854967367pt, half-side2+2sqrt(2).
Precision2 source corners fit a+bH within0.000311 OA. Neighbouring stars
on the axes have different surroundings; retain the full repeat466.27pt.
Usage: this script pieces.json tutorial.json; then finish dump.json tutorial.json.
"""
import os
import sys
sys.path.insert(0,os.path.dirname(__file__))
import common as cm
from common import g,step
import medium
import gen_meknes_bou_inania_petals as mp
from gen_meknes_bou_inania_rosette_rings import crossing_set
H,L=mp.H,2+4*mp.H


def build():
    mp.build_frame(2,2)
    step('The vertical side from S8 to S2 crosses the line from S3 to S5 at R. '
         'Draw a horizontal line through R. Draw a line through R parallel to the line from S1 to S3. '
         'Turn both lines round O by 90°, three times. '
         'The line through R, turned by 270°, crosses the line from S3 to S5 at V. '
         'Draw a horizontal line through V. Turn it round O by 90°, three times.')
    g.meet('R','q14','q02',(H,1+H));g.line_par('rh','R','h');g.line_par('rd','R','q01')
    g.repeat('rp',['rh','rd'],'rot4')
    g.meet('V','rh@3','q02',(1+H,2+H));g.line_par('vh','V','h');g.repeat('vp',['vh'],'rot4')
    g.meet('R1','q11','q03',(-1-H,H));g.meet('R3','q13','q01',(1+H,-H))
    cm.steps[-1]['textWithoutHelpers']=(
        'Draw a horizontal line through R. Turn it round O by 270°. '
        'The line from S2 to S4 crosses the line from S5 to S7 at R1. '
        'The line from S6 to S8 crosses the line from S1 to S3 at R3. '
        'Draw a line through each of R1 and R3 parallel to line OE. '
        'Draw a horizontal line through V. Turn it round O by 90°, three times.')
    crossing_set('W','rh','rd@3',(2+3*H,1+H),[('wv','v'),('wd','q01')],
                 'The horizontal line through R crosses the diagonal through R, turned by 270°, at W. '
                 'Draw a vertical line through W. Draw a line through W parallel to the line from S1 to S3. '
                 'Turn both lines round O by 90°, three times.')
    crossing_set('X','q14','rd@1',(H,1+3*H),[('xd','q01')],
                 'The vertical side from S8 to S2 crosses the diagonal through R, turned by 90°, at X. '
                 'Draw a line through X parallel to the line from S1 to S3. Turn it round O by 90°, three times.')
    step('Draw a circle with centre K1 and radius OA. It crosses line OE at Q, towards O. '
         'Draw a vertical line through Q. Turn it round O by 90°, three times.', 'compass')
    cm.circle_radius_of('ck','K1','c');g.meet('Q','ck','d45',(L-H,L-H))
    g.line_par('qv','Q','v');g.repeat('qp',['qv'],'rot4')
    crossing_set('Q2','ck','gx',(L,L-1),[('qd','q01')],
                 'The circle with centre K1 crosses the vertical line through T1 at Q2, towards T1. '
                 'Draw a line through Q2 parallel to the line from S1 to S3. Turn it round O by 90°, three times.')


SPEC={'id':'bourgoin-58-star-bands','title':'Star bands of Bourgoin plate 58',
    'short':'Bourgoin 58 star bands','subtitle':'Bourgoin, plate 58',
    'code':'P058','folder':'data162','frame':((294.36375,374.22),48.2854967367,12,L),
    'style':'Islamic','palette':'Alhambra','look':'interlace',
    'given':{'O':'The centre of an eight-pointed star.','A':'A point of that star.'},
    'note':'The finished design was read from Wichmann’s P058 drawing and its band centres snapped to '
           'exact square-root-of-two values. The unit-star opening is shared with the earlier reconstructions. '
           'Neighbouring stars on an axis have different surroundings, so the repeat spans two star spacings.',
    'changes':'The 12 pt bands are represented by their centre lines. The palette is illustrative; no photograph was checked. '
              'The source highlights one star in ochre; the tutorial repeats a consistent shape palette.',
    'references':'His references are Bourgoin plate 58; Wade MOR 0316 at the Attarine madrasa and SPA 2315/2109x '
                 'at the Alcázar, Seville; Broug page 76 figure 3.34, an Alcázar wooden door (1616); '
                 'Wichmann and Wade figure 9.6a; Dury page 22, marble inlay at the Great Mosque, Damascus; '
                 'Abas and Salman page 239; and Paccard volume 1 page 410, Royal Palace, Fez.',
    'ink':'Ink the lines picked out in orange. They close the stars, the long bands and the pieces between them.'}
NAMES={(6,3):('long_hexagon','b'),(16,2.343):('star','a'),(8,2):('eight','c'),
       (6,1.828):('hexagon','d'),(4,.586):('dart','ground'),(3,.5):('triangle','ground'),(4,.414):('kite','ground')}
if __name__=='__main__':medium.run(build,SPEC,NAMES)
