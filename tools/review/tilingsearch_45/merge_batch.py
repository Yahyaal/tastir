#!/usr/bin/env python3
"""After a Tiling Search batch is merged: renders each new tutorial for the
review page, copies its overlays there, and adds its review card, its id
to the open Tiling Search question and its row to the pattern status.

Usage: merge_batch.py <batch> <code>:<tutorial id> ...
Run from the repo root; the cards are written from each tutorial's own
title, pattern text and construction note, so they say what the tutorial
says.
"""
import json
import os
import shutil
import subprocess
import sys

DATA = 'apps/player/src/review/data.ts'
STATUS = 'docs/patterns/STATUS.md'
RESEARCH = 'docs/research/tilingsearch-45'


def q(t):
    return "'" + t.replace('\\', '\\\\').replace("'", "\\'") + "'"


def card(tid, code, t):
    pics = []
    if os.path.exists(f'docs/review/{tid}/photo-overlay.png'):
        pics.append((f'renders/{tid}/photo-overlay.png',
                     'David Wade’s photo with the tutorial’s lines in red (private, not shipped).'))
    pics.append((f'renders/{tid}/drawing-overlay.png',
                 'Wichmann’s drawing with the tutorial’s lines in red.'))
    pics.append((f'renders/{tid}/wall.png', 'Our wall.'))
    c = t['construction']
    story = [c['note'], c.get('changes', '')]
    steps = len(t['steps'])
    story.append(f'{steps} steps, {t.get("level", "")}.')
    pic = '\n'.join(f"      {{\n        src: {q(s)},\n        caption: {q(cap)},\n      }},"
                    for s, cap in pics)
    st = '\n'.join(f'      {q(x)},' for x in story if x)
    src = t['credits'][0]
    return f"""
  {{
    id: '{tid}',
    title: {q(t['title'] + ' (new, Tiling Search)')},
    fold: {t['fold']},
    status: 'decide',
    summary:
      {q(t['pattern'].get('text', t['title']))},
    story: [
{st}
    ],
    pictures: [
{pic}
    ],
    asks: [],
    sources: [
      {{
        label: {q(f"Brian Wichmann, Tiling Search: {t.get('subtitle', '')} ({code})")},
        url: {q(src['url'])},
      }},
    ],
  }},"""


def main():
    batch, pairs = sys.argv[1], [a.split(':') for a in sys.argv[2:]]
    s = open(DATA).read()
    anchor = s.rindex("(new, Tiling Search)")
    j = s.index("\n  {\n    id:", anchor)
    cards = ''
    rows = []
    for code, tid in pairs:
        t = json.load(open(f'tutorials/{tid}.json'))
        subprocess.run(['pnpm', '-s', 'review', tid], check=True,
                       stdout=subprocess.DEVNULL)
        for src, dst in [('overlay.png', 'drawing-overlay.png'),
                         ('photo-overlay.png', 'photo-overlay.png')]:
            p = f'{RESEARCH}/{code}/{src}'
            if os.path.exists(p):
                shutil.copy(p, f'docs/review/{tid}/{dst}')
        cards += card(tid, code, t)
        seen = 'photo by eye' if os.path.exists(f'{RESEARCH}/{code}/photo-overlay.png') else 'drawing only'
        rows.append(f"| {tid} | {t['fold']} | {len(t['steps'])} | {seen} (batch {batch}) | "
                    f"{t['title']}, from Wichmann's {code}. {t['construction']['note']} |")
    s = s[:j] + cards + s[j:]
    # The open question about the new patterns lists every one of them.
    qa = s.index("id: 'tilingsearch-45-first'")
    end = s.index('    ],\n  },', s.index('also: [', qa))
    s = s[:end] + ''.join(f"      '{tid}',\n" for _, tid in pairs) + s[end:]
    open(DATA, 'w').write(s)
    st = open(STATUS).read()
    last = [l for l in st.split('\n') if '(new' not in l and 'Tiling Search' not in l
            and l.startswith('| ') and ('drawing only' in l or 'photo by eye' in l)][-1]
    st = st.replace(last, last + '\n' + '\n'.join(rows), 1)
    open(STATUS, 'w').write(st)
    subprocess.run(['npx', 'prettier', '--write', DATA], check=True,
                   stdout=subprocess.DEVNULL)


main()
