---
schema_version: 0.1
id: null
type: artifact
artifact_kind: implementation_handoff
title: "MeatyMusic + Pipes — Musical Story Workbench v0.4"
project: MeatyMusic / Pipes
domain: agentic-music-workbench
status: candidate_artifact
owner: Nick Miethe
created_at: 2026-10-09
updated_at: 2026-10-09
system_of_record: GitHub (proposed)
current_location: portable-conversation-package
related_systems: [MeatyMusic, Pipes, The Long Becoming, IntentTree, SkillMeat, CCDash, MeatyWiki, Aural Geometry Lab]
source_context: "MeatyMusic v0.3 handoff; Pipes v0.1 starter; supplied Rowan WAV/MIDI; soundtrack v2/v3; Nick's listening notes and visual composition request."
intended_use: "Local review and additive implementation handoff; not a production deployment."
next_action: "Run ROWAN-001 locally and reconcile the new domain contracts with the live MeatyMusic repository."
review_cadence: after-local-audition-and-adapter-validation
confidentiality: personal
tags: [meatymusic, pipes, music-workbench, story-canvas, mcp]
---

# MeatyMusic + Pipes — Musical Story Workbench v0.4

**A working, local, persistent review build—not a deployed estate app.** It extends the supplied MeatyMusic Sonic Workshop v0.3 code and includes Pipes v0.2 source. Existing recipes, performer/instrument roles, takes, listening moments, provider handoffs and voice boundaries remain intact.

MeatyMusic is where musical meaning, projects and decisions live. Pipes performs bounded analysis, symbolic construction and rendering. The Long Becoming is the first creative project, not the owner of every future musical capability.

## Start locally

Prerequisites: Python **3.11 or later** and a modern browser. The prototype uses the Python standard library; no npm, database service, model key, DAW purchase or subscription is required for the demonstrated slice. FFmpeg and external model packages are not required for this workbench's bundled study or diagnostic render.

```bash
cd MeatyMusic_Pipes_Workbench_v0.4.0/prototype
python3 serve.py --port 8786 --data-dir "$HOME/.local/share/meatymusic-pipes-review"
```

Open `http://127.0.0.1:8786`, then choose **Open Rowan study**. This explicit import copies the preserved full original into the private review workspace and registers the musical project hierarchy, raw MIDI candidates, annotations, drafts and two story canvases. Existing review data is not discarded. Repeating the import is refused rather than overwriting edits.

Use a new review data directory first. Do not point an experimental build at production storage. The source package is portable; local working state is outside it in the data directory. Stop the server normally before copying that directory for backup. A second writer is refused.

## The review path

1. **Listen & evidence:** play the complete 3:14.8 Rowan recording. Select the first swell and the complete 1:25–1:52 return. Candidate raw MIDI is a separate overlay, not verified fiddle notation.
2. **Paint & intent:** move and edit a musical gesture, select its instrument and role, change a manually authored prominence value, pin an anchor, and connect a callback or response. Percentages are a story clock, not measured recording timestamps.
3. **Prepare:** compile separate Style, instrumental arrangement and Exclude blocks with source context; freeze a local handoff. No provider submission, credit spend or uploaded reference is implied.
4. **Render the independent sketch:** select `Independent motif sketch · not a transcription`. At 80 BPM and 48 quarter-note beats, render MIDI and a quiet sine-tone WAV. This is audible proof of the symbolic pipeline, not realistic fiddle/cello synthesis.
5. **Atlas / Discover / Worlds:** inspect six motif identities, find the “heart”/yearning passage without knowing its formal name, keep an unfiled thought, and inspect the nine Rowan works. Only the original has a recording.

Exact rendering of the accepted Rowan theme is intentionally blocked: its melodic score has not been verified. An independently authored sketch must never be relabeled as its transcription.

## Implemented now

- Nested musical projects and cue ownership with cross-linked motifs.
- Full original playback, bounded listening windows, waveform, and raw MIDI overlay.
- Human listening observations, context dependencies, and local explanation-bearing discovery.
- Two-lane interpretation/intent workflow, editable story gestures and relationships, branching, pin/unpin and revision history.
- Deterministic prompt/context compilation with explicit budgets and no silent truncation.
- Existing recipe/handoff authority reused; returned imported takes remain linked to their musical work.
- MIDI plus diagnostic audio rendering for explicitly note-backed sketches.
- Shared local HTTP domain, CLI and **28 MCP tools**; optimistic concurrency and idempotency.
- A whole-track ROWAN-001 experiment seed; no claim its future analytical/compositional stages have all run.

## Not implemented or connected

Automatic motif recognition; ear-confirmed transcription; realistic instrument rendering; live REAPER/MuseScore adapters; semantic embeddings; generative audio inference; Suno submission; remote ChatGPT connection; estate registry/task/memory writes; production multi-user storage/auth; a full DAW or score editor. See `IMPLEMENTATION_STATUS.md` rather than inferring availability from architecture diagrams.

## Documentation map

- `docs/08_WORKBENCH_AND_PIPES_ARCHITECTURE.md`: authority, model, workflows, scope and system integrations.
- `docs/09_MUSICAL_STORY_CANVAS.md`: visual authoring and recognition-oriented UX; implemented versus target features.
- `docs/10_ROWAN_001_EXPERIMENT.md`: complete source, hypotheses, human evidence and acceptance sequence.
- `docs/11_IMPLEMENTATION_AND_MIGRATION.md`: route into the live MeatyMusic/AOS repositories without a rewrite.
- `docs/12_AGENT_IMPLEMENTATION_HANDOFF.md`: actionable local-agent prompt.
- `docs/13_CAPABILITIES_SOURCES_AND_LIMITS.md`: adapter facts, source precedence and limitations.
- `contracts/workbench-v1.schema.json`, `contracts/implemented-mcp-tools.json`, `contracts/prototype-openapi.json`: implemented local contracts.
- `examples/v0.4/`: actual compiled context, prompt, frozen handoff, symbolic plan, MIDI, WAV and receipts.
- `qa/v0.4/`: automated tests and browser review evidence.

The v0.3 documentation and designs are retained as inheritance/reference, not silently presented as newly implemented v0.4 behavior. New documents and the current status take precedence on new workbench scope. `docs/inherited-v0.3/` preserves former entrypoint/status/checksum files.

## Use from a local MCP client

Start the server first, then configure the client with absolute paths:

```json
{
  "mcpServers": {
    "meatymusic-review": {
      "command": "python3",
      "args": ["/absolute/path/MeatyMusic_Pipes_Workbench_v0.4.0/prototype/tools/mcp_stdio.py"],
      "env": {
        "MM_URL": "http://127.0.0.1:8786",
        "MM_DATA_DIR": "/absolute/path/to/your/meatymusic-pipes-review"
      }
    }
  }
}
```

These are illustrative client settings, not an installation into any existing client. The adapter reads the local session token from the private data directory. Keep that directory and token off public/remote surfaces. The adapter supports initialization, ping and tools; it is not a general MCP resources/tasks/sampling implementation. Client/account capabilities must be discovered when connecting a remote chat rather than inferred from a plan name.

CLI uses the same local server and command envelope:

```bash
export MM_URL=http://127.0.0.1:8786
export MM_DATA_DIR="$HOME/.local/share/meatymusic-pipes-review"
python3 tools/music.py capabilities
python3 tools/music.py command --json ../examples/v0.4/read-rowan-context-command.json
```

Read current workspace sequence before any mutation; do not blindly retry conflicts. Use a new idempotency key for each distinct intended action. No tool submits music to a provider.

## Validation

```bash
cd prototype
python3 -m unittest discover -s tests -v
```

This build passed 81 Python tests, including real loopback HTTP and MCP stdio lifecycle/read/write checks. Browser UI was reviewed using a test-only authenticated bridge because this environment blocks direct browser loopback navigation; native-browser startup on Nick's workstation remains a local smoke test. MIDI parser parity with the supplied transcription, schema validation, source hashes, prompt budgets and render bounds were checked separately. No perceptual audition or native DAW integration is claimed.

**Privacy:** the full package includes Nick's original WAV, MIDI and personal listening notes. Do not publish the package as an open demo. A code-only export must omit `prototype/study_inputs`, `prototype/app/rowan_seed.json`, personal examples and screenshots/source notes that expose that material.
