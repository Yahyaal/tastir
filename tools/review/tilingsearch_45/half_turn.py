"""Write low-fold reconstructions with rectangular repeats.

The construction and independent piece inventory belong to each generator.
Measurements here only register private source polygons with that construction;
the tutorial contains compass/ruler references, never coordinates.
"""
import math
import sys

import common as cm
from common import put, step


def run(build, spec):
    pieces, out = sys.argv[1:3]
    build()
    ox, oy, unit, band, hx, hy = spec['frame']
    polygons = cm.frame_pieces(pieces, (ox, oy), 2 * unit, band)
    if spec.get('angle'):
        angle = math.radians(spec['angle'])
        c, s = math.cos(angle), math.sin(angle)
        polygons = [[(c*x+s*y, c*y-s*x) for x, y in q] for q in polygons]
    paths = cm.along_ink(cm.network(polygons, hcell=hx, vcell=hy, reach=4 * max(hx, hy)))
    corners = spec.get('corners', ['N1', 'N2', 'N3', 'N4'])
    step(f'Join {corners[0]}, {corners[1]}, {corners[2]} and {corners[3]} to mark the tile that repeats.', 'fade')
    put('tile', 'polygon', None, {'polygon': corners})
    expected = []
    colors = {}
    for name, vertices, a, b, count, color in spec['pieces']:
        expected.append({'name': name, 'vertices': vertices,
                         'area': round(a + b * math.sqrt(.5), 5), 'perCell': count})
        colors[name] = color
    tutorial = {
        'format': 0, 'id': spec['id'], 'title': spec['title'],
        'short': spec['short'], 'subtitle': spec['subtitle'],
        'fold': spec.get('fold', 2), 'style': spec['style'],
        'level': spec.get('level', 'intermediate'),
        'given': spec['given'],
        'construction': {
            'basis': 'reconstruction', 'fidelity': 'not-applicable',
            'note': spec['note'] + ' The drawing gives no steps; we devised the construction.',
            'changes': spec['changes'] + ' The compass steps, their order and the named points are ours.',
            'reviewed': '2026-10-26'},
        'credits': [{
            'source': f"Tiling Search, {spec['folder']}/{spec['code']}: {spec['subtitle']}",
            'creator': 'Brian Wichmann', 'kind': 'drawing',
            'url': f"https://tilingsearch.mit.edu/HTML/{spec['folder']}/{spec['code']}.html",
            'note': 'Read from his finished drawing, not construction instructions. ' + spec['references']}],
        'steps': cm.steps,
        'ink': {'text': 'Ink the lines picked out in orange.', 'paths': paths},
        'pattern': {'cell': 'tile', 'palette': spec.get('palette', 'Timurid tile'),
                    'look': spec.get('look', 'tiles'), 'colors': colors,
                    'text': 'Put copies of the ' + ('square' if abs(hx-hy) < 1e-10 else 'rectangular') + ' tile side by side.'},
        'expect': {'pieceTypes': len(expected), 'pieces': expected},
    }
    if spec.get('placements'):
        tutorial['pattern']['placements'] = spec['placements']
    if spec.get('star'):
        tutorial['star'] = spec['star']
    if spec.get('small'):
        for piece in expected:
            if piece['name'] in spec['small']:
                piece['small'] = True
    cm.write(tutorial, out)
    print(len(cm.steps), 'steps;', len(paths), 'ink paths')
