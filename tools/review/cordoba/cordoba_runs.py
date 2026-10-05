import json, math, sys
MIN = float(sys.argv[1]) if len(sys.argv) > 1 else 0.06
ink = json.load(open('cordoba-ink-raw.json'))
by = {}
for p, q, n in ink: by.setdefault(n, []).append((tuple(p), tuple(q)))
keep = []; dropped = 0
for n, segs in by.items():
    segs = sorted(segs, key=lambda s: (s[0][0], s[0][1]))
    runs = [[s] for s in segs]
    changed = True
    while changed:
        changed = False
        for i in range(len(runs)):
            for j in range(len(runs)):
                if i != j and runs[i] and runs[j] and math.dist(runs[i][-1][1], runs[j][0][0]) < 1e-7:
                    runs[i] += runs[j]; runs[j] = []; changed = True
        runs = [r for r in runs if r]
    for r in runs:
        if sum(math.dist(p, q) for p, q in r) < MIN: dropped += len(r); continue
        keep.append((r[0][0], r[-1][1], n))
print('kept', len(keep), 'dropped', dropped)
json.dump(keep, open('cordoba-ink.json', 'w'))
