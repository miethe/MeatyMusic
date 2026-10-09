#!/usr/bin/env python3
"""Run the self-contained Sonic Workshop review prototype. Python 3.11+, no packages.
Loopback only. Provider integration and production account authentication are out of scope.
"""
from __future__ import annotations
import argparse, hashlib, io, json, mimetypes, os, secrets, sys, threading, wave
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote
from app.domain import Store, DomainError, canonical, INSTRUMENTS, VERSION

ROOT=Path(__file__).resolve().parent
MAX_UPLOAD=40*1024*1024

def run(port=8786, data_dir=None):
    data=Path(data_dir or ROOT/'data').resolve(); data.mkdir(parents=True,exist_ok=True)
    import fcntl
    lockfile=(data/'.writer-lock').open('w')
    try: fcntl.flock(lockfile,fcntl.LOCK_EX|fcntl.LOCK_NB)
    except BlockingIOError: raise SystemExit('Another prototype server owns this data directory. Use a separate --data-dir.')
    assets=data/'assets'; assets.mkdir(exist_ok=True); store=Store(data/'workspace.json')
    token_file=data/'.session-token'; token=secrets.token_urlsafe(32); token_file.write_text(token); os.chmod(token_file,0o600)
    class Handler(BaseHTTPRequestHandler):
        server_version='SonicWorkshop/'+VERSION
        def log_message(self,fmt,*args): pass  # Never log user text, URLs, cookies, or credentials.
        def headers_common(self):
            self.send_header('X-Content-Type-Options','nosniff'); self.send_header('X-Frame-Options','DENY'); self.send_header('Referrer-Policy','no-referrer'); self.send_header('Cache-Control','no-store')
            self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
        def send_json(self,obj,status=200):
            raw=json.dumps(obj,ensure_ascii=False).encode(); self.send_response(status); self.headers_common(); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(raw))); self.end_headers()
            if self.command!='HEAD': self.wfile.write(raw)
        def allowed(self, api=False):
            host=self.headers.get('Host',''); hosts={f'127.0.0.1:{port}',f'localhost:{port}'}
            if host not in hosts: self.send_json({'error':{'code':'bad_host','message':'Loopback host required.'}},403); return False
            origin=self.headers.get('Origin')
            if origin and origin not in {f'http://{h}' for h in hosts}: self.send_json({'error':{'code':'bad_origin','message':'Same-origin requests only.'}},403); return False
            if api:
                bearer=self.headers.get('Authorization','')=='Bearer '+token
                cookie='mm_session='+token in [c.strip() for c in self.headers.get('Cookie','').split(';')]
                csrf=self.command in ['GET','HEAD'] or self.headers.get('X-MM-CSRF')==token
                if not (bearer or (cookie and csrf)):
                    self.send_json({'error':{'code':'unauthorized','message':'Open the local app or use its local CLI credential.'}},401); return False
            return True
        def do_HEAD(self): self.do_GET()
        def do_GET(self):
            try:
                path=unquote(urlparse(self.path).path)
                if not self.allowed(path.startswith('/api/') and path!='/api/health'): return
                if path=='/api/health': self.send_json(dict(status='ok',version=VERSION,mode='local_review_prototype',live_generation=False)); return
                if path=='/api/state': self.send_json(store.public()); return
                if path=='/api/catalog': self.send_json(dict(instruments=INSTRUMENTS)); return
                if path=='/api/capabilities': self.send_json(store.read('capabilities.get',{})); return
                if path=='/api/workbench-contract.json': self.send_file(ROOT.parent/'contracts'/'workbench-v1.schema.json'); return
                if path=='/api/openapi.json': self.send_file(ROOT.parent/'contracts'/'prototype-openapi.json'); return
                if path.startswith('/api/renders/'):
                    name=path.rsplit('/',1)[-1]
                    if not __import__('re').fullmatch(r'[0-9a-f]{64}\.(wav|mid)',name): self.send_json({'error':{'message':'Unknown render.'}},404); return
                    self.send_file(data/'renders'/name); return
                if path.startswith('/api/audio/'):
                    name=path.rsplit('/',1)[-1]
                    if not __import__('re').fullmatch(r'[0-9a-f]{64}\.(wav|mp3|ogg|flac|m4a)',name): self.send_json({'error':{'message':'Unknown audio artifact.'}},404); return
                    self.send_file(assets/name); return
                if path=='/':
                    raw=(ROOT/'static/index.html').read_text().replace('__MM_CSRF__',token).encode()
                    self.send_response(200); self.headers_common(); self.send_header('Set-Cookie',f'mm_session={token}; HttpOnly; SameSite=Strict; Path=/'); self.send_header('Content-Type','text/html; charset=utf-8'); self.send_header('Content-Length',str(len(raw))); self.end_headers()
                    if self.command!='HEAD': self.wfile.write(raw)
                    return
                target=(ROOT/'static'/path.lstrip('/')).resolve()
                if not target.is_relative_to((ROOT/'static').resolve()): self.send_json({'error':{'message':'Not found.'}},404); return
                self.send_file(target)
            except (BrokenPipeError,ConnectionResetError): pass
            except Exception: self.send_json({'error':{'code':'internal_error','message':'The local server could not serve this resource.'}},500)
        def send_file(self,p):
            if not p.is_file(): self.send_json({'error':{'message':'Not found.'}},404); return
            size=p.stat().st_size; start=0; end=size-1; status=200
            rang=self.headers.get('Range')
            if rang:
                m=__import__('re').fullmatch(r'bytes=(\d+)-(\d*)',rang)
                if not m: self.send_json({'error':{'message':'Unsupported range.'}},416); return
                start=int(m[1]); end=min(int(m[2]) if m[2] else end,end)
                if start>end or start>=size: self.send_json({'error':{'message':'Range outside file.'}},416); return
                status=206
            self.send_response(status); self.headers_common(); self.send_header('Content-Type',mimetypes.guess_type(p.name)[0] or 'application/octet-stream'); self.send_header('Accept-Ranges','bytes'); self.send_header('Content-Length',str(end-start+1))
            if status==206: self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
            self.end_headers()
            if self.command!='HEAD':
                with p.open('rb') as f:
                    f.seek(start); remaining=end-start+1
                    while remaining>0:
                        block=f.read(min(65536,remaining)); self.wfile.write(block); remaining-=len(block)
        def do_POST(self):
            if not self.allowed(True): return
            try:
                path=urlparse(self.path).path; n=int(self.headers.get('Content-Length','0'))
                if path=='/api/commands':
                    if not 0<n<=1_000_000: raise DomainError('too_large','Command exceeds 1 MB.',413)
                    env=json.loads(self.rfile.read(n));
                    if env.get('operation')=='take.register': raise DomainError('forbidden','Use the validated upload route.',403)
                    result=store.command(env); self.send_json(dict(result=result)); return
                if path=='/api/uploads':
                    if not 0<n<=MAX_UPLOAD: raise DomainError('too_large','Select an audio file under 40 MB.',413)
                    qs={k:v[0] for k,v in parse_qs(urlparse(self.path).query).items()}; raw=self.rfile.read(n)
                    ext=None
                    if raw[:4]==b'RIFF' and raw[8:12]==b'WAVE': ext='wav'
                    elif raw[:3]==b'ID3' or len(raw)>2 and raw[0]==255 and raw[1]&224==224: ext='mp3'
                    elif raw[:4]==b'OggS': ext='ogg'
                    elif raw[:4]==b'fLaC': ext='flac'
                    elif raw[4:8]==b'ftyp': ext='m4a'
                    if not ext: raise DomainError('unsupported_media','File signature is not supported audio. Try WAV, MP3, OGG, FLAC or M4A.')
                    duration=float(qs.get('duration',0)); evidence='browser_decode'
                    if ext=='wav':
                        try:
                            with wave.open(io.BytesIO(raw),'rb') as w: duration=w.getnframes()/w.getframerate(); evidence='server_wav_header'
                        except (wave.Error,ZeroDivisionError): raise DomainError('invalid_media','Could not decode WAV header.')
                    sha=hashlib.sha256(raw).hexdigest(); dest=assets/f'{sha}.{ext}'
                    with store.lock:
                        existed=dest.exists()
                        if not existed: dest.write_bytes(raw); os.chmod(dest,0o600)
                        try:
                            result=store.command(dict(operation='take.register',input=dict(recipe_id=qs.get('recipe_id'),handoff_id=qs.get('handoff_id') or None,title=qs.get('title','Imported take'),original_name=qs.get('name','audio'),duration=duration,duration_evidence=evidence,audio='/api/audio/'+dest.name,sha256=sha),expected_sequence=int(qs['sequence']),idempotency_key=self.headers.get('Idempotency-Key')))
                        except Exception:
                            if not existed: dest.unlink(missing_ok=True)
                            raise
                    self.send_json(dict(result=result)); return
                self.send_json({'error':{'code':'not_found','message':'Unknown route.'}},404)
            except DomainError as e: self.send_json(dict(error=dict(code=e.code,message=e.message)),e.status)
            except (ValueError,TypeError,KeyError,json.JSONDecodeError): self.send_json(dict(error=dict(code='invalid_request',message='Malformed request.')),400)
            except (BrokenPipeError,ConnectionResetError): pass
            except Exception: self.send_json(dict(error=dict(code='internal_error',message='Local command failed; no provider request was made.')),500)
    server=ThreadingHTTPServer(('127.0.0.1',port),Handler)
    print(f'Sonic Workshop {VERSION} — http://127.0.0.1:{port}\nLocal review prototype. No external generation. Press Ctrl+C to stop.',flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close(); lockfile.close()

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--port',type=int,default=8786); p.add_argument('--data-dir'); a=p.parse_args(); run(a.port,a.data_dir)
