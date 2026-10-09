---
schema_version: 0.1
id: null
type: artifact
artifact_kind: implementation_plan
title: "Implementation / Migration — Extend MeatyMusic, Expose Pipes"
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

# Implementation and migration

## What was changed here

This source release starts from the user's supplied `meatymusic-sonic-workshop-handoff-v0.3.0(1).zip`. It preserves the existing server, domain command path, recipe model, takes, performer directions, handoffs and UI. Additions are primarily `prototype/app/workbench.py`, `prototype/static/workbench.js`, `prototype/static/workbench.css`, the explicit private Rowan seed and `pipes/src/pipes_mcp/story.py`. Existing command handlers are extended so returned takes/variations stay associated with works.

The inherited root entrypoints/status/manifests were saved under `docs/inherited-v0.3`. Existing production-oriented architecture and designs remain reference material. This release does not establish which of those designs is deployed in Nick's estate.

## Phase P0 — delivered review slice

Nested projects, cues, motifs, human occurrences, expressive relations, loose captures, two editable relative-time stories, actual source playback and raw MIDI inventory, local discovery, bounded context compiler, deterministic prompt preparation and diagnostic symbolic render. Human/CLI/MCP use the existing domain path. UI, local transport and receipts are testable without paid tools.

Exit: Rowan source remains unchanged; recorded and intended timing cannot be confused; whole-phrase dependency is recoverable; valid authored notes render; unverified actual melody does not silently render as exact; idempotency/revisions tested.

## Phase P1 — reconcile and integrate with live MeatyMusic

Before editing, locate the actual MeatyMusic and Pipes repositories using the estate registry/local context. Record checkout revisions and dirty state; inspect current database, media storage, SDS/recipe model, UI shell and interfaces. Do not assume this source bundle is the live repository or replace production storage with its JSON reference store.

Add production entities using the existing database/migration discipline:

| Entity | Main fields / relationships |
|---|---|
| MusicalProject | id, owner scope, parent id, kind, title, summary, tags, revision |
| MusicalWork | id, owning project, title, recipe ids, story ids, take ids, purpose |
| MotifIdentity | id, owning project, kind, meaning, reference anchors, active representations |
| MotifRepresentation | id, motif id, revision, type, content/artifact ref, source/evidence, coordinate system, review |
| MotifOccurrence | id, exact take/hash, source start/end, motif id, role/instrument claims, evidence, timing uncertainty, reviewer |
| StoryRevision | immutable id/revision, owning work/project, relative gestures, constraints, relationships, provenance |
| StoryGesture | motif/representation refs, instrument/role, relative timing, intended contour, locked fields, open questions |
| Alignment | story/score/performance refs, explicit anchors, clock map, method/version, residual uncertainty, review |
| MusicalInterpretation | author, text, target/span, tags, confidence-language or open question, privacy, revision |
| Experiment / Condition / Review | question, independent variables, sources, execution links, observations, keeper decision |
| CreationPacket | frozen input refs, compiler version, capability snapshot, prompts/score plan, omitted context, permissions |
| ExecutionReceipt | operation, input/output hashes, adapter version, exact status, cost if known, errors, diagnostics |

Use existing `Take`, `Recipe`, `Handoff`, `Asset` and `Voice` authorities where present. Do not introduce new duplicate tables merely because this prototype names a concept differently. Motif ownership plus cross-links must support shared world themes and collaborations without copying records.

Add foreign keys, same-work/source-span checks, indexed project ancestry, immutable source assets, optimistic revision checks and idempotency keys scoped to actor/workspace/operation. Track source code/schema revision in migration receipts. Backfill existing recipes/takes as unassigned or linked works without inventing musical facts. Unfiled thoughts remain visible. Keep an explicit rollback/export path.

Port the UI into the existing shell and design tokens. Preserve player behavior, takes/recipe controls and voice-lab boundaries. The new canvas is a feature area; it is not a new top-level app competing with MeatyMusic.

## Phase P2 — one native renderer, one notation route

Prefer **REAPER ReaScript + a reviewed existing MCP bridge** for the first expressive render adapter. REAPER's scripting surface is native; the TwelveTake MCP is a community bridge. Inspect its actual `tools/list`, version, installation and license. Never hardcode a marketing tool count as a capability guarantee. MuseScore's official CLI/export path is the first notation route; a community MCP wrapper can follow if it adds value.

A renderer adapter contract should expose inspect capabilities, inspect project, create scratch project, import exact symbolic plan, resolve instrument preset, render bounded region/stems, return hashes/metadata, undo and clean scratch. Actual names must be mapped to discovered backend tools. Unsupported articulations/tunings are returned as limitations; never silently label a GM patch “realistic fiddle.”

Preflight: target project identity, active tab, dirty state, renderer/plugin versions, instrument/preset mapping, output-root allowlist, permission scope and render bounds. Use one named undo step per intended edit. Explicitly close undo blocks; deferred scripts need deliberate undo management. No edits to an already open personal production session by default.

Exit test: create a disposable three-part original score, render, reopen, inspect notes/preset mapping, verify output, undo, and prove the original project was unchanged. Store a receipt, not a screenshot alone.

## Phase P3 — analysis and guided discovery

Add audio/performance listeners, stem/transcription adapters and semantic retrieval only after verifying source permissions and current provider contracts. “Can technically accept a file” is not authority to send it. Keep unknown rights unknown; separate local playback, local DSP, external model analysis, provider-reference upload and publication.

Detection results are candidates with method/version and source alignment. Human corrections produce separate revisions. Melody similarity compares longer rhythmic/interval sequences and context, not a few shared notes. Record scores as method outputs, not plagiarism or originality verdicts.

Recognition-oriented retrieval should combine curated relations, metadata and authorized semantic index entries; explain each result. Interpretive private notes require an explicit scope before remote processing. User can disable learned personalization and keep exploration local.

## Phase P4 — rich visual composition and AOS scale

Implement cross-song motif matrix, gesture brushes, part-level transformation controls, tempo-aware story/score alignment, live motif playback highlighting, level-matched derived comparisons, regional/tuning-aware instrument maps and AGL event-plan imports. Keep workbench interaction immediate; move long operations to a cancellable job service with receipts and actor scopes.

AOS registration is a proposed action after local proof, not performed by this package. Suggested capability families: `music.inspect`, `music.context`, `music.score`, `music.render`, `music.compare`. MeatyMusic provides `music.project`, `music.story`, `music.capture`, `music.prepare`, `music.review`. The routing layer should resolve ownership rather than create a second control plane in Pipes.

## Minimum acceptance gates before estate registration

- Reconcile identities and storage with actual repositories.
- Authenticated scoped API/MCP, not a raw LAN-exposed local token server.
- No arbitrary filesystem/shell/provider targets from tool input.
- Source masters immutable and derived files idempotently registered.
- Expected revision and requested permission verified before writes.
- Finite/bounded input, render duration, message size and output size.
- Capabilities and claims match observed adapter behavior.
- Retry/cancel semantics distinguish queued, running, succeeded, failed and uncertain output.
- Telemetry reports real operations, costs and output verification without making artistic judgments.
- Human can inspect and reverse draft actions; approved masters and public publication require separate authority.
