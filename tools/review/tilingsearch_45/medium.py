"""Document and finish a reconstructed square-cell tutorial.

Geometry remains in each generator: this helper only writes the shared
metadata, extracts ink along that construction, and formats the JSON.
The frame values are research measurements, never tutorial coordinates.
"""
import json
import sys

import common as cm
from common import put, step


def run(build, spec, names, drawing=None):
    if sys.argv[1] == 'finish':
        cm.finish(sys.argv[2], sys.argv[3], names)
        if spec.get('small'):
            tut = json.load(open(sys.argv[3]))
            for piece in tut['expect']['pieces']:
                if piece['name'] in spec['small']:
                    piece['small'] = True
            cm.write(tut, sys.argv[3])
        return
    pieces, out = sys.argv[1:3]
    build()
    origin, unit, band, half_side = spec['frame']
    polys = drawing(pieces) if drawing else cm.frame_pieces(pieces, origin, 2*unit, band)
    diamond = spec.get('diamond', False)
    paths = cm.along_ink(cm.network(polys, hcell=half_side, reach=3*half_side, diamond=diamond))
    corners = ['T1', 'T2', 'T3', 'T4'] if diamond else ['K1', 'K2', 'K3', 'K4']
    step('Join {}, {}, {} and {} to mark the tile that repeats.'.format(*corners), 'fade')
    put('tile', 'polygon', None, {'polygon': corners})
    tut = {'format': 0, **{key: spec[key] for key in ['id', 'title', 'short', 'subtitle', 'given']}}
    tut.update({
        'format': 0, 'fold': 4, 'star': spec.get('star', 8),
        'style': spec.get('style', 'Moroccan'), 'level': spec.get('level', 'advanced'),
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': spec['note']+' The drawing gives no steps; we devised the construction.',
            'changes': 'The compass steps, their order and the named points are ours. '+spec['changes'],
            'reviewed': '2026-10-26'},
        'credits': [{
            'source': f"Tiling Search, {spec['folder']}/{spec['code']}: {spec['subtitle']}",
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': f"https://tilingsearch.mit.edu/HTML/{spec['folder']}/{spec['code']}.html",
            'note': 'Read from his finished drawing, not construction instructions. '+spec['references']}],
        'steps': cm.steps,
        'ink': {'text': spec.get('ink', 'Ink the lines picked out in orange.'), 'paths': paths},
        'pattern': {'cell': 'tile', 'palette': spec.get('palette', 'Marinid zellige'),
                    'look': spec.get('look', 'tiles'), 'colors': {},
                    'text': spec.get('repeat', 'Put copies of the square tile side by side.')},
        'expect': spec.get('expect', {'pieceTypes': 1, 'pieces': [{'name': 'x', 'vertices': 3, 'area': 1, 'perCell': 1}]})})
    if spec.get('star', 8) is None:
        tut.pop('star', None)
    if spec.get('placements'):
        tut['pattern']['placements'] = spec['placements']
    if spec.get('chiral'):
        tut['chiral'] = True
    cm.write(tut, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')
