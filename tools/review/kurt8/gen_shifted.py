#!/usr/bin/env python3
"""Rebuild the shifted wheel's lesson from the shared wheel construction.

Usage: gen_shifted.py <kurt-eight-fold-zellige.json> <shifted-tutorial.json>
The destination supplies its existing metadata, ink and expect block.
"""
from copy import deepcopy
import json
from pathlib import Path
import sys

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tilingsearch_45'))
from common import write


def build(primary):
    steps=deepcopy(primary['steps'][:18])
    # Make the missing parallels before asking for the octagons that use them.
    # Keep this pacing change local to the shifted variation.
    octagons=steps[15]
    guides={name:spec for name,spec in octagons['create'].items() if 'line' in spec}
    corners={name:spec for name,spec in octagons['create'].items() if name not in guides}
    steps[15]={
        'id':16,'text':'Draw the octagons.',
        'parts':[
            {'text':'Draw lines through X1 to X8 parallel to each of the four lines through O. '
                    'Draw only the missing lines. Do the same through R1 to R8.',
             'textWithoutHelpers':'Draw lines through R1 to R8 parallel to each of the four lines through O. '
                                  'Draw only the missing lines.',
             'create':guides,'animate':'ruler'},
            {'text':'Draw an octagon in each ring circle, each small circle and the circle round O. '
                    'Its corners are crossings of each circle with the lines through its centre.',
             'create':corners,'animate':'ruler'}]}
    steps[17]['text']=(
        'Draw a vertical line through each of E and W. Draw a horizontal line through each of N and S. '
        'They make a square that just touches the main circle. Its two upright sides are sides of the tile.')
    steps[17]['textWithoutHelpers']=(
        'Mark the square that just touches the main circle. Its corners are crossings already on the board. '
        'Its two upright sides are sides of the tile.')
    corner=corners['oK1_1']
    text=('The ring circle with centre X2 crosses the line from X2 to X5 at B, away from X5. '
          'Draw a straight line through O and B. It crosses the right side of the square at V.')
    steps.append({'id':19,'text':text,'textWithoutHelpers':text,
        'create':{'B':deepcopy(corner),'oSlant':{'line':{'through':['O','B']}},
                  'V':{'point':{'meet':['oSlant','tE']}}},
        'highlight':['ring1','g7b','tE'],'animate':'ruler'})
    parts=[
        {'text':'Draw a circle with centre O through V.',
         'create':{'cMidA':{'circle':{'centre':'O','through':'V'}}},'animate':'compass'},
        {'text':'Draw a circle with centre V through O. It crosses the last circle at Y1 and Y2.',
         'create':{'cMidB':{'circle':{'centre':'V','through':'O'}},
                   'Y1':{'point':{'meet':['cMidA','cMidB'],'pick':{'angle':135}}},
                   'Y2':{'point':{'meet':['cMidA','cMidB'],'pick':{'angle':0}}}},'animate':'compass'},
        {'text':'Draw a straight line through Y1 and Y2. '
                'It crosses the vertical line at H2 and the right side of the square at H1.',
         'create':{'roof':{'line':{'through':['Y1','Y2']}},
                   'H2':{'point':{'meet':['roof','v']}},'H1':{'point':{'meet':['roof','tE']}}},'animate':'ruler'},
        {'text':'Draw a circle with centre O through H1. It crosses the upright sides of the square at H3, H4 and H6.',
         'create':{'cSide':{'circle':{'centre':'O','through':'H1'}},
                   'H6':{'point':{'meet':['cSide','tE'],'pick':{'farthest':'H1'}}},
                   'H3':{'point':{'meet':['cSide','tW'],'pick':{'nearest':'H1'}}},
                   'H4':{'point':{'meet':['cSide','tW'],'pick':{'farthest':'H1'}}}},'animate':'compass'},
        {'text':'Draw a circle with centre O through H2. It crosses the vertical line again at H5.',
         'create':{'cTop':{'circle':{'centre':'O','through':'H2'}},
                   'H5':{'point':{'meet':['cTop','v'],'pick':{'farthest':'H2'}}}},'animate':'compass'},
        {'text':'Join H1, H2, H3, H4, H5 and H6. This hexagon is the tile that repeats.',
         'create':{'hexTile':{'polygon':['H1','H2','H3','H4','H5','H6']}},'animate':'ruler'}]
    steps.append({'id':20,'text':'Draw the hexagon tile.','parts':parts})
    return steps


def main():
    source,destination=sys.argv[1:3]
    tutorial=json.loads(Path(destination).read_text())
    tutorial['steps']=build(json.loads(Path(source).read_text()))
    write(tutorial,destination)


if __name__=='__main__':main()
