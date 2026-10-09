#!/usr/bin/env python3
"""Bounded MCP stdio adapter for the local HTTP prototype (protocol 2025-11-25).
No dependencies. Supports lifecycle, ping and tools; no prompts/resources/tasks/sampling.
All mutation tools require expected_sequence + idempotency_key and remain local-only.
"""
import json,sys
from client import request

def obj(props=None,required=None):return dict(type='object',properties=props or {},required=required or [],additionalProperties=False)
S={'type':'string'};N={'type':'integer','minimum':0}
TOOL_MAP={
 'music_workspace':('workspace.get',{},[],False,'Read local recipe/take/voice metadata and current sequence.'),
 'music_capabilities':('capabilities.get',{},[],False,'Read actual prototype capabilities; no remote availability probe.'),
 'music_catalog_search':('catalog.search',{'query':S},[],False,'Search the local instrument and recipe catalog.'),
 'music_compile':('prompt.compile',{'recipe_id':S,'provider':{'enum':['suno','eleven']}},['recipe_id'],False,'Compile exact Style/Excludes or an Eleven plan draft. No provider call.'),
 'music_variation_plan':('variation.plan',{'recipe_id':S,'transformation':{'enum':['horn-led','bowed-lead','chamber']}},['recipe_id','transformation'],False,'Preview a role-aware recipe patch. Does not change audio.'),
 'music_variation_apply':('variation.apply',{'recipe_id':S,'transformation':{'enum':['horn-led','bowed-lead','chamber']}},['recipe_id','transformation'],True,'Create a new local recipe variation. Parent/audio remain unchanged.'),
 'music_handoff_create':('handoff.create',{'recipe_id':S,'provider':{'enum':['suno','eleven']}},['recipe_id'],True,'Freeze a local prompt/recipe handoff. Nothing is submitted or charged.'),
 'music_moment_create':('moment.create',{'take_id':S,'title':S,'start':{'type':'number','minimum':0},'end':{'type':'number','minimum':0},'note':S},['take_id','title','start','end'],True,'Save a time-linked human listening observation against an exact take.'),
 'music_voice_brief':('voice.brief',{'singer_id':S},['singer_id'],False,'Prepare a proposed voice-design brief. No voice creation/promotion.'),
}
TOOL_MAP.update({
 'music_workbench':('workbench.get',{},[],False,'Read nested musical projects, motifs, stories, listening anchors and actual local jobs.'),
 'music_open_rowan_study':('workbench.seed',{},[],True,'Import the bundled private Rowan WAV, unverified MIDI and authored drafts into this local workspace; no network.'),
 'music_find_materials':('workbench.search',{'query':S,'project_id':S,'limit':{'type':'integer','minimum':1,'maximum':100}},[],False,'Discover local music ideas by text/curated synonyms with inclusion reasons. No embedding inference.'),
 'music_context_packet':('workbench.context',{'ids':{'type':'array','items':S,'maxItems':24},'project_id':S,'limit':{'type':'integer','minimum':1,'maximum':60}},['ids'],False,'Gather selected material with enclosing phrase, earlier callback, source and uncertainty; no binary upload.'),
 'music_reference_inventory':('workbench.reference',{'start':{'type':'number','minimum':0},'end':{'type':'number','minimum':0}},[],False,'Read bundled Rowan waveform and raw MIDI candidates. Metadata is not a verified score or emotion.'),
 'music_project_create':('project.create',{'title':S,'parent_id':S,'summary':S,'kind':{'enum':['world','culture','collection','project']}},['title'],True,'Create a nested musical project without creating an IntentTree task.'),
 'music_work_create':('work.create',{'title':S,'project_id':S,'recipe_id':S},['title','project_id'],True,'Link a cue to the existing recipe authority. Does not create a recording.'),
 'music_capture_thought':('capture.create',{'text':S,'project_id':S,'work_id':S,'kind':{'enum':['idea','listening_interpretation','creative_direction','question','keeper','avoid']},'tags':{'type':'array','items':S,'maxItems':24}},['text'],True,'Keep a human idea or interpretation without forcing a project or task assignment.'),
 'music_motif_create':('motif.create',{'title':S,'project_id':S,'meaning':S,'kind':{'enum':['melodic','rhythmic_melodic','expressive_arc','harmonic','textural']},'symbolic':{'type':'object','properties':{'status':{'const':'authored_sketch'},'pitches':{'type':'array','items':{'type':'integer','minimum':0,'maximum':127}},'durations':{'type':'array','items':{'type':'number','exclusiveMinimum':0}}},'required':['status','pitches','durations'],'additionalProperties':False}},['title','project_id'],True,'Create a motif concept or explicitly authored note sketch. Cannot promote a machine transcription to verified.'),
 'music_story_create':('story.create',{'title':S,'project_id':S,'source_story_id':S},['title','project_id'],True,'Create or branch relative-time musical intent, leaving source audio untouched.'),
 'music_story_update':('story.update',{'story_id':S,'expected_revision':N,'patch':{'type':'object','properties':{'title':S,'events':{'type':'array','items':{'type':'object'}},'relationships':{'type':'array','items':{'type':'object'}},'target_duration_seconds':{'type':'number'},'style_base':S,'excludes':S},'additionalProperties':False}},['story_id','expected_revision','patch'],True,'Apply a validated story revision. Pinned gestures require explicit unlock; planned coordinates are not measured timing.'),
 'music_story_unlock':('story.unlock',{'story_id':S,'expected_revision':N,'event_id':S},['story_id','expected_revision','event_id'],True,'Explicitly unpin one gesture before a requested edit.'),
 'music_story_compile':('story.compile',{'story_id':S},['story_id'],False,'Compile separate Style, instrumental arrangement, Exclude and contextual references; no submission or inferred notes.'),
 'music_story_score':('story.score',{'story_id':S,'bpm':{'type':'number'},'total_beats':{'type':'number'}},['story_id'],False,'Resolve authored note-backed gestures to an explicit beat clock. Block missing notation instead of inventing an exact score.'),
 'music_story_prepare':('story.prepare',{'story_id':S,'expected_revision':N},['story_id','expected_revision'],True,'Freeze a local creation handoff, recipe revision, story snapshot and context. No provider request or spend.'),
 'music_story_render':('story.render',{'story_id':S,'expected_revision':N,'bpm':{'type':'number'},'total_beats':{'type':'number'}},['story_id','expected_revision'],True,'Create bounded local MIDI and a sine-tone diagnostic WAV from explicit authored notes; not realistic instrument generation.'),
 'music_occurrence_create':('occurrence.create',{'take_id':S,'work_id':S,'motif_id':S,'title':S,'start':{'type':'number'},'end':{'type':'number'},'note':S,'instrument':S,'parent_occurrence_id':S},['take_id','work_id','motif_id','title','start','end'],True,'Annotate a heard motif occurrence with source timestamps as human-report evidence, not verified score data.'),
 'music_relation_create':('relationship.create',{'source_id':S,'target_id':S,'kind':{'enum':['recalls','requires_context','anchored_in','transforms','answers','supports','contrasts_with']},'note':S},['source_id','target_id','kind'],True,'Link musical meaning and context dependencies across owned entities, without copying them.'),
 'music_review':('workbench.review',{'target_id':S,'text':S,'scope':{'enum':['listening','intent','symbolic_check']},'verdict':{'enum':['keep','avoid','keep_exploring']}},['target_id','text'],True,'Record a human review without inferring emotion, changing original files, or promoting canonical status.'),
})
TOOLS=[]
for name,(op,props,required,write,desc) in TOOL_MAP.items():
    fields=dict(props);req=list(required)
    if write:fields.update(expected_sequence=N,idempotency_key=S);req+=['expected_sequence','idempotency_key']
    TOOLS.append(dict(name=name,description=desc,inputSchema=obj(fields,req),annotations=dict(readOnlyHint=not write,destructiveHint=False,idempotentHint=True,openWorldHint=False)))
initialized=False;ready=False

def respond(msg):print(json.dumps(msg,separators=(',',':'),ensure_ascii=False),flush=True)
def error(ident,code,message):respond(dict(jsonrpc='2.0',id=ident,error=dict(code=code,message=message)))
for line in sys.stdin:
    if len(line)>1_000_000: error(None,-32600,'Message exceeds prototype limit.');continue
    try:m=json.loads(line)
    except Exception:error(None,-32700,'Parse error.');continue
    if not isinstance(m,dict):error(None,-32600,'Object required.');continue
    ident=m.get('id');method=m.get('method');params=m.get('params',{})
    if method=='notifications/initialized':ready=initialized;continue
    if ident is None:continue
    if method=='initialize':
        if initialized:error(ident,-32600,'Already initialized.');continue
        initialized=True
        respond(dict(jsonrpc='2.0',id=ident,result=dict(protocolVersion='2025-11-25',capabilities=dict(tools=dict(listChanged=False)),serverInfo=dict(name='meatymusic-review',version='0.4.0'),instructions='Local prototype only. Never claim provider generation or singing identity transfer. Story intent, user listening reports and machine MIDI are different evidence classes. Rendered sine sketches are not realistic performances. Refresh sequence before a mutation; do not silently retry conflicts.')));continue
    if method=='ping':respond(dict(jsonrpc='2.0',id=ident,result={}));continue
    if not ready:error(ident,-32002,'Initialize and send notifications/initialized first.');continue
    if method=='tools/list':respond(dict(jsonrpc='2.0',id=ident,result=dict(tools=TOOLS)));continue
    if method!='tools/call':error(ident,-32601,'Method not supported.');continue
    if not isinstance(params,dict) or params.get('name') not in TOOL_MAP:error(ident,-32602,'Unknown tool.');continue
    name=params['name'];spec=next(t for t in TOOLS if t['name']==name);args=params.get('arguments',{});op,props,required,write,_=TOOL_MAP[name]
    if not isinstance(args,dict) or set(args)-set(spec['inputSchema']['properties']) or set(spec['inputSchema']['required'])-set(args):error(ident,-32602,'Invalid tool arguments.');continue
    try:
        values=dict(args);env=dict(operation=op,input=values)
        if write:env['expected_sequence']=values.pop('expected_sequence');env['idempotency_key']=values.pop('idempotency_key')
        result=request('/api/commands',env)['result']
        respond(dict(jsonrpc='2.0',id=ident,result=dict(content=[dict(type='text',text=json.dumps(result,ensure_ascii=False))],structuredContent=result,isError=False)))
    except Exception as ex:respond(dict(jsonrpc='2.0',id=ident,result=dict(content=[dict(type='text',text=str(ex))],isError=True)))
