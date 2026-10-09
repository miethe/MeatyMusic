"""Authenticated local command client. No automatic mutation retries."""
import json, os
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]

def request(path='/api/state', body=None, url=None, data_dir=None):
    base=(url or os.environ.get('MM_URL','http://127.0.0.1:8786')).rstrip('/')
    parsed=urlparse(base)
    if parsed.scheme!='http' or parsed.hostname not in ['127.0.0.1','localhost']:
        raise ValueError('The prototype CLI only accepts an http loopback server.')
    token_path=Path(data_dir or os.environ.get('MM_DATA_DIR',ROOT/'data'))/'.session-token'
    token=token_path.read_text().strip()
    headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'}
    req=Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers=headers)
    try:
        with urlopen(req,timeout=20) as res:return json.loads(res.read())
    except HTTPError as ex:
        detail=json.loads(ex.read()); raise RuntimeError(detail.get('error',{}).get('message',f'HTTP {ex.code}')) from None
