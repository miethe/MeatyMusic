---
schema_version: "0.1"
id: null
type: artifact
artifact_kind: source_and_decision_register
title: "Sources, evidence boundaries and architecture decisions"
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

# Sources, evidence boundaries and architecture decisions


## Scope

Reviewed 2026-10-07. Connected repository reads are source evidence, not a live deployment test. Default-branch URLs may move; the blob hashes below identify the actual file content read. No private hostnames, IP addresses or secret contents are reproduced in this handoff. Source links to private repositories require the user's access.

## Repository register

| ID | Source | Blob SHA / boundary |
| --- | --- | --- |
| R1 | [Voice Lab README](https://github.com/miethe/voice-lab/blob/main/README.md) | `69856522a530705a903794fcec72487137211b47`; curation, no provider calls, bundle promotion |
| R2 | [Voice Lab promotion bundle schema](https://github.com/miethe/voice-lab/blob/main/packages/contracts/promotion-bundle.schema.json) | `9c3ac4b76a98165098f676226b4924ea826f68cc`; v1.0 metadata contract |
| R3 | [Voice Lab implemented API](https://github.com/miethe/voice-lab/blob/main/docs/API_IMPLEMENTED.md) | `756247eb4f45f99c448a453d4a3429a983d8a40a`; actual vs target APIs, idempotency/revision and unsupported states |
| R4 | [aos-tts README](https://github.com/metis-aos/aos-tts/blob/main/README.md) | `3332034985930b7f8b51bf423595a388cee75630`; Estate Voice CLI/HTTP/library, promotion consumer, live gates |
| R5 | [MeatyMusic Style schema](https://github.com/miethe/MeatyMusic/blob/development/schemas/style.schema.json) | `14c237a8a9d8960bf106a8e5e627699b3ab386e0`; current re-read of max-three/key/tempo constraints |
| R6 | `reference/meatymusic-sonic-workshop-direction-v0.1.md` | Historical 2026-10-01 product direction and pinned broader review at `4c31e905` |
| R7 | `reference/prior-ux/` | Focused design references, not evidence of provider features or deployed UI |

## Primary provider and protocol sources

| ID | Source | Used for |
| --- | --- | --- |
| P1 | [Suno Platform](https://platform.suno.com/) | Official API entry exists; public page is sign-in, not complete authenticated contract |
| P2 | [Suno Voices](https://help.suno.com/en/articles/11362369) | Own-voice enrollment and spoken verification; no arbitrary synthetic identity import claim |
| P3 | [Suno Exclude](https://help.suno.com/en/articles/3161921) | Separate exclusion field |
| P4 | [Eleven Music composition plans](https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans) and [Compose API](https://elevenlabs.io/docs/api-reference/music/compose) | Structured chunks, text/plan contract and reproducibility limits |
| P5 | [Eleven Professional Voice Cloning](https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning) | Specifically excludes singing support for Professional Voice Clones |
| P6 | [Google Lyria music generation](https://ai.google.dev/gemini-api/docs/music-generation) | Batch music lane, separate from RealTime |
| P7 | [Lyria RealTime](https://ai.google.dev/gemini-api/docs/models/lyria-realtime-exp) | Experimental streaming and weighted control; distinct instrumental operation |
| P8 | [Stable Audio Open release](https://stability.ai/news-updates/introducing-stable-audio-open) | Specific 2024 model release, short samples/effects; not a claim about every current Stability model |
| P9 | [MCP lifecycle 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle) and [Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) | Implemented bounded stdio lifecycle/tools target |

Model names, pricing, entitlement and account-specific voice support must be rechecked before live integration. No paid-account API documentation was accessed. Earlier prompt pack claims are historical and can conflict with later provider documentation; import creative text without promoting old capability metadata to truth.

## ADR-01 — Extend MeatyMusic

Decision: migrate SDS and application modules additively. Rationale: MeatyMusic already owns music creation artifacts; another product would fragment prompt/take lineage. Alternative rejected: separate Sonic Workshop backend becoming a second master. Cost: a current-state audit and compatibility migration are mandatory.

## ADR-02 — Prototype is portable, production keeps its stack

Decision: dependency-free local review implementation. Existing source-described Next.js/FastAPI/PostgreSQL remains the integration target. Rationale: immediate reproducible review without provider credentials or an npm build. Cost: UI components and persistence need production adaptation; local JSON is not a scalable datastore.

## ADR-03 — Quiet, role-aware UX

Decision: graphite/mint focused screens with persistent player and contextual inspector. Rationale: musical intent and listening should dominate, not a marketing collage or fake multitrack DAW. Alternative: one giant generation dashboard. Cost: progressive disclosure is needed for the deeper compiler/experiment features.

## ADR-04 — Manual handoff is a first-class adapter

Decision: close the return path before external execution. Rationale: immediate utility for Suno and durable provenance regardless of provider API availability. Cost: user attestation cannot confirm provider acceptance and imported associations need review.

## ADR-05 — Separate creative singer, speech and singing

Decision: operation-scoped bindings attached to a creative profile. Rationale: speech and music capabilities differ, and existing Voice Lab-to-aos-tts ownership is already coherent. Cost: a separate singing validation path and adapter are required before claiming identity continuity.

## ADR-06 — Exact text, original audio

Decision: preserve actual submitted fields verbatim and originals by hash. Transformations alter recipes; regions reference recordings. Rationale: prevent evidence loss and false audio-edit claims. Cost: derived asset pipeline and storage lifecycle are separate future work.

## ADR-07 — Agent commands are the same commands

Decision: CLI/API/MCP share domain validation and revision/idempotency behavior. Rationale: no hidden automation side door. Cost: protocol and production auth compatibility need tests, not only a schema export.

## ADR-08 — Observation is not intent

Decision: keep requested, measured, human-observed and unknown metadata distinct. Rationale: prompting for an instrument, meter or singing range does not demonstrate it occurred. Cost: sparse early catalog data is preferable to fabricated rich metadata.
