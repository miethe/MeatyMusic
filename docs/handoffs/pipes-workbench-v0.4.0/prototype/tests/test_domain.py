import copy,json,tempfile,unittest
from pathlib import Path
from app.domain import Store,DomainError,seed,compile_prompt,variation,js_count,digest

class DomainTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.store=Store(Path(self.tmp.name)/'state.json');self.r='recipe_ridgeline';self.counter=0
 def tearDown(self):self.tmp.cleanup()
 def call(self,op,inp=None,key=None,seq=None):
  self.counter+=1
  return self.store.command(dict(operation=op,input=inp or {},idempotency_key=key or f'test-{self.counter}',expected_sequence=self.store.state['sequence'] if seq is None else seq))
 def failcode(self,code,fn):
  with self.assertRaises(DomainError) as c:fn()
  self.assertEqual(c.exception.code,code)
 def test_initial_seed(self):self.assertEqual(len(self.store.state['recipes']),2)
 def test_prompt_separate_limits(self):
  p=compile_prompt(self.store.state['recipes'][0],self.store.state);self.assertLessEqual(p['style_count'],1000);self.assertNotIn('trailer braaams',p['style']);self.assertIn('trailer braaams',p['excludes'])
 def test_utf16_counter(self):self.assertEqual(js_count('a🎵b'),4)
 def test_compiler_deterministic(self):
  a=compile_prompt(self.store.state['recipes'][0],self.store.state);b=compile_prompt(self.store.state['recipes'][0],self.store.state);self.assertEqual(a,b)
 def test_override_exact(self):
  h=self.call('handoff.create',{'recipe_id':self.r,'style_override':'A precise custom style.'});self.assertEqual(h['prompt']['style'],'A precise custom style.');self.assertTrue(h['prompt']['has_override'])
 def test_override_whitespace_preserved(self):
  raw='  Exact text.\nWith a deliberate break.  ';h=self.call('handoff.create',{'recipe_id':self.r,'style_override':raw});self.assertEqual(h['prompt']['style'],raw)
 def test_no_silent_truncation(self):self.failcode('prompt_over_budget',lambda:self.call('handoff.create',{'recipe_id':self.r,'style_override':'x'*1001}))
 def test_lyrics_limit(self):self.failcode('validation_error',lambda:self.call('recipe.update',{'recipe_id':self.r,'patch':{'lyrics':'x'*5001}}))
 def test_variation_parent_unchanged(self):
  before=copy.deepcopy(self.store.state['recipes'][0]);v=self.call('variation.apply',{'recipe_id':self.r,'transformation':'horn-led'});self.assertEqual(before,self.store.state['recipes'][0]);self.assertEqual(v['parent']['revision'],1);self.assertEqual(v['sections'][0],before['sections'][0])
 def test_section_role_overrides(self):
  v=self.call('variation.apply',{'recipe_id':self.r,'transformation':'horn-led'});s=next(s for s in v['sections'] if s['id']=='expansion');self.assertEqual(s['roles']['p6'],'lead')
 def test_pinned_lead_protected(self):self.failcode('locked_field',lambda:self.call('variation.apply',{'recipe_id':self.r,'transformation':'bowed-lead'}))
 def test_unpin_then_change(self):
  self.call('recipe.section.update',{'recipe_id':self.r,'section_id':'opening','patch':{'locked':False}});v=self.call('variation.apply',{'recipe_id':self.r,'transformation':'bowed-lead'});self.assertEqual(v['parts'][0]['instrument'],'erhu');self.assertIn('erhu',v['sections'][0]['description'])
 def test_locked_part_update(self):self.failcode('locked_field',lambda:self.call('recipe.part.update',{'recipe_id':self.r,'part_id':'p1','patch':{'instrument':'erhu'}}))
 def test_rhythm_pinned(self):self.failcode('locked_field',lambda:self.call('recipe.update',{'recipe_id':self.r,'patch':{'bpm':80}}))
 def test_stale_sequence(self):self.failcode('stale_revision',lambda:self.call('recipe.create',{'title':'No'},seq=999))
 def test_idempotent_replay(self):
  env=dict(operation='recipe.create',input={'title':'Exactly once'},expected_sequence=0,idempotency_key='same');a=self.store.command(env);b=self.store.command(env);self.assertEqual(a,b);self.assertEqual(len(self.store.state['recipes']),3);self.assertEqual(self.store.state['sequence'],1)
 def test_idempotency_conflict(self):
  self.call('recipe.create',{'title':'First'},key='same');self.failcode('idempotency_conflict',lambda:self.call('recipe.create',{'title':'Second'},key='same'))
 def test_handoff_immutable_recipe_snapshot(self):
  h=self.call('handoff.create',{'recipe_id':self.r});self.call('recipe.update',{'recipe_id':self.r,'patch':{'title':'Changed'}});self.assertEqual(self.store.state['handoffs'][0]['recipe_snapshot']['title'],'Sarod on the Ridgeline');self.assertEqual(h['external_calls'],0)
 def test_submission_state_user_attested(self):
  h=self.call('handoff.create',{'recipe_id':self.r});h=self.call('handoff.record_submission',{'handoff_id':h['id'],'actual_style':'Actual pasted text'});self.assertEqual(h['actual_submission']['evidence'],'user_attestation');self.assertEqual(h['prompt']['style_count'],766)
 def test_live_render_explicitly_not_implemented(self):self.failcode('not_implemented',lambda:self.call('generation.submit',{}));self.assertEqual(self.store.state['sequence'],0)
 def test_bad_url_rejected(self):self.failcode('validation_error',lambda:self.call('take.link',{'recipe_id':self.r,'url':'javascript:alert(1)'}))
 def test_link_only_no_waveform(self):
  t=self.call('take.link',{'recipe_id':self.r,'url':'https://suno.com/song/example'});self.assertIsNone(t['audio']);self.assertIsNone(t['duration']);self.failcode('validation_error',lambda:self.call('moment.create',{'take_id':t['id'],'start':0,'end':1,'title':'No'}))
 def test_moment_bounds(self):self.failcode('validation_error',lambda:self.call('moment.create',{'take_id':'take_diag_a','start':5,'end':30,'title':'No'}))
 def test_moment_to_recipe_no_audio_copy(self):
  m=self.call('moment.create',{'take_id':'take_diag_a','start':6,'end':12,'title':'Answer','note':'Keep the handoff'});r=self.call('moment.to_variation',{'moment_id':m['id']});self.assertEqual(r['reference_moment'],m['id']);self.assertEqual(len(self.store.state['takes']),2)
 def test_voice_metadata_not_singing_identity(self):
  b={'schema':'voice-lab.promotion-bundle','schema_version':'1.0','bundle_id':'example','voices':[{'id':'example','name':'Example','provider':'diagnostic','voice_id':'not-a-real-voice','status':'locked','styles':{'default':'warm'},'default_mood':'default'}]};self.call('voice.bundle.import',{'bundle':b});v=self.store.state['voice_bindings'][0];self.assertEqual(v['singing_status'],'unverified');self.assertEqual(v['allowed_operation'],'speech')
 def test_voice_binding_conflict(self):
  b={'schema':'voice-lab.promotion-bundle','schema_version':'1.0','voices':[{'id':'example','name':'Example','provider':'diagnostic','voice_id':'one','status':'locked','styles':{'default':'warm'},'default_mood':'default'}]};self.call('voice.bundle.import',{'bundle':b});b['voices'][0]['voice_id']='two';self.failcode('voice_binding_conflict',lambda:self.call('voice.bundle.import',{'bundle':b}));self.assertEqual(self.store.state['voice_bindings'][0]['voice_id'],'one')
 def test_singer_profile_is_direction(self):
  s=self.call('singer.update',{'singer_id':'singer_ember','patch':{'character':'Warm and smooth'}});self.assertEqual(s['identity_status'],'direction_only')
 def test_vocal_cast_removes_conflicting_excludes(self):
  self.call('recipe.update',{'recipe_id':self.r,'patch':{'vocal_mode':'solo','singer_ids':['singer_ember']}});p=compile_prompt(self.store.state['recipes'][0],self.store.state);self.assertNotIn('singing',p['excludes']);self.assertIn('Warm alto',p['style']);self.assertLessEqual(p['style_count'],1000)
 def test_state_survives_reload(self):
  self.call('recipe.create',{'title':'Persisted'});second=Store(self.store.path);self.assertEqual(second.state,self.store.state)
 def test_mutation_rollback(self):
  before=copy.deepcopy(self.store.state);self.failcode('validation_error',lambda:self.call('recipe.update',{'recipe_id':self.r,'patch':{'unknown':10}}));self.assertEqual(before,self.store.state)
 def test_export_never_contains_local_credential(self):
  public=self.store.public();self.assertNotIn('receipts',public);self.assertNotIn('token',json.dumps(public).lower())
 def test_horn_addition_assigns_section_lead(self):
  v=self.call('variation.apply',{'recipe_id':'recipe_rivers','transformation':'horn-led'});p=next(p for p in v['parts'] if p['instrument']=='horns');sec=next(s for s in v['sections'] if s['id']=='expansion');self.assertEqual(sec['roles'][p['id']],'lead')
 def test_chamber_removes_dangling_role_overrides(self):
  v=self.call('variation.apply',{'recipe_id':self.r,'transformation':'horn-led'});c=self.call('variation.apply',{'recipe_id':v['id'],'transformation':'chamber'});ids={p['id'] for p in c['parts']};self.assertTrue(all(set(s.get('roles',{}))<=ids for s in c['sections']))
if __name__=='__main__':unittest.main()
