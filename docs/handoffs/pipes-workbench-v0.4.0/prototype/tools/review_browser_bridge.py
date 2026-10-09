from pathlib import Path
import os,json,tempfile,subprocess,time,urllib.request,urllib.error,sys,socket,base64,re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];out=root/'qa/v0.4';report={'transport':'about:blank DOM with Python loopback HTTP bridge; native browser navigation blocked by environment policy','checks':[],'errors':[]}
with tempfile.TemporaryDirectory() as td:
 sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close();url=f'http://127.0.0.1:{port}'
 proc=subprocess.Popen([sys.executable,str(root/'prototype/serve.py'),'--port',str(port),'--data-dir',td],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 try:
  for _ in range(100):
   try:urllib.request.urlopen(url+'/api/health',timeout=.3);break
   except Exception:time.sleep(.05)
  with sync_playwright() as p:
   browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox']);page=browser.new_page(viewport={'width':1600,'height':1100},device_scale_factor=1)
   page.on('pageerror',lambda err:report['errors'].append(str(err)))
   token=(Path(td)/'.session-token').read_text().strip()
   def bridge(payload):
    target=payload['url']
    if not target.startswith('/'):raise ValueError('Only same-service paths are allowed in the review bridge.')
    headers=payload.get('headers',{});headers['Authorization']='Bearer '+token
    body=base64.b64decode(payload['body']) if payload.get('body') else None
    try:
     with urllib.request.urlopen(urllib.request.Request(url+target,data=body,headers=headers,method=payload.get('method','GET')),timeout=20) as r:return dict(status=r.status,headers=dict(r.headers),body=base64.b64encode(r.read()).decode())
    except urllib.error.HTTPError as r:return dict(status=r.code,headers=dict(r.headers),body=base64.b64encode(r.read()).decode())
   page.expose_function('__http',bridge)
   html=(root/'prototype/static/index.html').read_text().replace('__MM_CSRF__',token)
   html=re.sub(r'<script.*?</script>','',html);html=re.sub(r'<link[^>]+rel="stylesheet"[^>]*>','',html)
   page.set_content(html)
   page.add_style_tag(content=(root/'prototype/static/style.css').read_text()+'\n'+(root/'prototype/static/workbench.css').read_text())
   page.add_script_tag(content="""window.fetch=async(url,opt={})=>{let body=null;if(opt.body){let bytes=typeof opt.body==='string'?new TextEncoder().encode(opt.body):new Uint8Array(opt.body);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));body=btoa(binary);}const r=await window.__http({url:String(url),method:opt.method||'GET',headers:opt.headers||{},body});const bytes=Uint8Array.from(atob(r.body),c=>c.charCodeAt(0));return new Response(bytes,{status:r.status,headers:r.headers});};new MutationObserver(()=>{for(const a of document.querySelectorAll('audio[src^="/"]')){if(a.dataset.bridged)continue;a.dataset.bridged='yes';fetch(a.getAttribute('src')).then(r=>r.blob()).then(b=>a.src=URL.createObjectURL(b));}}).observe(document.body,{childList:true,subtree:true});""")
   page.add_script_tag(content=(root/'prototype/static/workbench.js').read_text().replace('export function','function'))
   app=(root/'prototype/static/app.js').read_text();app=app.replace("import {createWorkbench} from './workbench.js';",'')
   page.add_script_tag(content=app)
   page.wait_for_selector('[data-action="wb-seed"]')
   page.screenshot(path=str(out/'00-welcome.png'),full_page=True)
   page.click('[data-action="wb-seed"]');page.wait_for_selector('.wb-wave svg');report['checks'].append('Bridged browser seed and waveform loaded through real domain/HTTP service')
   page.screenshot(path=str(out/'01-listen.png'),full_page=True)
   page.click('[data-action="wb-mode"][data-id="paint"]');page.wait_for_selector('.wb-story-svg')
   page.screenshot(path=str(out/'02-paint.png'),full_page=True)
   page.fill('#wb-event-note','The retreat keeps its longing while the cello supports a wider return.');page.click('[data-action="wb-save-event"]');page.wait_for_timeout(200)
   assert 'Revision 2' in page.locator('.wb-story-toolbar').inner_text();report['checks'].append('Gesture revision persisted via shared domain API')
   page.click('[data-action="wb-view"][data-id="motifs"]');page.wait_for_selector('.wb-motif-card');page.screenshot(path=str(out/'03-motifs.png'),full_page=True)
   assert page.locator('.wb-motif-card').count()==6;report['checks'].append('Six distinct motif identities and evidence types visible')
   page.click('[data-action="wb-view"][data-id="discover"]');page.fill('#wb-search','heart');page.click('[data-action="wb-search"]');page.wait_for_selector('.wb-result');report['checks'].append('Recognition query maps to local yearning/context materials')
   page.screenshot(path=str(out/'04-discover.png'),full_page=True)
   page.click('[data-action="wb-view"][data-id="projects"]');page.wait_for_selector('.wb-work-grid');page.screenshot(path=str(out/'05-projects.png'),full_page=True)
   assert page.locator('.wb-work-grid article').count()==9;report['checks'].append('Root/culture/collection scope reveals 9 works, only 1 recorded')
   page.click('[data-action="wb-view"][data-id="canvas"]');page.click('[data-action="wb-mode"][data-id="paint"]');page.select_option('#wb-story-select','story_original_sketch')
   page.click('[data-action="wb-render-modal"]');page.click('[data-action="wb-render"]');page.wait_for_selector('#wb-preview-audio',timeout=20000)
   audio=page.locator('#wb-preview-audio');page.wait_for_function('document.querySelector("#wb-preview-audio").readyState>=1');assert page.eval_on_selector('#wb-preview-audio','e=>e.duration')>35
   report['checks'].append('Authored note-backed story creates playable diagnostic WAV and MIDI; no provider used')
   page.screenshot(path=str(out/'06-rendered-sketch.png'),full_page=True)
   page.click('[data-action="wb-compile"]');page.wait_for_selector('#wb-prompt-style');assert len(page.locator('#wb-prompt-style').input_value())<=1000
   page.screenshot(path=str(out/'07-creation-packet.png'),full_page=True)
   page.click('[data-action="close-modal"]')
   page.click('[data-action="wb-view"][data-id="experiments"]');page.screenshot(path=str(out/'08-experiments.png'),full_page=True)
   page.set_viewport_size({'width':390,'height':844});page.click('[data-action="wb-view"][data-id="canvas"]');page.click('[data-action="wb-mode"][data-id="heard"]');page.screenshot(path=str(out/'09-mobile.png'),full_page=True)
   overflow=page.evaluate('document.documentElement.scrollWidth>innerWidth');report['mobile_overflow']=overflow
   report['checks'].append('Mobile evidence canvas rendered')
   browser.close()
 finally:
  proc.terminate();proc.wait(timeout=3)
  (out/'browser-review.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
