---
schema_version: "0.1"
id: null
type: artifact
artifact_kind: agent_prompt
title: "Local-agent implementation handoff"
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

# Local-agent implementation handoff


You are implementing the Sonic Workshop extension inside Nick's existing MeatyMusic project. Read this package's START_HERE, implementation status, UX, architecture, provider/voice contracts and QA limitations before changing anything. Treat the local prototype as an executable acceptance reference, not an instruction to replace the production stack.

## Phase 0: reconcile

Locate MeatyMusic, Voice Lab and aos-tts through estate-supported discovery. Record checkout revisions, dirty state, current instructions, declared ownership, deployed revisions separately, and relevant open tasks. Run the repositories' supported smoke tests. Inspect actual UI/API/models/contracts instead of inferring capabilities from README copy. Do not overwrite shared dirty work, change authority or deploy while auditing.

Return a small reconciliation record: what exists, what is partial, what conflicts with this proposal, and the smallest additive slice that closes the user flow. The historical MeatyMusic `4c31e905` pin is context, not a current authority. Reconcile duplicate Style/SDS schemas and the current live provider flags.

## Preserve these invariants

- One canonical expanded SDS; “Sonic Recipe” is a UI name.
- No universal three-instrument cap. Model roles and section-specific foreground density.
- Instrumental/texture/one-shot assets do not require lyrics, tempo, or major/minor key.
- Role substitutions and expansion changes generate reviewable patches. Pins are enforced. Parent records and originals remain unchanged.
- Every provider handoff freezes exact Style, Excludes, settings, compiler/capability versions and recipe revision. Capture actual external changes separately, without text normalization.
- Default Suno project targets: 1,000 Style units, 5,000 lyric units; keep exclusions separate. Provider counter semantics are versioned. Never silently truncate pinned requirements.
- Recipes, attempts, takes, original bytes, regions and observations are different entities. A requested instrument or motif is not observed evidence.
- A speech binding never becomes a verified singing identity by import, naming, model similarity or a favorable speech sample.
- Voice Lab remains the curation workshop. Aos-tts remains the reviewed speech runtime. Preserve its paid/live/per-request gates. Do not add provider keys to the browser.
- Use only supported, authorized provider contracts. Suno has an official Platform entry, but access and actual API shape must be verified. No undocumented session scraping or invented endpoints.
- Shared domain commands drive UI/API/CLI/MCP. Mutations require explicit revision/idempotency semantics. No blind retry after an ambiguous paid submission.
- Do not create another general agent orchestrator, audio store, taxonomy master, or task for every playful edit.

## Build the first slice

Migrate representative existing SDS fixtures non-destructively. Implement Arrange → Variations → Prepare handoff → Import/link take → Listen/save moment → Branch from moment in the existing application. Keep the current audio player independent of the editing state. Match the focused screenshots and design tokens, not the older promotional collages.

Preserve keyboard controls and accessible numeric selection. Empty, link-only, unknown, conflict, over-budget, unsupported and partial-delivery states are part of the product. The visual recipe section strip is intention, not a real-time audio timeline.

Add singer-direction profiles and selected vocal cast. Import current Voice Lab promotion bundles with the authoritative schema and original provenance. A proposed voice-design brief requires an explicitly designed importer/adapter; do not claim an already existing endpoint accepts it. Prepare speech using resolved aos-tts catalog identity, reviewed text and default dry-run. Enable real speech or music only after an explicit human gate and verified capability contract.

## Test and release incrementally

Port useful domain and transport tests from the prototype. Add migration, per-record revisions, object-store original preservation, CSRF/auth, media Range/HEAD, optimistic edit, denied/revoked voice and submission-unknown cases. Run full native browser acceptance, including actual cookie/media behavior, clipboard/download, mobile/zoom and keyboard. Reproduce a permitted local music import and exact handoff retrieval.

Do not treat the authored diagnostic WAVs as generated music or validation of named instruments. Do not claim a smoke health response establishes generation readiness. Keep source, test and deployment evidence separate.

At each wave produce: change summary, actual file paths, tests executed, unimplemented behavior, sample records, rollback and next task. Proposed estate updates require normal approval. Commit or deploy only within Nick's authorized workflow. A useful first milestone is the closed manual Suno loop, not an unverified multi-provider generation dashboard.
