---
schema_version: "0.1"
id: null
type: artifact
artifact_kind: product_direction_and_architecture_proposal
title: "MeatyMusic — Sonic Workshop: Product Direction v0.1"
project: MeatyMusic
domain: musical_creation_and_experimentation
status: proposed
owner: Nick Miethe
created_at: 2026-10-01
updated_at: 2026-10-01
system_of_record: GitHub
current_location: conversation_artifact
related_systems: [Agentic OS, SkillMeat, MeatyWiki, CCDash, IntentTree, Aural Geometry Lab]
source_context:
  - Current conversation: instrumental scores, house-sound experiments, prompts, motifs, effects
  - "miethe/MeatyMusic development@4c31e9054cd9c7064093d66a7f14292a8bc8d30c"
  - Official Suno, ElevenLabs, and Google documentation checked 2026-10-01
intended_use: Product ideation and scoped implementation planning; not an implementation attestation
next_action: Audit current MeatyMusic vertical slice and define additive SDS v2 migration
review_cadence: Before implementation and whenever a provider capability changes
confidentiality: personal
tags: [sonic-workshop, orchestration, music-lineage, house-sound, provider-adapters]
---

# MeatyMusic — Sonic Workshop

## Executive direction

Extend MeatyMusic rather than start a new product. Make it a visual, agent-operable workspace for musical recipes, orchestration transformations, generation experiments, and the resulting audio collection. Prompt text is an important output, but not the whole creative model.

The core loop is:

**Reference → recipe → variation → provider request → take → listening notes → reusable discovery.**

Start with Suno-compatible manual handoff and reliable return-path capture. Add API-backed generation behind the same contracts. Keep Aural Geometry Lab separate as the owner of mathematical music construction and exact musical-event semantics.

This document is a proposal. Repository facts are scoped to the pinned revision; provider facts are dated. No application was run, no tests were executed, no remote files were changed, and no generation jobs were submitted for this review.

## 1. Existing foundation and verified constraints

The repository `miethe/MeatyMusic` appears to match the project described as MIDI Music. Its documentation names it Agentic Music Creation System (AMCS), centers it on a Song Design Spec (SDS), and already describes style, persona, producer-note, prompt, render, and review concepts. The documented stack includes Next.js, FastAPI, PostgreSQL, Redis, and artifact storage. These are repository descriptions, not proof of current deployment or end-to-end readiness. [R1–R3]

Directly inspected schema constraints are more consequential than the branding:

- `schemas/style.schema.json` represents instrumentation as strings and imposes `maxItems: 3`.
- Its key validation accepts major/minor key strings; tempo and key are required.
- `schemas/sds.schema.json` requires lyrics and repeats the instrumentation/key constraints in inline definitions.
- The inspected connector base defines submit/status/cancel and validates only the length of `final_prompt`; the connector directory contains an initializer, base, and mock. This does not establish that no integrations exist elsewhere. [R4–R7]

The older Style PRD additionally proposes warnings for slow tempo plus high energy and limits instruments to three. Those should not become universal musical laws in the expanded product. Their relevance should depend on the section, intended aesthetic, and selected validation profile. [R8]

**Migration implication:** expand the existing concepts and contracts rather than discard them. Preserve legacy IDs, prompts, exclusions, user annotations, and generated associations. Never silently fill missing tempo, key, roles, or provenance during import.

## 2. Purpose, problem, and product boundary

### Purpose

Make musical exploration easier to steer, compare, remember, and reuse without turning a pleasurable creative activity into administrative work.

### Problem

A flat tag list cannot adequately represent which instrument leads, which answers, when an ensemble grows, how a motif moves between instruments, or why one result was preferred. A folder of audio files cannot reconstruct those decisions. A provider-specific prompt editor cannot preserve intent across different generation interfaces.

### Product definition

**A musical recipe and experimentation workbench with an integrated listening catalog.**

The first product is not a DAW, a streaming service, a new music-generation model, a general agent framework, or a replacement for Aural Geometry Lab. It need not be an enterprise offering to be valuable.

### Primary experience

Open a favorite recipe such as *Sarod on the Ridgeline*. Lock the narrative arc and rhythmic intent. Replace the lead with a bowed instrument, preserve its foreground role, and move the former lead into rhythmic support. Review the musical and prompt diff. Compile for Suno, copy Style and Excludes separately, and record the handoff. Return with the actual submitted settings, provider link, and permitted audio download. Compare takes and mark the passage that worked. Promote the discovered arrangement pattern without pretending it is a universal rule.

## 3. Core concepts: evolve SDS, do not introduce a competing master

Use **Sonic Recipe** as the friendly UI name for a versioned, expanded SDS. Maintain migration compatibility with the existing SDS rather than creating a second independently editable specification.

### Identity profile

A reusable family of preferences: material palette, melodic behavior, orchestral scale, production character, default exclusions, exemplars, counterexamples, and rationale. Branches could include House/Chamber, House/Symphonic, House/Roots, and House/Experimental.

A house identity is not a provider custom model. Optional provider-model bindings are references on a profile, subject to verified access and rights. The identity remains useful without any training feature.

### Instrument definition versus assigned role

The instrument catalog describes an instrument. A recipe assigns it a job.

Catalog fields should include canonical ID, names and aliases, descriptive timbre, relevant techniques, register guidance, multiple tradition/context references, sources, and optional approved audio examples. Treat provider recognition as observed experience tied to a provider/model/prompt—not as an inherent property of the instrument.

An assignment adds role, register, articulation, prominence, section presence, motif association, and relationships such as call-and-response or rhythmic support.

Initial roles: lead, answer, countermelody, rhythmic figure, bass foundation, harmonic support, drone, texture, and punctuation. A player may change roles across sections.

Do not impose a universal three-instrument limit. Offer a configurable foreground-complexity advisory per section. A ten-player arrangement can still have only two prominent lines.

### Roots and feel

Separate instrumentation, melodic language, rhythmic organization, performance behavior, arrangement lineage, production, and cultural references. Adding an instrument should not silently add a region-wide genre stereotype or force a Western scale.

A tradition/reference record may carry richer descriptive grammar. A named raga or maqam must not be reduced to a bare scale label. Early support can preserve expert/user descriptions and references without claiming to validate an entire tradition.

### Arrangement and motif

Sections can contain roles, entrances, exits, register, density, dynamics, and motif transformations. Their timing may be relative, approximate, or exact. Record which kind it is.

A motif can be a verbal contour, an annotated audio excerpt, an original symbolic sequence, or an imported reference. These representations have different evidentiary strength. Text describing a motif does not establish that generated audio contains it.

## 4. Transformation engine

A transformation is a typed, reviewable patch to a recipe, not merely an instruction to rewrite the whole prompt.

| Transformation | Changes | Intended invariant |
| --- | --- | --- |
| Role-preserving substitution | Instrument, articulation, register hints | Lead/support job and arrangement arc |
| Role exchange | Which player leads, answers, or accompanies | Instrument roster |
| Orchestral expansion | Ensemble size and harmonic support | Featured acoustic motif and soloist presence |
| Chamber reduction | Doublings, density, register distribution | Essential foreground ideas |
| Groove translation | Pulse grouping, articulation, rhythmic support | Melodic/narrative intent |
| Motif handoff | Instrument carrying a recurring idea | Motif reference, where representable |
| Timbral contrast | Attack/sustain, material, register | Role and section placement |
| Narrative substitution | Development and climax placement | Selected musical palette |

Each patch declares preconditions, touched fields, locked fields, warnings, and a rationale. A deterministic patch can preserve specification fields; it cannot guarantee that a generative renderer preserves the audible melody.

Provide two modes:

**Play:** explore freely, mix axes, collect surprises. No required hypothesis or rating form.

**Experiment:** declare a question, fixed factors, variable factors, replicate count, selection method, and budget. Label results as exploratory when evidence is limited.

A 3-lead × 2-accompaniment × 2-take experiment creates 12 requested takes, not necessarily 12 provider API calls. Providers may bundle outputs differently. Report requests, takes, and costs separately.

A control labeled “more orchestral” must expose its mapping: add supporting strings, widen register, introduce horn responses, raise climax density. It must not silently change melody, tempo, or every style field. Blend weights are editorial priorities unless a specific provider supplies an actual weighted control.

## 5. Rich interface without a configuration maze

### Workshop

One principal working screen: reusable material browser on the left, ensemble roles and section strips in the center, a live provider-specific prompt/parameter inspector on the right, and a persistent player/take tray below. Support compact mobile editing and deeper desktop editing.

The default path is select favorite → change one thing → inspect/export. Theory and schema controls are progressive disclosure.

### Experiment board

Variant cards or a matrix show what changed, what stayed fixed, jobs, takes, and listening decisions. Include a baseline and rejected outcomes. Recipe comparisons and audio comparisons are separate.

### Listening room

A/B by whole take, a marked region, or corresponding manually aligned sections. Offer audition-only loudness matching, level control, and randomized labels. Do not rewrite original masters. Equivalent timestamps do not necessarily represent equivalent musical sections.

Mark a passage with observations such as “keep the handoff at 1:18; strings bury the soloist afterward.” The note attaches to an asset version and time range.

### Catalog

Search identity families, recipes, ensembles, prompts, take metadata, annotations, regions, motifs, loops, one-shots, stems, and releases. Distinguish requested metadata from observed metadata in filters and result labels.

A single generation can yield several useful regions without becoming several unrelated records. Keep links to originals, transformation history, and rights.

### Lineage view

Show recipe ancestry, reference links, generated takes, selected passages, and audio derivatives. Typed edges distinguish “inspired by,” “derived audio from,” and “variation of.” Do not misrepresent conceptual inspiration as byte-level audio derivation.

Use conventional cards and timelines first. A large graph visualization is optional, not the primary editing interaction.

## 6. Data model

| Object | Responsibility |
| --- | --- |
| IdentityProfileRevision | Reusable house sound, branches, defaults, exemplars |
| InstrumentDefinition | Sourced names, techniques, timbre and contextual metadata |
| RecipeRevision / SDS v2 | Style intent, ensemble roles, form, theory, asset kind, constraints |
| VariationPlan | Parent revision, operations, invariants and experiment factors |
| PromptArtifact | Exact compiled fields, settings, compiler/capability versions, character counts |
| GenerationAttempt | Actual submission, provider/job identity, status, retry lineage and cost |
| AudioAsset / Region | Original bytes or link-only record, hashes, formats, durations and derivatives |
| Observation / Evaluation | User or analyzer findings, provenance, confidence, context and time ranges |
| Reference | Track/composer/project link, annotations, authorized usage and retrieval provenance |

Use typed `asset_kind` values for score, song, motif, loop, one_shot, texture, and stem. Keep lyric support but make its requirements conditional. A texture or one-shot should not require BPM, major/minor key, or a verse/chorus blueprint.

Theory should allow unknown/unset, tonal-center descriptions, modes, user-defined pitch systems, optional symbolic detail, free time, tempo maps, and section-specific meter. Do not claim general validation for musical systems the implementation cannot model.

### Illustrative recipe fragment — proposed, not an implemented schema

```yaml
schema: meatymusic.sds.v2
id: recipe_sarod_ridgeline
revision: 3
asset_kind: score
identity_profile_ref: house_symphonic_v1
vocal_mode: instrumental
rhythm:
  bpm: 96
  meter: 4/4
  enforcement: prompt_target
ensemble:
  - part_id: lead_a
    instrument_ref: sarod
    role: lead
    articulation: lyrical_plucked
    prominence: foreground
  - part_id: reply_a
    instrument_ref: mandolin
    role: answer
  - part_id: bass_a
    instrument_ref: upright_bass
    role: bass_foundation
form:
  - id: opening
    active_parts: [lead_a, reply_a]
  - id: expansion
    behavior: orchestra_develops_opening_material
locks: [rhythm, form]
exclusions_profile_ref: instrumental_common_v1
```

The example's references are illustrative, not claims that those catalog records already exist. A complete schema must validate referential integrity and migration behavior before implementation.

## 7. Prompt compiler and provider capability contract

Compile from a frozen recipe revision, explicit target, policy profile, and versioned compiler. The result includes separate Style, Excludes, arrangement/lyrics fields where supported, provider settings, and a report of approximated or unsupported intent.

For the user's Suno workflow, preserve the **1,000-character Style budget** as an explicit target profile and keep exclusions separate. Suno documents a separate Exclude control. Provider/model/account capabilities must be checked rather than inferred from old prompts. [P1–P2]

The compiler should preserve priorities in this order unless the user overrides them: core identity, foreground instrument roles, distinctive relationships, narrative arc, then optional descriptive detail. It must never silently truncate locked requirements. Show omitted phrases and character counts.

Use deterministic formatting for stable compilation. An LLM may propose richer descriptions or compression, but its result becomes a reviewed, versioned artifact. Do not call a model on every slider movement or navigation event.

### Free-text round trip

Keep an editable prompt pane. Preserve manual overrides exactly, expose the difference from compiled text, and offer an explicit “reconcile to recipe” proposal. Re-parsing text may be ambiguous; require review before modifying the structured recipe. Always preserve the exact submitted text even when it differs from the recipe.

### Capability manifest

Key capabilities by provider, model, operation, account entitlement, and observation date. Include supported inputs, per-field limits, native parameters, prompt-only targets, reference-audio rules, output formats, seeds, variation semantics, cancellation, idempotency, and access status.

Expose states such as `native_parameter`, `prompt_only`, `unsupported`, and `unknown`. A native parameter is not automatically a verified acoustic guarantee. Provider knobs with similar names must not be assumed equivalent.

## 8. Integration strategy grounded in current documentation

| Target | Proposed route | Evidence boundary |
| --- | --- | --- |
| Suno | Manual handoff first: exact Style, Excludes, settings checklist, receipt and approved-download import | Existing project includes manual-copy workflow; no official public generation API was verified in this review. [R3, P1–P3] |
| ElevenLabs Music | First candidate API-backed batch adapter | Official API accepts a prompt or composition plan; current plans support ordered chunks with duration and styles. [P4–P5] |
| Google Lyria batch | Additional provider for independent interpretations | Official documentation describes text/image music generation and warns that outputs vary between calls. [P6] |
| Google Lyria RealTime | Later live exploration surface | Experimental WebSocket generation supports continuous steering; this is distinct from batch creation. [P7] |

Do not build a lowest-common-denominator adapter that discards structured composition plans. Keep a provider-neutral recipe and compile provider-specific request bodies. Conversely, do not force every provider to behave like a cancellable asynchronous job service if its actual interface differs.

A live surface can later expose supported weighted prompts and native controls. Elsewhere, moving a slider edits the next request; it does not edit the currently playing waveform.

## 9. Closing the return path

Create a handoff ID before leaving the application. Store the prepared prompt, profile, settings and source recipe revision. On return attach a provider link and/or permitted local download, verify the association, and record actual settings and any last-minute edits.

Model the relationship as recipe → prompt → attempt → zero or more takes → zero or more regions/derivatives. A provider failure, partial delivery, or uncertain association is a valid state—not a reason to invent missing metadata.

Use file hashes for byte identity and idempotent ingestion. A perceptual similarity score, if later added with appropriate permissions, is not a substitute for byte hashes or proof of identity.

Keep the original bytes unchanged. Trims, normalization, format conversion, and extracted stems are derivatives with recorded operations. A provider URL alone is a useful link-only record but does not establish local audio access.

## 10. Listening evidence and house-style evolution

Separate three questions:

1. Did the output follow the requested musical idea?
2. Does the user enjoy it?
3. Is it useful for a particular purpose?

A beautiful deviation may be a favorite but a failed preservation trial. A compliant technical sample may be useful but not enjoyable as a song.

Store explicit notes and pairwise preferences before building a personalized model. Retain counterexamples and conflicting preferences by use case. Skipping a track is not automatically dislike; saving it is not a blanket endorsement of every property.

Start with file validation and low-cost audio measurements such as duration, channels, sample rate, peak level and silence. Estimated BPM, key, instrument identity, and motif detection remain analyzer outputs with method, version, confidence, and uncertainty. Do not relabel requested instruments as detected instruments.

Curated findings become candidate profile changes: “In these samples, keep the orchestral accompaniment lower during plucked solos.” Promotion requires review and links to the actual evidence. House style should develop branches rather than converge on one averaged genre.

## 11. Agent-operable architecture

Reuse the existing frontend/backend foundation after verifying it. Implement one domain command layer used by the web UI, HTTP API, CLI, and MCP adapter. MCP is an interface to the product, not a second orchestrator.

```text
Web UI ─┐
CLI ────┼─> Authenticated domain commands
MCP ────┤      ├─ Recipe revisions and transformations
HTTP ───┘      ├─ Compiler and capability validation
               ├─ Experiments, handoffs and generation attempts
               └─ Catalog, listening notes and releases
                         │
                    Durable jobs
                         │
               Manual / official API / local render adapters
                         │
                  Ingest, inspect, audition
```

Suggested modules inside MeatyMusic: catalog, recipes, transformations, compiler, providers, experiments, listening, and asset processing. They need not be separate services.

**State authority:** use the existing transactional store for mutable drafts, permissions and job state. Seal submitted/released revisions and receipts as immutable JSON artifacts alongside content-addressed audio. Database indexes of sealed artifacts are projections. One write path must define authority at each lifecycle stage; no two independently editable masters.

Keep binaries out of ordinary source Git. Use existing S3-compatible or managed filesystem artifact storage, backup/export support, and signed/local authenticated playback. No new graph database, vector service, or general workflow framework is required for the first slice.

### Proposed command contracts, not existing commands

| Operation | Representative contract | Effect |
| --- | --- | --- |
| Discover | `music.capabilities`, `music.catalog.search` | Read only |
| Draft | `music.recipe.create`, `music.recipe.patch` | Versioned draft mutation |
| Explore | `music.variation.plan` | Preview variants and costs; no generation |
| Compile | `music.prompt.compile` | Produce exact artifacts and warnings |
| Handoff | `music.handoff.create` | Prepare manual workflow; no provider charge |
| Generate | `music.generation.submit` | Authorized external action with budget check |
| Capture | `music.asset.ingest`, `music.observation.add` | Validate imports and attach notes |
| Promote | `music.identity.propose_update` | Candidate only; approval before publication |

Include stable IDs, expected revision on writes, idempotency keys where meaningful, structured errors, actor identity, correlation IDs, and explicit effects. Separate propose from execute. Workers must not blindly retry an uncertain chargeable submission; reconcile provider state first, or surface manual review. Local cancellation does not establish provider cancellation.

## 12. Estate ownership and integrations

| Owner | Responsibility and handoff |
| --- | --- |
| MeatyMusic | Musical taxonomy, recipes, variants, prompts, take catalog, listening evidence |
| SkillMeat | Reusable agent skills, compiler/operator recipes and approved operational bundles; reference domain asset IDs |
| MeatyWiki | Why a house style evolved, musical references, decisions and lessons |
| CCDash | Execution/provider observations, failure and cost events; linked rather than competing music metadata |
| IntentTree | Project milestones and substantial experiments, not a mandatory node for every playful variation |
| Aural Geometry Lab | Mathematical construction, symbolic/event references and deterministic mappings |
| Agentic Control Plane | Routes requests and approvals; does not own musical semantics or the audio player |

For AGL interoperability, use explicit import/export manifests with source revision, permitted assets, event or motif references, and validation status. The retrieved AGL evidence bundle already has materials, source recipes, materialization receipts and assets, but the bundle is a dated snapshot, not current deployment evidence. [A1]

Classification: primarily personal creativity, research and implementation; relevant AOS layers are skill assets, execution, telemetry, memory, routing, and governance. Use Architect for the design, Editor/Composer-oriented skills for recipes, Researcher for sourced taxonomy, Critic for evidence/constraints, and Operator for approved jobs. This does not justify a separate swarm or persistent agent per instrument.

## 13. Provider rights and access are architecture inputs

Suno's current terms restrict scraping/extraction and contain broad restrictions on using service/output to power, enable, or train other AI/ML tools. Ordinary permission to use an audio file should not be treated as permission to embed it, analyze it with another model, upload it as another provider's reference, or train a model on it. This review does not resolve every proposed integration's legal status. [P3]

Use per-asset, per-operation permissions with `allowed`, `denied`, and `unknown` states and source/date. Unknown external reuse should stop for review, not silently proceed. The compiler can work with the user's own musical intent and notes without requiring restricted audio to be sent elsewhere.

Spotify references should begin as verified links/metadata and user annotations obtained through supported access. A recommendation playlist is not the user's listening history; a track URL is not access to its audio. Do not auto-ingest streaming audio or infer the user's preferences from app-generated recommendations.

## 14. MVP path

### Stage 0 — Reconcile the existing project

Run the app's supported smoke tests, map actual UI/API/data paths, inspect taxonomy conflicts, provider flags, and existing assets. Preserve the pinned findings above as a starting point, not a completed audit. Draft additive migrations for SDS v2 and conditional lyrics/tempo/key requirements. Reconcile duplicated inline schemas so one change cannot leave another validator stale.

### Stage 1 — Complete the creative loop

Import the earlier prompt packs as reviewable candidates, retaining original text. Create a recipe, branch it with a role-preserving swap, compile within the configured Style budget, export a manual handoff, attach a take, mark a region, and compare with a parent take. Every step has stable identity and provenance.

**First success criterion:** the user can recover what changed, the exact submitted prompt/settings, and the preferred moment without searching chat history or guessing filenames.

### Stage 2 — Structured experimentation and reuse

Add typed transformations, ensemble templates, role/section UI, optional experimental matrices, identity branches, A/B controls, reusable region/motif records, and agent contracts. Preserve the one-click playful path.

### Stage 3 — Supported automation

Add one official API adapter, robust job reconciliation, contract tests, rights checks and budget reservations. Introduce local asset-processing jobs. Add more providers only when they enable a meaningful workflow difference.

### Stage 4 — Advanced lab integrations

Evaluate AGL symbolic references, permitted audio analysis, live Lyria steering, audio/visual experiments, and supported inpainting or reference-based variation. Gate each by real capability and task value; none blocks Stage 1.

## 15. Validation and unresolved decisions

Required tests: legacy import preservation; per-field prompt limits; separate exclusions; immutable submitted snapshots; lock-respecting transformations; unsupported-capability warnings; unknown provenance retained; idempotent ingestion; missing media tolerated; concurrent edits rejected cleanly; no chargeable retries after uncertain submission; secrets absent from artifacts; and actual render success distinguished from listening acceptance.

Content tests should cover orchestral ensembles larger than three instruments, free-time textures, non-major/minor descriptions, long-form scores, one-shots, and vocal songs. A quiet/intense combination or mixed-era palette should not fail merely because an old conflict matrix considers it unusual.

Open implementation questions: which current features are operational; existing media store and playback health; supported provider access on the user's accounts; corpus export and download rights; desired scope of original MIDI material; and whether preference modeling adds value beyond good search and explicit notes.

## 16. Recommended first implementation brief

**Extend MeatyMusic with a role-aware SDS v2, immutable prompt/take lineage, and one complete manual generation-return-audition workflow. Do not build a DAW, replace AGL, assume an unofficial Suno API, or add automated aesthetic scoring as a prerequisite.**

Suggested repository destination: `docs/project_plans/PRDs/sonic-workshop-v0.1.md` after human review. This conversation artifact has not been committed.

## Source register

Repository reads are pinned to `4c31e9054cd9c7064093d66a7f14292a8bc8d30c` on the observed `development` branch.

- R1: `README.md` — https://github.com/miethe/MeatyMusic/blob/4c31e9054cd9c7064093d66a7f14292a8bc8d30c/README.md
- R2: `CLAUDE.md` — https://github.com/miethe/MeatyMusic/blob/4c31e9054cd9c7064093d66a7f14292a8bc8d30c/CLAUDE.md
- R3: Website PRD — https://github.com/miethe/MeatyMusic/blob/4c31e9054cd9c7064093d66a7f14292a8bc8d30c/docs/project_plans/PRDs/website_app.prd.md
- R4: Style schema — https://github.com/miethe/MeatyMusic/blob/4c31e9054cd9c7064093d66a7f14292a8bc8d30c/schemas/style.schema.json
- R5: SDS schema — https://github.com/miethe/MeatyMusic/blob/4c31e9054cd9c7064093d66a7f14292a8bc8d30c/schemas/sds.schema.json
- R6: Render connector interface — https://github.com/miethe/MeatyMusic/blob/4c31e9054cd9c7064093d66a7f14292a8bc8d30c/services/api/app/connectors/base.py
- R7: Inspected connector tree — https://api.github.com/repos/miethe/MeatyMusic/git/trees/37fc096ee61621c101c0217a6003c275865cc5db
- R8: Style PRD — https://github.com/miethe/MeatyMusic/blob/4c31e9054cd9c7064093d66a7f14292a8bc8d30c/docs/project_plans/PRDs/style.prd.md
- A1: Retrieved Library file `fr02-bundle.md`, generated 2026-08-19, AGL commit `352f10374f48e21a885b1041fd67af919b7bc166`; dated schema evidence only.
- P1: Suno Exclude field — https://help.suno.com/en/articles/3161921
- P2: Suno Creative Sliders — https://help.suno.com/en/articles/6141377
- P3: Suno Terms, revised 2026-08-10, effective 2026-09-03 — https://suno.com/terms
- P4: ElevenLabs composition plans — https://elevenlabs.io/docs/eleven-api/guides/how-to/music/composition-plans
- P5: ElevenLabs compose API — https://elevenlabs.io/docs/api-reference/music/compose
- P6: Google Lyria batch music generation — https://ai.google.dev/gemini-api/docs/generate-content/music-generation
- P7: Google Lyria RealTime — https://ai.google.dev/gemini-api/docs/realtime-music-generation

All provider documentation above was checked on 2026-10-01. Capabilities and terms must be rechecked before implementation; this source register is not an account-entitlement or legal approval record.
