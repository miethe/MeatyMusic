# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MeatyMusic** is the Agentic Music Creation System (AMCS) — a deterministic, constraint-driven music composition system that transforms structured creative intent (Song Design Spec / SDS) into validated artifacts: style specs, lyrics, producer notes, and composed prompts for music rendering engines.

**Mission**: Deterministically convert structured creative intent into validated musical artifacts with full traceability and reproducibility.

### North Star Principles

1. **Determinism**: Same inputs + seed ⇒ same outputs
2. **Constraint Fidelity**: Always satisfy blueprint/rubric + policy constraints before render
3. **Compact Power**: Minimal, non-conflicting tags with high information density
4. **Composable & Swappable**: Engines (Suno or others) are connectors, not core
5. **Traceability**: Every decision carries provenance, hashes, and scores

## Architecture

### System Design

```
Input: Song Design Spec (SDS) JSON
  ↓
Process: PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → (FIX)* → RENDER → REVIEW
  ↓
Output: Validated artifacts + optional audio assets + scores + event stream
```

### Core Components

- **Client**: React/React-Native UI → compiles entity specs + SDS
- **Gateway**: FastAPI (HTTP + WebSocket events)
- **Orchestrator**: Graph runner (Claude Code skills) with retries and fix loops
- **Storage**: Postgres (+pgvector) for metadata/embeddings; S3 for artifacts; Redis for queues
- **Connectors**: MCP servers for sources/evaluators; render connectors (Suno et al.) behind feature flags

### Workflow Nodes

Each node is a Claude Code skill with clearly defined contracts:

- **PLAN**: Expand SDS into ordered work targets (sections, goals)
- **STYLE**: Emit style spec honoring blueprint limits; sanitize conflicting tags
- **LYRICS**: Generate lyrics with citations; satisfy section and profanity rules
- **PRODUCER**: Produce arrangement/mix guidance aligned to style and blueprint
- **COMPOSE**: Build final prompt (with section/meta tags) under model limits
- **VALIDATE**: Score vs rubric; run length/section/policy/conflict guards
- **FIX** (loop ≤3): Apply targeted diffs (e.g., add hook lines; tighten rhyme)
- **RENDER** (flagged): Submit composed prompt to connector; store job + assets
- **REVIEW**: Persist artifacts, scores, citations, and emit final events

## Key Constraints & Contracts

### Global Determinism

- **Global seed**: Every node uses the run seed or `seed+node_idx`
- **Pinned Retrieval**: Only use source chunks whose hashes are logged in citations; fixed top-k; lexicographic tie-breaks
- **Model Limits**: Obey engine character limits and parameter constraints
- **Conflict Matrix**: Reject contradictory tags (e.g., "whisper" + "anthemic")
- **Decoding**: Low-variance settings (temperature ≤0.3, fixed top-p)

### Policy Guards

- No public release outputs with "style of <living artist>"
- Redact PII
- Profanity obeys `constraints.explicit`
- Source access only via allowed MCP scopes with provenance hashes

### Performance Targets (MVP)

- **Plan→Prompt Latency**: P95 ≤ 60s (excluding external rendering)
- **Rubric Pass Rate**: ≥ 95% without manual edits on test suite
- **Repro Rate**: ≥ 99% identical outputs across 10 replays (frozen inputs)
- **Security**: Zero high-severity violations on MCP allow-list policy

## PRD Reference

All PRDs are located in `docs/project_plans/PRDs/`:

- `website_app.prd.md` — Routes, screens, component library, API endpoints
- `style.prd.md` — Genre, BPM, key, mood, instrumentation, tags, conflicts
- `lyrics.prd.md` — Sections, rhyme, meter, POV, imagery, citations
- `persona.prd.md` — Reusable artist profiles, vocal range, influences
- `producer_notes.prd.md` — Arrangement, structure, mix targets
- `sources.prd.md` — External knowledge registry (file/web/API/MCP)
- `blueprint.prd.md` — Genre algorithms, tempo windows, lexicon, scoring
- `prompt.prd.md` — Merge artifacts into render-ready prompt
- `sds.prd.md` — Song Design Spec aggregator contract
- `render_job.prd.md` — Programmatic render request
- `claude_code_orchestration.prd.md` — State machine, skill I/O, events, gates
- `future_expansions.prd.md` — Roadmap for Suno integration, analytics, plugins

**Primary reference**: `docs/amcs-overview.md` — The north star index for all agents

## Hit Song Blueprints

Genre-specific blueprints in `docs/hit_song_blueprint/AI/`:

- `pop_blueprint.md`, `country_blueprint.md`, `hiphop_blueprint.md`, `rock_blueprint.md`
- `rnb_blueprint.md`, `electronic_blueprint.md`, `indie_alternative_blueprint.md`
- `christmas_blueprint.md`, `ccm_blueprint.md`, `kpop_blueprint.md`, `latin_blueprint.md`
- `afrobeats_blueprint.md`, `hyperpop_blueprint.md`, `pop_punk_blueprint.md`
- `general_fingerprint.md` — Cross-genre patterns
- `comparative_matrix.md` — Genre comparison table
- `design_checklists.md` — Quality gates

Human-readable overview: `docs/hit_song_blueprint/Human/human_overview.md`

## Repository Structure

```
/docs/                          # Documentation and PRDs
  ├── project_plans/PRDs/       # Product requirements
  ├── designs/                  # Design guidelines
  ├── hit_song_blueprint/       # Genre blueprints
  └── amcs-overview.md          # Primary agent reference

/.claude/                       # Claude Code configuration
  ├── settings.json             # Permissions, hooks
  ├── specs/                    # Specification templates
  ├── skills/                   # Custom skills
  └── config/                   # Agent configs

/schemas/                       # JSON schemas (entities + SDS + prompt)
/taxonomies/                    # Tag categories and conflict matrix
/limits/                        # Per-engine char limits & params
/specs/{song_id}/               # FE-emitted entity specs + SDS
/runs/{song_id}/{run_id}/       # Node IO, scores, citations, assets
```

## Development Workflow

### Before Implementing

1. Read `docs/amcs-overview.md` for system context
2. Identify which PRD(s) apply to the task
3. Check genre blueprint if music-specific work
4. Review existing patterns in similar features
5. Understand determinism requirements (seed propagation, hashing)

### Skill Development

When creating or modifying workflow skills:

- Follow skill contract structure from `claude_code_orchestration.prd.md`
- Define clear inputs/outputs with schema references
- Implement determinism: seed propagation, pinned retrieval, low temperature
- Emit structured events for observability
- Respect blueprint constraints and policy guards
- Include citation hashes for all source chunks used

### Testing

- Unit tests for individual skill logic
- Integration tests for workflow graph execution
- Determinism tests: Same SDS + seed must produce identical outputs
- Rubric compliance: Validate against blueprint scoring thresholds
- Policy tests: Ensure profanity filter, conflict checks, and artist normalization work

### Evaluation & Auto-Fix

**Metrics tracked**:
- `hook_density`, `singability`, `rhyme_tightness`, `section_completeness`, `profanity_score`, `total`

**Auto-fix playbook** (max 3 iterations):
- Low hook density → duplicate/condense chorus hooks
- Weak rhyme/meter → adjust scheme or syllables/line
- Tag conflicts → drop the lowest-weight tag per conflict matrix

### Feature Flags

Example flags (check current config):
```json
{
  "render.suno.enabled": false,
  "eval.autofix.enabled": true,
  "policy.release.strict": true,
  "ui.experimental.personas": false
}
```

## Acceptance Gates (Release Promotion)

- **Gate A**: Rubric pass ≥ 95% on 200-song synthetic set
- **Gate B**: Determinism reproducibility ≥ 99%
- **Gate C**: Security: MCP allow-list audit clean
- **Gate D**: Latency P95 ≤ 60s (no render)

## Agent Runbook (Default)

1. **Validate SDS** against schemas and feature flags
2. **PLAN** → derive ordered objectives
3. **STYLE, LYRICS, PRODUCER** in parallel where possible; persist artifacts + hashes
4. **COMPOSE** → produce `composed_prompt` within model limits
5. **VALIDATE** → compute scores; if fail → **FIX** (≤3) → **COMPOSE** → **VALIDATE**
6. **RENDER** (if enabled) → submit job, then poll and store assets
7. **REVIEW** → finalize outputs, emit events, produce summary JSON

## Safety & Compliance

- **PII & Private Sources**: Access only via allowed MCP scopes; always include provenance hashes; redact where policy requires
- **Influences**: Normalize "in the style of" to generic influence language for public releases
- **Profanity/Explicitness**: Enforce `constraints.explicit` strictly

## Glossary

- **SDS**: Song Design Spec — single JSON that ties all entities together
- **Blueprint/Rubric**: Genre rules + scoring weights/thresholds
- **Composer**: The prompt-builder that merges artifacts into a render-ready prompt
- **Connector**: Pluggable adapter for render engines or sources

## Observability

All workflow nodes emit structured events:
```json
{
  "ts": "2025-11-11T13:00:00Z",
  "run_id": "uuid",
  "node": "LYRICS",
  "phase": "start|end|fail",
  "duration_ms": 1234,
  "metrics": {...},
  "issues": [...]
}
```

Events are available via WebSocket at `/events` endpoint.

## Notes for Agents

- This overview is the **shared map**. Always defer to the **entity PRDs** for field-level truth and to the **Claude Code Workflow PRD** for execution order and I/O contracts.
- If a constraint, limit, or policy conflicts, the **SDS schema + Blueprint** win unless a feature flag explicitly overrides them.
- When uncertain about workflow behavior, consult `docs/claude_code_orchestration.prd.md` for state machine details.
- For genre-specific questions, reference the appropriate blueprint in `docs/hit_song_blueprint/AI/`.

---

## Project Status

**Phase 1: Bootstrap Complete (2025-11-12)**

Phase 1 involved bootstrapping MeatyMusic from MeatyPrompts infrastructure:

- **Phase 1A**: Repository setup and structure ✓
- **Phase 1B**: Infrastructure validation ✓
- **Phase 1C**: Configuration and secrets ✓
- **Phase 1D**: Documentation updates ✓

**Next**: Phase 2 - Database schema design and entity implementation

### What Was Done (Phase 1)

1. **Infrastructure Copied** (70% code reuse)
   - Backend: FastAPI, SQLAlchemy, PostgreSQL, Redis, OpenTelemetry
   - Frontend: Next.js, React, Tailwind, Zustand, React Query
   - DevOps: Docker Compose, GitHub Actions, monitoring stack
   - All service names updated from MeatyPrompts to MeatyMusic

2. **Configuration Completed**
   - Environment variables configured for all services
   - Database connection and migrations set up
   - Observability stack ready (logging, metrics, tracing)
   - Authentication infrastructure in place

3. **Documentation Created**
   - Enhanced README with quick start and deployment
   - Getting started guide for developers
   - Architecture comparison (MeatyPrompts vs AMCS)
   - Bootstrap migration log for context
   - Updated package descriptions with AMCS context

4. **Validation Done**
   - All services start and run correctly
   - Database migrations functional
   - API endpoints responding
   - Frontend build process working
   - Health checks passing

### What Comes Next (Phase 2)

1. **Database Schema**
   - Song entity
   - Style, Lyrics, Persona, ProducerNotes
   - Blueprint and ComposedPrompt
   - Run history and artifact tracking

2. **Domain Implementation**
   - SQLAlchemy models for all entities
   - Repository layer with CRUD operations
   - Service layer with business logic
   - API endpoints with proper validation

3. **Frontend Integration**
   - API client types for new endpoints
   - State management for songs and entities
   - Workflow UI components
   - Song creation forms and pages

4. **Testing & Validation**
   - Unit tests for repositories and services
   - Integration tests for workflows
   - E2E tests for complete flows
   - Determinism validation tests

### Development Guidelines (Phase 2+)

When implementing Phase 2 and beyond:

1. **Before Coding**
   - Read relevant PRD in `docs/project_plans/PRDs/`
   - Check blueprint if music-specific work
   - Review existing patterns in similar code
   - Understand determinism requirements (seed, hashing)

2. **Implementation**
   - Follow SQLAlchemy patterns from infrastructure layer
   - Implement determinism: seed propagation, pinned retrieval
   - Emit structured events for observability
   - Include citation hashes for all source references

3. **Testing**
   - Unit tests for business logic
   - Integration tests for database operations
   - Determinism tests: Same input + seed = same output
   - Rubric compliance validation

4. **Documentation**
   - Update docstrings for new functions
   - Add API documentation comments
   - Update README if public functionality
   - Update CLAUDE.md with new patterns

---

**Primary Audience**: AI agents and automated pipelines
**Last Updated**: 2025-11-12
**Bootstrap Source**: MeatyPrompts v1.x
**Infrastructure Reuse**: 70%
**Domain Code Reuse**: 0% (clean slate for AMCS)
