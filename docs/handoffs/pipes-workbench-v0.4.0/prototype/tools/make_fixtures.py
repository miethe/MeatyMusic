"""Original deterministic diagnostic tones; not recordings of named instruments."""
from pathlib import Path
import math, random, struct, wave
root=Path(__file__).resolve().parents[1]/'static/fixtures'; root.mkdir(parents=True,exist_ok=True)
sr=16000
for name,duration,variant in [('a',24,0),('b',26,1)]:
    notes=[146.83,220,293.66,246.94,196,220,164.81,146.83]; samples=[]
    for i in range(sr*duration):
        t=i/sr; beat=t%0.75; freq=notes[int(t/0.75)%8]; envelope=math.exp(-beat*(7 if variant==0 else 2.5))*min(1,beat*80)
        tone=(math.sin(2*math.pi*freq*t)+.18*math.sin(2*math.pi*freq*2*t))*.13*envelope
        pad=.025*math.sin(2*math.pi*73.415*t)*min(1,t/2)*min(1,(duration-t)/2)
        left=max(-.9,min(.9,tone+pad)); right=max(-.9,min(.9,tone*.85+pad))
        samples.append(struct.pack('<hh',int(left*32767),int(right*32767)))
    with wave.open(str(root/f'diagnostic-{name}.wav'),'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(b''.join(samples))
print('Wrote two original diagnostic audio fixtures.')
