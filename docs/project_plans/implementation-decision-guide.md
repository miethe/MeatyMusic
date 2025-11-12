# Implementation Decision Guide for AI Agents

**Purpose**: Navigate bootstrap vs from-scratch approaches for MeatyMusic AMCS with token-efficient file reading strategy.

**Last Updated**: 2025-11-12

---

## Quick Decision Matrix

| Factor | Bootstrap (MeatyPrompts) | Build from Scratch |
|--------|--------------------------|-------------------|
| **Timeline** | 6-8 weeks | 14-18 weeks |
| **Risk** | Medium (dependency on MP) | Low (full control) |
| **Code Reuse** | 60-70% from MP | 0% (clean slate) |
| **Control** | Constrained by MP patterns | Full architectural freedom |
| **Best For** | MVP, fast validation, learning | Production, long-term, custom needs |
| **Recommendation** | ✅ **Default choice** | Only if strong justification |

**Default Decision**: Use Bootstrap approach unless explicitly instructed otherwise.

---

## Implementation Approach Selection

### Use Bootstrap When (Recommended)
- Timeline is priority (MVP in 6-8 weeks)
- MeatyPrompts architecture is acceptable foundation
- Learning from existing patterns is valuable
- Risk of 60-70% rewrite is acceptable

### Use From-Scratch When
- Timeline >12 weeks available
- Custom architecture required (e.g., microservices)
- MeatyPrompts patterns are incompatible
- Zero technical debt is critical

### Hybrid Approach
- Bootstrap core workflow (PLAN→VALIDATE)
- Build custom UI from scratch
- Swap components incrementally

---

## Document Navigation Guide

### Strategic Docs (Read First, ~2-5K tokens each)

**ALWAYS START HERE:**

1. `/Users/miethe/dev/homelab/development/MeatyMusic/docs/amcs-overview.md`
   - System architecture, principles, glossary
   - **Cost**: Medium (~3K tokens)
   - **When**: Before any implementation

2. `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/implementation-roadmap.md`
   - High-level strategy comparison
   - **Cost**: Small (~2K tokens)
   - **When**: To understand approach options

3. `/Users/miethe/dev/homelab/development/MeatyMusic/docs/project_plans/bootstrap-plan.md`
   - Bootstrap phases, timeline, risks
   - **Cost**: Medium (~4K tokens)
   - **When**: If bootstrap chosen (default)

### Requirement Docs (Reference As Needed, ~5-10K tokens each)

**READ ON-DEMAND FOR SPECIFIC FEATURES:**

| File | Purpose | Token Cost | When to Read |
|------|---------|------------|--------------|
| `docs/project_plans/PRDs/sds.prd.md` | SDS contract | Medium (~6K) | Before SDS work |
| `docs/project_plans/PRDs/style.prd.md` | Style spec | Medium (~7K) | Before STYLE node |
| `docs/project_plans/PRDs/lyrics.prd.md` | Lyrics spec | Large (~8K) | Before LYRICS node |
| `docs/project_plans/PRDs/prompt.prd.md` | Compose prompt | Medium (~6K) | Before COMPOSE node |
| `docs/project_plans/PRDs/blueprint.prd.md` | Validation rules | Large (~9K) | Before VALIDATE node |
| `docs/project_plans/PRDs/claude_code_orchestration.prd.md` | Workflow graph | Large (~10K) | Before orchestrator |

### Bootstrap-Specific Docs (If Bootstrap Chosen)

**READ AFTER STRATEGIC DOCS:**

1. `/Users/miethe/dev/homelab/development/meatyprompts/docs/architecture.md`
   - MeatyPrompts architecture patterns
   - **Cost**: Medium (~4K tokens)
   - **When**: Understanding foundation

2. `/Users/miethe/dev/homelab/development/meatyprompts/docs/api-reference.md`
   - API endpoints to reuse/adapt
   - **Cost**: Large (~8K tokens)
   - **When**: Before backend work

### Phase Plans (Validation Checklists, ~3-8K tokens each)

**USE AS VALIDATION, NOT PRIMARY READING:**

| File | Purpose | Token Cost |
|------|---------|------------|
| `docs/project_plans/implementation-phase-plans/phase-0-foundation.md` | Project setup | Small (~3K) |
| `docs/project_plans/implementation-phase-plans/phase-1-data-models.md` | Schema validation | Medium (~5K) |
| `docs/project_plans/implementation-phase-plans/phase-2-backend-core.md` | Backend checklist | Large (~7K) |
| `docs/project_plans/implementation-phase-plans/phase-3-workflow-engine.md` | Workflow validation | Large (~8K) |
| `docs/project_plans/implementation-phase-plans/phase-4-sources-eval.md` | Source/eval checklist | Medium (~6K) |
| `docs/project_plans/implementation-phase-plans/phase-5-frontend.md` | UI validation | Large (~7K) |
| `docs/project_plans/implementation-phase-plans/phase-6-integration-polish.md` | Integration tests | Medium (~5K) |

---

## Execution Workflow: Bootstrap Approach

### Reading Order (Token-Optimized)

**Phase 0: Orientation (6-8K tokens total)**
1. Read `docs/amcs-overview.md` (3K tokens)
2. Read `docs/project_plans/bootstrap-plan.md` (4K tokens)
3. Skim `docs/project_plans/implementation-roadmap.md` (1K tokens, just bootstrap section)

**Phase 1: Foundation Setup (4-6K tokens)**
1. Read bootstrap plan Phase 1 section (~1K tokens)
2. Reference `phase-0-foundation.md` for validation checklist (~2K tokens, skim)
3. Reference MP architecture docs as needed (~3K tokens)

**Phase 2: Per-Feature Work (5-10K tokens per feature)**
1. Read bootstrap plan section for feature (~1K tokens)
2. Read specific PRD for feature (5-10K tokens)
3. Reference original phase plan for validation (~2K tokens, skim)
4. Read MP source code for patterns (variable, as needed)

**Phase 3: Validation (3-5K tokens)**
1. Check original phase plans against implementation
2. Run test suite
3. Verify determinism requirements from `amcs-overview.md`

### Token Optimization Tips

- **Don't read everything**: Load PRDs only when working on that feature
- **Use phase plans as checklists**: Skim for bullet points, don't deep-read
- **Reference MP code**: Read actual code, not full MP docs
- **Progressive disclosure**: Load supporting files only when blocked

### Bootstrap Execution Steps

```
1. Clone MeatyPrompts repo
2. Read bootstrap plan → identify adaptation targets
3. Copy relevant MP modules to MeatyMusic
4. Adapt copied code (schemas, endpoints, workflows)
5. Validate against original phase requirements
6. Test determinism and rubric compliance
```

---

## Execution Workflow: From-Scratch Approach

### Reading Order (Token-Optimized)

**Phase 0: Orientation (5-7K tokens)**
1. Read `docs/amcs-overview.md` (3K tokens)
2. Read `docs/project_plans/implementation-roadmap.md` (2K tokens, from-scratch section)
3. Skim `phase-0-foundation.md` (2K tokens)

**Phase 1-6: Sequential Phases (8-12K tokens per phase)**
1. Read full phase plan (3-8K tokens)
2. Read relevant PRDs (5-10K tokens per feature)
3. Implement per phase plan specifications
4. Run phase validation tests

### From-Scratch Execution Steps

```
1. Setup: Follow phase-0-foundation.md exactly
2. Data Models: Implement schemas per phase-1
3. Backend: Build API per phase-2
4. Workflow: Implement graph per phase-3
5. Sources/Eval: Build connectors per phase-4
6. Frontend: Build UI per phase-5
7. Integration: Polish per phase-6
```

---

## Validation Strategy

### Regardless of Approach

**Validation checklist from original phase plans:**

1. **Schema Compliance**
   - Validate all outputs against `/schemas/*.schema.json`
   - Reference: `phase-1-data-models.md`

2. **Determinism Requirements**
   - Same SDS + seed = identical outputs
   - Reference: `amcs-overview.md` (determinism section)

3. **Rubric Compliance**
   - Scores meet blueprint thresholds
   - Reference: `docs/project_plans/PRDs/blueprint.prd.md`

4. **Workflow Completeness**
   - All nodes (PLAN→REVIEW) implemented
   - Reference: `phase-3-workflow-engine.md`

5. **Security & Policy**
   - MCP allow-lists enforced
   - Profanity guards active
   - Reference: `amcs-overview.md` (safety section)

### Success Criteria (Both Approaches)

From original phase plans:
- ✅ Rubric pass rate ≥95% on test suite
- ✅ Determinism reproducibility ≥99%
- ✅ Latency P95 ≤60s (no render)
- ✅ Zero high-severity security violations

### Validation File Mapping

| Validation Area | Reference File | Section |
|----------------|----------------|---------|
| Schemas | `phase-1-data-models.md` | Validation Tests |
| API Endpoints | `phase-2-backend-core.md` | API Specs |
| Workflow Graph | `phase-3-workflow-engine.md` | State Machine |
| MCP Sources | `phase-4-sources-eval.md` | Source Registry |
| UI Components | `phase-5-frontend.md` | Component Library |
| Integration | `phase-6-integration-polish.md` | E2E Tests |

---

## Key File Paths Reference

### Strategic (Read First)

| File | Description | Tokens | Priority |
|------|-------------|--------|----------|
| `docs/amcs-overview.md` | System architecture | ~3K | **HIGH** |
| `docs/project_plans/bootstrap-plan.md` | Bootstrap strategy | ~4K | **HIGH** (if bootstrap) |
| `docs/project_plans/implementation-roadmap.md` | Approach comparison | ~2K | MEDIUM |

### Requirements (On-Demand)

| File | Description | Tokens | Read When |
|------|-------------|--------|-----------|
| `docs/project_plans/PRDs/sds.prd.md` | SDS contract | ~6K | SDS work |
| `docs/project_plans/PRDs/style.prd.md` | Style spec | ~7K | STYLE node |
| `docs/project_plans/PRDs/lyrics.prd.md` | Lyrics spec | ~8K | LYRICS node |
| `docs/project_plans/PRDs/producer_notes.prd.md` | Producer notes | ~6K | PRODUCER node |
| `docs/project_plans/PRDs/prompt.prd.md` | Compose prompt | ~6K | COMPOSE node |
| `docs/project_plans/PRDs/blueprint.prd.md` | Validation rules | ~9K | VALIDATE node |
| `docs/project_plans/PRDs/claude_code_orchestration.prd.md` | Workflow graph | ~10K | Orchestrator |

### Validation Checklists (Skim Only)

| File | Description | Tokens | Use For |
|------|-------------|--------|---------|
| `docs/project_plans/implementation-phase-plans/phase-0-foundation.md` | Setup validation | ~3K | Project init |
| `docs/project_plans/implementation-phase-plans/phase-1-data-models.md` | Schema validation | ~5K | Schema checks |
| `docs/project_plans/implementation-phase-plans/phase-2-backend-core.md` | API validation | ~7K | Backend checks |
| `docs/project_plans/implementation-phase-plans/phase-3-workflow-engine.md` | Workflow validation | ~8K | Graph checks |
| `docs/project_plans/implementation-phase-plans/phase-4-sources-eval.md` | Source validation | ~6K | MCP checks |
| `docs/project_plans/implementation-phase-plans/phase-5-frontend.md` | UI validation | ~7K | Frontend checks |
| `docs/project_plans/implementation-phase-plans/phase-6-integration-polish.md` | E2E validation | ~5K | Integration checks |

### Bootstrap-Specific (If Bootstrap)

| File | Description | Tokens | Read When |
|------|-------------|--------|-----------|
| `meatyprompts/docs/architecture.md` | MP architecture | ~4K | Understanding MP |
| `meatyprompts/docs/api-reference.md` | MP API docs | ~8K | Backend adaptation |
| `meatyprompts/src/**/*.py` | MP source code | Variable | Code adaptation |

---

## Quick Start Commands

### Bootstrap Approach
```bash
# 1. Read strategic docs (6-8K tokens)
Read docs/amcs-overview.md
Read docs/project_plans/bootstrap-plan.md

# 2. Clone MeatyPrompts
cd /Users/miethe/dev/homelab/development
git clone [meatyprompts-repo] meatyprompts

# 3. Start Phase 1 (read on-demand)
Read docs/project_plans/PRDs/sds.prd.md  # When needed
Read meatyprompts/docs/architecture.md    # When adapting
```

### From-Scratch Approach
```bash
# 1. Read strategic docs (5-7K tokens)
Read docs/amcs-overview.md
Read docs/project_plans/implementation-roadmap.md

# 2. Start Phase 0
Read docs/project_plans/implementation-phase-plans/phase-0-foundation.md

# 3. Progress sequentially through phases
Read docs/project_plans/implementation-phase-plans/phase-1-data-models.md
# ... etc
```

---

## Token Budget Recommendations

**Total budget for full implementation**: ~150-200K tokens

**Bootstrap approach allocation**:
- Strategic docs: 6-8K tokens (upfront)
- Per-feature work: 5-10K tokens (8-10 features) = 50-100K
- Validation: 10-20K tokens (periodic)
- MP code reading: 30-50K tokens (as needed)

**From-scratch approach allocation**:
- Strategic docs: 5-7K tokens (upfront)
- Phase plans: 40K tokens (all phases, sequential)
- PRD deep-reads: 60-80K tokens (all features)
- Validation: 10-20K tokens (periodic)

---

## Decision Flowchart

```
START
  ↓
Is timeline <10 weeks? ───YES──→ Use Bootstrap Approach
  ↓ NO                              ↓
  ↓                              Read bootstrap-plan.md
Is custom arch required? ─YES──→ Use From-Scratch Approach
  ↓ NO                              ↓
  ↓                              Read phase-0-foundation.md
Use Bootstrap (default)
  ↓
Read amcs-overview.md + bootstrap-plan.md
  ↓
Load PRDs on-demand per feature
  ↓
Validate against original phase plans
  ↓
DONE
```

---

## Final Notes for AI Agents

1. **Default to Bootstrap**: Unless explicitly told otherwise
2. **Read Minimally**: Load strategic docs first, PRDs on-demand
3. **Use Phase Plans as Checklists**: Skim for validation, don't deep-read
4. **Validate Continuously**: Check original requirements throughout
5. **Ask Before Switching**: If Bootstrap seems wrong, ask human before switching to from-scratch

**Most Important**: This guide exists to save tokens. Don't read everything—read what you need when you need it.
