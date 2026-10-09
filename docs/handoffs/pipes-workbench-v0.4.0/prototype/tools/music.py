#!/usr/bin/env python3
"""Usage: python3 tools/music.py state | capabilities | command --json request.json"""
import argparse,json,sys
from client import request
p=argparse.ArgumentParser();p.add_argument('--url');p.add_argument('--data-dir');sub=p.add_subparsers(dest='action',required=True)
sub.add_parser('state');sub.add_parser('capabilities');c=sub.add_parser('command');c.add_argument('--json',required=True,help='JSON envelope file, or - for stdin')
a=p.parse_args()
try:
    body=None;path='/api/state'
    if a.action=='capabilities':path='/api/capabilities'
    if a.action=='command':
        path='/api/commands'
        with (sys.stdin if a.json=='-' else open(a.json)) as f:body=json.load(f)
    print(json.dumps(request(path,body,a.url,a.data_dir),indent=2,ensure_ascii=False))
except Exception as e:
    print(str(e),file=sys.stderr);sys.exit(1)
