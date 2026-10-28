#!/usr/bin/env python3
"""Proposes a region and a tradition for every tutorial, for the owner to
check before they are written into the tutorials (the library browsing
plan, docs/LIBRARY-BROWSING-PLAN.md, step 1).

The region comes from the place the tutorial names (its subtitle, title and
first credit), checked against a list of place words in order; the
tradition from its current free-text style, cut down to a fixed list, with
the region deciding where the style is vague. OVERRIDES holds the cases the
rules get wrong, each with its reason. Writes docs/patterns/REGIONS.md.

Usage: python3 tools/review/propose_regions.py [--write]
With --write (after the owner approved the list, 27 October 2026) it also
writes each tutorial's tradition into `style` and its `region` after it.
"""
import glob
import json
import re
import sys
import unicodedata
from collections import Counter

REGIONS = [
    'Alhambra and Nasrid Spain',
    'Spain and Portugal, other',
    'Morocco',
    'Algeria and Tunisia',
    'Egypt, Syria and Iraq',
    'Turkey',
    'Iran',
    'Central Asia',
    'India',
    'Books and other',
]

# Place words, checked in this order; the first that appears wins.
PLACES = [
    ('Alhambra and Nasrid Spain', ['alhambra', 'generalife', 'nasrid', 'granada', 'comares', 'mexuar', 'partal',
                                   'arrayanes', 'dos hermanas', 'leones', 'barca']),
    ('Spain and Portugal, other', ['seville', 'sevilla', 'alcazar', 'toledo', 'cordoba', 'zaragoza', 'aljaferia',
                                   'spain', 'spanish', 'portugal', 'lisbon', 'mudejar']),
    ('Morocco', ['morocco', 'moroccan', 'fes', 'fez', 'meknes', 'marrakesh', 'marrakech', 'rabat', 'sale',
                 'tetouan', 'chellah', 'casablanca', 'telouet', 'bou inania', 'attarine', 'najjarin', 'moulay',
                 'ben youssef', 'badi', 'saadian', 'bahia', 'chefchaouen', 'tangier', 'zellige']),
    ('Algeria and Tunisia', ['algeria', 'algiers', 'tlemcen', 'tunisia', 'tunis', 'kairouan', 'dar el bey',
                             'hippo']),
    ('Egypt, Syria and Iraq', ['egypt', 'cairo', 'qaytbay', 'qalawun', 'barsbay', 'mamluk', 'ibn tulun', 'syria',
                         'damascus', 'aleppo', 'hama', 'azem', 'otrush', 'lebanon', 'tripoli', 'jerusalem',
                         'iraq', 'baghdad', 'samarra', 'mosul']),
    ('Central Asia', ['samarkand', 'bukhara', 'khiva', 'uzbekistan', 'tashkent', 'shah-i-zinda', 'shah i zinda',
                      'khojent', 'khujand', 'tash khauli', 'tillya', 'termez', 'afghanistan', 'balkh', 'mazar',
                      'turkmenistan', 'merv', 'herat', 'mazar-e sharif', 'mazar e sharif']),
    ('Turkey', ['turkey', 'turkish', 'istanbul', 'uskudar', 'topkapi', 'camlica', 'konya', 'sivas', 'bursa',
                'iznik', 'kayseri', 'ottoman', 'seljuk', 'divrigi', 'erzurum', 'ahlat', 'karatay', 'zeynebiye',
                'hani', 'sircali', 'zaynal']),
    ('Iran', ['iran', 'persia', 'isfahan', 'esfahan', 'tabriz', 'shiraz', 'qom', 'mashhad', 'kerman', 'yazd',
              'tehran', 'golestan', 'kashan', 'maragha', 'sultaniyeh', 'damghan', 'nishapur', 'nishabur',
              'amol', 'tayabad', 'hamadan', 'qazvin', 'maku', 'ardabil', 'natanz', 'gunbad']),
    ('India', ['india', 'agra', 'delhi', 'fatehpur', 'sikri', 'sikandra', 'jaipur', 'amber', 'taj mahal',
               'lahore', 'mughal', 'itimad', 'salim chishti', 'birbal', 'mandu', 'ahmedabad', 'jali']),
]

# Free-text styles cut down to a fixed list of traditions. A style not here
# is decided by the region (REGION_TRADITION).
TRADITIONS = {
    'Nasrid': 'Nasrid', 'Mudéjar': 'Mudéjar', 'Spanish': 'Mudéjar',
    'Marinid': 'Marinid', 'Marinid zellige (Fès)': 'Marinid', 'Moroccan': 'Moroccan',
    'Mamluk': 'Mamluk', 'Tulunid': 'Tulunid', 'Seljuk': 'Seljuk', 'Ottoman': 'Ottoman', 'Turkish': 'Ottoman',
    'Persian': 'Persian', 'Timurid': 'Timurid', 'Timurid / Persian': 'Timurid', 'Safavid': 'Safavid',
    'Central Asian': 'Timurid', 'Mughal': 'Mughal', 'Roman': 'Roman', 'Cosmatesque': 'Cosmatesque',
    'Celtic': 'Celtic', 'Norman Sicily': 'Norman Sicily', 'Tunisian': 'Maghrebi', 'Algerian': 'Maghrebi',
    'Syrian': 'Ottoman', 'Iraqi': 'Seljuk',
}
REGION_TRADITION = {
    'Alhambra and Nasrid Spain': 'Nasrid', 'Spain and Portugal, other': 'Mudéjar', 'Morocco': 'Moroccan',
    'Algeria and Tunisia': 'Maghrebi', 'Egypt, Syria and Iraq': 'Mamluk', 'Turkey': 'Seljuk', 'Iran': 'Persian',
    'Central Asia': 'Timurid', 'India': 'Mughal', 'Books and other': 'Islamic',
}

# Where the rules get it wrong: id -> (region, tradition or None, reason).
OVERRIDES = {
    'topkapi-scroll-pinwheel': ('Iran', 'Timurid', 'The Topkapı scroll is kept in Istanbul but was drawn by Timurid or Turkmen architects in Iran.'),
    'twelve-fold-dodecagrams': ('Books and other', None, 'A classic construction from a book, with no building named.'),
    'leon-tile-stars': (None, 'Moroccan', 'A modern tile "for sale": the word sale is not Salé.'),
    'mosul-imam-yahya-star-rows': (None, 'Seljuk', 'Mosul under its atabegs, 13th century: Seljuk-era work.'),
}


def tradition_by_place(region, text, tradition):
    """Where the place settles the tradition whatever the old style said."""
    if region == 'Alhambra and Nasrid Spain':
        return 'Nasrid'
    if region == 'Spain and Portugal, other' and tradition == 'Moroccan':
        return 'Mudéjar'
    if region == 'Morocco' and any(w in text for w in ['bou inania', 'attarine', 'chellah', 'sale', 'merinid', 'marinid']):
        return 'Marinid'
    return tradition


def plain(t):
    return ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn').lower()


def propose(t):
    credit = (t.get('credits') or [{}])[0]
    text = plain(' '.join(str(x) for x in [t.get('subtitle', ''), t.get('title', ''), credit.get('source', ''),
                                           t['id'].replace('-', ' ')]))
    region = next((r for r, words in PLACES if any(w in text for w in words)), 'Books and other')
    style = t.get('style', '')
    tradition = tradition_by_place(region, text, TRADITIONS.get(style) or REGION_TRADITION[region])
    why = ''
    if t['id'] in OVERRIDES:
        reg, trad, why = OVERRIDES[t['id']]
        region = reg or region
        tradition = trad or tradition
    return region, tradition, why


def main():
    rows = []
    for f in sorted(glob.glob('tutorials/*.json')):
        t = json.load(open(f))
        region, tradition, why = propose(t)
        if '--write' in sys.argv:
            text = open(f).read()
            new, n = re.subn(r'\n(\s*)"style": "[^"]*",(\n\s*"region": "[^"]*",)?',
                             lambda m: f'\n{m.group(1)}"style": "{tradition}",\n{m.group(1)}"region": "{region}",',
                             text, count=1)
            assert n == 1, f
            open(f, 'w').write(new)
        rows.append((region, t['title'], t['id'], t.get('subtitle', ''), t.get('style', ''), tradition, why))
    rows.sort(key=lambda r: (REGIONS.index(r[0]), r[1]))
    regions = Counter(r[0] for r in rows)
    traditions = Counter(r[5] for r in rows)
    out = ['# Proposed region and tradition of every tutorial', '',
           'Step 1 of [the library browsing plan](../LIBRARY-BROWSING-PLAN.md), proposed on 27 October 2026 by '
           '`tools/review/propose_regions.py` and checked by hand. The owner approved the list and both proposals on '
           '27 October 2026, and `propose_regions.py --write` wrote it into the tutorials. Each tutorial gets one region, from the place it names, and one tradition, '
           'from its old free-text style cut down to a fixed list; where the style was vague ("Islamic", '
           '"Islamic tilework"), the region decides. Rows the rules got wrong were corrected by hand and say why.',
           '', '## Two questions', '',
           '1. **Patterns with no building.** The classic constructions (six-fold snowflake, eight-fold star and '
           'cross, Samira Mian\'s rosettes and others) sit under Books and other, and keep the tradition their '
           'author gave them (Mamluk, Moroccan…). The alternative is to call them all Islamic. Keeping them is the '
           'proposal, because each was chosen for a tradition it belongs to.',
           '2. **Moroccan or Marinid.** Marinid is used for the Marinid buildings (Bou Inania, Attarine, Chellah, '
           'Salé), and Moroccan for the rest of Morocco, including Saadian and Alaouite work. The alternative is '
           'Moroccan for all of Morocco, which is simpler but loses the dynasty.',
           '', '## Counts', '',
           '| Region | Tutorials |', '|---|---|']
    out += [f'| {r} | {regions[r]} |' for r in REGIONS]
    out += ['', '| Tradition | Tutorials |', '|---|---|']
    out += [f'| {k} | {v} |' for k, v in traditions.most_common()]
    for region in REGIONS:
        part = [r for r in rows if r[0] == region]
        if not part:
            continue
        out += ['', f'## {region} ({len(part)})', '',
                '| Tutorial | Place given | Old style | Tradition | Note |', '|---|---|---|---|---|']
        out += [f'| [{title}](#/{tid}) | {sub} | {style} | {trad} | {why} |'
                for _, title, tid, sub, style, trad, why in part]
    open('docs/patterns/REGIONS.md', 'w').write('\n'.join(out) + '\n')
    print(regions)
    print(traditions)


main()
