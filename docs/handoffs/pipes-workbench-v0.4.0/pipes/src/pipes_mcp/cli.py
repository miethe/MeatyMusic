"""Simple non-MCP CLI for test and human inspection."""
import argparse,json
from . import core

def main():
    p=argparse.ArgumentParser(description='Pipes audio inspection')
    p.add_argument('operation',choices=['inspect','analyze'])
    p.add_argument('path')
    p.add_argument('--start',type=float,default=0)
    p.add_argument('--duration',type=float,default=20)
    a=p.parse_args()
    out=core.inspect_audio(a.path) if a.operation=='inspect' else core.analyze_audio(a.path,a.start,a.duration)
    print(json.dumps(out,indent=2))
if __name__=='__main__':main()
