"""Write low-fold reconstructions with rectangular repeats.

The construction and independent piece inventory belong to each generator.
Measurements here only register private source polygons with that construction;
the tutorial contains compass/ruler references, never coordinates.
"""
import math
import sys

import common as cm
from common import g, put, step


def unit_star():
    """Four opening steps, with the unit star and M at sqrt(2)/2 on OA."""
    cm.cell_square(
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through each of A and B. Draw a horizontal line through each of C and D. '
        'They cross at K1, K2, K3 and K4. Draw a straight line through O and K1.',
        'Draw a vertical line through O. The two lines cross the circle at A, B, C and D. '
        'Draw a vertical line through A. Draw a horizontal line through C. '
        'They cross at K1. Draw a straight line through O and K1.')
    h = math.sqrt(.5)
    step('The line from O to K1 crosses the circle at F. '
         'Draw a vertical line through F. It crosses the horizontal line through O at M. '
         'Turn the vertical line round O by 90°, three times.', 'ruler', ['F', 'M'])
    g.meet('F', 'c', 'd45', (h, h))
    g.line_par('fv', 'F', 'v')
    g.meet('M', 'fv', 'h', (h, 0))
    g.repeat('square', ['fv'], 'rot4')
    step('Draw a straight line through A and C. Turn it round O by 90°, three times.', 'ruler', ['A', 'C'])
    g.line_through('ac', 'A', 'C')
    g.repeat('diamond', ['ac'], 'rot4')


def rectangle(xpoint, ypoint, hx, hy):
    """The rectangle's four sides from two compass marks on the axes."""
    step(f'Draw a vertical line through {xpoint}. Draw a horizontal line through {ypoint}. '
         'Turn both lines round O by 180°. They cross at N1, N2, N3 and N4.', 'ruler', [xpoint, ypoint])
    g.line_par('sideX', xpoint, 'v')
    g.line_par('sideY', ypoint, 'h')
    g.repeat('frame', ['sideX', 'sideY'], 'rot2')
    for name, x, y, a, b in [('N1', 1, 1, 'sideX', 'sideY'), ('N2', -1, 1, 'sideX@1', 'sideY'),
                              ('N3', -1, -1, 'sideX@1', 'sideY@1'), ('N4', 1, -1, 'sideX', 'sideY@1')]:
        g.meet(name, a, b, (x*hx, y*hy))


def diagonals(points):
    """Both diagonal directions through each axial compass mark, all signs."""
    through = points[0] if len(points) == 1 else 'each of ' + ' and '.join(points)
    step(f'Draw a line through {through} at 90° to the line from O to K1. '
         'Turn the lines round O by 90°, three times.', 'ruler', points + ['K1'])
    names = []
    for point in points:
        name = f'diagonal_{point}'
        g.line_perp(name, point, 'd45')
        names.append(name)
    g.repeat(f'copies_{points[0]}', names, 'rot4')


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
