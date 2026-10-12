"""Run as local MCP stdio server, to be selected by an MCP-compatible client.

Read-only tools: inspect_audio, analyze_audio.
Narrow scratch-write tools: excerpt_audio, create_motif_midi.
"""
from mcp.server.fastmcp import FastMCP
from . import core
from .story import midi_inventory, compile_symbolic
mcp=FastMCP('Pipes Music Tools')

@mcp.tool()
def inspect_audio(path:str)->dict:
    """Read metadata and SHA-256 of a WAV/FLAC/AIFF/OGG inside PIPES_LIBRARY_ROOT."""
    return core.inspect_audio(path)

@mcp.tool()
def analyze_audio(path:str,start_seconds:float=0,duration_seconds:float=20)->dict:
    """Return deterministic DSP features and *tentative* harmonic fingerprint of a time range; not a score transcription."""
    return core.analyze_audio(path,start_seconds,duration_seconds)

@mcp.tool()
def excerpt_audio(path:str,start_seconds:float,end_seconds:float,format:str='wav')->dict:
    """Create a bounded excerpt into PIPES_EXPORT_ROOT without modifying the source."""
    return core.excerpt_audio(path,start_seconds,end_seconds,format)

@mcp.tool()
def create_motif_midi(name:str,notes:list[dict],bpm:float=80,instrument_program:int=40)->dict:
    """Write a **new original** MIDI motif from supplied explicit notes (midi_pitch/start_beat/duration_beats/velocity)."""
    return core.create_motif_midi(name,notes,bpm,instrument_program)

@mcp.tool()
def inspect_midi(path:str)->dict:
    """Bounded raw MIDI note/tempo inventory; not a verified transcription or instrument detector."""
    from pathlib import Path
    root=core.library_root();given=Path(path).expanduser();p=(given if given.is_absolute() else root/given).resolve()
    if not p.is_relative_to(root) or p.suffix.lower() not in ('.mid','.midi'):
        raise ValueError('MIDI must remain inside the allowlisted root')
    return midi_inventory(p)

@mcp.tool()
def prepare_story_score(story:dict,motifs:list[dict],bpm:float=80,total_beats:float=48)->dict:
    """Pure symbolic compilation from explicit authored/corrected note representations. Missing notes block; no audio, network, or library mutation."""
    return compile_symbolic(story,motifs,bpm,total_beats)

def main()->None:
    mcp.run(transport='stdio')

if __name__ == '__main__':main()
