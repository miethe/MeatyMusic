"""Read-only audio DSP and narrowly scoped scratch exports.

No network requests, cloud model calls, stem inference, or DAW mutations occur.
Audio properties and rough feature scores are descriptive, not transcription truth.
"""
from __future__ import annotations

import hashlib
import math
import os
import subprocess
from pathlib import Path

_ALLOWED_SUFFIXES = {'.wav', '.flac', '.aiff', '.aif', '.ogg'}
_NAMES = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B']
_MAJOR = [6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]
_MINOR = [6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17]

def library_root()->Path:
    return Path(os.environ.get('PIPES_LIBRARY_ROOT',Path.cwd())).expanduser().resolve()

def exports_root()->Path:
    root=library_root()
    dst=Path(os.environ.get('PIPES_EXPORT_ROOT',root/'.pipes_exports')).expanduser().resolve()
    if not dst.is_relative_to(root):
        raise ValueError('PIPES_EXPORT_ROOT must remain inside PIPES_LIBRARY_ROOT')
    return dst

def resolve_audio(path:str)->Path:
    root=library_root()
    candidate=Path(path).expanduser()
    p=(candidate if candidate.is_absolute() else root/candidate).resolve()
    if not p.is_relative_to(root):
        raise ValueError('Audio path outside allowlisted PIPES_LIBRARY_ROOT')
    if not p.is_file() or p.suffix.lower() not in _ALLOWED_SUFFIXES:
        raise ValueError('Expected existing WAV, FLAC, AIFF, or OGG inside allowlisted root')
    return p

def sha256_file(p:Path)->str:
    h=hashlib.sha256()
    with p.open('rb') as f:
        for block in iter(lambda:f.read(1024*1024), b''):
            h.update(block)
    return h.hexdigest()

def inspect_audio(path:str)->dict:
    import soundfile as sf
    p=resolve_audio(path)
    info=sf.info(str(p))
    return dict(name=p.name,sha256=sha256_file(p),duration_seconds=round(float(info.duration),3),
                sample_rate=int(info.samplerate),channels=int(info.channels),
                format=info.format,subtype=info.subtype,size_bytes=p.stat().st_size,
                note='File metadata, not a perceptual music analysis')

def analyze_audio(path:str,start_seconds:float=0.0,duration_seconds:float=20.0)->dict:
    import librosa
    import numpy as np
    p=resolve_audio(path)
    info=inspect_audio(path)
    start=float(start_seconds);duration=float(duration_seconds)
    if not math.isfinite(start) or not math.isfinite(duration) or start < 0 or duration <= 0 or duration > 120 or start>=info['duration_seconds']:
        raise ValueError('start must be inside recording; duration must be (0,120] seconds')
    duration=min(duration,info['duration_seconds']-start)
    y,sr=librosa.load(str(p),sr=11025,mono=True,offset=start,duration=duration)
    if len(y)<2048: raise ValueError('Section too short to analyze')
    hop=512
    rms=librosa.feature.rms(y=y,frame_length=2048,hop_length=hop)[0]
    onset=librosa.onset.onset_strength(y=y,sr=sr,hop_length=hop)
    centroid=librosa.feature.spectral_centroid(y=y,sr=sr,hop_length=hop)[0]
    chroma=librosa.feature.chroma_stft(y=y,sr=sr,hop_length=hop,n_fft=2048).mean(axis=1)
    profile=[]
    for tonic,name in enumerate(_NAMES):
        for mode,template in [('major',_MAJOR),('minor',_MINOR)]:
            cc=float(np.corrcoef(chroma,np.roll(template,tonic))[0,1])
            if math.isfinite(cc): profile.append((cc,f'{name} {mode}'))
    profile.sort(reverse=True)
    pcs=[dict(pitch=_NAMES[i],strength=round(float(chroma[i]),4)) for i in np.argsort(chroma)[::-1]]
    return dict(source_sha256=info['sha256'],start_seconds=start,duration_seconds=round(duration,3),
                relative_rms_dbfs=round(float(20*np.log10(max(float(np.sqrt(np.mean(rms*rms))),1e-9))),2),
                mean_onset_strength=round(float(np.mean(onset)),3),
                mean_spectral_centroid_hz=round(float(np.mean(centroid)),1),
                pitch_classes=pcs,rough_key_candidates=[{'key':k,'correlation':round(float(v),3)} for v,k in profile[:4]],
                confidence_note='NOT note, chord, instrument, or melody transcription. Key is template correlation in a polyphonic mix.')

def excerpt_audio(path:str,start_seconds:float,end_seconds:float,format:str='wav')->dict:
    p=resolve_audio(path);meta=inspect_audio(path)
    start=float(start_seconds);end=float(end_seconds)
    if not all(map(math.isfinite,(start,end))) or start < 0 or end <= start or end>meta['duration_seconds']+.01 or end-start>180:
        raise ValueError('Require bounded valid timestamps and <= 180 second excerpt')
    if format not in ('wav','flac','mp3'): raise ValueError('Supported output formats: wav, flac, mp3')
    dest=exports_root();dest.mkdir(parents=True,exist_ok=True)
    unique=meta['sha256'][:12]
    import uuid
    output=dest/f'{unique}_{start:.3f}_{end:.3f}_{uuid.uuid4().hex[:10]}.{format}'
    if output.is_symlink(): raise ValueError('Export path may not be a symlink')
    cmd=['ffmpeg','-hide_banner','-loglevel','error','-n','-ss',str(start),'-t',str(end-start),'-i',str(p),'-vn']
    if format=='wav': cmd += ['-c:a','pcm_s16le']
    elif format=='flac': cmd += ['-c:a','flac']
    else: cmd += ['-c:a','libmp3lame','-b:a','224k']
    cmd.append(str(output))
    subprocess.run(cmd,check=True,timeout=40)
    return dict(output=str(output),source_sha256=meta['sha256'],start_seconds=start,end_seconds=end,
                output_sha256=sha256_file(output),immutable_source=True)

def create_motif_midi(name:str,notes:list[dict],bpm:float=80.0,instrument_program:int=40)->dict:
    """Create a scratch single-instrument MIDI. Input notes have midi_pitch, start_beat, duration_beats, velocity."""
    import pretty_midi
    if not name or len(name)>120 or not (1<=len(notes)<=200) or not (30<=float(bpm)<=250) or not(0<=instrument_program<=127):
        raise ValueError('Invalid motif name, note count, BPM, or MIDI instrument program')
    m=pretty_midi.PrettyMIDI(initial_tempo=float(bpm))
    inst=pretty_midi.Instrument(program=int(instrument_program),name=name)
    seconds_per_beat=60.0/float(bpm)
    for n in notes:
        pitch=int(n['midi_pitch']);start=float(n['start_beat']);dur=float(n['duration_beats']);velocity=int(n.get('velocity',85))
        if not (0<=pitch<=127 and 0<=velocity<=127 and 0<=start<=512 and 0<dur<=64) or start+dur>512:
            raise ValueError('Invalid note pitch/timing/velocity; maximum 512 beats')
        inst.notes.append(pretty_midi.Note(velocity=velocity,pitch=pitch,
            start=start*seconds_per_beat,end=(start+dur)*seconds_per_beat))
    m.instruments.append(inst)
    dest=exports_root();dest.mkdir(parents=True,exist_ok=True)
    import re
    safe=re.sub(r'[^A-Za-z0-9_-]+','_',name)[:60].strip('_') or 'motif'
    import json
    h=hashlib.sha256(json.dumps([name,notes,bpm,instrument_program],sort_keys=True).encode()).hexdigest()[:12]
    out=dest/f'{safe}_{h}.mid'
    if out.is_symlink(): raise ValueError('Export path may not be a symlink')
    if not out.exists(): m.write(str(out))
    return dict(output=str(out),sha256=sha256_file(out),note_count=len(notes),bpm=bpm,
                note='Symbolic score from explicit input notes; NOT a transcription of any source audio')
