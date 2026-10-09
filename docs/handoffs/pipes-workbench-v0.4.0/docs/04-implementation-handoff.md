---
schema_version: "0.1"
id: null
type: artifact
artifact_kind: implementation_plan
title: "Additive implementation and migration plan"
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

# Additive implementation and migration plan


## Objective

Integrate Sonic Workshop into the existing MeatyMusic application, proving one closed create → handoff → take → moment → variation loop before broadening provider execution. Preserve existing songs, personas, prompts, IDs and recordings. The review prototype is a working acceptance reference, not a request to rebuild the application with Python's HTTPServer.

## Current evidence

An earlier repository review pinned MeatyMusic development at `4c31e905`. This handoff re-read the Style schema and found the same blob `14c237a8a9d8960bf106a8e5e627699b3ab386e0`: flat instrument strings capped at three, major/minor key text and required tempo/key. That is a schema finding, not deployment state. Voice Lab and aos-tts contract documents were read independently. Re-run smoke tests and capture a fresh repository pin before changing code.

## Data migration

1. Keep each legacy object ID and the original source serialization in a migration archive. Add schema_version and migration provenance.
2. Expand SDS instead of introducing a competing editable recipe object. Names in the UI may change while identity remains stable.
3. Turn legacy instrument strings into part references with `role: unspecified` where the source did not assign roles. Never invent evidence that an instrument was audible.
4. Make lyrics conditional on the vocal asset mode. A score, loop, one-shot or texture may have no lyrics, BPM or key. Preserve existing blank/unknown states rather than inserting 4/4 or C major.
5. Replace the major/minor-only assumption with optional structured/descriptive tonality and tuning metadata. Do not reduce a named raga or maqam to a Western key string.
6. Separate instrumental roster from foreground density per section. Remove the universal max-three policy; replace it with an explainable optional arrangement advisory.
7. Preserve exact prompt and exclusion text. Distinguish prepared versus actual submissions and legacy provenance unknown.
8. Attach existing external links as link-only records until permitted original bytes are imported. Deduplicate by byte hash, not title similarity.
9. Add singer direction revisions and operation-scoped voice bindings. Existing persona IDs can be referenced; provider model IDs must not masquerade as singer identities.
10. Consolidate duplicated inline and standalone schemas before migrating. Validate both old and new fixtures and provide a rollback path.

No destructive conversion should run automatically. Provide a preview containing counts, unresolved mappings, proposed IDs, orphan assets, conflicts and rollback steps. Approve a frozen plan hash and commit transactionally.

## Target module layout

Use existing project conventions first. A plausible organization is:

```text
services/api/app/
  music/recipes, instruments, transformations, compilation
  music/handoffs, attempts, assets, observations
  music/singers, voice_bindings, providers
  api/routers/music_*.py
apps/web/
  sonic-workshop/{arrange,variations,listen,library,voices,connections}
packages/contracts/
  sds-v2, prompt-artifact, generation-attempt, singer-direction, voice-binding
```

This is a proposed ownership map, not a set of paths already present. Reuse existing auth, database, object storage, events, jobs, tests and design primitives where they exist. The prototype's native JS/CSS demonstrates behavior and tokens; port components into React rather than mounting an unrelated shadow frontend indefinitely.

## Work packages and acceptance

| ID | Work package | Depends on | Acceptance |
| --- | --- | --- | --- |
| SW-00 | Current-state reconciliation | None | Pinned tree, dirty-state report, smoke tests, real routes/models and baseline feature matrix; no guessed liveness |
| SW-01 | SDS v2 additive migration | SW-00 | Legacy fixtures preserve IDs/text; instrumental and non-tonal assets validate; no duplicate schema drift |
| SW-02 | Canonical parts/sections/locks | SW-01 | Role cards and section presence share backend contract; locked edits fail explicitly; undo/branch leave parent intact |
| SW-03 | Deterministic compiler | SW-01 | Per-field Unicode counters; exclusions separate; required content never silently truncated; exact overrides preserved |
| SW-04 | Handoff and return path | SW-03 | Prepared vs actual text/settings; one attempt/many takes; original hashes and link-only states; orphan/retry handling |
| SW-05 | Listening and moments | SW-04 | Persistent exact-take player; measured waveform; valid regions; original bytes unchanged; no false time alignment |
| SW-06 | Typed variations and Play | SW-02, SW-05 | Three baseline operations plus role exchange; previews explain changed/preserved; no mandatory experiment bureaucracy |
| SW-07 | Singer direction and cast | SW-01 | Solo/duet/instrumental; separate creative direction and bindings; section-level vocal roles; immutable singer revisions |
| SW-08 | Voice Lab / aos-tts adapter | SW-07 | Full current bundle validation; profile conflicts held; service catalog IDs resolved; live speech needs existing gates |
| SW-09 | CLI/API/MCP parity | SW-02–08 | Shared handlers, optimistic revisions/idempotency, bounded tools, auth, structured failures; no silent paid retries |
| SW-10 | Provider capability discovery | SW-03 | Official authorized schema, account evidence and expiry; native/prompt-only/unknown states; costs not fabricated |
| SW-11 | First live music adapter | SW-04, SW-09, SW-10 | Explicit budget reservation; one verified authorized request; timeout reconciliation, original receipt and outputs |
| SW-12 | Experiment board | SW-06, SW-11 | Baseline, fixed/variable factors, replicates and requests/takes/cost distinctions; no automated preference claim |
| SW-13 | Estate exports | SW-04, SW-05, SW-09 | Idempotent outbox receipts; store references instead of duplicate canonical music data |
| SW-14 | Curated prompt/instrument import | SW-01 | Preserve original packs, propose roles, flag unknowns and review before catalog promotion |
| SW-15 | Production and accessibility gate | All released scope | Full native browser, auth, backup, media, keyboard/screen reader, concurrency and observability acceptance |

Recommended first release is SW-00–06 plus bounded voice direction from SW-07 and API parity. Voice generation, new model hosting and singing identity are independent releases. Stage by working slices, not by a fixed date or claim that every column is already built.

## Provider and voice execution gates

A request that can spend credits must require actor authority, a quoted/estimated cost with uncertainty, a user-approved cap, a frozen prompt/request body and a supported official adapter. Submit once. If the network outcome is unknown, mark submission_unknown and reconcile; do not buy another take automatically.

A voice import must not widen its operation scope. Voice Lab promotion is not permission to sing, enroll in another platform, publish, clone or train. Human voice enrollment remains in the provider's authorized process. Synthetic fictional singer descriptors are useful without any such binding.

## Production requirements beyond the prototype

| Area | Required hardening |
| --- | --- |
| Persistence | Existing SQL transactions and per-aggregate revisions; immutable sealed manifests; migration rollback |
| Media | Streaming ingestion, robust decoding in isolated worker, hash verification, duration metadata, quotas, safe filenames, HTTP Range/HEAD/ETag tests, backup restore |
| Security | Estate auth, CSRF/origin/host validation, per-action scope, secrets manager, outbound allowlist, no arbitrary URL fetches |
| Jobs | Durable queue/outbox; actual attempt statuses; cancellation/reconciliation; recorded unknown costs |
| UI | Native cookie/media acceptance, clipboard/download verification, drag/touch alternatives, screen reader and zoom, long-text/error/offline states |
| Singing | Explicit supported provider bindings, original test phrases and evaluation, revoked/changed voice handling, no inherited speech guarantee |
| Telemetry | Correlation and actual costs; privacy-aware metadata; provider and local failures separately |
| Catalog | Source-backed instrument/tradition metadata; requested/observed filters; no Spotify recommendation-to-history inference |
| Testing | Contract parity across UI/CLI/API/MCP; replay determinism only for controlled steps; provider recorded/sandbox tests plus human-authorized live gate |

## Reference acceptance scenarios

A. Pin the opening, attempt a lead replacement: it fails with a precise pinned-field explanation. Unpin and explicitly retry: a separate child is created.

B. Edit Style manually with leading/trailing whitespace: the saved handoff and actual-submission artifact match exact text and character count. An over-budget locked requirement fails; it is not silently removed.

C. Import the same byte-identical audio twice: original storage identity is stable while take associations remain explicit. A partial failed mutation must not leave a falsely completed take.

D. Select a moment beyond track duration or on a link-only take: reject. A valid moment points to one exact asset version and builds a conceptual recipe branch.

E. Import a speech-only voice: the singer remains unverified for singing; no external call occurs. A conflict against the existing provider voice binding is held for review.

F. Provider submit times out after possible acceptance: state becomes unknown, budget remains reserved pending reconciliation, and the UI does not offer a blind automatic retry.

G. Compare two generated takes with different section positions: A/B respects their own timelines; no fabricated synchronization.

H. Two clients edit the same record: the stale client receives a conflict, reloads and explicitly reconciles; no last-write-wins overwrite.

## Definition of done for integration

Committed, reviewed changes in the existing repositories; migration preview and rollback tested; end-to-end native browser flow with a permitted real music export; source and deployment pins recorded separately; actual estate seam behavior verified with read/write authority; unimplemented providers still explicit. This package by itself satisfies none of the remote deployment gates.
