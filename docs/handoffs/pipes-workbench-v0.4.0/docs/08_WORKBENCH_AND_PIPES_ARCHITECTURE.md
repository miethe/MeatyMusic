---
schema_version: 0.1
id: null
type: artifact
artifact_kind: architecture_spec
title: "MeatyMusic / Pipes — Architecture and Product Definition v0.4"
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

# A musical workbench, not a prompt folder

## Purpose and problem

Let Nick move between a felt idea, a musical relationship, a concrete score and a performed sound without losing what made the idea matter. MeatyMusic should support composition, listening, writing, collecting, hypothesis-making and imaginative play as legitimate states—not just steps that must immediately become a finished song.

A folder of WAVs cannot say why a phrase matters. A prompt library cannot show whether its requested melody occurred. A conventional MIDI grid does not naturally represent “the second rise only works because the earlier promise faltered.” A mood tag loses the relationship entirely. A DAW remains valuable for precise production, but it should not be the only doorway into creative thought.

The product's central unit is a **linked musical idea**, which can have words, a visual gesture, a score representation, performed examples, counterexamples and a changing interpretation. These are related representations, not interchangeable facts.

## Product and ownership decision

**MeatyMusic owns the human-facing workbench and musical domain. Pipes is a reusable estate execution capability.** This promotes Pipes beyond its previous game-only experiment without turning it into a second library or replacing the existing MeatyMusic application.

| Responsibility | Authority | Boundary |
|---|---|---|
| Projects, cues, creative intent, motifs, recipes, takes, listening judgments | MeatyMusic | Reuse SDS/recipe authority and version history; don't copy it into Pipes |
| Audio inspection, symbolic transforms, renderer invocation, bounded comparison, execution receipts | Pipes | Stateless computations or job state; input/output artifact IDs, not a separate truth about meaning |
| Game worlds, cultures, soundtrack decisions | The Long Becoming | First content consumer; other music projects can coexist |
| Exact mathematical/event mappings and formal experiments | Aural Geometry Lab | Supplies versioned event/score plans, consumes rendered results; do not redefine exact maps as aesthetic inference |
| Reusable method stacks and constraints | SkillMeat | Store recipes/skills or references; do not duplicate every WAV |
| Explanation, research and durable decisions | MeatyWiki | Linked explanatory projections, not a competing musical asset database |
| Execution/cost/error telemetry | CCDash | Measure runs, not “how good the art objectively is” |
| Deliberate work and experiment tasks | IntentTree | Explicit promoted tasks only, not every capture or gesture |
| Tool/model routing and approvals | AOS control plane | Route bounded jobs; no implicit approval to spend, publish or replace masters |
| Voice identity and speech | Voice Lab / existing aos-tts service | Preserve speech/singing boundaries from v0.3; no automatic transfer of a speaking identity into a singer |

Canonical layer mapping: creative intent and contextual capture touch L1–L2; deliberate experiment planning L3; composer/arranger/critic postures L4; reusable recipes L5; Pipes execution L6; CCDash L7; MeatyWiki L8; routing L9; permissions/evidence L10; future sharing L11. This is a personal creative and implementation capability, not an enterprise offering claim.

## Core concepts

**Project:** a nested scope such as a world, culture, album or independent study. Every project can hold incomplete ideas. Hierarchy organizes ownership; typed links express reuse across the hierarchy.

**Work / cue:** a musical identity or intended piece. A work is not a file and can contain many recipes, story branches, scores and takes. A take is an immutable realized artifact with source lineage, not “the song” itself.

**Motif:** an identity whose type may be melodic, rhythmic, harmonic, textural or an expressive arc. It may initially exist only as an idea or audio anchor. “Rowan Return” is a relationship among phrases, not merely six notes.

**Representation:** a versioned realization of a motif or work in prose, notation, MIDI, MusicXML, audio, gesture or performance instructions. Future rich representations retain coordinate system, source and validation. Current implementation has a nullable simple symbolic sketch plus audio/occurrence links.

**Occurrence:** a claimed appearance in an exact take and time interval. Human-reported, machine-candidate and verified occurrences must be distinct. The current create API can record human reports; it cannot assert machine or score verification.

**Instrument role:** lead, answer, counterline, foundation, pattern, color or expansion. Instrument identity and dramatic role are independent. Fiddle and cello can exchange roles while remaining distinct instruments.

**Story:** a revisioned arrangement of gestures, silence, motif references, instrumental ownership and relationships. It can be useful before exact notes exist. A story does not magically become a score because it was painted on a timeline.

**Interpretation:** “the retreat carries yearning” has an observer and a context. Preserve Nick's language verbatim where possible, allow multiple readings, and do not infer diagnosis, biography or objective emotion from audio.

**Experiment:** question, immutable source conditions, methods, comparison views, observations and review. Its outcomes may be “keep exploring” or “nothing reliable found.”

**Creation packet:** frozen story/recipe/context, exact prompts, requested settings, references, rights/capability status and evaluation questions. Preparing is distinct from submitting, hearing, accepting and publishing.

## Hierarchy plus graph

```text
MeatyMusic workspace
└── The Long Becoming                       world/project
    ├── World theme                         shared motif
    └── Rowan Reach                         culture/project
        ├── Above the Rowan Canopy          work
        │   ├── approved original           immutable take
        │   ├── first statement             observed passage
        │   ├── complete Rowan Return       observed passage + expressive identity
        │   ├── raw Basic Pitch             unverified symbolic representation
        │   └── story branches              planned variations
        └── What We Carry                   album/project
            └── eight companion cues        briefs, not generated recordings
```

A motif can belong to one scope and be reused by multiple works. A cross-culture work can refer to both cultures without copying their whole registries. The original reference may anchor several experiments. Do not force the relations into a strictly nested file tree; do not expose a full tangled graph by default.

## Evidence and time contracts

Five kinds remain separate: **authored intention**, **human listening report**, **machine candidate**, **measured signal**, **verified symbolic score**. Store origin, method/version, subject, scope and provenance. Acceptance of an audio performance does not certify its transcription. A corrected score does not prove a particular emotion or cultural origin.

Three clocks are explicit:

| Clock | Unit | Authority |
|---|---|---|
| Story intent | relative position 0–1; optional target duration | author |
| Symbolic composition | beats, bars, ticks plus explicit tempo/meter map | score |
| Recorded performance | samples / seconds against an exact asset hash | media |

A mapping between clocks is its own artifact. An evenly stretched story is a compositional choice, not a measured alignment. Raw MIDI's default 120 BPM is not the recording tempo; the first detected note at 25.36 seconds does not move the recording's origin. Future elastic alignments need anchors, version, residual uncertainty and manual correction.

## Architecture

```text
Browser workbench / local CLI / MCP client
              │ same domain commands and revisions
              ▼
MeatyMusic domain: projects, ideas, motifs, stories, recipes, takes, reviews
              │ frozen input/context and permitted capability request
              ▼
Pipes operation layer
 ├── deterministic inspect / bounded excerpts / raw MIDI inventory
 ├── explicit symbolic plan / transformation / validation
 ├── diagnostic renderer (implemented)
 ├── native DAW and notation adapters (target)
 └── authorized perception/generation adapters (target)
              │ receipts, outputs, evidence type, partial failures
              ▼
MeatyMusic review / compare / keeper decision
              │ only intentional promotions
              └── AOS references, recipes, memory and telemetry
```

The portable review server uses a local JSON store because that is the supplied v0.3 reference implementation. This is **not** a decision to replace the existing MeatyMusic production PostgreSQL authority, nor a proposal for a new framework rewrite. Port the verified domain contracts into the live app after reconciliation.

## Human and agent workflow

1. Capture a thought, hum reference, file or timestamp without demanding complete metadata.
2. Discover by project, instrument, remembered feeling, relationship or similarity hypothesis; return small sets with reasons and preview context.
3. Pin an anchor and branch an idea. Decide what is fixed (melody, role, phrase order) and what can vary (timbre, density, harmony, tempo).
4. Paint the story. Add a cello answer, withhold it, relate a later rise to an earlier phrase, leave an unfilled region.
5. Choose the next level of commitment: prompt/reference packet; explicitly authored symbolic sketch; or a renderer-ready score.
6. Pipes executes only available, authorized operations, returning files and receipts. Unknown capabilities produce a ready-to-use handoff, not a fabricated success.
7. Audition locally. Compare creative satisfaction separately from requested structural fidelity. Keep alternatives and negative examples.
8. Deliberately promote a take/score/recipe or simply keep the thought. No mandatory task conversion.

## Context compiler: the important new behavior

Selecting the high return near 1:38 should retrieve its enclosing 1:25–1:52 phrase, the earlier 0:25–0:55 statement, the original take identity, relevant user notes and the uncertainty of the transcription. Selection follows **musical dependencies**, not only a nearest-neighbor search for loud peaks.

The current implementation performs bounded cycle-safe traversal over explicit `requires_context`, `recalls`, `anchored_in`, `answers`, `supports` and `transforms` relations. Every included record has a reason. Limits/omissions are disclosed. The packet contains identifiers and metadata; this does not mean any binary was uploaded. Future provider compilers must resolve allowed bytes separately with a receipt.

## Data/API and current implementation

`contracts/workbench-v1.schema.json` describes the actual review-state shape. Runtime domain checks add graph references, source bounds, parent containment, finite values, locks and revision control. `contracts/prototype-openapi.json` describes actual local routes. `contracts/implemented-mcp-tools.json` exports actual tool schemas.

Every mutation uses expected workspace sequence and idempotency key; story edits additionally use expected revision. A changed story creates recoverable history. Pinned gestures require explicit unlock. Source masters never change. The compiler refuses oversized prompts rather than truncating meaning invisibly.

Examples are generated by the actual implementation in `examples/v0.4/`, not illustrative success records. The sine renderer's sound is intentionally basic; instrument names become MIDI playback hints, not proof of sampled or modeled instrument quality.

## Success criteria

- A user can capture an unfiled musical idea in one field and retrieve it without a project assignment.
- Selecting a peak retrieves the preparation on which its interpretation depends.
- A motif can be identified as an accepted sound while its written notes remain uncertain.
- A story can be edited before notation exists; exact-score rendering correctly blocks unresolved notes.
- A separate explicit note sketch produces inspectable MIDI and audible diagnostic sound with source unchanged.
- Human, CLI and MCP actions share domain behavior and conflict handling.
- A returned take remains connected to work, recipe and handoff without becoming a duplicate unrelated song.
- Future production use returns real renderer/provider receipts and preserves permission boundaries.

## Risks and limits

A beautiful graph can make speculative relationships look proven; evidence styling and wording must resist that. Over-structuring can interrupt creativity; preserve loose capture and incomplete motifs. A prompt-to-score model can invent the wrong identity; never fill an “exact reference” gap silently. Audio is large and private; use a media vault, scoped capabilities and immutable hashes. Native DAW bridges differ and can alter the wrong session; verify identity/dirty state and scratch-only permissions. A local token prototype is not production auth. Similarity is a hypothesis until compared against authorized material; no originality/copyright verdict comes from shared intervals. Role/tuning defaults must not erase individual musical traditions.

## MVP path

P0 is this local review slice. P1 moves domain/media contracts into the actual MeatyMusic app. P2 connects one native renderer and one notation path with disposable projects. P3 adds carefully scoped perception/transcription and richer retrieval with evidence, permissions and corrections. P4 expands AGL mappings, cross-culture motif maps and score-performance alignment. Do not block useful idea organization on completing every renderer.
