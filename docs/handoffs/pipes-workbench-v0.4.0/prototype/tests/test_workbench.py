import copy, hashlib, json, math, tempfile, unittest, sys, wave
from pathlib import Path
from app.domain import Store, DomainError, digest
from app.workbench import bundled, compile_story
from pipes_mcp.story import compile_symbolic, midi_bytes, midi_inventory, diagnostic_wav

class WorkbenchTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.shared=tempfile.TemporaryDirectory();s=Store(Path(cls.shared.name)/'workspace.json')
  s.command(dict(operation='workbench.seed',input={},expected_sequence=0,idempotency_key='seed'))
  cls.baseline=copy.deepcopy(s.state)
 @classmethod
 def tearDownClass(cls):cls.shared.cleanup()
 def setUp(self):
  self.t=tempfile.TemporaryDirectory();self.s=Store(Path(self.t.name)/'workspace.json');self.s.state=copy.deepcopy(self.baseline);self.c=0
 def tearDown(self):self.t.cleanup()
 def call(self,op,d=None,seq=None,key=None):
  self.c+=1;return self.s.command(dict(operation=op,input=d or {},expected_sequence=self.s.state['sequence'] if seq is None else seq,idempotency_key=key or 'new-'+str(self.c)))
 def fail(self,code,op,d):
  before=copy.deepcopy(self.s.state)
  with self.assertRaises(DomainError) as err:self.call(op,d)
  self.assertEqual(err.exception.code,code);self.assertEqual(before,self.s.state)
 def story(self,id='story_rowan_return'):return next(x for x in self.s.state['workbench']['stories'] if x['id']==id)
 def test_source_inventory_and_full_origin(self):
  x=bundled();self.assertEqual(x['takes'][0]['duration'],194.8);self.assertEqual(x['midi']['note_count'],434);self.assertEqual(x['midi']['origin_seconds'],0);self.assertAlmostEqual(x['midi']['first_note_seconds'],25.360417,5)
 def test_separate_approved_reference_and_authored_sketch(self):
  ms={m['id']:m for m in self.s.state['workbench']['motifs']};self.assertIsNone(ms['motif_rowan_theme']['symbolic']);self.assertEqual(ms['motif_rowan_sketch']['symbolic']['pitches'],[62,66,69,71,69,66])
 def test_context_peak_includes_complete_phrase_and_early_callback(self):
  p=self.call('workbench.context',{'ids':['occ_rise']});ids={x['id'] for x in p['items']};self.assertTrue({'occ_rise','occ_return','occ_first','take_rowan_original'}<=ids)
 def test_context_cycles_terminate(self):
  self.call('relationship.create',{'source_id':'occ_first','target_id':'occ_rise','kind':'recalls'})
  p=self.call('workbench.context',{'ids':['occ_rise']});self.assertEqual(len({x['id'] for x in p['items']}),len(p['items']))
 def test_context_limits_disclosed(self):
  p=self.call('workbench.context',{'ids':['occ_rise'],'limit':1});self.assertEqual(len(p['items']),1);self.assertTrue(p['omitted'])
 def test_unknown_context_rejected(self):self.fail('validation_error','workbench.context',{'ids':['made-up']})
 def test_search_has_inclusion_reasons(self):
  r=self.call('workbench.search',{'query':'heart','project_id':'project_rowan_reach'});self.assertTrue(r['results']);self.assertTrue(all(x['why'].startswith('Matches') for x in r['results']))
 def test_subproject_search_excludes_unrelated_culture(self):
  p=self.call('project.create',{'title':'Elsewhere','parent_id':'project_long_becoming'});self.call('capture.create',{'project_id':p['id'],'text':'A yearning note nowhere else'})
  rs=self.call('workbench.search',{'query':'yearning','project_id':'project_rowan_reach'});self.assertFalse(any(x['record'].get('project_id')==p['id'] for x in rs['results']))
 def test_inherited_world_motif_search(self):
  r=self.call('workbench.search',{'query':'world','project_id':'project_rowan_reach'});self.assertTrue(any(x['id']=='motif_world' for x in r['results']))
 def test_capture_needs_no_project(self):
  x=self.call('capture.create',{'text':'Something to keep, not to act on.'});self.assertIsNone(x['project_id']);self.assertEqual(x['status'],'unfiled')
 def test_concept_needs_no_notes(self):
  m=self.call('motif.create',{'project_id':'project_rowan_reach','title':'Not yet ready to name the feeling','kind':'expressive_arc'});self.assertIsNone(m['symbolic'])
 def test_cannot_mark_new_notes_verified(self):self.fail('validation_error','motif.create',{'project_id':'project_rowan_reach','title':'Fake','symbolic':{'status':'human_verified_score','pitches':[62],'durations':[1]}})
 def test_create_project_under_unknown_parent_rejected(self):self.fail('not_found','project.create',{'title':'No','parent_id':'unknown'})
 def test_story_clock_cannot_be_relabelled_as_observed(self):self.fail('validation_error','story.update',{'story_id':'story_rowan_return','expected_revision':1,'patch':{'clock':'recording_seconds'}})
 def test_story_branch_leaves_original(self):
  old=copy.deepcopy(self.story());new=self.call('story.create',{'source_story_id':old['id'],'title':'Alternative','project_id':old['project_id']});self.assertEqual(self.story(),old);self.assertEqual(new['parent_story'],{'id':old['id'],'revision':1})
 def test_story_stale_revision_rejected(self):self.fail('stale_story','story.update',{'story_id':'story_rowan_return','expected_revision':99,'patch':{'title':'Late'}})
 def test_story_edit_retains_history(self):
  self.call('story.update',{'story_id':'story_rowan_return','expected_revision':1,'patch':{'title':'Altered'}});self.assertEqual(self.story()['revision'],2);self.assertEqual(self.s.state['workbench']['story_history'][-1]['title'],'Paint the Rowan Return')
 def test_lock_blocks_geometry_until_explicit_unlock(self):
  events=copy.deepcopy(self.story()['events']);events[0]['locked']=True
  self.call('story.update',{'story_id':'story_rowan_return','expected_revision':1,'patch':{'events':events}})
  changed=copy.deepcopy(events);changed[0]['start']=.06
  self.fail('locked_field','story.update',{'story_id':'story_rowan_return','expected_revision':2,'patch':{'events':changed}})
  self.call('story.unlock',{'story_id':'story_rowan_return','expected_revision':2,'event_id':events[0]['id']});self.assertFalse(self.story()['events'][0]['locked'])
 def test_story_foreign_event_ref_rejected(self):self.fail('validation_error','story.update',{'story_id':'story_rowan_return','expected_revision':1,'patch':{'relationships':[{'source_id':'no','target_id':'se_first','kind':'recalls'}]}})
 def test_nan_rejected(self):
  es=copy.deepcopy(self.story()['events']);es[0]['start']=float('nan');self.fail('validation_error','story.update',{'story_id':'story_rowan_return','expected_revision':1,'patch':{'events':es}})
 def test_prompt_compile_deterministic_and_limits(self):
  a=self.call('story.compile',{'story_id':'story_rowan_return'});b=self.call('story.compile',{'story_id':'story_rowan_return'});self.assertEqual(a,b);self.assertLessEqual(a['prompt']['style_count'],1000);self.assertLessEqual(a['prompt']['lyrics_count'],5000);self.assertNotIn('banjo lead',a['prompt']['style'])
 def test_prompt_overflow_not_silently_truncated(self):
  self.call('story.update',{'story_id':'story_rowan_return','expected_revision':1,'patch':{'style_base':'x'*1100}})
  self.fail('prompt_over_budget','story.compile',{'story_id':'story_rowan_return'})
 def test_exact_rowan_render_blocks_unknown_melody(self):
  a=self.call('story.score',{'story_id':'story_rowan_return'});self.assertEqual(a['status'],'blocked_missing_notation');self.assertFalse(a['audio_rendered'])
  self.fail('missing_notation','story.render',{'story_id':'story_rowan_return','expected_revision':1});self.assertFalse((Path(self.t.name)/'renders').exists())
 def test_authored_score_render_and_midi_roundtrip(self):
  r=self.call('story.render',{'story_id':'story_original_sketch','expected_revision':1,'bpm':80,'total_beats':48})
  self.assertEqual(r['external_calls'],0);self.assertFalse(r['instrument_realism'])
  mid=Path(self.t.name)/'renders'/r['midi'].split('/')[-1];data=midi_inventory(mid);self.assertEqual(data['note_count'],14)
  wav=Path(self.t.name)/'renders'/r['audio'].split('/')[-1]
  with wave.open(str(wav)) as w:self.assertAlmostEqual(w.getnframes()/w.getframerate(),36.25,3)
  self.assertEqual(len(self.s.state['takes']),3)
 def test_render_limit(self):self.fail('score_validation','story.render',{'story_id':'story_original_sketch','expected_revision':1,'bpm':30,'total_beats':160})
 def test_packet_frozen_and_context_linked(self):
  p=self.call('story.prepare',{'story_id':'story_rowan_return','expected_revision':1});h=self.s.state['handoffs'][-1];snapshot=copy.deepcopy(h)
  self.call('story.update',{'story_id':'story_rowan_return','expected_revision':1,'patch':{'title':'Later draft'}})
  self.assertEqual(h,snapshot);self.assertEqual(h['status'],'prepared');self.assertEqual(p['status'],'prepared_not_submitted')
  work=next(x for x in self.s.state['workbench']['works'] if x['id']==p['work_id']);self.assertIn(p['recipe_id'],work['recipe_ids'])
 def test_returned_take_joins_work_without_media_duplicate(self):
  p=self.call('story.prepare',{'story_id':'story_rowan_return','expected_revision':1})
  t=self.call('take.link',{'recipe_id':p['recipe_id'],'url':'https://suno.com/song/example','title':'Linked result'})
  work=next(x for x in self.s.state['workbench']['works'] if x['id']==p['work_id']);self.assertIn(t['id'],work['take_ids']);self.assertIsNone(t['audio'])
 def test_review_does_not_change_reference_approval(self):
  old=copy.deepcopy(self.s.state['takes'][-1]);r=self.call('workbench.review',{'target_id':'take_rowan_original','text':'Keep this feeling','verdict':'keep'});self.assertFalse(r['changes_canonical_status']);self.assertEqual(self.s.state['takes'][-1],old)
 def test_occurrence_stays_within_audio(self):self.fail('validation_error','occurrence.create',{'take_id':'take_rowan_original','work_id':'work_rowan_canopy','motif_id':'motif_rowan_theme','title':'Too far','start':190,'end':200})
 def test_new_occurrence_is_report_not_score_fact(self):
  o=self.call('occurrence.create',{'take_id':'take_rowan_original','work_id':'work_rowan_canopy','motif_id':'motif_rowan_theme','title':'Listen here','start':85,'end':112});self.assertEqual(o['evidence'],'human_report')
 def test_render_receipt_idempotency(self):
  seq=self.s.state['sequence'];d={'story_id':'story_original_sketch','expected_revision':1};a=self.call('story.render',d,seq,'same-render');b=self.call('story.render',d,seq,'same-render');self.assertEqual(a,b);self.assertEqual(len(self.s.state['workbench']['render_jobs']),1)
 def test_original_source_hash_unchanged(self):
  p=Path(__file__).parents[1]/'study_inputs/rowan-original.wav';self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),bundled()['takes'][0]['sha256'])
 def test_malformed_midi_rejected(self):
  p=Path(self.t.name)/'bad.mid';p.write_bytes(b'MThd'+b'\x00'*10)
  with self.assertRaises(ValueError):midi_inventory(p)
 def test_store_survives_restart(self):
  self.call('capture.create',{'text':'Persist this'});s2=Store(self.s.path);self.assertEqual(s2.state,self.s.state)
if __name__=='__main__':unittest.main()
