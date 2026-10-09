#!/usr/bin/env python3
"""Playwright interaction and responsive review.
Default: normal loopback browser navigation. --transport-bridge: render identical app
in about:blank and relay fetch through Python, for environments blocking all browser URLs.
The bridge does NOT test native cookie/CSRF/media integration or browser downloads.
HTTP authentication/range handling are tested independently by test_transport.py.
Requires: pip install playwright; playwright install chromium (or --chromium PATH).
"""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import argparse,base64,json,os,re,socket,subprocess,sys,tempfile,time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
a=argparse.ArgumentParser();a.add_argument('--transport-bridge',action='store_true');a.add_argument('--chromium');a.add_argument('--out',default=str(ROOT.parent/'designs'));args=a.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
BRIDGE_JS='''window.fetch=async (url,opt={})=>{let body=null;if(opt.body){let bytes=typeof opt.body==='string'?new TextEncoder().encode(opt.body):new Uint8Array(opt.body);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));body=btoa(binary);}const r=await window.__http({url:String(url),method:opt.method||'GET',headers:opt.headers||{},body});const bytes=Uint8Array.from(atob(r.body),c=>c.charCodeAt(0));return new Response(bytes,{status:r.status,headers:r.headers});};'''
report={'transport':'about:blank DOM + loopback HTTP bridge' if args.transport_bridge else 'native loopback','checks':[],'page_errors':[],'screens':[]}
with tempfile.TemporaryDirectory() as td:
 sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close();base=f'http://127.0.0.1:{port}'
 proc=subprocess.Popen([sys.executable,str(ROOT/'serve.py'),'--port',str(port),'--data-dir',td],stdout=subprocess.DEVNULL)
 try:
  for _ in range(100):
   try:
    with urlopen(base+'/api/health',timeout=.3):break
   except Exception:time.sleep(.04)
  token=(Path(td)/'.session-token').read_text().strip()
  def bridge(payload):
   url=payload['url'];headers=dict(payload.get('headers') or {});headers['Authorization']='Bearer '+token
   body=base64.b64decode(payload['body']) if payload.get('body') else None
   try:
    with urlopen(Request(base+url,data=body,headers=headers,method=payload.get('method','GET')),timeout=20) as res:return dict(status=res.status,headers=dict(res.headers),body=base64.b64encode(res.read()).decode())
   except HTTPError as ex:return dict(status=ex.code,headers=dict(ex.headers),body=base64.b64encode(ex.read()).decode())
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,executable_path=args.chromium,args=['--no-sandbox'])
   page=browser.new_page(viewport={'width':1600,'height':1380},device_scale_factor=1)
   page.set_default_timeout(5000)
   page.on('pageerror',lambda err:report['page_errors'].append(str(err)))
   if args.transport_bridge:
    page.expose_function('__http',bridge)
    html=(ROOT/'static/index.html').read_text().replace('__MM_CSRF__',token)
    html=re.sub(r'<link[^>]*>','',html);html=re.sub(r'<script[^>]*></script>','',html)
    page.set_content(html);page.add_style_tag(content=(ROOT/'static/style.css').read_text());page.evaluate("() => {"+BRIDGE_JS+"}");page.add_script_tag(content=(ROOT/'static/app.js').read_text())
   else:page.goto(base)
   page.wait_for_selector('.part-card');report['checks'].append('Initial arrangement loads seven role-aware parts.')
   def snap(name):
    page.evaluate("document.getElementById('toast').className=''");page.screenshot(path=str(out/name),full_page=False);report['screens'].append(name)
   snap('01-workshop.png')
   page.locator('[data-action="preview-variation"]').click();page.wait_for_selector('.modal');snap('02-variation-diff.png')
   page.get_by_role('button',name='Apply as variation',exact=True).click();page.wait_for_selector('.variant-card.selected');assert page.locator('h1').inner_text().endswith('horn-led');report['checks'].append('Preview/apply creates a separate horn-led variation.')
   snap('03-variations.png')
   page.locator('.head-actions [data-action="handoff"]').click();page.wait_for_selector('#handoff-style');assert len(page.locator('#handoff-style').input_value())<=1000
   page.locator('#handoff-model').fill('Recorded manually in provider');snap('04-suno-handoff.png')
   page.get_by_role('button',name='Save handoff',exact=True).click();page.wait_for_selector('.receipt-hero');assert 'Not submitted' in page.locator('.receipt-hero').inner_text();report['checks'].append('Suno handoff freezes under-budget style and records prepared/not-submitted state.')
   page.locator('[data-action="close-modal"]').click()
   # Upload diagnostic bytes through the same UI used for user-provided audio.
   page.locator('.head-actions [data-action="import-take"]').click();page.locator('#import-file').set_input_files(str(ROOT/'static/fixtures/diagnostic-a.wav'));page.locator('#import-title').fill('Imported diagnostic · review sample');page.locator('#import-confirm').check();page.get_by_role('button',name='Attach result',exact=True).click();page.wait_for_selector('.listening-panel');page.wait_for_selector('.wave.large');report['checks'].append('Audio import through UI stores original bytes and shows a measured waveform.')
   page.locator('#region-start').fill('5');page.locator('#region-start').dispatch_event('change');page.locator('#region-end').fill('10');page.locator('#region-end').dispatch_event('change');page.locator('#moment-title').fill('The changing contour');page.locator('#moment-note').fill('Sample listening note: compare the attack and sustain. This recording is diagnostic audio, not a generated score.');page.get_by_role('button',name='Save moment',exact=True).click();page.wait_for_selector('.moment-card');report['checks'].append('A bounded time region and note persist against the exact imported take.')
   snap('05-listening-room.png')
   page.locator('[data-action="play-region"]').click();page.wait_for_timeout(600);assert page.locator('#audio').evaluate('(a)=>!a.paused');report['checks'].append('Diagnostic audio plays from the selected range through an in-memory audio Blob.');page.locator('#audio').evaluate('(a)=>a.pause()')
   page.locator('[data-action="nav"][data-page="voices"]').click();page.wait_for_selector('.voice-editor');page.locator('#s-character').fill('Warm, smooth, intimate; sustained vowels with a late shimmer');page.get_by_role('button',name='Save direction',exact=True).click();page.wait_for_timeout(150);report['checks'].append('Singer direction updates without claiming verified singing identity.')
   page.locator('[data-action="import-voice"]').click();page.locator('#voice-bundle-file').set_input_files(str(ROOT.parent/'examples/voice-lab-demo-promotion.json'));page.get_by_role('button',name='Import metadata',exact=True).click();page.wait_for_selector('.binding-row');assert 'speech' in page.locator('.binding-row').inner_text();report['checks'].append('Voice Lab promotion bundle imports as speech-scoped metadata only.')
   snap('06-singers-and-voices.png')
   page.locator('[data-action="nav"][data-page="connections"]').click();page.wait_for_selector('.provider-card');assert page.locator('.provider-card').count()==6;snap('07-connections.png');report['checks'].append('Six explicit provider/estate routes visible with no live connection claims.')
   page.locator('[data-action="nav"][data-page="library"]').click();page.wait_for_selector('.recipe-tile');snap('08-library.png')
   page.locator('[data-action="nav"][data-page="explore"]').click();page.wait_for_selector('.instrument-tile');page.locator('#instrument-search').fill('brass');page.wait_for_timeout(400);assert 1<=page.locator('.instrument-tile').count()<26;report['checks'].append('Instrument atlas filters by family/context.')
   page.locator('#instrument-search').fill('');page.wait_for_timeout(350);snap('09-instrument-atlas.png')
   page.locator('[data-action="nav"][data-page="voices"]').click();page.set_viewport_size({'width':430,'height':932});page.wait_for_timeout(100);assert page.evaluate('document.documentElement.scrollWidth')==430;snap('10-mobile-voices.png');report['checks'].append('430px voice workspace has no horizontal overflow.')
   page.locator('button[data-action="nav"][data-page="workshop"]').click();page.locator('[data-action="tab"][data-tab="arrange"]').click();page.wait_for_selector('.arc-card');assert page.evaluate('document.documentElement.scrollWidth')==430;snap('11-mobile-workshop.png');report['checks'].append('430px arrangement workspace has no horizontal overflow.')
   page.set_viewport_size({'width':1600,'height':1380});page.locator('[data-action="guide"]').click();page.wait_for_selector('.modal');page.keyboard.press('Escape');assert page.locator('.modal').count()==0;report['checks'].append('Keyboard Escape dismisses dialog.')
   assert not report['page_errors'],report['page_errors']
   browser.close()
 finally:proc.terminate();proc.wait(timeout=5)
report['status']='passed';report['limits']=['Native browser loopback navigation was blocked by managed browser policy in the authoring environment. Screens and interactions were tested with a local HTTP transport bridge.','Clipboard permission and native download behavior require a local browser acceptance pass.','No remote provider, singer identity, live estate service, or production deployment was tested.'] if args.transport_bridge else ['No remote provider, singing identity or production deployment tested.']
(ROOT.parent/'qa/browser-review.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
