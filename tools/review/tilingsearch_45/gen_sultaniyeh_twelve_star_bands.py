#!/usr/bin/env python3
"""IRA2633: the exact W85 centre-line mesh, with three piece-fill classes.

The source is a coloured ribbon drawing, which its page calls not
edge-to-edge. Its band centres coincide with W85 after scaling5/6.
O=(297.5,374.1754166667)pt, OA=25(3+√3)/√2pt, frame15°, band15pt.
Copying the base tutorial deliberately preserves all construction and ink
references; the distinct fill assignment is the variation.
Usage: gen_sultaniyeh_twelve_star_bands.py output.json
"""
import json
import math
from pathlib import Path
import sys

import common as cm
from gen_mexuar_twelve_star_bands import build, L

UNIT=25*(3+math.sqrt(3))/math.sqrt(2)


def drawing(pieces):
    """The source star and kite contours, used to check registration."""
    keep=lambda p: all(abs(v-.5)<.001 for v in p['fill']) or max(p['fill'])<.01
    ps=cm.frame_pieces(pieces,(297.5,374.1754166666667),2*UNIT,15,keep=keep)
    c,s=math.cos(math.pi/12),math.sin(math.pi/12)
    return [[(c*x+s*y,c*y-s*x) for x,y in q] for q in ps]


def main():
    root=Path(__file__).resolve().parents[3]
    tutorial=json.loads((root/'tutorials/mexuar-twelve-star-bands.json').read_text())
    tutorial.update({'id':'sultaniyeh-twelve-star-bands',
        'title':'Twelve-pointed star bands of Öljeitü’s mausoleum, Sultaniyeh',
        'short':'Sultaniyeh twelve-star bands','subtitle':'Öljeitü’s mausoleum, Sultaniyeh',
        'style':'Persian'})
    tutorial['construction']={
        'basis':'reconstruction','fidelity':'not-applicable',
        'note':'The finished design was read from Wichmann’s IRA2633 coloured ribbon drawing. '
               'Its band centre lines coincide with W85’s complete mesh. This filling variation '
               'shares every construction step and ink reference with mexuar-twelve-star-bands. '
               'The drawing gives no construction instructions.',
        'changes':'The source’s15pt ribbons are represented by their centre lines with the strapwork look. '
                  'The grey stars, green pentagons and triangles, and black kites retain three distinct fill classes. '
                  'The numeric palette and single band colour are illustrative. The frame turns15°. '
                  'The compass operations, order and named points are ours. No monument photograph was independently checked.',
        'reviewed':'2026-10-27'}
    tutorial['credits']=[{'source':'Tiling Search, data189/IRA2633: Öljeitü’s mausoleum, Sultaniyeh',
        'creator':'Brian Wichmann','kind':'drawing',
        'url':'https://tilingsearch.mit.edu/HTML/data189/IRA2633.html',
        'note':'The page cites David Wade’s photograph IRA2633, Öljeitü’s mausoleum, Sultaniyeh, Iran '
               '(1313 AD, 712 AH). Its non-edge-to-edge statement describes the filled ribbon rendering; '
               'the repeated centre-line mesh reconstructed here is the same as W85.'}]
    tutorial['pattern']['colors']={'star':'ground','pentagon':'b','kite':'a','triangle':'b'}
    cm.write(tutorial,sys.argv[1])
    print(len(tutorial['steps']),'shared steps;',len(tutorial['ink']['paths']),'identical ink paths')

if __name__=='__main__':main()
