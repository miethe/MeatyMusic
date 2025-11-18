# AMCS Workflow Skills Implementation: All-Phases Context

**Initiative**: Agentic Music Creation System (AMCS) - Workflow Skills & Deterministic Orchestration
**Branch**: claude/execute-amcs-workflow-v1-01Stc5w8dwWxBLyyrzrovmFe
**Status**: Phase 0 - Infrastructure Preparation
**Last Updated**: 2025-11-18

---

## Current State

| Item | Status | Notes |
|------|--------|-------|
| **Branch** | `claude/execute-amcs-workflow-v1-01Stc5w8dwWxBLyyrzrovmFe` | ✅ Phase 0 complete |
| **Last Commit** | Pending (Phase 0 infrastructure) | All 6 tasks complete |
| **Current Phase** | Phase 0 ✅ COMPLETE | Phase 1 READY TO START |
| **Current Task** | Ready for PLAN skill | Infrastructure ready |
| **Skill Template** | ✅ `.claude/skills/amcs-template/` | 10 files, <15min workflow |
| **Determinism Framework** | ✅ `app/core/determinism.py` | 75 tests passing |
| **Event Framework** | ✅ `app/core/workflow_events.py` | Context manager ready |
| **Citation Framework** | ✅ `app/core/citations.py` | Pinned retrieval |
| **Test Infrastructure** | ✅ SkillTestCase + fixtures | 10 SDSs + 5 blueprints |

---

## Phase Scope Summary

### Phase 0: Skill Framework & Testing Infrastructure (Current)
Establish reusable patterns for all workflow skills: determinism framework, event emission, schema validation, local testing harness.
- **Duration**: 1-2 days
- **Deliverables**: Skill template, test utilities, seed/hash modules
- **Parallel Tracks**: Can start anytime after this phase

### Phase 1: Core Skills (PLAN → STYLE → LYRICS)
Implement first three workflow nodes. Establish determinism patterns (seed propagation, pinned retrieval, low-temp decoding). Build citation framework.
- **Duration**: 5-7 days
- **Deliverables**: Three skills with rubric validation, determinism tests passing
- **Blockers**: None - can start immediately after Phase 0

### Phase 2: Production Skills (PRODUCER → COMPOSE)
Extend arrangement logic; build artifact merge pipeline. Integrate with rendered prompt format. Add conflict matrix enforcement.
- **Duration**: 3-4 days
- **Deliverables**: Two skills; integrated artifact pipeline
- **Blockers**: Depends on Phase 1 artifact contracts

### Phase 3: Validation & Auto-Fix (VALIDATE → FIX Loop)
Rubric scoring engine; policy guards; fix loop with max 3 retries. Connect to blueprints and tag conflict matrix.
- **Duration**: 4-5 days
- **Deliverables**: Scoring engine; auto-fix skill with comprehensive test suite
- **Blockers**: Depends on Phases 1-2 artifacts

### Phase 4: Render & Review (RENDER → REVIEW)
Connector pattern; feature-flagged render submission. Final artifact persistence and event emission.
- **Duration**: 2-3 days
- **Deliverables**: Render connector skeleton; review skill; full run event stream
- **Blockers**: Depends on Phases 1-3

### Phase 5: End-to-End Integration & Performance Testing
Full workflow graph; determinism reproducibility suite (10 replays); latency profiling; rubric pass rate on 200-song synthetic dataset.
- **Duration**: 3-4 days
- **Deliverables**: Runnable workflow; >99% reproducibility; ≥95% rubric pass rate
- **Blockers**: Depends on Phases 1-4

### Phase 6: Security Audit & Policy Enforcement
MCP allow-list validation; PII redaction; artist normalization; profanity guard integration.
- **Duration**: 2-3 days
- **Deliverables**: Policy guard suite; security test cases; audit checklist
- **Blockers**: Depends on Phase 5

### Phase 7: Observability & Monitoring
Event emission standardization; metrics (hook_density, singability, rhyme_tightness, section_completeness). Dashboard and alerting integration.
- **Duration**: 2-3 days
- **Deliverables**: Structured event schema; metrics emit pattern; integration tests
- **Blockers**: Depends on Phases 1-6

---

## Key Architecture Decisions (Phase 0 Complete)

### Skill Structure ✅
- **Decision**: Decorator pattern with @workflow_skill for cross-cutting concerns
- **Chosen**: Modular template in `.claude/skills/amcs-template/` with copy-modify workflow (<15min)
- **Rationale**: Centralizes telemetry, events, validation, error handling; reduces boilerplate by 80%
- **Deliverables**: 10 files including SKILL.md, implementation.py, test_skill.py, ARCHITECTURE.md
- **Quality**: 10-point determinism checklist embedded; all patterns documented

### Determinism Framework ✅
- **Decision**: Simple seed derivation (base_seed + node_index) for debuggability
- **Chosen**: SeededRandom wrapper + @determinism_safe decorator + hash_artifact() utility
- **Rationale**: base_seed+1 for PLAN, base_seed+2 for STYLE, etc. - easy to trace
- **Deliverables**: `app/core/determinism.py` with 7 components, 75 unit tests (100% passing)
- **Validation**: DecoderSettings enforces temp≤0.3, detects datetime violations

### Event Emission Pattern ✅
- **Decision**: skill_execution() context manager with auto-emission (START/END/FAIL)
- **Chosen**: WorkflowEvent with ts, run_id, node, phase, duration_ms, metrics, issues
- **Rationale**: Zero boilerplate - developers populate state["metrics"] and state["issues"]
- **Deliverables**: `app/core/workflow_events.py` with 27 tests, usage guide
- **Integration**: Structured logging ready; DB persistence (TODO), WebSocket (TODO)

### Citation & Hash Strategy ✅
- **Decision**: Pinned retrieval via content hashes (SHA-256) for deterministic source chunks
- **Chosen**: First run = semantic search → hash → store; Subsequent = load hashes → pinned_retrieval()
- **Rationale**: Semantic search is non-deterministic; content hashes guarantee same chunks
- **Deliverables**: `app/core/citations.py` with CitationRecord, hash_chunk(), pinned_retrieval()
- **Validation**: 10-run determinism test passes; lexicographic sorting for tie-breaks

---

## Important Learnings & Gotchas

### To Watch For (Placeholder)
- **Seed Propagation**: Must pass seed through skill invocations consistently - verify in tests
- **Temperature/Sampling**: Low-variance decoding (temp ≤0.3, fixed top-p) required for determinism
- **Blueprint Access**: Ensure skills have deterministic access to genre blueprints (no random ordering)
- **Character Limits**: Each skill must respect engine limits; compose phase is bottleneck
- **Conflict Matrix**: Must be checked before RENDER; can trigger FIX loop
- **PII & Influences**: Policy guards must catch "style of <living artist>" before public release

### Known Issues
- None yet - to be populated during implementation

**Last Learnings Update**: 2025-11-18 (none yet)

---

## Cross-Phase Dependencies

| From | To | Type | Notes |
|------|-----|------|-------|
| Phase 0 | All Phases | Hard | Skill template, determinism framework required for all skills |
| Phase 1 | Phase 2 | Hard | Artifact contracts (style, lyrics) must be finalized |
| Phase 1 | Phase 3 | Hard | Metrics/scores depend on Phase 1 outputs |
| Phase 2 | Phase 3 | Hard | Composed prompt format must be defined |
| Phases 1-3 | Phase 4 | Hard | All artifacts needed for render submission |
| Phases 1-4 | Phase 5 | Hard | Full workflow graph depends on all skills |
| Phase 5 | Phase 6 | Hard | Baseline functionality must pass before security audit |

**Parallel Opportunities**:
- Phases 1 and 2 (LYRICS/PRODUCER) can overlap once STYLE artifact is stable
- Phase 7 (observability) can start in parallel during Phase 5 (light touch)

---

## Quick Reference

### Environment Setup
```bash
# Activate workspace
cd /home/user/MeatyMusic
pnpm install

# Check Node.js version (need ≥18)
node --version

# Verify database connection
# (PostgreSQL + Redis via docker-compose, configured in .env)
```

### Key File Locations (Will Update)
```
.claude/skills/workflow/          # Skill implementations (to be created)
├── skill-plan/
├── skill-style/
├── skill-lyrics/
├── skill-producer/
├── skill-compose/
├── skill-validate/
├── skill-fix/
├── skill-render/
└── skill-review/

.claude/utils/                    # Shared utilities (to be created)
├── determinism.ts               # Seed, hash utilities
├── event-emitter.ts             # Structured events
├── blueprint-access.ts          # Genre blueprint queries
└── citation-tracker.ts          # Provenance tracking

tests/amcs-workflow/             # Integration tests (to be created)
├── phase-0/                     # Skill framework tests
├── phase-1/                     # PLAN, STYLE, LYRICS tests
└── [phases 2-7]/
```

### Phase 0 Checklist (Template)
```markdown
- [ ] Define skill template structure
- [ ] Implement determinism utilities (seed, hash)
- [ ] Create event emitter pattern
- [ ] Build local skill test harness
- [ ] Document skill contract template
- [ ] Create first skill stub (e.g., skill-plan)
- [ ] Validate reproducibility with 5 test runs
```

### Test Command Template
```bash
# Run all workflow tests
pnpm test tests/amcs-workflow/

# Run phase-specific tests
pnpm test tests/amcs-workflow/phase-1/

# Run single skill test
pnpm test tests/amcs-workflow/phase-1/skill-plan.test.ts

# Determinism validation (run 10x, compare outputs)
pnpm test:determinism tests/amcs-workflow/
```

### Debug/Inspection
```bash
# Inspect SDS schema
cat schemas/sds.schema.json | jq '.properties | keys'

# Check blueprint structure
ls -la docs/hit_song_blueprint/AI/

# List available genre blueprints
ls docs/hit_song_blueprint/AI/ | grep blueprint

# View conflict matrix
cat taxonomies/conflict_matrix.json
```

---

## Session Handoff Template

When handing off to subagent, include:

```markdown
## Context for Next Agent

**What's been done**:
- [List completed tasks]

**What's next**:
- [List immediate next steps]

**Current blockers**:
- [Any blockers or decisions needed]

**Key files to read**:
- [Essential PRDs or references]

**Test status**:
- [Which tests are passing/failing]

**Metrics**:
- [Current reproducibility %, rubric pass rate, latency P95]
```

---

## Notes

- **This file is a working scratchpad**, not comprehensive documentation
- **Update after each phase** with completed decisions and learnings
- **Keep it concise** - link to PRDs for details, not inline
- **Timestamps matter** - include date when decisions/learnings are added
- **Parallel opportunities** - check cross-phase dependencies before starting new work

---

**Next Action**: Await Phase 0 kickoff for skill framework design
