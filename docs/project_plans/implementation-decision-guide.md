# Bootstrap Hybrid Execution Guide for MeatyMusic AMCS

**Purpose**: Single entry point for AI agents implementing MeatyMusic AMCS using the bootstrap hybrid approach.

**Status**: Active execution guide
**Last Updated**: 2025-11-12
**Approach**: Bootstrap from MeatyPrompts codebase with domain adaptation

---

## Overview

This guide directs AI agents through the bootstrap hybrid implementation approach. You will copy proven infrastructure from MeatyPrompts, then adapt domain-specific components to MeatyMusic AMCS requirements.

**Bootstrap Hybrid Approach**: Copy 60-70% of MeatyPrompts infrastructure (proven patterns), adapt domain models (Song workflow vs Prompt management), implement AMCS-specific workflow orchestration.

**Timeline**: 6-8 weeks vs 14-18 weeks from scratch (65% time savings)

### How to Use This Guide

1. **Start here**: This is your ONLY entry point
2. **Follow phase sequence**: Execute Phase 1 → 2 → 3 → 4 → 5 in order
3. **Read on-demand**: Load detailed files only when phase requires them
4. **Validate continuously**: Check requirements against original phase plans
5. **Navigate efficiently**: Use file path tables for token optimization

---

## Phase-by-Phase Execution Map

### Phase 1: Repository Setup & Cleanup (3-5 days)

**Primary Plan**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/bootstrap-from-meatyprompts.md` (Section: Phase 1)

#### What You'll Do

1. Create MeatyMusic monorepo structure
2. Copy foundational infrastructure from MeatyPrompts (as-is)
3. Remove domain-specific MeatyPrompts code (Prompt entities)
4. Establish clean baseline for AMCS implementation

#### Requirements Validation

- Reference: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-0-foundation.md`
- Verify: Directory structure, package.json workspaces, Python/Node dependencies
- Success: Clean build passes, tests pass, no MeatyPrompts domain references

#### PRD References

None (infrastructure setup phase)

#### MeatyPrompts Reference

- Source location: `/Users/miethe/dev/homelab/development/meatyprompts/`
- Copy these (as-is):
  - `/package.json`, `/.npmrc`, `/.gitignore`, `/pyproject.toml`
  - `/infra/`, `/monitoring/`, `/.github/workflows/`
  - `/services/api/app/core/`, `/services/api/app/observability/`
  - `/packages/ui/`, `/packages/tokens/`

#### Design Guidance

None (following MeatyPrompts patterns exactly)

#### Validation Checklist

- [ ] Monorepo structure matches MeatyPrompts layout
- [ ] All infrastructure directories copied and functional
- [ ] pnpm workspace builds successfully
- [ ] Python backend starts without errors
- [ ] No references to "prompt", "template", or MP-specific entities
- [ ] CI/CD pipelines pass

#### Token Budget

5-8K tokens

- Read bootstrap plan Phase 1: ~2K
- Skim phase-0-foundation.md: ~2K
- Reference MP structure: ~1-4K (as needed)

---

### Phase 2: Infrastructure Preservation (5-7 days)

**Primary Plan**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/bootstrap-from-meatyprompts.md` (Section: Phase 2)

#### What You'll Do

1. Preserve MeatyPrompts infrastructure patterns (Router → Service → Repository → DB)
2. Set up database schemas for AMCS entities
3. Implement observability and tracing
4. Establish security patterns (RLS, multi-tenancy)

#### Requirements Validation

- Reference: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-0-foundation.md` (Database, Observability, Security sections)
- Verify: Schema migrations, OpenTelemetry tracing, RLS policies
- Success: Database migrations run, telemetry flows to collector, security tests pass

#### PRD References (read on-demand)

- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/sds.prd.md` (for schema structure)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/style.prd.md` (for style table schema)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/lyrics.prd.md` (for lyrics table schema)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/persona.prd.md` (for persona table schema)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/producer_notes.prd.md` (for producer_notes table schema)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/sources.prd.md` (for sources table schema)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/blueprint.prd.md` (for blueprints table schema)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/prompt.prd.md` (for composed_prompts table schema)

#### MeatyPrompts Reference

- Copy infrastructure (as-is):
  - `/services/api/app/repositories/base.py` (base repository with RLS)
  - `/services/api/app/core/async_database.py` (connection pooling)
  - `/services/api/app/core/security/` (RLS, context management)
  - `/services/api/app/observability/` (OpenTelemetry setup)
  - `/services/api/alembic/` (migration framework)
- Adapt patterns:
  - Study `/services/api/app/repositories/prompt_repo.py` → create `song_repo.py`, `style_repo.py`, etc.
  - Study `/services/api/app/models/prompt.py` → create AMCS entity models

#### Design Guidance

- Database architecture: Follow MeatyPrompts RLS patterns exactly
- Schema design: Use JSON/JSONB for flexible entity fields
- Observability: Preserve OpenTelemetry trace structure

#### Validation Checklist

- [ ] Alembic migrations create all AMCS entity tables
- [ ] Base repository patterns work with new entities
- [ ] RLS policies enforce user/organization isolation
- [ ] OpenTelemetry traces flow to collector
- [ ] All entity schemas validate against JSON schemas in `/schemas/`
- [ ] Database tests pass

#### Token Budget

15-25K tokens

- Read bootstrap plan Phase 2: ~3K
- Read PRDs for schema definitions: ~8-12K (as needed)
- Reference MP repository patterns: ~4-10K

---

### Phase 3: Domain Model Migration (10-15 days)

**Primary Plan**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/bootstrap-from-meatyprompts.md` (Section: Phase 3)

#### What You'll Do

1. Implement AMCS entity services (Style, Lyrics, Persona, ProducerNotes, Sources, Blueprint)
2. Implement SDS aggregation service
3. Build API endpoints for CRUD operations
4. Preserve MeatyPrompts service layer patterns

#### Requirements Validation

- Reference: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-1-entity-services.md` (all services)
- Reference: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-2-aggregation.md` (SDS aggregation)
- Verify: All entity CRUD operations, SDS compilation, constraint validation
- Success: All API endpoints functional, tests pass, SDS compiles correctly

#### PRD References (read when implementing each entity)

- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/style.prd.md` (Style service implementation)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/lyrics.prd.md` (Lyrics service implementation)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/persona.prd.md` (Persona service implementation)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/producer_notes.prd.md` (ProducerNotes service implementation)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/sources.prd.md` (Sources service implementation)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/blueprint.prd.md` (Blueprint service implementation)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/sds.prd.md` (SDS aggregation implementation)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/prompt.prd.md` (Composed prompt service implementation)

#### MeatyPrompts Reference

- Study service layer patterns:
  - `/services/api/app/services/prompt_service.py` → adapt for AMCS entities
  - Router → Service → Repository → DB pattern
  - Error handling and validation patterns
  - Transaction management
- Study API endpoints:
  - `/services/api/app/api/routes/prompts.py` → adapt for AMCS entities
  - Request/response schemas
  - Authentication and authorization

#### Design Guidance

- Service layer: Preserve MeatyPrompts strict layering (Router → Service → Repository)
- Validation: Use Pydantic models for request/response validation
- Error handling: Follow MeatyPrompts error hierarchy
- Transactions: Use MP's async transaction patterns

#### Validation Checklist

- [ ] All entity services implement CRUD operations
- [ ] SDS aggregation service compiles entity specs correctly
- [ ] All API endpoints functional with proper auth
- [ ] Request/response validation works
- [ ] Service layer tests pass (≥80% coverage)
- [ ] Integration tests pass
- [ ] All outputs validate against `/schemas/*.schema.json`

#### Token Budget

40-60K tokens

- Read bootstrap plan Phase 3: ~4K
- Read entity PRDs: ~30-40K (8 PRDs × 4-6K each)
- Reference MP service patterns: ~6-16K

---

### Phase 4: Workflow Orchestration (15-20 days)

**Primary Plan**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/bootstrap-from-meatyprompts.md` (Section: Phase 4)

#### What You'll Do

1. Implement workflow graph orchestrator (PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → FIX → RENDER → REVIEW)
2. Create Claude Code skills for each workflow node
3. Implement validation and auto-fix loops
4. Build WebSocket event streaming

#### Requirements Validation

- Reference: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-3a-orchestrator.md` (orchestrator implementation)
- Reference: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-3b-skills.md` (skill implementation)
- Verify: Complete workflow execution, skill I/O contracts, event streaming
- Success: Workflow executes SDS → artifacts, determinism tests pass, rubric compliance ≥95%

#### PRD References (critical for this phase)

- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/claude_code_orchestration.prd.md` (PRIMARY - workflow state machine)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/blueprint.prd.md` (validation rules and rubric scoring)
- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/prompt.prd.md` (COMPOSE node implementation)
- All entity PRDs (for skill implementation context)

#### MeatyPrompts Reference

- Study Claude Code integration:
  - `/.claude/skills/` (skill structure and patterns)
  - `/.claude/agents/` (agent configuration patterns)
  - Study skill-builder patterns for creating workflow skills
- Study async patterns:
  - Service layer async execution
  - WebSocket implementation (if exists)
  - Event streaming patterns

#### Design Guidance

- Workflow graph: Directed acyclic graph (DAG) with retry logic
- Skill contracts: Clear input/output schemas per node
- Determinism: Seed propagation, pinned retrieval, low-temperature settings
- Event streaming: WebSocket events for observability

#### Validation Checklist

- [ ] Orchestrator implements full workflow graph
- [ ] All workflow nodes implemented as Claude Code skills
- [ ] Skill input/output contracts validated
- [ ] VALIDATE node scores artifacts against rubric
- [ ] FIX loop iterates ≤3 times with targeted improvements
- [ ] WebSocket events stream correctly
- [ ] Determinism tests: Same SDS + seed = identical outputs (≥99%)
- [ ] Rubric compliance: ≥95% pass rate on test suite
- [ ] Workflow latency: P95 ≤60s (excluding render)

#### Token Budget

35-50K tokens

- Read bootstrap plan Phase 4: ~5K
- Read claude_code_orchestration.prd.md: ~10K (CRITICAL)
- Read blueprint.prd.md: ~9K
- Read prompt.prd.md: ~6K
- Reference MP skill patterns: ~5-20K

---

### Phase 5: UI Adaptation (10-15 days)

**Primary Plan**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/bootstrap-from-meatyprompts.md` (Section: Phase 5)

#### What You'll Do

1. Adapt MeatyPrompts UI components to AMCS workflows
2. Build workflow visualization dashboard
3. Create entity editor components
4. Implement real-time workflow status display

#### Requirements Validation

- Reference: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-4-frontend.md` (UI component requirements)
- Verify: All screens functional, component library complete, API integration working
- Success: UI renders workflows, all entity editors functional, real-time updates work

#### PRD References

- `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/website_app.prd.md` (PRIMARY - routes, screens, components)
- All entity PRDs (for editor requirements)

#### MeatyPrompts Reference

- Adapt UI components:
  - `/apps/web/src/components/prompts/` → `/components/songs/`
  - `/apps/web/src/components/editor/` → `/components/workflow/`
  - `/apps/web/src/components/runs/` → reuse for workflow runs
- Preserve UI infrastructure:
  - `/apps/web/src/lib/api/` (API client utilities)
  - `/apps/web/src/hooks/queries/` (React Query patterns)
  - `/apps/web/src/hooks/mutations/` (mutation patterns)
  - `/packages/ui/` (shared component library)

#### Design Guidance

- Component architecture: Follow MeatyPrompts patterns (hooks + contexts)
- State management: React Query for server state, Zustand for client state
- Real-time updates: WebSocket integration for workflow events
- Design system: Preserve MeatyPrompts design tokens

#### Validation Checklist

- [ ] All routes defined in website_app.prd.md implemented
- [ ] Entity editor components functional
- [ ] Workflow visualization displays graph correctly
- [ ] Real-time workflow status updates via WebSocket
- [ ] Dashboard shows analytics and metrics
- [ ] All API integrations working
- [ ] Component tests pass
- [ ] E2E tests pass for critical flows

#### Token Budget

25-35K tokens

- Read bootstrap plan Phase 5: ~4K
- Read website_app.prd.md: ~8K
- Reference entity PRDs for editors: ~8-12K
- Reference MP UI patterns: ~5-11K

---

## Document Hierarchy

### Primary Execution Guides (Read for HOW)

#### Bootstrap Implementation Plan

- **File**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/bootstrap-from-meatyprompts.md`
- **Purpose**: Step-by-step bootstrap phases with MeatyPrompts file paths
- **When**: Start of each phase for detailed tasks
- **Token Cost**: ~15K total (read by phase: ~3-5K per phase)

### Requirements Specifications (Read for WHAT)

#### Original Phase Plans (validation checklists)

- **Files**:
  - `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-0-foundation.md`
  - `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-1-entity-services.md`
  - `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-2-aggregation.md`
  - `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-3a-orchestrator.md`
  - `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-3b-skills.md`
  - `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/phases/phase-4-frontend.md`
- **Purpose**: Validate implementation meets original requirements
- **When**: After implementing features, for validation
- **Token Cost**: ~8-15K per file (read selectively)

#### Product Requirements Documents (detailed entity specs)

- **Directory**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/PRDs/`
- **Purpose**: Field-level specifications, constraints, validation rules
- **When**: Implementing specific entities or workflows
- **Token Cost**: ~5-10K per PRD (read on-demand)

### Reference Codebases (Read for EXAMPLES)

#### MeatyPrompts Codebase

- **Location**: `/Users/miethe/dev/homelab/development/meatyprompts/`
- **Purpose**: Proven patterns for infrastructure, services, UI components
- **When**: Understanding implementation patterns, adapting code
- **Token Cost**: Variable (read specific files as needed)

### Architecture and Design (Read for DECISIONS)

#### System Overview

- **File**: `/Users/miethe/dev/homelab/development/MeatyMusic/docs/amcs-overview.md`
- **Purpose**: North star principles, architecture, constraints
- **When**: Before starting, when making architectural decisions
- **Token Cost**: ~3K tokens

---

## File Path Quick Reference

### Phase 1: Repository Setup

| Purpose | File Path | Read When |
|---------|-----------|-----------|
| Bootstrap tasks | `docs/project_plans/bootstrap-from-meatyprompts.md` (Phase 1) | Start of phase |
| Infrastructure validation | `docs/project_plans/phases/phase-0-foundation.md` | Validation |
| MeatyPrompts structure | `/Users/miethe/dev/homelab/development/meatyprompts/` | Reference patterns |

### Phase 2: Infrastructure

| Purpose | File Path | Read When |
|---------|-----------|-----------|
| Bootstrap tasks | `docs/project_plans/bootstrap-from-meatyprompts.md` (Phase 2) | Start of phase |
| Schema requirements | `docs/project_plans/PRDs/*.prd.md` | Implementing schemas |
| MP repository patterns | `meatyprompts/services/api/app/repositories/` | Adapting patterns |
| Foundation validation | `docs/project_plans/phases/phase-0-foundation.md` | Validation |

### Phase 3: Domain Models

| Purpose | File Path | Read When |
|---------|-----------|-----------|
| Bootstrap tasks | `docs/project_plans/bootstrap-from-meatyprompts.md` (Phase 3) | Start of phase |
| Entity requirements | `docs/project_plans/PRDs/[entity].prd.md` | Implementing entity |
| SDS requirements | `docs/project_plans/PRDs/sds.prd.md` | SDS aggregation |
| MP service patterns | `meatyprompts/services/api/app/services/` | Service implementation |
| Entity validation | `docs/project_plans/phases/phase-1-entity-services.md` | Validation |
| SDS validation | `docs/project_plans/phases/phase-2-aggregation.md` | Validation |

### Phase 4: Workflow

| Purpose | File Path | Read When |
|---------|-----------|-----------|
| Bootstrap tasks | `docs/project_plans/bootstrap-from-meatyprompts.md` (Phase 4) | Start of phase |
| Orchestration spec | `docs/project_plans/PRDs/claude_code_orchestration.prd.md` | CRITICAL - workflow design |
| Blueprint/rubric spec | `docs/project_plans/PRDs/blueprint.prd.md` | Validation implementation |
| Prompt composition | `docs/project_plans/PRDs/prompt.prd.md` | COMPOSE node |
| MP skill patterns | `meatyprompts/.claude/skills/` | Skill implementation |
| Orchestrator validation | `docs/project_plans/phases/phase-3a-orchestrator.md` | Validation |
| Skills validation | `docs/project_plans/phases/phase-3b-skills.md` | Validation |

### Phase 5: UI

| Purpose | File Path | Read When |
|---------|-----------|-----------|
| Bootstrap tasks | `docs/project_plans/bootstrap-from-meatyprompts.md` (Phase 5) | Start of phase |
| UI requirements | `docs/project_plans/PRDs/website_app.prd.md` | UI implementation |
| MP UI components | `meatyprompts/apps/web/src/components/` | Component adaptation |
| MP UI library | `meatyprompts/packages/ui/` | Design system |
| Frontend validation | `docs/project_plans/phases/phase-4-frontend.md` | Validation |

---

## Common Questions Guide

### "Where do I find X?"

| Question | Answer |
|----------|--------|
| How do I implement Phase X? | Read `bootstrap-from-meatyprompts.md` section for Phase X |
| What are the requirements for feature Y? | Read `docs/project_plans/PRDs/[entity].prd.md` |
| How do I validate my work? | Check `docs/project_plans/phases/phase-[N]-*.md` |
| What MeatyPrompts code should I reference? | See bootstrap plan phase section for MP file paths |
| What's the system architecture? | Read `docs/amcs-overview.md` |
| How do workflows execute? | Read `PRDs/claude_code_orchestration.prd.md` |
| What are validation rules? | Read `PRDs/blueprint.prd.md` |
| What UI screens are needed? | Read `PRDs/website_app.prd.md` |

### Design Questions

| Question | Where to Look |
|----------|---------------|
| Database schema design? | Follow MeatyPrompts patterns exactly (RLS, JSONB fields) |
| API endpoint structure? | Copy MeatyPrompts Router → Service → Repository pattern |
| Service layer patterns? | Reference `meatyprompts/services/api/app/services/` |
| Repository patterns? | Reference `meatyprompts/services/api/app/repositories/base.py` |
| UI component patterns? | Reference `meatyprompts/apps/web/src/components/` |
| Workflow orchestration? | Read `PRDs/claude_code_orchestration.prd.md` (NEW) |
| Skill implementation? | Reference `meatyprompts/.claude/skills/` + skill-builder patterns |

### Validation Failing

| Problem | Solution |
|---------|----------|
| Schema validation fails | Check against `/schemas/*.schema.json` |
| Determinism tests fail | Verify seed propagation, pinned retrieval, low temperature |
| Rubric compliance low | Read `PRDs/blueprint.prd.md`, implement scoring correctly |
| API tests fail | Verify Router → Service → Repository pattern intact |
| UI tests fail | Check component contracts match API responses |
| Workflow tests fail | Verify skill I/O contracts, event emission |

### MeatyPrompts Pattern Unclear

| Pattern | Reference Location |
|---------|-------------------|
| Repository base class | `meatyprompts/services/api/app/repositories/base.py` |
| Service layer async | `meatyprompts/services/api/app/services/prompt_service.py` |
| API route structure | `meatyprompts/services/api/app/api/routes/` |
| Error handling | `meatyprompts/services/api/app/errors.py` |
| OpenTelemetry tracing | `meatyprompts/services/api/app/observability/` |
| React Query patterns | `meatyprompts/apps/web/src/hooks/queries/` |
| UI component library | `meatyprompts/packages/ui/` |
| Claude Code skills | `meatyprompts/.claude/skills/` |

---

## Execution Workflow Template

### For Any Phase

#### Step 1: Read Primary Plan

```text
File: docs/project_plans/bootstrap-from-meatyprompts.md (Phase X section)
Token cost: 3-5K
Purpose: Understand tasks, MeatyPrompts files to copy/adapt
```

#### Step 2: Reference Requirements

```text
File: docs/project_plans/phases/phase-[N]-*.md
Token cost: 2-4K (skim for validation checklist)
Purpose: Know what success looks like
```

#### Step 3: Load Specific PRDs

```text
Files: docs/project_plans/PRDs/[entity].prd.md (as needed)
Token cost: 5-10K per PRD
Purpose: Field-level specifications, constraints
```

#### Step 4: Examine MeatyPrompts Patterns

```text
Location: meatyprompts/[path from bootstrap plan]
Token cost: Variable (read specific files)
Purpose: Understand proven patterns to copy/adapt
```

#### Step 5: Implement with Validation

```text
Action: Write code following MP patterns, adapt to AMCS domain
Validate: Run tests, check against JSON schemas, verify constraints
```

#### Step 6: Verify Against Success Criteria

```text
File: docs/project_plans/phases/phase-[N]-*.md (validation section)
Token cost: 1-2K (skim checklist)
Purpose: Confirm phase completion
```

---

## Token Optimization Strategy

### Total Token Budget

~120-160K

#### Phase 1

5-8K tokens

- Bootstrap plan: 2K
- Foundation validation: 2K
- MP structure reference: 1-4K

#### Phase 2

15-25K tokens

- Bootstrap plan: 3K
- PRDs for schemas: 8-12K
- MP repository patterns: 4-10K

#### Phase 3

40-60K tokens

- Bootstrap plan: 4K
- Entity PRDs (8 PRDs): 30-40K
- MP service patterns: 6-16K

#### Phase 4

35-50K tokens

- Bootstrap plan: 5K
- Orchestration PRD: 10K (CRITICAL)
- Blueprint PRD: 9K
- Prompt PRD: 6K
- MP skill patterns: 5-20K

#### Phase 5

25-35K tokens

- Bootstrap plan: 4K
- Website app PRD: 8K
- Entity PRDs for editors: 8-12K
- MP UI patterns: 5-11K

### Loading Strategy

#### Always Load First (upfront cost: ~6-8K)

1. `docs/amcs-overview.md` (~3K)
2. `bootstrap-from-meatyprompts.md` current phase (~3-5K)

#### Load On-Demand (per-feature cost: ~5-15K)

- PRDs: Only when implementing that entity/feature
- MP code: Only when adapting that pattern
- Phase validation: Only when verifying completion

#### Never Load

- Future phase plans (wait until that phase)
- Unrelated PRDs (e.g., don't load render_job.prd.md until Phase 4)
- Full MeatyPrompts docs (read code directly instead)

---

## Validation Gates

### Phase 1 Complete When

- [ ] Monorepo builds successfully
- [ ] Infrastructure tests pass
- [ ] No MeatyPrompts domain references remain
- [ ] CI/CD pipelines green

### Phase 2 Complete When

- [ ] Database migrations run successfully
- [ ] All entity tables exist with RLS policies
- [ ] OpenTelemetry tracing flows to collector
- [ ] All schemas validate against `/schemas/*.schema.json`
- [ ] Repository tests pass

### Phase 3 Complete When

- [ ] All entity CRUD operations functional
- [ ] SDS aggregation compiles correctly
- [ ] All API endpoints working with auth
- [ ] Service layer tests ≥80% coverage
- [ ] Integration tests pass

### Phase 4 Complete When

- [ ] Full workflow executes (PLAN → REVIEW)
- [ ] All workflow nodes implemented as skills
- [ ] Determinism tests pass (≥99% reproducibility)
- [ ] Rubric compliance ≥95% on test suite
- [ ] Workflow latency P95 ≤60s
- [ ] WebSocket events stream correctly
- [ ] Auto-fix loops work (≤3 iterations)

### Phase 5 Complete When

- [ ] All routes from website_app.prd.md implemented
- [ ] Entity editors functional
- [ ] Workflow visualization works
- [ ] Real-time updates via WebSocket
- [ ] Dashboard analytics display
- [ ] E2E tests pass for critical flows

---

## Critical Path Items

### Must Read (High Priority)

1. **`docs/amcs-overview.md`**: System architecture, principles, constraints
2. **`bootstrap-from-meatyprompts.md`**: Phase-by-phase tasks with MP file paths
3. **`PRDs/claude_code_orchestration.prd.md`**: Workflow state machine (Phase 4)
4. **`PRDs/blueprint.prd.md`**: Validation and rubric scoring (Phase 4)

### Read On-Demand (Medium Priority)

- **Entity PRDs**: When implementing that specific entity
- **Phase validation plans**: When verifying phase completion
- **MeatyPrompts code**: When adapting specific patterns

### Read for Context (Low Priority)

- **`docs/project_plans/implementation-roadmap.md`**: Strategic overview (optional)
- **Hit song blueprints**: Genre-specific rules (Phase 4, validation only)
- **`PRDs/future_expansions.prd.md`**: Roadmap (not implementation)

---

## Bootstrap vs From-Scratch Decision

**You've already chosen Bootstrap**. This guide assumes that decision.

**If reconsidering**: Only switch to from-scratch if:

- Timeline >12 weeks available
- MeatyPrompts patterns are fundamentally incompatible
- Custom architecture is absolutely required

**To switch**: Read `implementation-roadmap.md` for from-scratch approach, then follow phase-0 through phase-6 plans sequentially (ignore bootstrap plan).

---

## Key Principles

### Determinism (Critical)

#### Every workflow execution must be reproducible

- Propagate seed to all nodes: `seed + node_index`
- Pin retrieval: Fixed top-k, lexicographic tie-breaks
- Low variance: Temperature ≤0.3, fixed top-p
- Hash all source chunks for provenance

#### Determinism Validation

Same SDS + seed must produce identical outputs ≥99% of time

### Constraint Fidelity (Critical)

#### Always satisfy blueprint/rubric constraints

- Check tag conflicts before finalizing style
- Enforce profanity rules per `constraints.explicit`
- Validate section completeness before finishing
- Ensure character limits per engine

#### Constraint Validation

Rubric compliance ≥95% without manual edits

### Compact Power (Important)

#### Minimize tags, maximize information density

- Remove redundant/conflicting tags
- Use high-weight tags from blueprints
- Prioritize specificity over quantity

### Traceability (Important)

#### Every decision must have provenance

- Emit structured events per node
- Log all source chunk hashes
- Track all scores and metrics
- Preserve full workflow history

---

## Example Execution: Phase 3, Style Service

### Scenario

#### You are asked

"Implement the Style service for Phase 3"

### Your execution

1. **Read bootstrap plan Phase 3** (~4K tokens)
   - File: `bootstrap-from-meatyprompts.md` (Phase 3 section)
   - Identify: Copy service patterns, adapt to Style entity

2. **Read Style PRD** (~7K tokens)
   - File: `docs/project_plans/PRDs/style.prd.md`
   - Extract: Fields, constraints, tag categories, conflict matrix

3. **Reference MeatyPrompts service** (~3K tokens)
   - File: `meatyprompts/services/api/app/services/prompt_service.py`
   - Pattern: Router → Service → Repository → DB

4. **Implement Style service**
   - Create `services/api/app/services/style_service.py`
   - Follow MP patterns: async methods, error handling, transactions
   - Adapt to Style domain: genre validation, BPM ranges, tag conflicts

5. **Validate against phase plan** (~2K tokens)
   - File: `docs/project_plans/phases/phase-1-entity-services.md`
   - Check: Style CRUD operations, tag conflict detection, constraint validation

6. **Verify**
   - Unit tests pass
   - Integration tests pass
   - Output validates against `/schemas/style.schema.json`

#### Total tokens

~16K for complete Style service implementation

---

## Final Notes for AI Agents

### When Starting Work

1. **Load this guide first** (you're reading it now)
2. **Read `amcs-overview.md`** (system architecture)
3. **Read bootstrap plan for your phase** (detailed tasks)
4. **Load PRDs on-demand** (when implementing features)
5. **Reference MeatyPrompts code** (proven patterns)

### During Implementation

- **Follow MeatyPrompts patterns exactly** for infrastructure
- **Adapt domain models** from Prompt → Song entities
- **Validate continuously** against original requirements
- **Test determinism** at every step
- **Check rubric compliance** frequently

### When Blocked

- **Design question?** Check MeatyPrompts code for pattern
- **Requirement unclear?** Read specific PRD section
- **Validation failing?** Check phase plan validation checklist
- **Pattern unclear?** Reference MP file path from bootstrap plan

### Success Criteria

- **All phases complete** with validation gates passed
- **Determinism**: ≥99% reproducibility
- **Rubric**: ≥95% compliance
- **Latency**: P95 ≤60s
- **Security**: Zero high-severity violations

---

**You are ready to execute. Start with Phase 1.**
