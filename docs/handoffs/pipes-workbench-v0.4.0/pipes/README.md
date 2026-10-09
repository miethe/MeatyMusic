# Pipes v0.2 — execution module, not a second music library

The parent MeatyMusic package is the working review app. Its stdlib server directly calls `pipes_mcp.story` for MIDI inventory, explicit symbolic plans and diagnostic rendering. Use parent `START_HERE.md` for the tested path; no external dependencies are needed for that slice.

## New operations

`story.midi_inventory(path)` parses bounded SMF type-0/type-1 PPQ files, retaining their absolute origin. Note overlap warnings remain candidates, not corrections. `story.compile_symbolic(story,motifs,bpm,total_beats)` requires explicit note-backed authored/reviewed representations and blocks missing notation. `story.midi_bytes(plan)` and `story.diagnostic_wav(plan,path)` create MIDI and quiet sine audio. The renderer is not a violin/cello model.

The optional standalone SDK server retains original inspection, analysis, excerpt and draft-MIDI operations, plus `inspect_midi` and `prepare_story_score`. This server needs its optional SDK/DSP dependencies and an explicit allowlisted `PIPES_LIBRARY_ROOT`/`PIPES_EXPORT_ROOT`; inspect `core.py` for defaults and safety. The original README is preserved as historical setup detail. Its SDK handshake was not tested for this release; use the parent's tested stdio bridge for the current integrated workflow.

```bash
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -e .
# Only after setting explicit private library/output roots:
pipes-mcp
```

Installing dependencies is optional and was not performed on Nick's workstation. Verify package versions and actual client capabilities when choosing the standalone route. The pure symbolic module is dependency-free. Excerpt outputs now receive unique names; draft MIDI rejects existing output names, so reruns cannot silently replace accepted files.

Pipes owns computation and execution receipts. Musical project/motif/interpretation state belongs to MeatyMusic. Native DAW, notation, perception and provider adapters remain planned, not installed.
