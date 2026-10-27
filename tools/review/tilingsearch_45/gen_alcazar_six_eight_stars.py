#!/usr/bin/env python3
"""CM022: mixed six/eight-point stars on a square repeat.

O=(300.345625,373.845625)pt; 15pt bands; OA=25(1+√2)pt.
Put H=√2/2. The cell half-side is H(1+5/√3).
The axial mark H+√(3/2) sets the first slant family. Moving its crossing
at (H,H+4H/√3) by H/√3 gives the cell side. Remaining lines are parallels
through existing crossings. No numeric coordinates enter the tutorial.
"""
import math

import common as cm
from common import g, step
import half_turn

H = math.sqrt(.5)
L = H * (1 + 5 / math.sqrt(3))


def build():
    half_turn.unit_star()
    step('Draw a circle with centre A through O. It crosses the first circle at Z, above O. '
         'Draw a straight line through O and Z. '
         'Draw the line through O that halves the angle AOZ. '
         'Draw lines through O at 90° to these two new lines.', 'compass')
    g.circle_through('ca', 'A', 'O')
    g.meet('Z', 'ca', 'c', (.5, math.sqrt(3)/2))
    g.line_through('r60', 'O', 'Z')
    g.line_bisect('r30', 'A', 'O', 'Z')
    g.line_perp('r120', 'O', 'r30')
    g.line_perp('r150', 'O', 'r60')
    step('Draw a circle with centre O and opening AW. W is the first circle’s crossing at 120° from A. '
         'Draw a vertical line through J, where the new circle crosses the line from O to K1. '
         'It crosses the horizontal line through O at N.', 'compass')
    g.meet('W', 'c', 'r120', (-.5, math.sqrt(3)/2))
    g.circle_from('cs3', 'O', 'A', 'W')
    g.meet('J', 'cs3', 'd45', (math.sqrt(1.5), math.sqrt(1.5)))
    g.line_par('jv', 'J', 'v')
    g.meet('N', 'jv', 'h', (math.sqrt(1.5), 0))
    step('Draw a circle with centre M and opening ON. '
         'It crosses the horizontal line at Q, right of M. '
         'Draw lines through Q parallel to the lines from O to Z and from O to W. '
         'Turn both lines round O by 90°, three times.', 'compass')
    g.circle_from('cn', 'M', 'O', 'N')
    g.meet('Q', 'cn', 'h', (H+math.sqrt(1.5), 0))
    for n, ref in [('s1', 'r60'), ('s2', 'r120')]:
        g.line_par(n, 'Q', ref)
        g.repeat(n+'r', [n], 'rot4')
    step('The vertical line through M crosses the line at 30° from OA at T. '
         'It crosses the new line slanting up to the right at V, above T. '
         'Draw a circle with centre V and opening MT. It crosses the vertical at X, above V.', 'compass')
    g.meet('T', 'fv', 'r30', (H, H/math.sqrt(3)))
    g.meet('V', 'fv', 's2@1', (H, H*(1+4/math.sqrt(3))))
    g.circle_from('cv', 'V', 'T', 'M')
    g.meet('X', 'cv', 'fv', (H, L))
    step('Draw a horizontal line through X. Turn it round O by 90°, three times. '
         'The four lines frame the tile, with corners U1 to U4.')
    g.line_par('frame', 'X', 'h')
    g.repeat('frames', ['frame'], 'rot4')
    for i, (a, b, p) in enumerate([
        ('frame', 'frame@3', (L,L)), ('frame', 'frame@1', (-L,L)),
        ('frame@2', 'frame@1', (-L,-L)), ('frame@2', 'frame@3', (L,-L))]):
        g.meet(f'U{i+1}', a, b, p)
    step('The upper tile side crosses the line through Q turned by 90° at E. '
         'Draw a line through E parallel to the line at 30° from OA. '
         'Turn it round O by 90°, three times.')
    g.meet('E', 's1@1', 'frame', (-2*H, L))
    g.line_par('outer', 'E', 'r30')
    g.repeat('outers', ['outer'], 'rot4')
    step('Draw a line through O at 90° to the line from O to K1. '
         'It crosses the last slanting line at P, above O. '
         'Draw a line through P parallel to line OZ. Turn it round O by 90°, three times.')
    g.line_perp('d135', 'O', 'd45')
    value = H*(-2+3*math.sqrt(3))
    g.meet('P', 'd135', 'outer', (-value, value))
    g.line_par('outer2', 'P', 'r60')
    g.repeat('outers2', ['outer2'], 'rot4')

    cm.steps[4]['textWithoutHelpers'] = (
        'Draw a circle with centre A through O. It crosses the first circle at Z, above O. '
        'Draw the line through O that halves the angle AOZ. '
        'Draw a line through O at 90° to this new line.')
    cm.steps[8]['textWithoutHelpers'] = (
        'Draw a horizontal line through X. Draw its copies turned by 90° and 180° round O. '
        'The upper corners of the tile are U1 and U2. The lower corners are U3 and U4.')


SPEC = {
    'id': 'alcazar-six-eight-stars', 'code': 'CM022', 'folder': 'data15',
    'title': 'Six- and eight-pointed stars of the Alcázar, Seville',
    'short': 'Alcázar six and eight stars', 'subtitle': 'Hall of the Ambassadors, Alcázar of Seville',
    'style': 'Mudéjar', 'palette': 'Alhambra', 'look': 'strapwork',
    'frame': ((300.345625,373.845625),25*(1+math.sqrt(2)),15,L),
    'given': {'O': 'The centre of an eight-pointed star.', 'A': 'Its right point.'},
    'note': 'The finished design was read from Wichmann’s CM022 drawing. '
            'The unit star and a square-root-of-three compass transfer fix the six-pointed stars and the full square repeat.',
    'changes': 'The 15 pt bands are represented by their centre lines. The palette is illustrative. No photograph was checked.',
    'references': 'The page cites Cahier and Martin page 22; Wade SPA 2219 and SPA 2319; '
                  'John Rigby photograph 180, Hall of the Ambassadors; and Nick Crossling’s photograph of '
                  'wood inlay in the Salón de Techo de Carlos V. These are the page’s attributions.'
}


def main():
    import sys
    pieces, out = sys.argv[1:3]
    build()
    polys = cm.frame_pieces(pieces, SPEC['frame'][0], 2*SPEC['frame'][1], 15)
    paths = cm.along_ink(cm.network(polys, hcell=L, reach=4*L))
    step('Join U1, U2, U3 and U4 to mark the tile that repeats.', 'fade')
    g.put('tile', 'polygon', None, {'polygon': ['U1','U2','U3','U4']})
    tut = {
        'format':0, **{k:SPEC[k] for k in ['id','title','short','subtitle','given']},
        'fold':4,'star':8,'style':SPEC['style'],'level':'advanced',
        'construction': {'basis':'reconstruction','fidelity':'not-applicable',
            'note':SPEC['note']+' The drawing gives no steps; we devised the construction.',
            'changes':SPEC['changes']+' The compass steps, their order and named points are ours.', 'reviewed':'2026-10-27'},
        'credits':[{'source':'Tiling Search, data15/CM022: Alcázar of Seville','creator':'Brian Wichmann',
            'kind':'drawing','url':'https://tilingsearch.mit.edu/HTML/data15/CM022.html','note':SPEC['references']}],
        'steps':cm.steps, 'ink':{'text':'Ink the lines picked out in orange.','paths':paths},
        'pattern':{'cell':'tile','palette':'Alhambra','look':'strapwork','colors':
            {'six_star':'a','eight_star':'ground','four_star':'c','eight':'ground','arrow':'a','kite':'a'},
            'text':'Put copies of the square tile side by side.'},
        'expect':{'pieceTypes':6, 'cellArea':round(4*L*L,5),
            'note':'Areas: six_star 2√3; eight 8−3√3; four_star (38√3−58)/3; '
                   'eight_star 8−4√2; arrow −3/2+√2+5√3/6; kite 1−√3/3. '
                   'Their counted sum is (56+20√3)/3 = 4L².',
            'pieces':[
                {'name':name,'vertices':n,'area':round(area,5),'perCell':count}
                for name,n,area,count in [
                    ('six_star',12,2*math.sqrt(3),2), ('eight',8,8-3*math.sqrt(3),4),
                    ('four_star',8,(38*math.sqrt(3)-58)/3,1), ('eight_star',16,8-4*math.sqrt(2),1),
                    ('arrow',8,-1.5+math.sqrt(2)+5*math.sqrt(3)/6,4), ('kite',4,1-math.sqrt(3)/3,4)]]}}
    cm.write(tut,out)
    print(len(cm.steps),'steps;',len(paths),'paths')


if __name__ == '__main__':
    main()
