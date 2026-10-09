"""Dependency-free symbolic music primitives shared by Pipes and the review workbench.

No model calls, network, instrument identification, or emotional inference. MIDI tick
clocks and second clocks are distinct. Diagnostic renders are plain synthesis, not
fiddle/cello performance. The caller owns asset storage and permission enforcement.
"""
from __future__ import annotations
import bisect, hashlib, json, math, struct, wave
from array import array
from pathlib import Path

NOTE_NAMES = ('C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B')
PROGRAMS = {'fiddle':40,'cello':42,'viola':41,'horns':60,'mandolin':24,
            'mountain-dulcimer':15,'hammered-dulcimer':15,'marimba':12,
            'upright-bass':43,'flute':73,'kora':24,'piano':0}

def finite(value, low, high, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
        raise ValueError(f'{name} must be finite and between {low} and {high}.')
    return float(value)

def pitch_name(pitch):
    return f'{NOTE_NAMES[pitch % 12]}{pitch // 12 - 1}'

def _vlq(data, pos):
    value=0
    for _ in range(4):
        if pos>=len(data): raise ValueError('Truncated MIDI variable integer.')
        n=data[pos];pos+=1;value=(value<<7)|(n&127)
        if n<128:return value,pos
    raise ValueError('Oversized MIDI variable integer.')

def midi_inventory(path: str | Path, max_notes=100000) -> dict:
    """Read bounded SMF type 0/1. Return raw events; do not repair transcription.

    Track clocks are converted through the global tempo map, preserving the original
    absolute origin. Overlapping same-pitch events follow the PrettyMIDI close-prior-onsets policy and are flagged.
    A MIDI program is playback metadata, not an instrument recognition result.
    """
    p=Path(path)
    if not p.is_file() or p.stat().st_size>8*1024*1024: raise ValueError('Expected MIDI <= 8 MiB.')
    data=p.read_bytes()
    if data[:4]!=b'MThd' or len(data)<14:raise ValueError('Invalid MIDI header.')
    length=struct.unpack('>I',data[4:8])[0]
    if length<6 or length>1024 or 8+length>len(data):raise ValueError('Invalid MIDI header length.')
    fmt,tracks,ppq=struct.unpack('>HHH',data[8:14])
    if fmt not in (0,1) or not 0<tracks<=128 or ppq==0 or ppq&0x8000:raise ValueError('Only PPQ MIDI types 0/1 are supported.')
    pos=8+length;tempos=[];notes=[];programs=[];signatures=[];keys=[];bends=[];warnings=[]
    event_count=0;last_tick=0
    for track in range(tracks):
        if data[pos:pos+4]!=b'MTrk' or pos+8>len(data):raise ValueError('Missing MIDI track.')
        size=struct.unpack('>I',data[pos+4:pos+8])[0];pos+=8
        if pos+size>len(data):raise ValueError('Truncated MIDI track.')
        stream=data[pos:pos+size];pos+=size;t=0;i=0;running=None;active={}
        while i<len(stream):
            dt,i=_vlq(stream,i);t+=dt;last_tick=max(last_tick,t)
            if t>ppq*1000000:raise ValueError('MIDI duration exceeds analysis bounds.')
            if i>=len(stream):raise ValueError('Truncated MIDI event.')
            status=stream[i]
            if status<128:
                if running is None:raise ValueError('MIDI running status missing.')
                status=running
            else:
                i+=1
                if status<240:running=status
                else:running=None
            event_count+=1
            if event_count>1000000:raise ValueError('MIDI event limit exceeded.')
            if status==255:
                if i>=len(stream):raise ValueError('Truncated meta event.')
                kind=stream[i];i+=1;n,i=_vlq(stream,i);v=stream[i:i+n];i+=n
                if len(v)!=n:raise ValueError('Truncated MIDI metadata.')
                if kind==81 and n==3:
                    us=int.from_bytes(v,'big')
                    if us==0:raise ValueError('Invalid zero MIDI tempo.')
                    tempos.append((t,track,us))
                elif kind==88:signatures.append({'tick':t,'raw':list(v)})
                elif kind==89:keys.append({'tick':t,'raw':list(v)})
                elif kind==47:break
                continue
            if status in (240,247):n,i=_vlq(stream,i);i+=n;continue
            if status>=240:raise ValueError('Unsupported MIDI system event.')
            kind=status>>4;channel=status&15;n=1 if kind in (12,13) else 2
            values=stream[i:i+n];i+=n
            if len(values)!=n or any(x>127 for x in values):raise ValueError('Invalid MIDI channel data.')
            if kind==12:programs.append({'track':track,'channel':channel,'tick':t,'program_zero_based':values[0]})
            elif kind==14:bends.append({'track':track,'channel':channel,'tick':t,'value':(values[1]<<7|values[0])-8192})
            elif kind in (8,9):
                pitch,velocity=values;k=(channel,pitch)
                if kind==9 and velocity:
                    if active.get(k):warnings.append('Overlapping same-pitch detections; no automatic repair.')
                    active.setdefault(k,[]).append((t,velocity))
                elif active.get(k):
                    closed=[x for x in active[k] if x[0]!=t];kept=[x for x in active[k] if x[0]==t]
                    for start,vel in closed:
                        if t>start:notes.append({'track':track,'channel':channel,'pitch':pitch,'name':pitch_name(pitch),'start_tick':start,'end_tick':t,'velocity':vel})
                    active[k]=kept if closed and kept else []
                    if len(notes)>max_notes:raise ValueError('MIDI note bound exceeded.')
                else:warnings.append('Unpaired note-off event.')
        if any(active.values()):warnings.append('Unclosed note-on event; not extended automatically.')
    unique={0:500000}
    for tick,track,us in sorted(tempos):unique[tick]=us
    ticks=sorted(unique);seconds=[0.0]
    for a,b in zip(ticks,ticks[1:]):seconds.append(seconds[-1]+(b-a)*unique[a]/ppq/1000000)
    def sec(tick):
        j=bisect.bisect_right(ticks,tick)-1
        return seconds[j]+(tick-ticks[j])*unique[ticks[j]]/ppq/1000000
    for n in notes:n.update(start=round(sec(n['start_tick']),6),end=round(sec(n['end_tick']),6))
    notes.sort(key=lambda n:(n['start'],n['track'],n['pitch']))
    return {'schema':'pipes.midi-inventory.v1','sha256':hashlib.sha256(data).hexdigest(),
            'format':fmt,'ppq':ppq,'note_count':len(notes),'notes':notes,
            'first_note_seconds':notes[0]['start'] if notes else None,
            'last_note_seconds':max((n['end'] for n in notes),default=0),
            'duration_seconds':round(sec(last_tick),6),'origin_seconds':0,
            'tempo_map':[{'tick':t,'seconds':round(sec(t),6),'bpm':60000000/unique[t]} for t in ticks],
            'tempo_status':'file_metadata_not_measured_recording_tempo','programs':programs,
            'time_signatures':signatures,'key_signatures':keys,'pitch_bend_count':len(bends),
            'warnings':sorted(set(warnings)),
            'evidence':'machine_transcription_unverified',
            'notes_notice':'Do not infer instrument, performed key, meter, emotional meaning or motif identity from metadata.'}

def compile_symbolic(story: dict, motifs: list[dict], bpm: float=80, total_beats: float=48) -> dict:
    """Compile authored/corrected note representations only. Missing exact motifs block.

    Relative narrative placement is explicitly bound to a new beat clock by this
    operation. Neither that binding nor instrument GM programs describes source audio.
    """
    bpm=finite(bpm,30,240,'BPM');total_beats=finite(total_beats,4,160,'Beats')
    if total_beats*60/bpm>120:raise ValueError('Diagnostic preview is bounded to 120 seconds.')
    if story.get('clock')!='relative':raise ValueError('Symbolic draft requires a relative intent clock.')
    lookup={m['id']:m for m in motifs};parts=[];missing=[]
    for e in sorted(story.get('events',[]),key=lambda x:x['start']):
        m=lookup.get(e['motif_id'],{});representation=m.get('symbolic')
        if not representation or representation.get('status') not in ('authored_sketch','human_verified_score'):
            missing.append({'event_id':e['id'],'motif_id':e['motif_id'],'reason':'No approved or authored note representation. Intent is not exact music.'});continue
        pitches=representation.get('pitches',[]);durations=representation.get('durations',[1]*len(pitches))
        if not pitches or len(pitches)!=len(durations):raise ValueError('Invalid symbolic representation.')
        start=finite(e['start'],0,1,'Start');end=finite(e['end'],0,1,'End')
        if end<=start:raise ValueError('Invalid relative event range.')
        transpose=e.get('transpose',0)
        if isinstance(transpose,bool) or not isinstance(transpose,int) or not -24<=transpose<=24:raise ValueError('Transpose out of bounds.')
        for p in pitches:
            if isinstance(p,bool) or not isinstance(p,int) or not 0<=p+transpose<=127:raise ValueError('MIDI pitch out of bounds.')
        for d in durations:finite(d,.01,64,'Note duration')
        factor=(end-start)*total_beats/sum(durations);cursor=start*total_beats;ns=[]
        for p,d in zip(pitches,durations):
            ns.append({'pitch':p+transpose,'start_beat':round(cursor,8),'duration_beats':round(d*factor,8),'velocity':78 if e.get('role')=='lead' else 60});cursor+=d*factor
        parts.append({'event_id':e['id'],'motif_id':m['id'],'instrument':e['instrument'],
                      'program':PROGRAMS.get(e['instrument'],0),'notes':ns})
    if missing:return {'status':'blocked_missing_notation','missing':missing,'audio_rendered':False,'parts':[]}
    if not parts:raise ValueError('Add at least one note-backed motif.')
    if len(parts)>15 or sum(len(p['notes']) for p in parts)>2048:raise ValueError('Diagnostic MIDI supports at most 15 parts and 2,048 notes; the richer intent draft can still be exported.')
    value={'schema':'pipes.symbolic-plan.v1','status':'authored_symbolic_draft','story_id':story['id'],
           'story_revision':story['revision'],'bpm':bpm,'total_beats':total_beats,'parts':parts,
           'notice':'Explicit authored notes; GM programs are playback hints, not a realistic performance. Not a transcription.'}
    value['sha256']=hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    return value

def _enc_vlq(n):
    out=[n&127];n>>=7
    while n:out.insert(0,(n&127)|128);n>>=7
    return bytes(out)

def midi_bytes(plan):
    if plan.get('status')!='authored_symbolic_draft':raise ValueError('A complete symbolic plan is required.')
    ppq=960;out=[]
    tempo=round(60000000/plan['bpm'])
    track=b'\x00\xff\x51\x03'+tempo.to_bytes(3,'big')+b'\x00\xff\x2f\x00'
    out.append(b'MTrk'+len(track).to_bytes(4,'big')+track)
    for i,part in enumerate(plan['parts']):
        channel=i%15
        if channel>=9:channel+=1
        events=[(0,0,bytes([0xc0|channel,part['program']]))]
        for n in part['notes']:
            a=round(n['start_beat']*ppq);b=max(a+1,round((n['start_beat']+n['duration_beats'])*ppq))
            events.extend([(a,2,bytes([0x90|channel,n['pitch'],n['velocity']])),(b,1,bytes([0x80|channel,n['pitch'],0]))])
        events.sort(key=lambda x:(x[0],x[1]));track=bytearray();prev=0
        for t,_,event in events:track+=_enc_vlq(t-prev)+event;prev=t
        track+=b'\x00\xff\x2f\x00';out.append(b'MTrk'+len(track).to_bytes(4,'big')+track)
    return b'MThd\x00\x00\x00\x06'+struct.pack('>HHH',1,len(out),ppq)+b''.join(out)

def diagnostic_wav(plan, path, sample_rate=16000):
    """Quiet sine-tone preview. Deliberately not labelled as an instrument render."""
    if plan.get('status')!='authored_symbolic_draft':raise ValueError('A complete symbolic plan is required.')
    duration=plan['total_beats']*60/plan['bpm']+.25
    if not 0<duration<=121:raise ValueError('Preview exceeds duration limit.')
    buf=array('f',[0.0])*math.ceil(duration*sample_rate)
    for part in plan['parts']:
        for n in part['notes']:
            start=round(n['start_beat']*60/plan['bpm']*sample_rate)
            length=max(1,round(n['duration_beats']*60/plan['bpm']*sample_rate))
            frequency=440*2**((n['pitch']-69)/12);attack=max(1,min(length//5,int(.025*sample_rate)));release=max(1,min(length//3,int(.08*sample_rate)))
            for j in range(min(length,len(buf)-start)):
                env=min(1,j/attack,(length-j)/release)
                buf[start+j]+=.065*n['velocity']/127*env*math.sin(2*math.pi*frequency*j/sample_rate)
    peak=max((abs(x) for x in buf),default=0);gain=min(1,.30/peak) if peak else 1
    pcm=array('h',(max(-32767,min(32767,round(x*gain*32767))) for x in buf))
    import sys
    if sys.byteorder!='little':pcm.byteswap()
    with wave.open(str(path),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sample_rate);w.writeframes(pcm.tobytes())
    return {'duration_seconds':duration,'renderer':'pipes-sine-diagnostic-v1','instrument_realism':False,'source_plan_sha256':plan['sha256']}
