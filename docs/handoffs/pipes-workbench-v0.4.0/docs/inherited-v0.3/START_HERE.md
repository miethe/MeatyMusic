---
schema_version: "0.1"
id: null
type: artifact
artifact_kind: implementation_handoff
title: "MeatyMusic / Sonic Workshop — complete handoff v0.3.0"
project: MeatyMusic
domain: music_and_voice_creation
status: implementation_handoff_candidate
owner: Nick Miethe
created_at: 2026-10-07
updated_at: 2026-10-07
system_of_record: GitHub
current_location: conversation_handoff
related_systems: [Agentic OS, Voice Lab, aos-tts, SkillMeat, MeatyWiki, CCDash, IntentTree, Aural Geometry Lab]
source_context: "Existing Sonic Workshop proposal, focused UX references, repository contract reads, official provider documentation"
intended_use: "Local prototype review and additive implementation in the existing estate"
next_action: "Run the local prototype and reconcile the existing MeatyMusic implementation before integration"
review_cadence: "Before integration or provider capability changes"
confidentiality: personal
tags: [sonic-workshop, music, voice, prototype, implementation-handoff]
---

# MeatyMusic / Sonic Workshop — complete handoff v0.3.0


## What is delivered

A working, local-only review prototype, its source, eleven screenshots of the implemented interface, a visual review page, architecture and UX specifications, integration contracts, a migration backlog, examples, and automated tests. This is not only a mockup deck.

**Product direction:** a musical recipe and listening workbench. Change which instrument carries an idea; preserve the recipe's history; connect every prepared prompt to the recording and the moment that made the experiment worthwhile.

**Voice direction:** one creative singer identity can have separate speech and singing bindings. MeatyMusic directs the musical performance; Voice Lab curates speech candidates and promoted picks; Estate Voice / `aos-tts` renders reviewed speech. Neither a spoken audition nor a provider TTS voice identifier establishes a usable singing identity.

## Run the prototype

Prerequisites: macOS or Linux, Python 3.11 or later, and a modern browser. No npm, Python packages, provider accounts, keys, or build step are needed for the local runtime.

```bash
cd meatymusic-sonic-workshop-handoff-v0.3.0/prototype
python3 serve.py --port 8786
```

Open `http://127.0.0.1:8786` in your browser. Stop with Ctrl+C. The app binds only to loopback. A workspace is created under `prototype/data/`; it survives restart. A second server may not use the same data directory.

For an isolated review workspace:

```bash
python3 serve.py --port 8786 --data-dir "$HOME/.local/share/meatymusic-review"
```

To review visuals without running software, open `designs/review.html`. It contains screenshots, not a simulated interactive app.

## A ten-minute walkthrough

1. **Arrange:** Open *Sarod on the Ridgeline*. Select Expansion. Preview “Horns take the lead,” then apply it. The result is a separate recipe; the source and any playing recording stay unchanged.
2. **Inspect:** Switch to Variations. Compare the changed and preserved fields. A pinned opening refuses a lead replacement until you explicitly unpin it.
3. **Prepare:** Choose Prepare handoff. Edit the Style field, keep Excludes separate, inspect the 1,000-unit budget, record your intended settings, and save. The receipt says prepared—not generated.
4. **Return:** Import a permitted local audio file or attach a provider link. The prototype hashes original bytes. A link-only record is not presented as a playable downloaded asset.
5. **Listen:** Select a time range, play it, name a useful moment, and write what you heard. “Build from here” creates a recipe branch referencing that moment; it does not cut, copy, or regenerate audio.
6. **Cast:** Open Singers & voices. Edit Ember or Hollow, choose instrumental/solo/duet in the current recipe, and export a singer-design brief. Import `examples/voice-lab-demo-promotion.json` to inspect the speech-only metadata flow. It is diagnostic metadata, not a usable provider voice.
7. **Connect:** Review the six provider/estate lanes. No lane in this prototype sends live generation requests. Export metadata or a draft composition plan for the next implementation stage.

The two bundled audio files are original synthesized diagnostic contours, not Suno music, real instrument recordings, or singer performances. Use your own permitted exports to judge actual musical results.

## Package map

| Location | Purpose |
| --- | --- |
| `prototype/` | Python local server, shared domain commands, browser UI, CLI, bounded MCP server, fixtures, tests |
| `docs/01-product-and-ux.md` | Product purpose, flows, screen behavior, accessibility and interaction states |
| `docs/02-architecture-and-estate.md` | Domain architecture, source-of-truth rules, estate ownership and event boundaries |
| `docs/03-provider-and-voice-contracts.md` | Suno/API discovery, other music lanes, singer/speech/voice integration |
| `docs/04-implementation-handoff.md` | Additive migration, backlog, production acceptance gates |
| `docs/05-sources-and-decisions.md` | Current source register, repository blob pins, decisions and evidence limits |
| `docs/06-agent-implementer-prompt.md` | Ready-to-use implementation instruction for local agents |
| `docs/07-validation-and-limitations.md` | What was tested and what remains unverified |
| `contracts/` | Implemented prototype transport/envelope shapes and separately labeled target schemas |
| `examples/` | Reproducible request and export examples, MCP configuration template |
| `designs/` | Eleven actual UI screenshots, tokens, annotations and standalone visual review |
| `prompt-catalog/` | Previous prompt packs for an eventual reviewed importer; not current provider specifications |
| `reference/` | Earlier product/UX proposals, retained as historical context |
| `qa/` | Automated test output, browser review report, schema checks |

## What works versus what is proposed

**Implemented locally:** recipe editing; section locks; role-aware variations; prompt compilation and exact manual overrides; handoff snapshots; user-attested submission metadata; original audio import; waveform visualization and playback; bounded moments; branch-from-moment; catalog browsing; singer direction editing; Voice Lab promotion metadata import; singer/speech brief export; CLI and nine MCP tools.

**Not implemented:** remote music or speech generation; provider authentication; voice enrollment or cloning; verified singer continuity; native multitrack editing; pitch/timing guarantees; automatic section alignment; loudness matching; blind listening; full prompt-pack ingestion; background estate event publishing; production identity/RBAC; waveform streaming for large media; Windows server support.

This prototype intentionally uses a small Python standard-library server and browser-native UI for review portability. **Do not replace the existing MeatyMusic Next.js/FastAPI/PostgreSQL architecture with it.** Integrate the tested behavior and contracts into that application after a current-state audit.

## Validation summary

The handoff includes unit/HTTP/CLI/MCP tests and a browser interaction review. Read `qa/automated-tests.txt` for the exact current count and `qa/browser-review.json` for the thirteen browser checks. Browser pages were rendered and exercised with a local HTTP transport bridge because native loopback navigation is blocked in the authoring browser environment. Server auth/range behavior was tested separately. Native browser cookie/media behavior, clipboard and downloads remain a local acceptance gate.

No estate repository was modified, no service deployed, no provider credential used, no generation purchased, and no remote voice promoted.

## Agent entry points

With the local server running:

```bash
python3 tools/music.py state
python3 tools/music.py capabilities
python3 tools/music.py command --json ../examples/compile-request.json
python3 -m unittest discover -s tests -v
```

A nondefault data directory requires `--data-dir` before the CLI subcommand, or `MM_DATA_DIR`. See `examples/mcp-config.template.json` for the stdio MCP adapter. The server must already be running; MCP does not start another server or generate audio.

## Backup and privacy

“Export workspace” exports metadata only. For a complete local backup, stop the server and copy the workspace directory including `assets/`; original audio is not embedded in the JSON export. Do not share `.session-token`. Provider secrets are never stored by this prototype. The prepared handoff may contain private creative text; review before sending outside your estate.
