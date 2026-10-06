"""Split the long steps 8-12 of bou-inania-rosette.json into parts, one move each.

Usage: python3 10_parts.py tutorials/bou-inania-rosette.json

Run after finish.py. Rewrites steps 8-12 in place, keeping the file's layout
(one element per line), so the rest of the file is untouched.
"""
import json
import re
import sys

PARTS = {
    8: ('The ring of small stars and pentagons.', [
        ('Where a star line crosses a side of the big figure, rule a line at right angles to the 7.5° line, and its mirror image in the horizontal. Turn both round: 24 lines that make the small five-pointed stars.',
         ['X1', 'C', 'Cs', 'X2', 'Cw', 'Cws'], 'ruler'),
        ('Through the point of the first circle at 30°, rule the line at right angles to the 30° line: it just touches the circle. Turn it round. These are helper lines.',
         ['Tg', 'Tgs'], 'ruler'),
        ('Where the helper lines touching the circle at 30° and −30° cross the horizontal, rule a line at right angles to it, and turn it round: these lines close the pentagons.',
         ['X3', 'B', 'Bs'], 'ruler'),
    ]),
    9: ('The octagon of the corner stars, and the frame.', [
        ('Where a side of the big figure crosses one of the 24 lines, rule a line at right angles to the 22.5° line. Turn it round in eighths: the octagon of the corner stars.',
         ['X4', 'G', 'Gs'], 'ruler'),
        ('Where an octagon side crosses one of the 24 lines, rule a line at right angles to the horizontal. Turn it round in quarters: the frame, and the edge of the tile.',
         ['X5', 'F', 'Fs'], 'ruler'),
    ]),
    10: ('The ring round the shields.', [
        ('Where a star line crosses a pentagon line, rule a line at right angles to the horizontal, and turn it round: the inner side of the ring.',
         ['X6', 'D', 'Ds'], 'ruler'),
        ('Where two of the 24 lines cross on the horizontal, rule a line at right angles to the 15° line, and turn it round: the points of the ring.',
         ['X7', 'K', 'Ks'], 'ruler'),
    ]),
    11: ('Lines out into the corners.', [
        ('Where a side of the big figure crosses the inner side of the ring, rule a line at right angles to the horizontal, and turn it round. These carry the star lines on into the corners.',
         ['X8', 'S', 'Ss'], 'ruler'),
        ('Where the frame crosses a pentagon line, rule a line at right angles to the 45° line, and turn it round in quarters: the lines across the corners.',
         ['X9', 'H', 'Hs'], 'ruler'),
        ('Where a side of the big figure crosses a pentagon line, rule a line at right angles to the 15° line, and turn it round.',
         ['X10', 'M', 'Ms'], 'ruler'),
        ('Where two of the 24 lines cross on the 45° line, rule a line at right angles to the 15° line, and turn it round.',
         ['X11', 'N', 'Ns'], 'ruler'),
    ]),
    12: ('An eight-pointed star at each corner of the frame. Its square is the little square between the big figure’s sides and the frame.', [
        ('Join the little square’s other two corners, and mark where that line crosses the diagonal: the star’s centre.',
         ['K13', 'K14', 'sda', 'Sa', 'K15', 'K16', 'sdb', 'Sb', 'K17', 'K18', 'sdc', 'Sc', 'K19', 'K20', 'sdd', 'Sd'], 'ruler'),
        ('Through the centre, rule a level line and an upright one. Where they meet the line across the corner are two points of the diamond.',
         [f'{p}{t}' for t in 'abcd' for p in ('sh', 'sv', 'St1', 'St2')], 'ruler'),
        ('Draw the circle about the centre through one of these points: it meets the level and upright lines again at the other two.',
         [f'{p}{t}' for t in 'abcd' for p in ('sc', 'St3', 'St4')], 'compass'),
        ('Join the four points: the diamond, which with the little square makes the eight-pointed star.',
         [f'{p}{t}' for t in 'abcd' for p in ('sp', 'sq', 'ss')], 'ruler'),
    ]),
}


def dumps(v):
    return json.dumps(v, ensure_ascii=False)


def format_step(step):
    out = ['    {', f'      "id": {step["id"]},', f'      "text": {dumps(step["text"])},', '      "parts": [']
    for i, part in enumerate(step['parts']):
        out.append('        {')
        out.append(f'          "text": {dumps(part["text"])},')
        out.append('          "create": {')
        items = list(part['create'].items())
        for j, (name, spec) in enumerate(items):
            out.append(f'            {dumps(name)}: {dumps(spec)}' + (',' if j < len(items) - 1 else ''))
        out.append('          },')
        out.append(f'          "animate": {dumps(part["animate"])}')
        out.append('        }' + (',' if i < len(step['parts']) - 1 else ''))
    out.append('      ]')
    out.append('    },')
    return '\n'.join(out)


path = sys.argv[1]
text = open(path, encoding='utf-8').read()
tut = json.loads(text)
steps = {s['id']: s for s in tut['steps']}
blocks = []
for sid, (heading, parts) in PARTS.items():
    create = steps[sid].get('create')
    if create is None:
        sys.exit(f'step {sid} already has parts')
    used = [n for _, names, _ in parts for n in names]
    assert sorted(used) == sorted(create), (sid, set(used) ^ set(create))
    blocks.append(format_step({'id': sid, 'text': heading, 'parts': [
        {'text': t, 'create': {n: create[n] for n in names}, 'animate': a} for t, names, a in parts]}))
start = re.search(r'\n    \{\n      "id": 8,', text).start() + 1
end = re.search(r'\n    \{\n      "id": 13,', text).start() + 1
text = text[:start] + '\n'.join(blocks) + '\n' + text[end:]
json.loads(text)
open(path, 'w', encoding='utf-8').write(text)
print('split steps', ', '.join(map(str, PARTS)))
