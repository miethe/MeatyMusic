"""Sonic Workshop review prototype: pure domain rules and a local JSON command store.
No provider requests, remote voice operations, or inference calls are performed here.
"""
from __future__ import annotations
import copy, hashlib, json, math, os, re, threading, uuid
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

VERSION = '0.4.0'
STYLE_LIMIT = 1000
LYRICS_LIMIT = 5000

def now(): return datetime.now(timezone.utc).isoformat()
def uid(prefix): return f'{prefix}_{uuid.uuid4().hex[:12]}'
def canonical(x): return json.dumps(x, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
def digest(x): return hashlib.sha256(canonical(x).encode()).hexdigest()
def js_count(x): return len(x.encode('utf-16-le')) // 2

class DomainError(Exception):
    def __init__(self, code, message, status=422):
        self.code, self.message, self.status = code, message, status
        super().__init__(message)

def need(test, message, code='validation_error', status=422):
    if not test: raise DomainError(code, message, status)

def text(x, label, maximum=5000, empty=False):
    need(isinstance(x,str), f'{label} must be text.')
    need((empty or bool(x.strip())) and len(x)<=maximum, f'{label} must contain {0 if empty else 1}–{maximum} characters.')
    return x.strip()

def safe_url(x):
    p=urlparse(text(x,'URL',2048)); need(p.scheme in ('https','http') and p.hostname and not p.username and not p.password,'Use an ordinary http(s) URL without embedded credentials.')
    return x

INSTRUMENTS = [
 ('sarod','Sarod','Plucked strings','South Asia','Lyrical plucked lead; sliding phrases','amber'),
 ('mandolin','Mandolin','Plucked strings','Roots / chamber','Short, bright rhythmic answers','mint'),
 ('cello','Cello','Bowed strings','Orchestra / chamber','A long, independent counterline','blue'),
 ('upright-bass','Upright bass','Bowed strings','Roots / orchestra','A warm rhythmic foundation','blue'),
 ('dobro','Dobro','Plucked strings','American roots','Gliding transitional phrases','amber'),
 ('horns','French horns','Brass','Orchestra','Rounded, lyrical ensemble expansion','mint'),
 ('strings','Divided strings','Ensemble','Orchestra','Broad supporting harmony','lilac'),
 ('erhu','Erhu','Bowed strings','East Asia','Expressive sustained lead','lilac'),
 ('oud','Oud','Plucked strings','West Asia / North Africa','Ornamented plucked melody','amber'),
 ('ney','Ney','Winds','West Asia / North Africa','Breath-shaped answering line','mint'),
 ('bansuri','Bansuri','Winds','South Asia','Long, flowing melodic line','mint'),
 ('koto','Koto','Plucked strings','East Asia','Resonant plucked cells','amber'),
 ('shakuhachi','Shakuhachi','Winds','East Asia','Sparse breath-shaped phrases','mint'),
 ('dan-bau','Đàn bầu','Strings','Southeast Asia','Harmonic glides and lyrical bends','lilac'),
 ('sape','Sape','Plucked strings','Borneo','Warm repeating melodic figure','amber'),
 ('ranat-ek','Ranat ek','Tuned percussion','Southeast Asia','Nimble wooden repeating figures','amber'),
 ('khaen','Khaen','Free reeds','Southeast Asia','Breathing reed patterns','mint'),
 ('didgeridoo','Didgeridoo','Winds','Australia','Low evolving drone','blue'),
 ('bass-clarinet','Bass clarinet','Winds','Chamber','Rounded low lyrical voice','blue'),
 ('flugelhorn','Flugelhorn','Brass','Chamber / jazz','Warm singing brass phrases','mint'),
 ('mbira','Mbira','Lamellophones','Southern Africa','Interlocking metal-tine patterns','amber'),
 ('marimba','Marimba','Tuned percussion','Chamber','Dry wooden melodic cells','amber'),
 ('qanun','Qanun','Plucked strings','West Asia / North Africa','Bright rippling responses','amber'),
 ('santur','Santur','Struck strings','West / South Asia','Sparse ringing figures','lilac'),
 ('fiddle','Fiddle','Bowed strings','Roots','Nimble bowed countermelody','mint'),
 ('mountain-dulcimer','Mountain dulcimer','Plucked strings','Appalachian-inspired','Ringing home answer','amber'),
 ('hammered-dulcimer','Hammered dulcimer','Struck strings','Chamber','Bright interlocking figures','amber'),
 ('kora','Kora','Plucked strings','Mande-inspired','Rolling answering patterns','mint'),
 ('autoharp','Autoharp','Plucked strings','Roots','Soft chord resonance','amber'),
 ('viola','Viola','Bowed strings','Chamber','Warm inner line','lilac'),
 ('flute','Flute','Winds','Chamber','Breathing melodic response','mint'),
 ('frame-drum','Frame drum','Percussion','Multiple traditions','Light sparse rhythmic punctuation','blue'),
]
INSTRUMENTS = [dict(id=i,name=n,family=f,context=c,behavior=b,color=co,metadata_status='editorial_prompt_palette_not_an_authenticity_claim') for i,n,f,c,b,co in INSTRUMENTS]
COMMON_EXCLUDES='singing, lyrics, spoken word, choir, chanting, vocal samples, trailer braaams, festival EDM drops, constant percussion pounding, heavily compressed master'

def seed():
    parts = [dict(id=p,instrument=i,role=r,behavior=b) for p,i,r,b in [
      ('p1','sarod','lead','Introduces the central melody'),('p2','mandolin','answer','Short rhythmic responses'),
      ('p3','cello','counterline','A longer independent voice'),('p4','upright-bass','foundation','Maintains the pocket'),
      ('p5','dobro','color','Connects phrases with slow slides'),('p6','horns','expansion','Develops the opening material'),('p7','strings','harmony','Broad supporting harmony')]]
    sections=[dict(id='opening',name='Opening',description='An intimate sarod and mandolin duet.',parts=['p1','p2'],locked=True),
      dict(id='develop',name='Develop',description='Trade the theme; cello adds a longer line.',parts=['p1','p2','p3','p4','p5'],locked=False),
      dict(id='expansion',name='Expansion',description='Strings develop the theme; horns answer softly.',parts=['p1','p2','p3','p4','p5','p6','p7'],locked=False),
      dict(id='return',name='Return',description='A quiet reprise returns to the plucked voices.',parts=['p1','p2','p3'],locked=False)]
    r=dict(id='recipe_ridgeline',revision=1,title='Sarod on the Ridgeline',identity='House / Symphonic',kind='score',vocal_mode='instrumental',roots='symphonic folk adventure, progressive bluegrass, Indian chamber fusion',bpm=96,meter='4/4',tonality='Modal warmth and open fifths',production='Tactile acoustic detail, clear soloists, deep natural hall and patient dynamic growth.',parts=parts,sections=sections,excludes=COMMON_EXCLUDES,lyrics='',singer_ids=[],parent=None,changes=[],created_at=now(),locks=['rhythm'])
    r2=copy.deepcopy(r); r2.update(id='recipe_rivers',title='Two Rivers, One Voice',identity='House / Roots',bpm=72,meter='6/8',roots='Vietnamese-Appalachian chamber folk, lyrical orchestral ballad',parts=[dict(id='p1',instrument='dan-bau',role='lead',behavior='Long gliding melodic phrases'),dict(id='p2',instrument='dobro',role='answer',behavior='Warm gliding answers'),dict(id='p3',instrument='cello',role='counterline',behavior='A lyrical inner voice'),dict(id='p4',instrument='strings',role='harmony',behavior='Gradual orchestral expansion')],sections=[dict(id='opening',name='Opening',description='Two sliding voices in dialogue.',parts=['p1','p2'],locked=True),dict(id='develop',name='Develop',description='Cello reveals an independent melody.',parts=['p1','p2','p3'],locked=False),dict(id='expansion',name='Expansion',description='Strings open the horizon.',parts=['p1','p2','p3','p4'],locked=False),dict(id='return',name='Return',description='Return to the two soloists.',parts=['p1','p2'],locked=False)])
    singers=[dict(id='singer_ember',revision=1,name='Ember',role='lead',register='Warm alto',character='Smooth, intimate, lightly smoky',phrasing='Patient lines; a slow descending melisma on a sustained hook vowel',vibrato='Restrained, arriving late on held notes',language='English',identity_status='direction_only',voice_ref=None),dict(id='singer_hollow',revision=1,name='Hollow',role='answer',register='Low baritone',character='Warm, textured, chest-led',phrasing='Long supportive harmonies; leave room for the lead',vibrato='Natural and restrained',language='English',identity_status='direction_only',voice_ref=None)]
    return dict(schema_version=VERSION,sequence=0,recipes=[r,r2],handoffs=[],takes=[dict(id='take_diag_a',recipe_id=r['id'],title='Diagnostic A · plucked contour',duration=24,source='diagnostic',audio='/fixtures/diagnostic-a.wav',sha256=None,notes='Deterministic synthesized test audio. Not Suno, not a sarod performance.',requested_instruments=['sarod','mandolin'],observed_instruments=None),dict(id='take_diag_b',recipe_id=r['id'],title='Diagnostic B · sustained contour',duration=26,source='diagnostic',audio='/fixtures/diagnostic-b.wav',sha256=None,notes='A second synthesized test fixture, not a generation result.',requested_instruments=['sarod','mandolin'],observed_instruments=None)],moments=[],singers=singers,voice_bindings=[],events=[],receipts={},settings=dict(voice_lab_url='',aos_tts_url=''),identity_notes=[],recipe_history=[])

PROVIDERS=[
 dict(id='suno',name='Suno',category='Music & sounds',route='manual',status='Manual handoff',description='Copy Style and Excludes, create in your account, return with the result. API access is not assumed.',singing='Own-voice workflow documented; account/model eligibility must be verified.',endpoint=None),
 dict(id='eleven',name='Eleven Music',category='Structured music',route='planned',status='Plan export only',description='Section-aware composition plan export. No API credentials or generation adapter in this prototype.',singing='Music vocals supported; a TTS voice ID is not a verified singing binding.',endpoint=None),
 dict(id='lyria',name='Lyria',category='Batch & live music',route='planned',status='Adapter proposed',description='Separate batch and real-time contracts. No live connection or streaming implementation.',singing='Batch and RealTime have different capabilities.',endpoint=None),
 dict(id='stable',name='Stable Audio Open',category='Local materials',route='planned',status='Adapter proposed',description='Candidate local lane for short materials and effects. Model download, license and hardware require review.',singing='Not selected as the singing-identity lane.',endpoint=None),
 dict(id='voice-lab',name='Voice Lab',category='Identity & curation',route='bundle',status='Bundle import',description='Read-only promotion metadata import. Design-brief export is a proposed handoff, not an existing Voice Lab API.',singing='Speech curation is not singing validation.',endpoint=None),
 dict(id='aos-tts',name='Estate Voice',category='Reviewed speech',route='planned',status='Speech handoff',description='Use promoted voices for spoken introductions, narration and lyric readings. No live requests here.',singing='Speech generation only; never silently route a song here.',endpoint=None)]

def find_record(items, ident, label='Record'):
    found=next((x for x in items if x['id']==ident),None)
    need(found is not None,f'{label} not found.','not_found',404); return found

def compile_prompt(recipe, state, provider='suno', override=None):
    names={x['id']:x['name'] for x in INSTRUMENTS}
    mode='Instrumental' if recipe['vocal_mode']=='instrumental' else 'Vocal'
    pulse= f"{recipe['bpm']} BPM, {recipe['meter']}" if recipe.get('bpm') else 'Free-time phrasing'
    core=[f"{mode} {recipe['roots']}; {pulse}."]
    for p in recipe['parts']:
        core.append(f"{names.get(p['instrument'],p['instrument'])}: {p['role']}, {p['behavior'].rstrip('.')}.")
    if recipe['vocal_mode']!='instrumental':
        for s in state['singers']:
            if s['id'] in recipe.get('singer_ids',[]): core.append(f"{s['role']}: {s['register']}, {s['character']}; {s['phrasing']}.")
    core += [f"{s['name']}: {s['description']}" for s in recipe['sections']]
    optional=[recipe.get('tonality',''), recipe.get('production','')]
    full=' '.join(core+optional); omitted=[]
    while js_count(full)>STYLE_LIMIT and optional:
        omitted.insert(0,optional.pop()); full=' '.join(core+optional)
    warnings=['Arrangement, instrument identity, tempo and motif preservation are prompt targets, not verified audio properties.']
    if recipe['vocal_mode']!='instrumental': warnings.append('Vocal character describes a target; no verified singing identity is bound.')
    if override is not None: text(override,'Style',10000); full=override; warnings.append('Manual override retained verbatim. It has not been reconciled to the recipe.')
    need(js_count(full)<=STYLE_LIMIT,f'Core prompt needs {js_count(full)} UTF-16 units; reduce details explicitly. Nothing has been silently truncated.','prompt_over_budget')
    lyrics=recipe.get('lyrics',''); need(js_count(lyrics)<=LYRICS_LIMIT,'Lyrics exceed the 5,000-character project limit.','lyrics_over_budget')
    excludes=recipe['excludes']
    if recipe['vocal_mode']!='instrumental': excludes=', '.join(t.strip() for t in excludes.split(',') if t.strip() not in ['singing','lyrics','choir','chanting','vocal samples'])
    result=dict(schema='meatymusic.prompt.v1',provider=provider,recipe_id=recipe['id'],recipe_revision=recipe['revision'],style=full,excludes=excludes,lyrics=lyrics,style_count=js_count(full),count_unit='utf16_code_units',limit=STYLE_LIMIT,omitted=omitted,warnings=warnings,compiler_version=VERSION,has_override=override is not None,capability_snapshot='reviewed-2026-10-07; account/model not probed')
    if provider=='eleven':
        result['composition_plan']={'chunks':[dict(text=f"[{s['name']}] {{instrumental: {s['description']}}}" if recipe['vocal_mode']=='instrumental' else f"[{s['name']}] {{{s['description']}}}",duration_ms=30000,positive_styles=[recipe['roots'],recipe['tonality'],s['description']],negative_styles=[t.strip() for t in excludes.split(',')]) for s in recipe['sections']]}
        result['warnings'].append('Plan draft uses editable 30-second section placeholders; it is not a submitted provider request. Assign lyrics to sections before vocal submission.')
    result['hash']=digest(result)
    return result


def variation(recipe, operation):
    r=copy.deepcopy(recipe); changes=[]
    if operation=='horn-led':
        s=find_record(r['sections'],'expansion','Expansion section'); need(not s['locked'],'Expansion section is pinned. Unlock it before changing it.','locked_field')
        s['description']='French horns carry the melody; strings support; the plucked voices remain audible.'
        s['roles']={p['id']:('lead' if p['instrument']=='horns' else 'harmony' if p['instrument']=='strings' else 'color' if p['role']=='lead' else p['role']) for p in r['parts'] if p['id'] in s['parts']}
        changes=['Expansion: French horns take the lead.','Strings become supporting harmony.']
        r['title']=recipe['title']+' · horn-led'
        if not any(p['instrument']=='horns' for p in r['parts']):
            p=dict(id=uid('p'),instrument='horns',role='expansion',behavior='Carries the expansion melody'); r['parts'].append(p); s['parts'].append(p['id']); s['roles'][p['id']]='lead'
    elif operation=='bowed-lead':
        p=next((p for p in r['parts'] if p['role']=='lead'),None); need(p,'A lead role is required.')
        old=next(x['name'] for x in INSTRUMENTS if x['id']==p['instrument']); p.update(instrument='erhu',behavior='Sustained bowed melody with long answers')
        for s in r['sections']:
            if p['id'] in s['parts']:
                need(not s['locked'],'A pinned section includes the lead. Unlock it before a lead substitution.','locked_field')
                s['description']=re.sub(re.escape(old),'erhu',s['description'],flags=re.I)
        changes=[f'Lead: {old} → erhu.','Lead articulation: plucked → sustained bowed.']; r['title']=recipe['title']+' · bowed lead'
    elif operation=='chamber':
        for s in r['sections']:
            if not s['locked']: s['description']='Develop the theme as a small acoustic ensemble, with no orchestral expansion.'
        removed={p['id'] for p in r['parts'] if p['instrument'] in ['horns','strings']}
        need(not any(s['locked'] and removed.intersection(s['parts']) for s in r['sections']),'A pinned section uses an instrument this operation removes.','locked_field')
        r['parts']=[p for p in r['parts'] if p['id'] not in removed]
        for s in r['sections']:
            s['parts']=[i for i in s['parts'] if i not in removed]
            if 'roles' in s: s['roles']={i:role for i,role in s['roles'].items() if i not in removed}
        r['roots']='lyrical chamber folk, acoustic post-minimalism'; changes=['Orchestral layers removed.','Acoustic roles and rhythmic target retained.']; r['title']=recipe['title']+' · chamber'
    else: raise DomainError('unknown_operation','Unknown variation operation.')
    return dict(recipe=r,changes=changes,preserved=['Rhythmic target','Pinned sections','Parent recipe and recordings'],notice='A recipe transformation, not an edit to existing audio.')

class Store:
    def __init__(self, path):
        self.path=Path(path); self.path.parent.mkdir(parents=True,exist_ok=True); self.lock=threading.RLock()
        if self.path.exists(): self.state=json.loads(self.path.read_text())
        else: self.state=seed(); self.save()
        from .workbench import ensure
        ensure(self.state)
    def save(self):
        temp=self.path.with_suffix('.tmp')
        with temp.open('w') as stream:
            os.chmod(temp,0o600); stream.write(json.dumps(self.state,ensure_ascii=False,indent=2)); stream.flush(); os.fsync(stream.fileno())
        temp.replace(self.path)
    def public(self):
        s=copy.deepcopy(self.state); s.pop('receipts',None); return s
    def command(self, envelope):
        with self.lock:
            need(isinstance(envelope,dict),'Command must be an object.')
            op=text(envelope.get('operation'),'Operation',100); data=envelope.get('input',{}); need(isinstance(data,dict),'Input must be an object.')
            reads=['catalog.search','capabilities.get','prompt.compile','variation.plan','workspace.get','voice.brief','tts.handoff','workspace.export']
            from .workbench import READS
            if op in reads or op in READS: return self.read(op,data)
            key=text(envelope.get('idempotency_key'),'Idempotency key',200)
            request_hash=digest(dict(operation=op,input=data,expected_sequence=envelope.get('expected_sequence')))
            receipt=self.state['receipts'].get(key)
            if receipt:
                need(receipt['hash']==request_hash,'This idempotency key was already used for a different command.','idempotency_conflict',409)
                return copy.deepcopy(receipt['result'])
            need(envelope.get('expected_sequence')==self.state['sequence'],'Workspace changed. Refresh and explicitly retry your edit.','stale_revision',409)
            old=copy.deepcopy(self.state)
            try:
                result=self.mutate(op,data)
                from .workbench import after_mutation
                after_mutation(self.state,op,result)
                self.state['sequence']+=1
                event=dict(id=uid('event'),operation=op,sequence=self.state['sequence'],at=now(),actor='local-operator',effect='local_only',subject_id=result.get('id') or data.get('recipe_id'))
                self.state['events'].append(event)
                result=dict(result,sequence=self.state['sequence'])
                self.state['receipts'][key]=dict(hash=request_hash,result=result)
                self.save(); return copy.deepcopy(result)
            except Exception:
                self.state=old; raise
    def read(self,op,d):
        from .workbench import READS, read
        if op in READS:return read(self,op,d)
        if op in ['workspace.get','workspace.export']: return self.public()
        if op=='capabilities.get': return dict(providers=PROVIDERS,live_generation=False,voice_lab_import='promotion-bundle/1.0 metadata only',style_budget=STYLE_LIMIT)
        if op=='catalog.search':
            q=str(d.get('query','')).lower(); return dict(instruments=[x for x in INSTRUMENTS if q in canonical(x).lower()],recipes=[x for x in self.state['recipes'] if q in canonical(x).lower()])
        if op=='prompt.compile': return compile_prompt(find_record(self.state['recipes'],d.get('recipe_id')),self.state,d.get('provider','suno'),d.get('style_override'))
        if op=='variation.plan': return variation(find_record(self.state['recipes'],d.get('recipe_id')),d.get('transformation'))
        if op=='voice.brief':
            s=find_record(self.state['singers'],d.get('singer_id')); return dict(schema='meatymusic.voice-design-brief.v1',status='proposed_interchange',singer=copy.deepcopy(s),intended_use='singer_character_design',speech_and_singing_separate=True,required_review=['Speech auditions do not establish singing range or identity.','No automatic promotion or provider enrollment.'],probe_plan=['Spoken character read','Vowel and pitch study where supported','Short original sung phrase where supported','Audition in ensemble'],created_at=now())
        if op=='tts.handoff':
            binding=find_record(self.state['voice_bindings'],d.get('voice_id'),'Imported voice'); reviewed=text(d.get('text'),'Reviewed text',5000)
            need(d.get('reviewed') is True,'Review the spoken text before preparing the speech handoff.')
            return dict(schema='meatymusic.speech-handoff.v1',status='prepared_not_sent',operation='spoken_audition',voice_catalog_id=binding['id'],voice_id=binding['voice_id'],provider=binding['provider'],text=reviewed,backend='dry-run',confirm_live=False,notes='Consumer adapter must resolve its actual aos-tts contract. This export makes no request and is not singing synthesis.')
        raise DomainError('unknown_operation','Unknown read operation.',404)
    def mutate(self,op,d):
        from .workbench import WRITES, mutate
        if op in WRITES:return mutate(self,op,d)
        if op=='generation.submit': raise DomainError('not_implemented','Live generation is not implemented. Use a manual handoff or export a provider plan.',501)
        if op=='recipe.create':
            r=copy.deepcopy(self.state['recipes'][0]); r.update(id=uid('recipe'),revision=1,title=text(d.get('title','Untitled study'),'Title',120),parent=None,created_at=now(),changes=[]); self.state['recipes'].append(r); return r
        if op=='variation.apply':
            parent=find_record(self.state['recipes'],d.get('recipe_id')); plan=variation(parent,d.get('transformation')); r=plan['recipe']; r.update(id=uid('recipe'),revision=1,parent=dict(id=parent['id'],revision=parent['revision']),changes=plan['changes'],created_at=now()); self.state['recipes'].append(r); return r
        if op in ['recipe.update','recipe.part.update','recipe.part.add','recipe.section.update']:
            r=find_record(self.state['recipes'],d.get('recipe_id')); self.state['recipe_history'].append(copy.deepcopy(r))
            if op=='recipe.update':
                patch=d.get('patch',{}); need(isinstance(patch,dict),'Patch must be an object.')
                allowed={'title','roots','bpm','meter','tonality','production','excludes','lyrics','vocal_mode','singer_ids','kind','identity','locks'}; need(set(patch)<=allowed,'Unknown recipe field.')
                if 'rhythm' in r['locks']: need(not {'bpm','meter'}.intersection(patch),'Rhythm is pinned. Unlock it before editing.','locked_field')
                for k,v in patch.items():
                    if k=='bpm': need(v is None or isinstance(v,(float,int)) and not isinstance(v,bool) and 20<=v<=300,'BPM must be empty or 20–300.')
                    elif k=='vocal_mode': need(v in ['instrumental','solo','duet'],'Choose instrumental, solo or duet.')
                    elif k=='kind': need(v in ['score','song','motif','loop','one_shot','texture'],'Unsupported asset kind.')
                    elif k=='singer_ids': need(isinstance(v,list) and len(v)<=8 and all(any(s['id']==i for s in self.state['singers']) for i in v),'Invalid singer references.')
                    elif k=='locks': need(isinstance(v,list) and all(i=='rhythm' for i in v),'Invalid lock.')
                    else: text(v,k,5000,empty=k in ['lyrics','excludes','production','tonality'])
                    if k=='lyrics': need(js_count(v)<=LYRICS_LIMIT,'Lyrics exceed the 5,000-character limit.')
                    r[k]=v
            elif op=='recipe.part.update':
                p=find_record(r['parts'],d.get('part_id'),'Part'); patch=d.get('patch',{}); need(set(patch)<={'instrument','role','behavior'},'Unsupported part field.')
                need(not any(s['locked'] and p['id'] in s['parts'] for s in r['sections']),'This part participates in a pinned section. Unpin the section before editing it.','locked_field')
                if 'instrument' in patch: need(any(x['id']==patch['instrument'] for x in INSTRUMENTS),'Unknown instrument.')
                for k,v in patch.items(): text(v,k,160)
                p.update(patch)
            elif op=='recipe.part.add':
                ident=d.get('instrument'); need(any(x['id']==ident for x in INSTRUMENTS),'Unknown instrument.'); need(len(r['parts'])<24,'Prototype ensemble limit is 24.')
                sec=find_record(r['sections'],d.get('section_id'),'Section'); need(not sec['locked'],'Unpin this section before adding an instrument.','locked_field')
                inst=next(x for x in INSTRUMENTS if x['id']==ident); p=dict(id=uid('p'),instrument=ident,role='color',behavior=inst['behavior']); r['parts'].append(p); sec['parts'].append(p['id'])
            else:
                sec=find_record(r['sections'],d.get('section_id'),'Section'); patch=d.get('patch',{}); need(set(patch)<={'locked','description'},'Unsupported section field.')
                if 'description' in patch: need(not sec['locked'],'Unpin this section before editing.','locked_field'); text(patch['description'],'Section description',350)
                if 'locked' in patch: need(isinstance(patch['locked'],bool),'Lock must be boolean.')
                sec.update(patch)
            r['revision']+=1; return r
        if op=='handoff.create':
            r=find_record(self.state['recipes'],d.get('recipe_id')); provider=d.get('provider','suno'); need(provider in ['suno','eleven'],'Only Suno handoffs and Eleven plan drafts are implemented.')
            p=compile_prompt(r,self.state,provider,d.get('style_override'))
            settings=d.get('settings',{}); need(isinstance(settings,dict) and len(canonical(settings))<4000,'Settings must be a small object.')
            h=dict(id=uid('handoff'),recipe_id=r['id'],recipe_revision=r['revision'],recipe_snapshot=copy.deepcopy(r),prompt=p,settings=settings,settings_status='user_recorded_not_provider_verified',provider=provider,status='prepared',created_at=now(),actual_submission=None,external_calls=0)
            self.state['handoffs'].append(h); return h
        if op=='handoff.record_submission':
            h=find_record(self.state['handoffs'],d.get('handoff_id')); need(h['status']=='prepared','Only a prepared handoff can be recorded as submitted.')
            actual=d.get('actual_style',h['prompt']['style']); text(actual,'Actual style',10000); need(js_count(actual)<=STYLE_LIMIT,'Actual style exceeds 1,000-character target.')
            h['actual_submission']=dict(style=actual,settings=d.get('settings',h['settings']),recorded_at=now(),evidence='user_attestation'); h['status']='submitted_by_user'; return h
        if op=='take.link':
            r=find_record(self.state['recipes'],d.get('recipe_id')); h=find_record(self.state['handoffs'],d.get('handoff_id')) if d.get('handoff_id') else None
            need(h is None or h['recipe_id']==r['id'],'Handoff and recipe do not match.')
            t=dict(id=uid('take'),title=text(d.get('title','Linked take'),'Title',160),recipe_id=r['id'],handoff_id=h['id'] if h else None,source='link_only',url=safe_url(d.get('url')),audio=None,duration=None,association='user_confirmed',observed_instruments=None,created_at=now()); self.state['takes'].append(t); return t
        if op=='take.register':
            # Trusted server import endpoint only: ordinary command endpoint blocks this operation.
            r=find_record(self.state['recipes'],d.get('recipe_id')); h=find_record(self.state['handoffs'],d.get('handoff_id')) if d.get('handoff_id') else None; need(h is None or h['recipe_id']==r['id'],'Handoff and recipe do not match.')
            duration=d.get('duration'); need(isinstance(duration,(int,float)) and math.isfinite(duration) and 0<duration<=7200,'Audio duration must be between 0 and 7,200 seconds.')
            t=dict(id=uid('take'),recipe_id=r['id'],handoff_id=h['id'] if h else None,title=text(d.get('title'),'Title',160),source='local_import',audio=d['audio'],sha256=d['sha256'],duration=duration,duration_evidence=d.get('duration_evidence','browser_decode'),original_name=d.get('original_name'),created_at=now(),association='user_confirmed',observed_instruments=None,rights=dict(local_playback='user_selected_file',cross_provider_reference='unknown',model_analysis='unknown',training='unknown')); self.state['takes'].append(t); return t
        if op=='moment.create':
            t=find_record(self.state['takes'],d.get('take_id'),'Take'); start=d.get('start'); end=d.get('end')
            need(t.get('duration') and isinstance(start,(float,int)) and isinstance(end,(float,int)) and 0<=start<end<=t['duration'],'Moment must be inside the selected audio duration. Link-only takes cannot have measured regions.')
            m=dict(id=uid('moment'),take_id=t['id'],recipe_id=t['recipe_id'],title=text(d.get('title','A useful moment'),'Title',120),start=round(start,3),end=round(end,3),note=text(d.get('note',''),'Listening note',2000,empty=True),source='human_annotation',created_at=now()); self.state['moments'].append(m); return m
        if op=='moment.to_variation':
            m=find_record(self.state['moments'],d.get('moment_id')); parent=find_record(self.state['recipes'],m['recipe_id']); r=copy.deepcopy(parent); r.update(id=uid('recipe'),revision=1,title=parent['title']+' · '+m['title'],parent=dict(id=parent['id'],revision=parent['revision']),reference_moment=m['id'],changes=['Inspired by a saved moment; audio not copied or edited.'],created_at=now()); self.state['recipes'].append(r); return r
        if op=='singer.update':
            s=find_record(self.state['singers'],d.get('singer_id'),'Singer'); patch=d.get('patch',{}); need(set(patch)<={'name','register','character','phrasing','vibrato','language','role','voice_ref'},'Unsupported singer field.')
            for k,v in patch.items():
                if k=='voice_ref': need(v is None or any(b['id']==v for b in self.state['voice_bindings']),'Unknown imported voice reference.')
                else: text(v,k,500)
            s.update(patch); s['revision']+=1; return s
        if op=='voice.bundle.import':
            b=d.get('bundle'); need(isinstance(b,dict) and b.get('schema')=='voice-lab.promotion-bundle' and b.get('schema_version')=='1.0','Expected a Voice Lab promotion bundle v1.0.')
            need(isinstance(b.get('voices'),list) and len(b['voices'])<=250,'Invalid voice list.'); added=[]
            for v in b['voices']:
                for k in ['id','name','provider','voice_id']: text(v.get(k),f'Voice {k}',300)
                need(v.get('status') in ['locked','promoted'],'Only locked/promoted metadata can be linked.')
                need(isinstance(v.get('styles'),dict) and v.get('default_mood') in v['styles'],'Invalid default mood.')
                existing=next((x for x in self.state['voice_bindings'] if x['id']==v['id']),None)
                record=dict(v,imported_at=now(),bundle_id=b.get('bundle_id'),source_bundle_hash=digest(b),allowed_operation='speech',singing_status='unverified')
                if existing: need(existing['voice_id']==v['voice_id'] and existing['provider']==v['provider'],'Voice ID conflict. Resolve in Voice Lab first.','voice_binding_conflict',409)
                else: self.state['voice_bindings'].append(record); added.append(v['id'])
            return dict(imported=added,total=len(self.state['voice_bindings']),status='metadata_only')
        if op=='settings.update':
            for k,v in d.items():
                need(k in ['voice_lab_url','aos_tts_url'],'Unknown setting.'); self.state['settings'][k]=safe_url(v) if v else ''
            return self.state['settings']
        if op=='identity.note':
            n=dict(id=uid('insight'),text=text(d.get('text'),'Insight',2000),status='candidate',source='human',created_at=now()); self.state['identity_notes'].append(n); return n
        raise DomainError('not_implemented','This command is not implemented in the review prototype.',501)
