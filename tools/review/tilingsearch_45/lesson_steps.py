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


def parallel_groups(steps, groups, geometry):
    """Delay independent single-line families to their last member's step.

    Reject a group if an intervening move needs an earlier member. Equal
    directions and repeat operations are checked before sharing wording.
    """
    import re
    original={s['id']:s for s in steps};remove=set();replacements={}
    def strings(v):
        if isinstance(v,str):yield v
        elif isinstance(v,dict):
            for x in v.values():yield from strings(x)
        elif isinstance(v,list):
            for x in v:yield from strings(x)
    for ids in groups:
        assert not remove.intersection(ids)
        members=[original[i] for i in ids];points=[];directions=[];turns=[];introductions=[];actions=[];tails=[]
        for i,s in zip(ids,members):
            made=s['create'];lines=[n for n,x in made.items() if 'line' in x]
            assert len(lines)==1 and not any('circle' in x or 'polygon' in x for x in made.values())
            line=lines[0];points.append(made[line]['line']['through']);assert isinstance(points[-1],str)
            directions.append(geometry[line][1][1])
            repeats=[x['repeat'] for x in made.values() if 'repeat' in x];assert len(repeats)==1
            turns.append(repeats[0]['by'])
            sentences=re.split(r'(?<=[.!?])\s+(?=[A-Z])',s['text'])
            at=next(j for j,t in enumerate(sentences) if t.startswith('Draw '))
            intro=' '.join(sentences[:at])
            assert not re.search(r'\b(new|last) line\b',intro),intro
            if intro.startswith('Line '):intro='The line '+intro[5:]
            introductions.append(intro);actions.append(sentences[at]);tails.append(' '.join(sentences[at+1:]))
            produced=set(made)
            for j in range(i+1,max(ids)+1):
                if j not in original:continue
                for part in original[j].get('parts',[original[j]]):
                    refs=list(strings(part.get('create',{})))
                    assert not any(r in produced or any(r.startswith(n+'@') for n in produced) for r in refs),(i,j)
        assert len(set(turns))==1
        for a,b in zip(directions,directions[1:]):assert abs(a[0]*b[1]-a[1]*b[0])<1e-8
        match=re.fullmatch(r'Draw a (straight |horizontal |vertical |)line through ([A-Z]\d*)(.*)\.',actions[0])
        assert match and match[2]==points[0]
        names=', '.join(points[:-1])+' and '+points[-1]
        action=f'Draw {match[1]}lines through {names}{match[3]}.'
        assert len(action.split())<=20
        tail=tails[0].replace('Turn it round','Turn each line round')
        prefix=' '.join(t for t in introductions if t)
        text=' '.join(t for t in [prefix,action,tail] if t)
        result=merge(members,text)
        helper_tails=[s.get('textWithoutHelpers',s['text']).split('Turn it round O by ')[-1] for s in members]
        if all('Turn it round O by ' in s.get('textWithoutHelpers',s['text']) for s in members) and len(set(helper_tails))==1:
            if any('textWithoutHelpers' in s for s in members):
                result['textWithoutHelpers']=' '.join(t for t in [prefix,action,'Turn each line round O by '+helper_tails[0]] if t)
        remove.update(ids);replacements[max(ids)]=result
    return number([replacements[s['id']] if s['id'] in replacements else s
                   for s in steps if s['id'] not in remove or s['id'] in replacements])


def tenfold_opening_parts(steps):
    """Keep each dependent compass transfer in the ten-division opening separate.

    Called only by lessons opting into the pacing review; shared openings and
    all other generator callers keep their original output.
    """
    third=steps[2]
    assert set(third['create'])=={'cW','Y1','Y2','m','M'}
    steps[2]=partition(third,'Find the halfway point.',[
        ('Draw a circle with centre F through O. It crosses the first circle at Y1 and Y2.',
         ['cW','Y1','Y2'],None),
        ('Draw a straight line through Y1 and Y2. It crosses the horizontal line at M, halfway from O to F.',
         ['m','M'],None)])
    fifth=steps[4]
    plan=[('Draw a circle with centre A and opening from O to R. It crosses the first circle at B and K.',
           ['cF0','B','K'],None)]
    for centre,point,index in [('B','C',1),('C','D',2),('D','E',3),('K','J',9),('J','H',8),('H','G',7)]:
        plan.append((f'Draw a circle with centre {centre} and the same opening. '
                     f'It crosses the first circle at {point}, away from A.',
                     [f'cF{index}',point],None))
    # The named centre and the direction round the circle distinguish each
    # crossing; do not call the last points new points of the finished ink.
    plan[-1]=(plan[-1][0]+' The first circle is now cut into ten.',plan[-1][1],None)
    steps[4]=partition(fifth,'Divide the circle into ten.',plan)
    return steps


def mirrored_line_parts(step,helper_texts=None):
    """Separate a greedy batch into lines with their own symmetry copies.

    Keep original point/line names and copy aliases. A repeat wrapper may
    be split, but every original repeated element still occurs once.
    """
    import re
    assert 'parts' not in step
    made=step['create']
    repeats=[(n,x['repeat']) for n,x in made.items() if 'repeat' in x]
    assert all(r['by'] in ['mirror:h','rot2'] for _,r in repeats)
    repeat_at=next((i for i,(n,x) in enumerate(made.items())
                    if 'repeat' in x or ('line' in x and n.endswith('b') and n[:-1] in made)),len(made))
    groups=[];pending=[]
    for n,x in list(made.items())[:repeat_at]:
        pending.append(n)
        if 'line' in x:groups.append(pending);pending=[]
    assert not pending
    if len(groups)<=1:return step
    sentences=re.split(r'(?<=[.!?])\s+(?=[A-Z])',step['text'])
    turned=sentences[-1]=='Turn all of them round O by 180°.'
    if turned:sentences.pop()
    assert sentences.pop()=='Reflect the new lines in the horizontal line through O.'
    chunks=[];text=[]
    for sentence in sentences:
        if sentence.startswith('Line '):sentence='The line '+sentence[5:]
        text.append(sentence)
        if sentence.startswith('Draw '):chunks.append(' '.join(text));text=[]
    assert not text and len(chunks)==len(groups)
    parts=[];assigned=set();copied={n:[] for n,_ in repeats}
    for i,(names,text) in enumerate(zip(groups,chunks)):
        create={n:deepcopy(made[n]) for n in names};assigned.update(names)
        for rn,r in repeats:
            if r['by']!='mirror:h':continue
            points=[n for n in r['of'] if n in names]
            if points:
                create[rn+f'Part{i+1}']={'repeat':{**deepcopy(r),'of':points}}
                copied[rn]+=points
        for n,x in list(made.items())[repeat_at:]:
            if 'repeat' in x:continue
            assert 'line' in x and n.endswith('b') and n[:-1] in made
            if n[:-1] in names:create[n]=deepcopy(x);assigned.add(n)
        for rn,r in repeats:
            if r['by']!='rot2':continue
            lines=[n for n in r['of'] if n in create]
            if lines:
                create[rn+f'Part{i+1}']={'repeat':{**deepcopy(r),'of':lines}}
                copied[rn]+=lines
        point=made[names[-1]]['line']['through']
        normal=text+' Reflect the new line in the horizontal line through O.'
        if turned:normal+=' Turn both lines round O by 180°.'
        part={'text':normal,'create':create,'animate':'ruler'}
        if 'textWithoutHelpers' in step:
            part['textWithoutHelpers']=(helper_texts or {}).get(point,normal)
        parts.append(part)
    assert assigned|{n for n,_ in repeats}==set(made)
    assert all(sorted(copied[n])==sorted(r['of']) for n,r in repeats)
    result={k:deepcopy(v) for k,v in step.items() if k not in ['create','textWithoutHelpers']}
    result.update(text='Draw the guide lines and their mirror images.',parts=parts)
    return result


def eightfold_opening_parts(steps):
    """Opt-in pacing of the square-diagonal opening, with no geometry change."""
    second=steps[1]
    assert {'ax','cy','E','d45','d135','S8'}<=second['create'].keys()
    steps[1]=partition(second,'Divide the circle into eight.',[
        ('Draw a vertical line through O. It crosses the circle at C and D. '
         'The horizontal line crosses the circle at B on the left.', ['v','B','C','D'],None),
        ('Draw a vertical line through A. Draw a horizontal line through C. They cross at E.',
         ['ax','cy','E'],None),
        ('Draw a straight line through O and E.', ['d45'],None),
        ('Draw a line through O at 90° to line OE. '
         'The circle crosses the four lines through O at S1 to S8.',
         ['d135',*[f'S{i}' for i in range(1,9)]],None)])
    return steps


def sentence_parts(step,heading,plan,without=None):
    """Partition existing sentences at explicitly reviewed move boundaries.

    plan has (sentence count, element names) per move. Alternative helper
    text is mandatory when the original step had an alternative.
    """
    import re
    sentences=re.split(r'(?<=[.!?])\s+(?=[A-Z])',step['text'])
    assert sum(n for n,_ in plan)==len(sentences),(step['id'],len(sentences),plan)
    assert 'textWithoutHelpers' not in step or without is not None,step['id']
    at=0;parts=[]
    for i,(n,names) in enumerate(plan):
        text=' '.join(sentences[at:at+n]);at+=n
        parts.append((text,names,None if without is None else without[i]))
    return partition(step,heading,parts)


def compass_walk_parts(step,opening):
    """Give each successive equal compass transfer its own part."""
    groups=[]
    for n,x in step['create'].items():
        if 'circle' in x:groups.append([n])
        else:
            assert 'point' in x and groups
            groups[-1].append(n)
    assert len(groups)>1
    plan=[]
    for names in groups:
        assert len(names)==2
        centre=step['create'][names[0]]['circle']['centre'];point=names[1]
        text=f'Draw a circle with centre {centre} and opening {opening}. '
        text+=f'It crosses the horizontal line at {point}, to the right.'
        plan.append((text,names,None))
    return partition(step,'Transfer the compass opening.',plan)


def sixteenfold_opening_parts(steps):
    """Separate the dependent angle halvings of the sixteen-division opening."""
    old=steps[1];made=old['create'];assert {'S5','d45','S3','d135','r2','r2r','S16'}<=made.keys()
    last=[n for n in made if n not in ['v','S5','d45','S3','d135']]
    normal=('Draw the line through O that halves the angle between the horizontal line and the line through S3. '
            'It crosses the circle at S2. Turn this line round O by 45°, three times. '
            'The lines through O cross the circle at S1 to S16, with S1 at A.')
    steps[1]=partition(old,'Divide the circle into sixteen.',[
        ('Draw a vertical line through O. It crosses the circle at S5.', ['v','S5'],None),
        ('Draw the line through O that halves the angle between the horizontal and the vertical line. '
         'It crosses the circle at S3.', ['d45','S3'],None),
        ('Draw a line through O at 90° to the line through S3.', ['d135'],None),
        (normal,last,'Draw a line through O at 112.5° to the horizontal line.'
         if 'textWithoutHelpers' in old else None)])
    return steps
