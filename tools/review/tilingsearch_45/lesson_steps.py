"""Opt-in lesson editing helpers. Nothing changes until a generator calls one.

Every partition must retain each construction element exactly once. This
module only arranges teaching moves; it does not change their geometry.
"""
from copy import deepcopy


def partition(step, heading, plan):
    """One (text, element names, helper text) tuple per learner move."""
    made=step['create']
    parts=[]
    for text,names,without in plan:
        part={'text':text,'create':{n:deepcopy(made[n]) for n in names},
              'animate':step.get('animate','ruler')}
        if without is not None:part['textWithoutHelpers']=without
        parts.append(part)
    names=[n for p in parts for n in p['create']]
    assert len(names)==len(set(names)) and set(names)==set(made)
    result={k:deepcopy(v) for k,v in step.items() if k not in ['create','textWithoutHelpers']}
    result.update(text=heading,parts=parts)
    return result


def merge(steps,text,without=None):
    result=deepcopy(steps[0])
    result['create']={n:deepcopy(v) for s in steps for n,v in s['create'].items()}
    assert len(result['create'])==sum(len(s['create']) for s in steps)
    result['text']=text
    result.pop('textWithoutHelpers',None)
    if without is not None:result['textWithoutHelpers']=without
    elif any('textWithoutHelpers' in s for s in steps):
        result['textWithoutHelpers']=' '.join(s.get('textWithoutHelpers',s['text']) for s in steps)
    return result


def circle_parts(step,heading):
    """Split a serial compass transfer at its existing circle instructions."""
    import re
    texts=re.split(r'(?=Draw a circle\b)',step['text'])
    prefix=texts.pop(0) if texts and not texts[0].startswith('Draw a circle') else ''
    texts=[t.strip() for t in texts if t.strip()]
    texts[0]=prefix+texts[0]
    groups=[];pending=[]
    for name,spec in step['create'].items():
        assert next(iter(spec)) in ['circle','point','points']
        if 'circle' in spec:
            groups.append(pending+[name]);pending=[]
        elif groups:groups[-1].append(name)
        else:pending.append(name)
    assert len(groups)==len(texts) and not pending
    return partition(step,heading,[(t,ns,t) for t,ns in zip(texts,groups)])


def number(steps):
    for i,s in enumerate(steps,1):s['id']=i
    return steps


def group_words(steps):
    """Group consecutive independent line instructions, without moving geometry.

    Equal direction descriptions are required. A dependency between their
    points, or a sentence longer than twenty words, prevents the grouping.
    Generators opt in locally; their other callers are unaffected.
    """
    import re
    action=re.compile(r'Draw a (straight |horizontal |vertical |)line through ([A-Z]\d*)(.*)\.')
    for step in steps:
        for part in step.get('parts',[step]):
            made=part.get('create',{})
            def refs(v):
                if isinstance(v,str) and v in made:yield v
                elif isinstance(v,dict):
                    for x in v.values():yield from refs(x)
                elif isinstance(v,list):
                    for x in v:yield from refs(x)
            def independent(points):
                owners={n:spec['line'].get('through') for n,spec in made.items() if 'line' in spec}
                for p in points:
                    pending=[p];seen=set()
                    while pending:
                        n=pending.pop()
                        if n in seen or n not in made:continue
                        seen.add(n)
                        if n in owners and owners[n] in points and owners[n]!=p:return False
                        pending.extend(refs(made[n]))
                return True
            for key in ['text','textWithoutHelpers']:
                if key not in part:continue
                sentences=re.split(r'(?<=[.!?])\s+(?=[A-Z])',part[key]);out=[];i=0
                while i<len(sentences):
                    first=action.fullmatch(sentences[i]);j=i+1;points=[first[2]] if first else []
                    if first and (not first[3] or first[3].startswith((' parallel to ',' at '))):
                        while j<len(sentences) and j<i+3:
                            other=action.fullmatch(sentences[j])
                            if not other or (other[1],other[3])!=(first[1],first[3]) or other[2] in points:break
                            points.append(other[2]);j+=1
                    if len(points)>1:
                        names=', '.join(points[:-1])+' and '+points[-1]
                        grouped=f'Draw {first[1]}lines through {names}{first[3]}.'
                        if independent(points) and len(grouped.split())<=20:
                            out.append(grouped);i=j;continue
                    out.append(sentences[i]);i+=1
                part[key]=' '.join(out)
    return steps
