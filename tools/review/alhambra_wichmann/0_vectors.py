"""Writes <name>-vec.json from a Tiling Search PDF <name>.pdf: every drawn
path with its fill, stroke and straight segments (PyMuPDF).
Usage: uv run --with pymupdf python 0_vectors.py <name>"""
import json, sys
import pymupdf
name = sys.argv[1]
pg = pymupdf.open(f'{name}.pdf')[0]


def lines(d):
    # straight segments, with rectangles ('re') and quads ('qu') as four
    # sides each (SPA0417X draws its small squares as rectangles)
    out = []
    for it in d['items']:
        if it[0] == 'l':
            out.append([[it[1].x, it[1].y], [it[2].x, it[2].y]])
        elif it[0] in ('re', 'qu'):
            q = it[1].quad if it[0] == 're' else it[1]
            c = [q.ul, q.ur, q.lr, q.ll]
            out += [[[c[i].x, c[i].y], [c[(i + 1) % 4].x, c[(i + 1) % 4].y]] for i in range(4)]
    return out


segs = [{'fill': d.get('fill'), 'color': d.get('color'), 'width': d.get('width'), 'lines': lines(d)}
        for d in pg.get_drawings()]
json.dump(segs, open(f'{name}-vec.json', 'w'))
print(len(segs), 'paths')
