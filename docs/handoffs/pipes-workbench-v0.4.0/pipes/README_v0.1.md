# Pipes Music MCP v0.1 (local starter)

Local-first audio inspection and scratch MIDI composer for the *The Long Becoming* soundtrack workspace. Unlike the standalone architecture spec, **this is working starter source**, verified offline through its core unit tests. The full MCP client handshake and REAPER integration still require installation/testing on your machine.

## Requirements

Python >=3.10, ffmpeg on PATH, a local MCP client (e.g. Codex CLI or Claude Code), `uv` or `pip`.

## Install and verify locally

```bash
cd pipes_mcp_starter
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
export PIPES_LIBRARY_ROOT="$HOME/Music/TheLongBecoming"
mkdir -p "$PIPES_LIBRARY_ROOT"
pipes-cli inspect "$PIPES_LIBRARY_ROOT/Above the Rowan Canopy - OMG.wav"
# If you have placed the WAV there:
pipes-cli analyze "$PIPES_LIBRARY_ROOT/Above the Rowan Canopy - OMG.wav" --start 90 --duration 15
python -m unittest discover -s tests -v
```

No attempts will be made to download models, upload audio, or call cloud APIs. The local source file is never modified. Scratch excerpts and MIDI are written under `<PIPES_LIBRARY_ROOT>/.pipes_exports`.

## Example MCP client configuration

Register a local stdio MCP tool in your agent client's MCP configuration:

```json
{
  "mcpServers": {
    "pipes": {
      "command": "/ABS/PATH/pipes_mcp_starter/.venv/bin/pipes-mcp",
      "env": {
        "PIPES_LIBRARY_ROOT": "/ABS/PATH/TO/YOUR/MUSIC/LIBRARY"
      }
    }
  }
}
```

Your specific client may expect another config key or an `mcp add` command; use its current documentation. Do not paste credentials into a global config. Paths must be absolute, and files must live under the configured root.

## Tools

| MCP tool | Access | Result |
|---|---|---|
| `inspect_audio` | Read | Metadata, SHA-256, source identity |
| `analyze_audio` | Read | RMS, onset strength, spectral centroid, rough pitch class/key profile |
| `excerpt_audio` | Scratch write | WAV/FLAC/MP3 excerpt with parent hash and timestamps |
| `create_motif_midi` | Scratch write | MIDI from provided pitches and beats; **not an automatic transcription** |

The `analyze_audio` feature analysis is descriptive DSP, not auditory understanding or score transcription. Never promote an automatically estimated key into the canonical score without human review.

## Next: REAPER integration (do not reimplement)

Connect the existing [TwelveTake REAPER MCP](https://github.com/TwelveTake-Studios/reaper-mcp) as a **separate MCP server** to the same local agent. The agent can call Pipes to inspect/select/excerpt; use the REAPER MCP to create instrument tracks, load VST sound libraries, write MIDI notes, render, and measure. Initially use a scratch project, not an active production session.

For manuscript notation use MusicXML via Python/music21 and a MuseScore MCP or CLI. For expressive instruments, use Spitfire BBC SO Discover or paid sampled instruments hosted in REAPER; audio quality needs manual A/B listening.

## Why not ChatGPT direct write, yet?

ChatGPT Pro currently supports read/fetch MCP apps through developer mode, while full write/modify MCP is in Business/Enterprise/Edu beta per official docs (checked 2026-10-09). ChatGPT uses remote MCP endpoints, not a localhost stdio server. A local agent can work with stdio MCP today; a private gateway plus Secure MCP Tunnel is a separate deployment for eligible ChatGPT connections.

## License and rights

The original file came from Suno. The current Suno terms have broad restrictions on using Suno output to enable other AI systems; do not feed user Suno recordings into other AI models without a proper rights check. Deterministic DSP is the default. This repository contains no Suno music assets and no unofficial Suno API integration.
