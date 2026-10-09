---
schema_version: 0.1
id: null
type: artifact
artifact_kind: agent_prompt
title: "Local Agent Handoff — Musical Story Workbench"
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

# Local implementation handoff

## Objective

Integrate the supplied MeatyMusic + Pipes v0.4 review slice into Nick's existing MeatyMusic workshop and expose Pipes as a reusable AOS musical execution capability. Preserve the full Rowan recording as the first end-to-end experiment. This is an additive integration, not permission to build another DAW, replace the app, publish source audio or call generation services.

## Read first

Read `START_HERE.md`, `IMPLEMENTATION_STATUS.md`, docs 08–13, the implemented contracts, and `sources/source-manifest.json`. Inspect the existing v0.3 docs for recipe/SDS, provider and voice boundaries. Review `prototype/app/domain.py`, `prototype/app/workbench.py`, UI additions, transport adapters and `pipes/src/pipes_mcp/story.py`.

Locate the live MeatyMusic, Pipes and estate registry via local capabilities. Inspect repository revisions, uncommitted changes, database authority and actual deployments before editing. Do not infer installed tools or external account privileges from earlier chat text. Reuse existing model/provider routing, media and job services.

## Preserve these decisions

- MeatyMusic owns musical intent, hierarchy, motif identities, stories, recipes, takes and reviews.
- Pipes performs bounded operations and returns receipts; it does not own a second music library.
- The Long Becoming → Rowan Reach → work/cue hierarchy coexists with cross-linked shared motifs.
- User listening interpretation is not machine measurement. A selected audio performance is not a verified symbolic transcription.
- The full 194.8-second Rowan take is primary. The 85–112-second return depends on the earlier 25–55-second statement; the 98-second peak is not self-sufficient context.
- The old D–F#–A–B–A–F# sketch stays distinct from the performed Rowan melody.
- Intent time, symbolic beat time and recorded sample time are separate clocks with explicit mappings.
- Capture can remain unfiled; do not create an IntentTree task for every gesture or idea.
- Prompts retain separate Style/arrangement/Exclude fields. Prepared, submitted, generated, reviewed and promoted are different states.
- Painting a story creates intent. Missing exact notation must block exact rendering, not invite invented transcription.
- Voice Lab/aos-tts boundaries from the previous handoff remain intact.

## Sequence

1. Run all portable tests and the local UI smoke test in a fresh private data directory. Confirm source hash and native browser startup. Keep the prior prototype as a rollback artifact.
2. Produce a reconciliation note: existing entities/services versus portable ones, retained fields, necessary migrations, conflicts, ownership and implementation gaps.
3. Port hierarchy, motifs/representations, human occurrences, story revisions/relationships, unfiled captures and context compiler into the existing domain. Reuse recipe/take/media authorities. Add transport parity tests before exposing new operations.
4. Integrate the story/evidence/atlas/discovery lenses with current UI patterns and accessibility. Do not let machine candidates look like verified notes.
5. Seed ROWAN-001 privately with approved input handling. Recompute the full WAV hash and raw MIDI parse, retaining origin zero. Do not overwrite original or auto-promote source sketches.
6. Connect one reviewed REAPER bridge in a disposable project. Read native capabilities and renderer/preset identity, implement bounded import/render/inspect/undo, and store actual output receipts. Do not install or activate paid products without approval.
7. Add notation export via official MuseScore/standard formats; expose current limitations. Demonstrate one controlled original three-instrument cue before attempting the unverified Rowan transcription.
8. Add candidate AOS registry/seam entries through existing process only after local acceptance. Preserve provider/manual handoff fallback where no verified API exists.

## Validation

Retain tests for stale revisions, pin enforcement, idempotency, source immutability, path containment, full phrase context, cycle/budget handling, prompt budgets, returned-take lineage, no-project capture retrieval, missing-score render refusal and genuine MIDI/audio output. Add native adapter tests for wrong project, dirty state, unsupported articulation, timeout, partial render, cancel and undo.

Report separately: source changes, passed tests, local runtime proof, deployed state, capabilities actually connected, remaining gaps and any human approvals needed. Do not announce implementation as deployment or confuse a diagnostic sine sketch with expressive instrument synthesis.

## First user-facing result

Nick opens the complete Rowan performance, selects the yearning-return passage, sees its earlier callback, paints a cello-supported variation, inspects the compiled materials and auditions an explicitly authored/native-rendered sketch. Every view should reveal why the material was included and what is still uncertain.
