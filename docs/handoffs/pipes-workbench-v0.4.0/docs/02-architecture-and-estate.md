---
schema_version: "0.1"
id: null
type: artifact
artifact_kind: architecture_spec
title: "Architecture and estate ownership"
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

# Architecture and estate ownership


## Decision

MeatyMusic owns musical intent, orchestration transformations, take lineage and musical listening decisions. Add functionality to the existing application after reconciliation. The portable review prototype is an executable behavior reference, not a production stack migration.

## Domain model

Use the existing SDS identity and introduce a versioned v2 schema. UI “recipe” means that SDS, not a second editable source of truth.

```text
Identity profile revision / references
             ↓
Recipe revision ── typed patch ──> Child recipe revision
             ↓
Prompt artifact + native settings + capability snapshot
             ↓
Handoff / generation attempt
             ↓
Original take ──> region / listening observation
             │                 ↓
             └──── reference for next recipe

Singer direction revision
    ├─ speech binding → Voice Lab promotion → aos-tts reviewed speech
    └─ singing binding → separately verified music/singing provider capability
```

| Entity | Required distinction |
| --- | --- |
| InstrumentDefinition | Describes the instrument; does not assign its job |
| EnsemblePart | Assigns role, behavior and section presence to an instrument |
| SectionIntent | Relative/approximate/exact intention; not automatically observed audio timing |
| RecipeRevision | Frozen musical intent; parent revision and patch provenance |
| IdentityProfileRevision | House branches, exemplars, rationale; not provider custom model |
| PromptArtifact | Exact fields, counters, compiler version, omitted/unsupported features |
| GenerationAttempt | Requested versus actually submitted settings, status, evidence and costs |
| AudioAsset | Original bytes/hash or explicitly link-only record |
| Region | Time-bound reference to one immutable audio asset |
| Observation | Human/analyzer source, method, confidence, scope and evaluation context |
| SingerDirectionRevision | Desired performance character; not a provider resource |
| VoiceBinding | Provider/model/operation scope, evidence, permissions and validity |

## Reproducibility boundary

Deterministic transformations and compilation preserve recipe fields. They do not force a generative model to obey musical instructions or reproduce a waveform. A provider seed is a recorded input, not a universal guarantee. Retain originals, exact request bodies, source/model versions and observed outcomes.

Prototype compilation is deterministic from the same recipe/state/target. Stable hash serialization uses UTF-8 canonical JSON. Style budgeting uses UTF-16 code units so browser and server agree; production adapters must explicitly record the actual counter semantics of each provider surface. A 1,000-unit target is the current project constraint, not a claim that every provider shares it.

## Shared command layer

```text
Browser UI ─┐
CLI ────────┼── authenticated domain commands ── transactional state
MCP ────────┤             │
HTTP ───────┘             ├── deterministic compiler / typed transformations
                          ├── import + immutable artifact service
                          └── authorized jobs / provider adapters (future)
```

No transport should implement its own business rules. User-facing drafts and agent proposals share the same locks, exact-text rules and identity boundaries. All outbound operations disclose effects and require appropriate grants. Navigation and ordinary state reads require no model inference.

Prototype transport: stdlib loopback HTTP, JSON store, one process per data directory. Writes use a global optimistic sequence, idempotency receipt and rollback on validation failure. Production should adopt per-aggregate revisions in the existing PostgreSQL transactions and a durable outbox/job table, rather than a second JSON authority.

## State and artifact authority

Drafts/jobs are transactional records. Seal a submission's recipe snapshot, prompt and receipt as immutable artifacts; store originals in the existing media store by hash. Derived waveforms are caches; trims, normalization and stems are explicit derivatives. A conceptual reference is not a byte-derived asset. Avoid two independently writable masters in Git and the database.

Prototype store files are owner-readable and not exposed as a filesystem browser. The token rotates on restart. The original-upload path validates size/signature and stores original bytes; WAV duration is read server-side, other format duration is labeled browser-estimated. Production requires stronger decoding, streaming ingestion, quotas, recoverable imports and verified backups.

## Provider adapter target

Each adapter supplies discover/validate/compile/prepare and only actually supported execution methods. Capability keys include provider, model, operation, entitlement evidence and observation time. Field capability states are native_parameter, prompt_only, unsupported or unknown. Native parameters still require result validation.

Do not invent one common asynchronous lifecycle when a provider streams synchronously. Model request, response, delivery and cancellation separately. Record expected cost, unit, reservation, observed charge and confidence; unknown is not zero. Retry only with verified provider idempotency or after reconciliation. Frontend never receives provider API secrets.

## Estate ownership and seams

| Owner | Stores / executes | MeatyMusic handoff |
| --- | --- | --- |
| MeatyMusic | SDS, ensemble/motif/cast, prompts, attempts, take and moment catalog | Canonical musical IDs and reviewable artifacts |
| Voice Lab | Voice candidates, takes, comparisons, evaluations, persona locks, promotion | Link or import promoted metadata; proposed design brief is an adapter task |
| aos-tts / Estate Voice | Promoted speech catalog and reviewed speech generation | Reviewed text plus resolved catalog ID and explicit dry-run/live authority |
| Aural Geometry Lab | Formal musical construction, symbolic events and deterministic mappings | Explicit motif/event/asset references with provenance and rights |
| SkillMeat | Reusable skills, transformation/operator workflows and approved bundles | Store operational recipe, reference domain artifact IDs rather than duplicate all audio metadata |
| MeatyWiki | Decisions, musical rationale, reference interpretation, house-sound lessons | Candidate note linked to actual recipe/take/moment evidence |
| CCDash | Execution/provider traces, actual failures and observed costs | Correlated run events; enjoyment not inferred from success code |
| IntentTree | Meaningful work and larger experiments | Explicit project/milestone linkage; no task required for every playful edit |
| Control Plane | Route requests, effort and approval | Calls music domain operations, does not own musical state |
| Existing asset storage | Original binaries, hashes and backups | Media ownership integration, not another ungoverned bucket |

Existing Voice Lab-to-aos-tts promotion already separates workshop and speech runtime. Preserve it: MeatyMusic must not modify Voice Lab locks or copy provider credential ownership into the music UI. The speech runtime has no required live dependency on Voice Lab. [R1–R4 in sources]

## Agent posture mapping

Architect: schemas and seams. Composer/Editor: musical draft and prompt phrasing. Researcher: sourced instrument and provider metadata. Critic: transformation invariants, unsupported claims and result evidence. Operator: approved import or generation. Prefer a bounded workflow over always-on per-instrument agents.

## Events and approvals

Target event families: recipe.revised, variation.created, handoff.prepared, submission.attested, provider.accepted, submission.unknown, take.imported, moment.saved, voice.reference_linked, identity.change_proposed. Every event carries stable subject/revision IDs, actor, correlation, effect scope and evidence class. External text/audio need not be embedded in telemetry. Use IDs and hashes with authorized resolution.

The prototype emits local history only. It does not publish to CCDash, MeatyWiki, SkillMeat or IntentTree. Production outbox consumers need idempotent receipts, retries and explicit failure visibility.

## Authentication and permissions

Use established estate authentication in production. Resolve services through the estate registry/config; never compile private hostnames or tokens into frontend exports. Distinguish read, edit, import, submit/spend, voice enrollment, publication and destructive actions. Treat per-asset permission to play locally separately from permission to upload as another model's reference, analyze with ML, train, or publish.

Local prototype auth is not multi-user security: any same-user process can read its token and the operator identity is singular. Keep it loopback-only. Do not expose through a tunnel or reverse proxy as production without replacing the auth and storage model.
