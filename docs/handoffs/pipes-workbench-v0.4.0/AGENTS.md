---
schema_version: 0.1
id: null
type: artifact
artifact_kind: agent_instructions
title: "Package Guidance for Implementing Agents"
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

# Agent instructions

Read START_HERE.md and IMPLEMENTATION_STATUS.md first. Current v0.4 docs supersede inherited entrypoint/status claims. Preserve all v0.3 recipe, media, provider, voice and command invariants unless an explicit migration changes them.

Do not overwrite input recordings, turn unverified MIDI into canonical notation, infer emotional facts from waveform, or claim a prompt preparation was a provider submission. Never run remote generation, install paid software, publish private assets or mutate a live DAW session just to demonstrate progress.

Use the existing domain command path, optimistic concurrency, idempotency and work/recipe/take lineage. Validate structured references and all clocks. Reuse actual live repository authority; do not replace its production stack with this JSON review server.

Run the test suite and report what ran. Keep local code, runtime proof, deployment and external connection states distinct. Follow docs/12_AGENT_IMPLEMENTATION_HANDOFF.md for migration.
