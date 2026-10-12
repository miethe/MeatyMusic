---
schema_version: 0.1
id: null
type: artifact
artifact_kind: validation_reference
title: "Capability Evidence, Source Precedence and Limits"
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

# Capability and evidence boundary

## Source precedence

1. User-supplied master and user-selected interpretation are authoritative for this creative reference, with their distinct scopes.
2. Supplied v0.3 MeatyMusic source establishes the additive implementation base, not proof of live estate deployment.
3. New v0.4 code/tests establish the local behaviors described in the current status.
4. v2/v3 soundtrack briefs and raw MIDI study are preserved sources, not proof that requested notes or emotions occurred.
5. Official tool documentation establishes supported integration surfaces, not that Nick's machine has them installed.
6. Community bridge documentation establishes a candidate implementation, not a vendor-native MCP guarantee.

The new sources and their hashes are recorded in `sources/source-manifest.json`. Existing bundled documents remain available for traceability. No installed font files or third-party instrument libraries are distributed.

## External integration checks — 2026-10-09

| Target | Source | What is supported | What remains unproven here |
|---|---|---|---|
| REAPER ReaScript | https://www.reaper.fm/sdk/reascript/reascript.php | Native scripts can invoke REAPER actions/API; embedded Lua; explicit undo APIs | Local installation, active project state, plugins, render output |
| TwelveTake REAPER MCP | https://github.com/TwelveTake-Studios/reaper-mcp | Community bridge documents project/MIDI/FX/render control | Installed version, local tool inventory, authorizations and native execution |
| MuseScore CLI | https://handbook.musescore.org/appendix/command-line-usage | Official command-line export/batch entrypoint | Exact installed flags/version and renderer output; no local MuseScore invocation |
| MCP tools specification | https://modelcontextprotocol.io/specification/2025-11-25/server/tools | tools/list, tools/call, schemas, structured tool responses | Runtime permissions are still implemented by app/domain, not tool annotations |
| Suno creative controls | https://help.suno.com/en/articles/6141377 | Influence controls are documented | User's current model/menu/account state, reliable score fidelity or automatic submission |

Prefer current runtime capability discovery over hard-coded provider tiers. Earlier handoffs' product/model names and plan limitations are historical context; this release does not assert universal ChatGPT write restrictions or a live Suno API. The local agent MCP uses stdio and local authenticated HTTP. Connecting this chat remotely has not been done.

## Operation-specific permission envelope — target contract

Each future adapter invocation carries actor, project scope, operation, allowed asset IDs, source rights assessment, local/remote boundary, cost ceiling when applicable, target project identity, output root, revision and approval evidence. The policy check occurs at dispatch and at the tool boundary. An MCP annotation does not enforce these permissions.

Keep local playback, deterministic DSP, model analysis, cross-provider reference upload, public release and model training as separate use classes. A user's possession of a file alone does not resolve all downstream uses. Current code performs local inspection and source-preserving diagnostic operations only; it makes no network requests to models or music providers.

## Important technical limits

- The review prototype is single-user/local with session-token auth, host/origin checks and writer locking. It is not hardened production remote access.
- The story canvas supports up to 32 gestures and 64 relationships in this slice; it is not a full sequencer.
- The note-backed renderer accepts a bounded explicit clock, at most 15 parts/2048 notes and up to 120 seconds plus release tail. It uses a quiet synthetic tone, not samples or a musical performance model.
- General MIDI program labels are playback hints, not reliable instrument identity or articulation.
- Raw MIDI parsing is deterministic; transcription accuracy, expressive performance and orchestral attribution are not thereby verified.
- Local search uses lexical matching and a small curated synonym map. It is not automatic audio understanding or a semantic recommendation model.
- Story intent uses a relative clock. A recording cursor is not projected into an intent canvas without an alignment.
- Imported source notes and render receipts may contain personal material; exclude them from public demos.
- Native renderer nondeterminism and sample-library changes must be recorded; the same MIDI alone does not guarantee identical expressive audio.

## Review posture

Keep creative meaning human-led. Analyst reports what was measured; composer proposes choices; arranger translates roles; operator executes; critic checks outcomes and missing premises. None should convert an interpretation into a fact or conceal a blocked capability with a plausible description of what might have happened.
