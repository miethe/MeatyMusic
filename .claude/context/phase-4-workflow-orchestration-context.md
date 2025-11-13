# Phase 4 Context: Workflow Orchestration

## Current State

**Branch**: feat/project-init
**Last Commit**: a791d5b - docs(phase3): Final Phase 3 validation - 92% complete, APPROVED for Phase 4
**Current Task**: Not started

## Phase Scope

Implement the Claude Code workflow orchestration system that transforms Song Design Specs (SDS) into validated musical artifacts through a deterministic graph of skills: PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → FIX (≤3 iterations) → RENDER (flagged) → REVIEW. Each node is a Claude Code skill with strict input/output contracts, seed propagation for determinism, and structured event emission for observability.

## Key Decisions

### [Date] - Decision Title
**What**:
**Why**:
**Impact**:

## Important Learnings

### [Date] - Learning Title
**Discovery**:
**Implication**:
**Action**:

## Quick Reference

### Environment Setup
```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# Watch logs
docker-compose logs -f backend

# Run tests
docker-compose exec backend pytest
```

### Key Files
- `docs/project_plans/PRDs/claude_code_orchestration.prd.md` - Workflow specification
- `backend/src/services/workflow/` - Orchestrator service (to create)
- `.claude/skills/workflow/` - Workflow skills (to create)
- `backend/src/api/v1/workflows.py` - Workflow API endpoints (to create)
- `schemas/` - Entity JSON schemas
- `taxonomies/conflict_matrix.json` - Tag conflict rules
- `limits/` - Per-engine character limits

### Workflow Node Contracts
```
PLAN: Input(SDS) → Output(plan.json)
STYLE: Input(SDS.style, plan, blueprint) → Output(style.json)
LYRICS: Input(SDS.lyrics, plan, style, sources) → Output(lyrics.txt, citations.json)
PRODUCER: Input(SDS.producer_notes, style, plan) → Output(producer_notes.json)
COMPOSE: Input(style, lyrics, producer) → Output(composed_prompt.json)
VALIDATE: Input(composed_prompt, blueprint) → Output(scores.json, pass/fail)
FIX: Input(scores, issues, artifacts) → Output(fixed_artifacts)
RENDER: Input(composed_prompt, engine) → Output(job_id, asset_url)
REVIEW: Input(all_artifacts, scores) → Output(final_summary.json)
```

### Determinism Requirements
- Seed propagation: `node_seed = run_seed + node_index`
- Pinned retrieval: Sort by content hash for tie-breaking
- Low temperature: ≤0.3 for all LLM calls
- Fixed top-k: Consistent retrieval limits
- Citation hashes: Log all source chunk hashes used

## Success Metric

**Primary**: Same SDS + seed produces identical outputs ≥99% of the time across 10 replays
**Secondary**: Rubric pass rate ≥95% on 200-song test suite without manual edits
**Performance**: P95 workflow latency ≤60s (excluding external render connector time)
