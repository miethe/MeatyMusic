import base64,hashlib,json,os,socket,subprocess,sys,tempfile,time,unittest
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from urllib.parse import urlencode
ROOT=Path(__file__).resolve().parents[1]
class TransportTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory();sock=socket.socket();sock.bind(('127.0.0.1',0));cls.port=sock.getsockname()[1];sock.close();cls.base=f'http://127.0.0.1:{cls.port}'
  cls.proc=subprocess.Popen([sys.executable,str(ROOT/'serve.py'),'--port',str(cls.port),'--data-dir',cls.tmp.name],stdout=subprocess.DEVNULL)
  for _ in range(100):
   try:
    with urlopen(cls.base+'/api/health',timeout=.2):break
   except Exception:time.sleep(.04)
  cls.token=(Path(cls.tmp.name)/'.session-token').read_text().strip()
 @classmethod
 def tearDownClass(cls):cls.proc.terminate();cls.proc.wait(timeout=5);cls.tmp.cleanup()
 def req(self,path,body=None,headers=None,method=None):
  data=json.dumps(body).encode() if isinstance(body,dict) else body
  h={'Authorization':'Bearer '+self.token};h.update(headers or {})
  try:
   with urlopen(Request(self.base+path,data=data,headers=h,method=method),timeout=5) as res:return res.status,res.read(),dict(res.headers)
  except HTTPError as ex:return ex.code,ex.read(),dict(ex.headers)
 def test_health_no_provider_claim(self):
  status,b,_=self.req('/api/health');self.assertEqual(status,200);self.assertFalse(json.loads(b)['live_generation'])
 def test_implemented_openapi_available(self):
  status,b,_=self.req('/api/openapi.json');self.assertEqual(status,200);doc=json.loads(b);self.assertEqual(doc['openapi'],'3.1.0');self.assertIn('/api/commands',doc['paths'])
 def test_state_requires_auth(self):self.assertEqual(self.req('/api/state',headers={'Authorization':'wrong'})[0],401)
 def test_cross_origin_denied(self):self.assertEqual(self.req('/api/commands',{'operation':'workspace.get'},headers={'Origin':'https://evil.example'})[0],403)
 def test_host_denied(self):self.assertEqual(self.req('/api/state',headers={'Host':'evil.example'})[0],403)
 def test_index_has_cookie_and_csrf(self):
  status,b,h=self.req('/');self.assertEqual(status,200);self.assertIn('HttpOnly',h['Set-Cookie']);self.assertIn(self.token.encode(),b)
 def test_unsupported_generation_is_501(self):
  seq=json.loads(self.req('/api/state')[1])['sequence'];self.assertEqual(self.req('/api/commands',{'operation':'generation.submit','input':{},'idempotency_key':'unsupported','expected_sequence':seq})[0],501)
 def test_cannot_register_arbitrary_server_path(self):self.assertEqual(self.req('/api/commands',{'operation':'take.register','input':{'audio':'/etc/passwd'}})[0],403)
 def test_invalid_audio_signature(self):
  self.assertEqual(self.req('/api/uploads',b'not audio',headers={'Idempotency-Key':'badmedia'})[0],422)
 def test_upload_original_hash_and_range(self):
  seq=json.loads(self.req('/api/state')[1])['sequence'];raw=(ROOT/'static/fixtures/diagnostic-a.wav').read_bytes();qs=urlencode(dict(recipe_id='recipe_ridgeline',title='Imported fixture',name='test.wav',duration=24,sequence=seq));status,b,_=self.req('/api/uploads?'+qs,raw,{'Idempotency-Key':'uploadtest'});self.assertEqual(status,200);t=json.loads(b)['result'];self.assertEqual(t['sha256'],hashlib.sha256(raw).hexdigest());self.assertEqual(t['duration'],24)
  status,chunk,h=self.req(t['audio'],headers={'Range':'bytes=0-99'});self.assertEqual(status,206);self.assertEqual(chunk,raw[:100]);self.assertIn('bytes 0-99',h['Content-Range'])
 def test_cli_compiler(self):
  env=os.environ.copy();env.update(MM_URL=self.base,MM_DATA_DIR=self.tmp.name)
  result=subprocess.run([sys.executable,str(ROOT/'tools/music.py'),'capabilities'],env=env,capture_output=True,text=True,timeout=8);self.assertEqual(result.returncode,0);self.assertFalse(json.loads(result.stdout)['live_generation'])
 def test_mcp_lifecycle_and_compile(self):
  env=os.environ.copy();env.update(MM_URL=self.base,MM_DATA_DIR=self.tmp.name)
  msgs=[{'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2025-11-25','capabilities':{},'clientInfo':{'name':'test','version':'1'}}},{'jsonrpc':'2.0','method':'notifications/initialized'},{'jsonrpc':'2.0','id':2,'method':'tools/list'},{'jsonrpc':'2.0','id':3,'method':'tools/call','params':{'name':'music_compile','arguments':{'recipe_id':'recipe_ridgeline'}}}]
  p=subprocess.run([sys.executable,str(ROOT/'tools/mcp_stdio.py')],env=env,input='\n'.join(map(json.dumps,msgs))+'\n',capture_output=True,text=True,timeout=8);self.assertEqual(p.returncode,0);responses=list(map(json.loads,p.stdout.splitlines()));self.assertEqual(len(responses),3);self.assertEqual(responses[0]['result']['protocolVersion'],'2025-11-25');self.assertEqual(len(responses[1]['result']['tools']),28);self.assertFalse(responses[2]['result']['isError']);self.assertLessEqual(responses[2]['result']['structuredContent']['style_count'],1000)
 def test_workbench_contract_and_seed_media(self):
  status,b,_=self.req('/api/workbench-contract.json');self.assertEqual(status,200);self.assertEqual(json.loads(b)['$schema'],'https://json-schema.org/draft/2020-12/schema')
  seq=json.loads(self.req('/api/state')[1])['sequence']
  status,b,_=self.req('/api/commands',{'operation':'workbench.seed','input':{},'expected_sequence':seq,'idempotency_key':'transport-rowan-seed'})
  self.assertEqual(status,200)
  state=json.loads(self.req('/api/state')[1]);take=next(t for t in state['takes'] if t['id']=='take_rowan_original')
  status,chunk,h=self.req(take['audio'],headers={'Range':'bytes=0-43'});self.assertEqual(status,206);self.assertEqual(chunk[:4],b'RIFF');self.assertEqual(len(chunk),44)
 def test_mcp_new_workbench_tools(self):
  env=os.environ.copy();env.update(MM_URL=self.base,MM_DATA_DIR=self.tmp.name)
  seq=json.loads(self.req('/api/state')[1])['sequence']
  msgs=[{'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2025-11-25','capabilities':{},'clientInfo':{'name':'test','version':'1'}}},{'jsonrpc':'2.0','method':'notifications/initialized'},{'jsonrpc':'2.0','id':2,'method':'tools/call','params':{'name':'music_capture_thought','arguments':{'text':'A new melody can wait for its project.','expected_sequence':seq,'idempotency_key':'mcp-capture'}}},{'jsonrpc':'2.0','id':3,'method':'tools/call','params':{'name':'music_find_materials','arguments':{'query':'melody'}}}]
  p=subprocess.run([sys.executable,str(ROOT/'tools/mcp_stdio.py')],env=env,input='\n'.join(map(json.dumps,msgs))+'\n',capture_output=True,text=True,timeout=10)
  self.assertEqual(p.returncode,0);out=[json.loads(x) for x in p.stdout.splitlines()];self.assertFalse(out[1]['result']['isError']);self.assertFalse(out[2]['result']['isError'])
  self.assertIn('A new melody can wait',json.dumps(out[2]));self.assertIsNone(out[1]['result']['structuredContent']['project_id'])
if __name__=='__main__':unittest.main()
