"""Additive MeatyMusic workbench commands. MeatyMusic owns creative state; Pipes computes.

All transports call these through Store.command, preserving optimistic concurrency,
rollback and idempotency. No provider/DAW/estate calls occur. User interpretations,
plans, machine candidates and score verification remain distinct kinds of evidence.
"""
from __future__ import annotations
import copy, functools, hashlib, json, math, re, sys, shutil, os, tempfile
from pathlib import Path
from .domain import need, text, uid, now, digest, js_count, find_record, DomainError, INSTRUMENTS
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'pipes'/'src'))
from pipes_mcp.story import compile_symbolic, midi_bytes, diagnostic_wav

READS={'workbench.get','workbench.search','workbench.context','workbench.reference','story.compile','story.score'}
WRITES={'workbench.seed','project.create','work.create','capture.create','motif.create','occurrence.create','relationship.create','story.create','story.update','story.unlock','story.prepare','story.render','workbench.review'}
COLLECTIONS=('projects','works','motifs','occurrences','relationships','stories','story_history','captures','experiments','packets','render_jobs','reviews')

def ensure(state):
    if 'workbench' not in state:state['workbench']={'version':'0.4.0','seeded':False,**{k:[] for k in COLLECTIONS}}
    for k in COLLECTIONS:state['workbench'].setdefault(k,[])
    return state['workbench']

@functools.lru_cache(maxsize=1)
def bundled():return json.loads((Path(__file__).parent/'rowan_seed.json').read_text())

def enum(value, values, label):
    need(value in values,f'Unsupported {label}.');return value

def number(value,low,high,label):
    need(isinstance(value,(float,int)) and not isinstance(value,bool) and math.isfinite(value) and low<=value<=high,f'{label} must be finite and within {low}–{high}.');return value

def tags(value):
    need(isinstance(value,list) and len(value)<=24,'Use at most 24 tags.')
    return [text(x,'Tag',80) for x in value]

def project_scope(w,ident,ancestors=False):
    if ident is None:return {p['id'] for p in w['projects']}
    find_record(w['projects'],ident,'Project');ids={ident}
    for _ in range(len(w['projects'])+1):
        additions={p['parent_id'] for p in w['projects'] if p['id'] in ids and p['parent_id']} if ancestors else {p['id'] for p in w['projects'] if p['parent_id'] in ids}
        if additions<=ids:return ids
        ids|=additions
    raise DomainError('cycle','Project tree contains a cycle.')

def entity_map(w,state):
    rows={r['id']:r for k in COLLECTIONS if k not in ('story_history','packets','render_jobs') for r in w[k]}
    rows.update({r['id']:r for r in state['recipes']+state['takes']})
    return rows

def validate_story(s,w,state):
    text(s.get('title'),'Story title',160);find_record(w['projects'],s.get('project_id'),'Project')
    if s.get('work_id'):find_record(w['works'],s['work_id'],'Work')
    if s.get('based_on_take_id'):find_record(state['takes'],s['based_on_take_id'],'Take')
    need(s.get('clock')=='relative','Story intent uses a relative clock; it cannot become an observed recording timeline.')
    number(s.get('target_duration_seconds',180),4,1200,'Target duration')
    text(s.get('style_base',''),'Style base',2000,empty=True);text(s.get('excludes',''),'Excludes',3000,empty=True)
    events=s.get('events');need(isinstance(events,list) and len(events)<=32,'Maximum 32 painted gestures in this review slice.')
    allowed={'id','title','start','end','motif_id','instrument','role','gesture','level','note','locked','source_occurrence_id','transpose'}
    ids=set()
    for e in events:
        need(isinstance(e,dict) and set(e)<=allowed,'Unknown gesture field.')
        ident=text(e.get('id'),'Gesture ID',100);need(ident not in ids,'Gesture IDs must be unique.');ids.add(ident)
        text(e.get('title'),'Gesture title',150);a=number(e.get('start'),0,1,'Start');b=number(e.get('end'),0,1,'End');need(a<b,'Gesture end must follow start.')
        find_record(w['motifs'],e.get('motif_id'),'Motif')
        need(e.get('instrument') in {i['id'] for i in INSTRUMENTS},'Choose a catalog instrument.')
        enum(e.get('role'),('lead','answer','counterline','foundation','pattern','color','expansion','silence'),'role')
        enum(e.get('gesture'),('introduce','reach','recall','withdraw','hold','support','rise','release','settle','answer','absence'),'gesture')
        number(e.get('level'),0,1,'Drawn prominence');text(e.get('note',''),'Gesture note',1200,empty=True)
        need(isinstance(e.get('locked'),bool),'Locked must be boolean.')
        tr=e.get('transpose',0);need(isinstance(tr,int) and not isinstance(tr,bool) and -24<=tr<=24,'Transpose must be integer semitones between -24 and 24.')
        if e.get('source_occurrence_id'):find_record(w['occurrences'],e['source_occurrence_id'],'Source occurrence')
    need(isinstance(s.get('relationships'),list) and len(s['relationships'])<=64,'Invalid relationship list.')
    for r in s['relationships']:
        need(set(r)=={'source_id','target_id','kind'},'Invalid relationship fields.')
        need(r['source_id'] in ids and r['target_id'] in ids and r['source_id']!=r['target_id'],'A relationship must reference two existing gestures.')
        enum(r['kind'],('recalls','answers','grows_from','supports','withholds','contrasts_with','coincides'),'relationship kind')
    return s

def context_packet(w,state,ids,project_id=None,limit=24):
    """Follow semantic dependencies, not nearest audio peak. Bounded, cycle-safe, local."""
    limit=int(number(limit,1,60,'Context limit'));lookup=entity_map(w,state)
    need(isinstance(ids,list) and len(ids)<=24,'At most 24 initial context IDs.')
    need(all(isinstance(i,str) and i in lookup for i in ids),'Unknown context reference.')
    queue=[(i,'explicit selection') for i in ids];seen=set();items=[];omitted=[]
    while queue:
        i,reason=queue.pop(0)
        if i in seen:continue
        seen.add(i);row=lookup[i]
        if len(items)>=limit:omitted.append({'id':i,'reason':'context item limit'});continue
        items.append({'id':i,'included_because':reason,'record':copy.deepcopy(row)})
        for k in ['parent_occurrence_id','take_id','motif_id','project_id','parent_id','recipe_id']:
            t=row.get(k)
            if isinstance(t,str) and t in lookup:queue.append((t,k+' of '+i))
        for r in w['relationships']:
            if r['source_id']==i and r['kind'] in ('recalls','requires_context','anchored_in','transforms','answers','supports'):
                queue.append((r['target_id'],r['kind']+' from '+i))
    pids=project_scope(w,project_id,ancestors=True) if project_id else set()
    meanings=[copy.deepcopy(x) for x in w['captures'] if x.get('project_id') in pids][:12]
    return {'schema':'meatymusic.context-packet.v1','status':'prepared_local_only','items':items,'meaning_notes':meanings,'omitted':omitted,
            'external_calls':0,'binary_uploads':0,'rules':['Original recording is unchanged.','Human interpretations are not analyzer findings.','Raw Basic Pitch is unverified.','Earlier authored sketches are not transcriptions.','Permission for playback does not establish permission for model upload.'],
            'receipt_note':'This packet supplies references and reasons. It does not prove any reference was sent to a provider.'}

def compile_story(s,w,state):
    validate_story(s,w,state);lookup={m['id']:m for m in w['motifs']};events=sorted(s['events'],key=lambda e:e['start'])
    parts=[]
    for e in events:
        n=next(x['name'] for x in INSTRUMENTS if x['id']==e['instrument'])
        clause=f"{n} {e['role']}"
        if clause not in parts:parts.append(clause)
    sections=['[Instrumental only. Bracketed text is arrangement guidance, not sung words.]',
              '[Timing: all percentages describe desired story order, not measured locations in the reference. Exact notes require a separate approved symbolic score.]']
    for e in events:
        n=next(x['name'] for x in INSTRUMENTS if x['id']==e['instrument'])
        sections.append(f"[{round(e['start']*100)}–{round(e['end']*100)}% · {e['title']}: {n} as {e['role']}; {e['gesture']}. Motif: {lookup[e['motif_id']]['title']}. {e['note']}]")
    titles={e['id']:e['title'] for e in events}
    for r in s['relationships']:sections.append(f"[Relationship: {titles[r['source_id']]} {r['kind'].replace('_',' ')} {titles[r['target_id']]}.]")
    if s.get('based_on_take_id'):sections.append('[Continuity requires the actual approved audio reference; a named motif or written description does not attach it.]')
    style=s['style_base'].strip()
    if parts:style+=' Ensemble roles: '+', '.join(parts)+'.'
    lyrics='\n'.join(sections)
    need(js_count(style)<=1000,'Style exceeds 1,000 UTF-16 units. Shorten the style base or roles; nothing was silently truncated.','prompt_over_budget')
    need(js_count(lyrics)<=5000,'Arrangement exceeds 5,000 UTF-16 units. Shorten gesture notes; nothing was silently truncated.','prompt_over_budget')
    warning=['Prominence curves express author intent; they are not loudness automation.','Lyrics guidance is experimental; reference fidelity requires listening.']
    if any(lookup[e['motif_id']].get('symbolic') is None for e in events):warning.append('Some motifs have no verified notation. Exact symbolic rendering is blocked until they are resolved or replaced with authored sketches.')
    references=[e['source_occurrence_id'] for e in events if e.get('source_occurrence_id')]
    context=context_packet(w,state,list(dict.fromkeys(references)),s['project_id'])
    prompt={'schema':'meatymusic.prompt.v1','provider':'suno','story_id':s['id'],'story_revision':s['revision'],
            'style':style,'lyrics':lyrics,'excludes':s['excludes'],'style_count':js_count(style),'lyrics_count':js_count(lyrics),
            'count_unit':'utf16_code_units','limit':1000,'omitted':[],'warnings':warning,'compiler_version':'story-compiler-0.4.0',
            'capability_snapshot':'manual-field contract; account/model not probed','has_override':False}
    prompt['hash']=digest(prompt)
    return {'prompt':prompt,'context':context,'story_snapshot':copy.deepcopy(s),'external_calls':0,'status':'preview_not_submitted'}

def read(store,op,d):
    w=ensure(store.state)
    if op=='workbench.get':return copy.deepcopy(w)
    if op=='workbench.reference':
        need(w['seeded'],'Open the bundled Rowan study first.')
        x=bundled();a=number(d.get('start',0),0,194.8,'Start');b=number(d.get('end',194.8),0,194.8,'End');need(a<b,'End must follow start.')
        return {'waveform':x['waveform'],'media_manifest':x['media_manifest'],'midi':{**{k:v for k,v in x['midi'].items() if k!='notes'},'notes':[n for n in x['midi']['notes'] if n['end']>a and n['start']<b]},'origin_seconds':0,'span':[a,b]}
    if op=='workbench.context':return context_packet(w,store.state,d.get('ids',[]),d.get('project_id'),d.get('limit',24))
    if op=='workbench.search':
        q=text(d.get('query',''),'Search',600,empty=True).lower();scope=project_scope(w,d.get('project_id'))
        inherited=project_scope(w,d['project_id'],True) if d.get('project_id') else scope
        words=set(re.findall(r'[\w]+',q));expansions={'heart':{'yearning','longing'},'dip':{'withdraw','retreat'},'hope':{'continuance','return'},'home':{'hearth','belonging'},'swell':{'rise','ascent'}}
        for token in list(words):words|=expansions.get(token,set())
        rows=[]
        for collection in ('works','motifs','captures','stories','occurrences','experiments'):
            for x in w[collection]:
                pid=x.get('project_id')
                if collection=='occurrences':pid=next((work['project_id'] for work in w['works'] if work['id']==x.get('work_id')),None)
                if pid not in (scope|inherited if collection=='motifs' else scope) and not (collection=='captures' and pid is None and d.get('project_id') is None):continue
                hay=' '.join(str(x.get(k,'')) for k in ['title','text','meaning','note','tags','question']).lower()
                hit=sorted(t for t in words if t in hay)
                if words and not hit:continue
                rows.append({'kind':collection,'id':x['id'],'title':x.get('title',x.get('text','Untitled')[:90]),'why':'Matches '+', '.join(hit) if hit else 'Available in this musical neighborhood','record':copy.deepcopy(x),'score':len(hit)})
        rows.sort(key=lambda x:(-x['score'],x['title']));limit=int(number(d.get('limit',30),1,100,'Search limit'))
        return {'results':rows[:limit],'total':len(rows),'omitted':max(0,len(rows)-limit),'method':'local lexical and curated synonym matching; no embedding or inference','query':q}
    if op in ('story.compile','story.score'):
        s=find_record(w['stories'],d.get('story_id'),'Story')
        if op=='story.compile':return compile_story(s,w,store.state)
        try:return compile_symbolic(s,w['motifs'],d.get('bpm',80),d.get('total_beats',48))
        except ValueError as e:raise DomainError('score_validation',str(e))
    raise DomainError('unknown_operation','Unknown workbench read.',404)

def mutate(store,op,d):
    w=ensure(store.state)
    if op=='workbench.seed':
        need(not w['seeded'],'Rowan is already imported; existing work was not overwritten.','already_seeded',409)
        source=copy.deepcopy(bundled())
        source_file=Path(__file__).resolve().parents[1]/'study_inputs/rowan-original.wav'
        expected=source['takes'][0]['sha256']
        need(hashlib.sha256(source_file.read_bytes()).hexdigest()==expected,'Bundled reference checksum mismatch.','source_mismatch')
        asset_dir=store.path.parent/'assets';asset_dir.mkdir(exist_ok=True)
        need(asset_dir.resolve().is_relative_to(store.path.parent.resolve()),'Asset directory escapes workspace.')
        dest=asset_dir/(expected+'.wav')
        if dest.exists():need(hashlib.sha256(dest.read_bytes()).hexdigest()==expected,'Stored audio checksum mismatch.','source_mismatch')
        else:
            shutil.copyfile(source_file,dest);os.chmod(dest,0o600)
        # Import into existing review workspace without discarding its captures/projects.
        for k in COLLECTIONS:
            for x in source['workbench'].get(k,[]):
                need(not any(a['id']==x['id'] for a in w[k]),'Seed identity conflict; no records overwritten.','identity_conflict',409)
                w[k].append(x)
        for k in ('recipes','takes'):
            for x in source[k]:
                need(not any(a['id']==x['id'] for a in store.state[k]),'Seed identity conflict.','identity_conflict',409);store.state[k].append(x)
        w['seeded']=True
        return {'id':'project_rowan_reach','status':'imported_reference_and_drafts','original_sha256':source['takes'][0]['sha256'],'external_calls':0}
    if op=='project.create':
        parent=d.get('parent_id')
        if parent:find_record(w['projects'],parent,'Parent project')
        r={'id':uid('project'),'parent_id':parent,'kind':enum(d.get('kind','project'),('world','culture','collection','project'),'project kind'),
           'title':text(d.get('title'),'Project title',160),'summary':text(d.get('summary',''),'Summary',2000,empty=True),'tags':tags(d.get('tags',[]))}
        w['projects'].append(r);return r
    if op=='work.create':
        find_record(w['projects'],d.get('project_id'),'Project')
        title=text(d.get('title'),'Work title',160);rid=d.get('recipe_id')
        if rid:find_record(store.state['recipes'],rid,'Recipe')
        else:rid=store.mutate('recipe.create',{'title':title})['id']
        r={'id':uid('work'),'project_id':d['project_id'],'recipe_id':rid,'title':title,'kind':'cue','status':'draft','take_ids':[]};w['works'].append(r);return r
    if op=='capture.create':
        pid=d.get('project_id');wid=d.get('work_id')
        if pid:find_record(w['projects'],pid,'Project')
        if wid:find_record(w['works'],wid,'Work')
        r={'id':uid('capture'),'project_id':pid,'work_id':wid,'text':text(d.get('text'),'Thought',5000),
           'kind':enum(d.get('kind','idea'),('idea','listening_interpretation','creative_direction','question','keeper','avoid'),'capture kind'),
           'tags':tags(d.get('tags',[])),'status':'unfiled' if not pid else 'candidate','source':'human_authored','created_at':now()}
        w['captures'].append(r);return r
    if op=='motif.create':
        find_record(w['projects'],d.get('project_id'),'Project');symbolic=d.get('symbolic')
        if symbolic is not None:
            need(set(symbolic)<={'status','pitches','durations'},'Invalid symbolic fields.');need(symbolic.get('status')=='authored_sketch','This entry path creates authored sketches, not verified transcriptions.')
            p=symbolic.get('pitches',[]);ds=symbolic.get('durations',[])
            need(isinstance(p,list) and 1<=len(p)<=128 and len(ds)==len(p),'Supply matching pitch and duration arrays.')
            for n in p:need(isinstance(n,int) and not isinstance(n,bool) and 0<=n<=127,'Invalid MIDI pitch.')
            for n in ds:number(n,.01,64,'Note duration')
        r={'id':uid('motif'),'project_id':d['project_id'],'title':text(d.get('title'),'Motif title',160),'meaning':text(d.get('meaning',''),'Meaning',3000,empty=True),
           'kind':enum(d.get('kind','melodic'),('melodic','rhythmic_melodic','expressive_arc','harmonic','textural'),'motif kind'),
           'status':'authored_sketch' if symbolic else 'concept_only','symbolic':copy.deepcopy(symbolic),'tags':tags(d.get('tags',[]))}
        w['motifs'].append(r);return r
    if op=='occurrence.create':
        t=find_record(store.state['takes'],d.get('take_id'),'Take');find_record(w['motifs'],d.get('motif_id'),'Motif');work=find_record(w['works'],d.get('work_id'),'Work')
        need(t.get('duration') is not None,'A playable known-duration take is required.')
        need(t['recipe_id'] in work.get('recipe_ids',[work['recipe_id']]),'Take belongs to a different work recipe.')
        a=number(d.get('start'),0,t['duration'],'Start');b=number(d.get('end'),0,t['duration'],'End');need(a<b,'End must follow start.')
        parent=d.get('parent_occurrence_id')
        if parent:
            p=find_record(w['occurrences'],parent);need(p['take_id']==t['id'] and p['start']<=a<b<=p['end'],'Parent phrase must contain the occurrence in the same take.')
        r={'id':uid('occurrence'),'take_id':t['id'],'work_id':work['id'],'motif_id':d['motif_id'],'start':a,'end':b,
           'title':text(d.get('title'),'Occurrence title',160),'note':text(d.get('note',''),'Listening note',3000,empty=True),'evidence':'human_report','timing_precision':'user_marked','source':'local operator','verification':'not_score_verified','parent_occurrence_id':parent,'instrument':text(d.get('instrument','unspecified'),'Heard instrument',120)}
        w['occurrences'].append(r);return r
    if op=='relationship.create':
        ids=entity_map(w,store.state);a=d.get('source_id');b=d.get('target_id');need(a in ids and b in ids and a!=b,'Choose two existing, distinct entities.')
        r={'id':uid('relation'),'source_id':a,'target_id':b,'kind':enum(d.get('kind'),('recalls','requires_context','anchored_in','transforms','answers','supports','contrasts_with'),'relationship kind'),'evidence':'human_report','note':text(d.get('note',''),'Relation note',1600,empty=True)}
        w['relationships'].append(r);return r
    if op=='story.create':
        parent=find_record(w['stories'],d['source_story_id'],'Source story') if d.get('source_story_id') else None
        r=copy.deepcopy(parent) if parent else {'clock':'relative','events':[],'relationships':[],'based_on_take_id':None,'work_id':None,'target_duration_seconds':180,'style_base':'Instrumental cinematic chamber music; clear independent voices, lyrical phrasing and acoustic detail.','excludes':'vocals, singing, spoken word, choir'}
        r.update(id=uid('story'),revision=1,title=text(d.get('title','A new musical story'),'Title',160),project_id=d.get('project_id',parent['project_id'] if parent else None),status='intent_draft',created_at=now(),parent_story={'id':parent['id'],'revision':parent['revision']} if parent else None)
        validate_story(r,w,store.state);w['stories'].append(r);return r
    if op in ('story.update','story.unlock'):
        s=find_record(w['stories'],d.get('story_id'),'Story');need(d.get('expected_revision')==s['revision'],'Story changed. Refresh before editing.','stale_story',409);candidate=copy.deepcopy(s)
        if op=='story.unlock':find_record(candidate['events'],d.get('event_id'),'Gesture')['locked']=False
        else:
            patch=d.get('patch');need(isinstance(patch,dict) and set(patch)<={'title','events','relationships','target_duration_seconds','style_base','excludes'},'Invalid story patch.')
            candidate.update(copy.deepcopy(patch));new={e['id']:e for e in candidate['events']}
            for old in s['events']:
                if old['locked']:need(new.get(old['id'])==old,'Unlock a pinned gesture explicitly before editing or deleting it.','locked_field')
        validate_story(candidate,w,store.state);w['story_history'].append(copy.deepcopy(s));candidate['revision']+=1;candidate['updated_at']=now();s.clear();s.update(candidate);return s
    if op=='story.prepare':
        s=find_record(w['stories'],d.get('story_id'),'Story');out=compile_story(s,w,store.state)
        need(d.get('expected_revision')==s['revision'],'Story changed; review the latest compile.','stale_story',409)
        recipe_id=next((x['recipe_id'] for x in w['works'] if x['id']==s.get('work_id')),store.state['recipes'][0]['id'])
        parent=find_record(store.state['recipes'],recipe_id);r=copy.deepcopy(parent);r.update(id=uid('recipe'),revision=1,title=s['title'],lyrics=out['prompt']['lyrics'],excludes=s['excludes'],parent={'id':parent['id'],'revision':parent['revision']},source_story={'id':s['id'],'revision':s['revision']},created_at=now(),changes=['Materialized from reviewed story intent; original recording unchanged.']);store.state['recipes'].append(r)
        h=store.mutate('handoff.create',{'recipe_id':r['id'],'style_override':out['prompt']['style'],'settings':{'model':'select_in_provider','source':'manual_account_check_required'}})
        h.update(story_snapshot=copy.deepcopy(s),context_snapshot=out['context']);h['prompt']=out['prompt']
        work=next((x for x in w['works'] if x['id']==s.get('work_id')),None)
        if work:
            work.setdefault('recipe_ids',[work['recipe_id']]).append(r['id'])
        else:
            work={'id':uid('work'),'project_id':s['project_id'],'recipe_id':r['id'],'recipe_ids':[r['id']],'title':s['title'],'kind':'cue','status':'draft','take_ids':[]}
            w['works'].append(work)
        packet={'work_id':work['id'],'id':uid('packet'),'story_id':s['id'],'story_revision':s['revision'],'handoff_id':h['id'],'recipe_id':r['id'],'status':'prepared_not_submitted','created_at':now(),'context':out['context']};w['packets'].append(packet);return packet
    if op=='story.render':
        s=find_record(w['stories'],d.get('story_id'),'Story')
        need(d.get('expected_revision')==s['revision'],'Story changed; review the latest score.','stale_story',409)
        try:plan=compile_symbolic(s,w['motifs'],d.get('bpm',80),d.get('total_beats',48))
        except ValueError as ex:raise DomainError('score_validation',str(ex))
        need(plan['status']=='authored_symbolic_draft','Exact note representation missing. Use the independent authored note sketch or correct the motif first.','missing_notation')
        root=store.path.parent/'renders';root.mkdir(exist_ok=True)
        need(root.resolve().is_relative_to(store.path.parent.resolve()),'Render directory escapes workspace.')
        basename=plan['sha256'];mid=root/(basename+'.mid');wav=root/(basename+'.wav')
        for dest in (mid,wav):need(not dest.is_symlink(),'Render target may not be a symlink.')
        if not mid.exists():mid.write_bytes(midi_bytes(plan));os.chmod(mid,0o600)
        if not wav.exists():
            with tempfile.NamedTemporaryFile(dir=root,suffix='.wav',delete=False) as temp:tmp=Path(temp.name)
            try:diagnostic_wav(plan,tmp);os.chmod(tmp,0o600);tmp.replace(wav)
            finally:tmp.unlink(missing_ok=True)
        receipt={'id':uid('render'),'story_id':s['id'],'story_revision':s['revision'],'status':'succeeded','kind':'diagnostic_sine_preview',
                 'plan':plan,'audio':'/api/renders/'+wav.name,'midi':'/api/renders/'+mid.name,
                 'audio_sha256':hashlib.sha256(wav.read_bytes()).hexdigest(),'midi_sha256':hashlib.sha256(mid.read_bytes()).hexdigest(),
                 'instrument_realism':False,'external_calls':0,'duration_seconds':plan['total_beats']*60/plan['bpm']+.25,'created_at':now(),
                 'notice':'Authored note timing only. Not a fiddle/cello performance, transcription, or changed reference take.'}
        w['render_jobs'].append(receipt);return receipt
    if op=='workbench.review':
        target=d.get('target_id');need(target in entity_map(w,store.state),'Unknown review target.')
        r={'id':uid('review'),'target_id':target,'text':text(d.get('text'),'Review',4000),'scope':enum(d.get('scope','listening'),('listening','intent','symbolic_check'),'review scope'),
           'verdict':enum(d.get('verdict','keep_exploring'),('keep','avoid','keep_exploring'),'review verdict'),'source':'human','created_at':now(),'changes_canonical_status':False}
        w['reviews'].append(r);return r
    raise DomainError('unknown_operation','Unknown workbench command.',404)

def after_mutation(state,operation,result):
    """Keep the existing recipe/take commands joined to work identity; never duplicate media."""
    w=ensure(state)
    if operation in ('variation.apply','moment.to_variation'):
        parent=result.get('parent',{}).get('id')
        for work in w['works']:
            ids=work.setdefault('recipe_ids',[work['recipe_id']])
            if parent in ids and result['id'] not in ids:ids.append(result['id'])
    if operation in ('take.register','take.link'):
        for work in w['works']:
            if result['recipe_id'] in work.get('recipe_ids',[work['recipe_id']]) and result['id'] not in work['take_ids']:work['take_ids'].append(result['id'])
