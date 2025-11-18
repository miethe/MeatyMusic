# AMCS Workflow Skills Implementation: All-Phases Progress Tracker

**Document ID**: TRACK-AMCS-WS-001
**Scope**: WP-N1 (Claude Code Workflow Skills Development)
**Created**: 2025-11-18
**Last Updated**: 2025-11-18
**Target Audience**: AI Development Agents + Technical Leadership

---

## Executive Summary

This document tracks the comprehensive implementation of **WP-N1: Claude Code Workflow Skills Development** — the creation of 8 deterministic Claude Code skills that power the core AMCS workflow:

**Workflow**: PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → FIX → REVIEW

**Classification**: LARGE (L)
- **Total Tasks**: 80+ detailed tasks across 11 phases (0-10)
- **Story Points**: ~120-150 total
- **Estimated Duration**: 3-4 weeks (2-3 agents in parallel)
- **Critical Success Factor**: Determinism ≥99% reproducibility
- **Status**: Phase 0 Complete, Phase 1 Ready to Start

**Key Deliverables**:
1. 8 fully implemented skills with determinism validation
2. Unit tests for each skill (100% pass rate)
3. Integration tests for workflow execution (100% pass rate)
4. Determinism validation (≥99% reproducibility across 500 runs)
5. Complete documentation with troubleshooting guide

---

## Overall Progress Tracker

| Phase | Name | Status | Completion | ETA |
|-------|------|--------|-----------|-----|
| 0 | Infrastructure & Setup | ✅ Complete | 100% | 2025-11-18 |
| 1 | PLAN Skill | Ready | 0% | - |
| 2 | STYLE Skill | Blocked | 0% | (needs Phase 1) |
| 3 | LYRICS Skill | Blocked | 0% | (needs Phase 1) |
| 4 | PRODUCER Skill | Blocked | 0% | (needs Phase 1) |
| 5 | COMPOSE Skill | Blocked | 0% | (needs Phases 2-4) |
| 6 | VALIDATE Skill | Blocked | 0% | (needs Phase 5) |
| 7 | FIX Skill | Blocked | 0% | (needs Phase 6) |
| 8 | REVIEW Skill | Blocked | 0% | (needs Phase 7) |
| 9 | Integration Testing | Blocked | 0% | (needs Phase 8) |
| 10 | Determinism Validation & Optimization | Blocked | 0% | (needs Phase 9) |

**Overall Completion**: 1/11 phases (9%)

---

# PHASE 0: Infrastructure & Setup

**Duration**: 3-4 days → Completed in 1 session
**Story Points**: 13 → Completed 27 story points
**Status**: ✅ COMPLETE (2025-11-18)
**Dependencies**: None (blocker for all other phases)

## Phase Description

Establish the foundational infrastructure for all 8 workflow skills, including:
- Skill templates and contract definitions
- Test harness setup and fixtures
- Seed propagation framework implementation
- Event emission infrastructure
- Determinism validation tools

## Detailed Tasks

### Task 0.1: Create Skill Template & Base Infrastructure ✅
- [x] Create base skill template with SKILL.md structure
- [x] Implement skill contract schema (inputs, outputs, events)
- [x] Set up skill directory structure (`.claude/skills/amcs-template/`)
- [x] Create shared utilities module for seed propagation
- [x] Document skill development patterns and conventions
- **Story Points**: 4 (actual)
- **Duration**: Completed
- **Subagent**: lead-architect
- **Deliverables**:
  - `.claude/skills/amcs-template/` with 10 files (SKILL.md, implementation.py, test_skill.py, etc.)
  - Complete <15min developer workflow
  - 10-Point Determinism Checklist
  - ARCHITECTURE.md with design decisions

### Task 0.2: Create Skill Contract Schemas ✅
- [x] Design WorkflowContext, SkillInput, SkillOutput base classes
- [x] Implement 8 skill-specific input/output pairs (16 Pydantic classes)
- [x] Add field validators and model validators
- [x] Document all schemas with examples
- [x] Create usage examples
- **Story Points**: 5 (actual)
- **Duration**: Completed
- **Subagent**: python-pro
- **Deliverables**:
  - `services/api/app/schemas/skill_contracts.py` (880 lines, 19 classes)
  - 27 validators for robust validation
  - Usage examples in docs/examples/

### Task 0.3: Implement Determinism Framework ✅
- [x] Create SeededRandom class wrapping Python's random module
- [x] Implement get_node_seed(base_seed, node_index) function
- [x] Create hash_artifact() for SHA-256 provenance
- [x] Implement DecoderSettings validator (temp ≤0.3, top_p ≤0.9)
- [x] Create @determinism_safe decorator for violation detection
- [x] Document 10-point determinism checklist
- **Story Points**: 5 (actual)
- **Duration**: Completed
- **Subagent**: python-pro
- **Deliverables**:
  - `services/api/app/core/determinism.py` (605 lines)
  - 75 unit tests (100% passing)
  - Design documentation in docs/designs/

### Task 0.4: Create Event Emission Framework ✅
- [x] Define WorkflowEvent dataclass with all required fields
- [x] Implement emit_event() async and emit_event_sync() functions
- [x] Create skill_execution context manager for automatic events
- [x] Implement EventTimer for precise timing measurements
- [x] Document event schema and integration points
- **Story Points**: 4 (actual)
- **Duration**: Completed
- **Subagent**: python-pro
- **Deliverables**:
  - `services/api/app/core/workflow_events.py` (12KB)
  - 27 unit tests covering all functionality
  - Usage guide in docs/
  - Zero-boilerplate observability via context manager

### Task 0.5: Create Citation Hashing for LYRICS ✅
- [x] Implement CitationRecord dataclass
- [x] Create hash_chunk() with whitespace normalization
- [x] Implement create_citations_json() organizing by section
- [x] Create pinned_retrieval() for deterministic source retrieval
- [x] Document pinned retrieval concept and algorithm
- **Story Points**: 5 (actual)
- **Duration**: Completed
- **Subagent**: python-pro
- **Deliverables**:
  - `services/api/app/core/citations.py` (280 lines)
  - 14 unit tests (100% passing, including 10-run determinism)
  - Full workflow example (first run vs subsequent run)
  - Design documentation

### Task 0.6: Create Test Harness & Fixtures ✅
- [x] Create SkillTestCase base class with assertion helpers
- [x] Define seed constants (TEST_SEED, TEST_SEED_PLAN, etc.)
- [x] Generate 10 sample SDSs covering all genres
- [x] Create 5 genre blueprints with rules and rubrics
- [x] Generate 3 source collections with pre-computed hashes
- [x] Set up pytest conftest.py with 15+ fixtures
- [x] Create fixture generation script
- **Story Points**: 4 (actual)
- **Duration**: Completed
- **Subagent**: python-pro
- **Deliverables**:
  - `tests/unit/skills/base.py` with 5 assertion helpers
  - `tests/fixtures/` with sample_sds.json, blueprints, sources
  - `tests/conftest.py` with session-scoped fixtures
  - Comprehensive README and quick start guide
- [ ] Set up event persistence to database
- [ ] Create WebSocket event streaming handler
- [ ] Add event deduplication and replay logic
- **Story Points**: 3
- **Duration**: 1 day
- **Subagent Assignment**: **lead-architect** (infrastructure/architecture)
- **Acceptance Criteria**:
  - Event schema matches specification
  - Events persisted to database correctly
  - WebSocket streaming functional
  - Deduplication working (tested with 100 duplicate events)

### Task 0.4: Set Up Test Fixtures & Determinism Validation Tools
- [ ] Generate 100+ diverse test SDSs (various genres, constraints)
- [ ] Create determinism test framework (10-run comparison)
- [ ] Implement SHA-256 artifact hashing utility
- [ ] Create determinism report generator
- [ ] Set up test data management (fixtures in git, large datasets in S3)
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - 100+ diverse SDSs generated and available
  - Determinism tests run without errors
  - SHA-256 hashing verified
  - Reports generated in required format

### Task 0.5: Define Skill Contracts & Data Schemas
- [ ] Create input/output schemas for each skill (Pydantic models)
- [ ] Define citation schema (hash, source_id, text, weight)
- [ ] Create metrics schema (generic + skill-specific metrics)
- [ ] Document data flow between skills
- [ ] Create integration test fixtures for skill pairs
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **lead-architect** (architecture/data flow)
- **Acceptance Criteria**:
  - All schemas defined in Pydantic
  - Schemas validated against sample data
  - Data flow diagram created
  - Integration test fixtures ready

### Task 0.6: Create Determinism Validation Checklist
- [ ] Define determinism validation criteria (≥99% threshold)
- [ ] Create checklist for each skill (floating-point ops, datetime, RNG)
- [ ] Implement automated determinism audit tool
- [ ] Document determinism bypass strategy (for future-compatible changes)
- [ ] Create sign-off procedure for Phase 10 validation
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (determinism focus)
- **Acceptance Criteria**:
  - Checklist covers all known non-determinism sources
  - Audit tool detects violations
  - Sign-off procedure documented
  - All 8 skills clear checklist before Phase 10

## Phase 0 Success Criteria

- [ ] Skill template created and validated
- [ ] Seed propagation framework fully operational
- [ ] Event emission infrastructure streaming events
- [ ] 100+ test SDSs ready and verified
- [ ] All data schemas defined in Pydantic
- [ ] Determinism validation tools ready
- [ ] Documentation complete with examples
- [ ] Phase 1 (PLAN skill) ready to begin

---

# PHASE 1: PLAN Skill Implementation

**Duration**: 3-4 days
**Story Points**: 12
**Status**: Not Started
**Dependencies**: Phase 0 (Infrastructure)
**Blocker For**: Phases 2-8 (all dependent on PLAN output)

## Phase Description

Implement the PLAN skill — the first workflow node that expands the Song Design Spec (SDS) into ordered work targets (sections, goals, duration constraints).

**PLAN Contract**:
- **Input**: Song Design Spec (SDS) + seed
- **Output**: plan.json (ordered list of sections with goals and constraints)
- **Seed**: seed + 1
- **Events**: START, END (or FAIL)

## Detailed Tasks

### Task 1.1: Create PLAN Skill SKILL.md & Contract
- [ ] Write PLAN skill documentation (core instructions, patterns, examples)
- [ ] Define input contract (SDS structure, required fields)
- [ ] Define output contract (plan.json schema with sections, goals, constraints)
- [ ] Create example inputs and expected outputs
- [ ] Document edge cases (extreme BPM, unusual time signatures)
- **Story Points**: 2
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - SKILL.md complete and clear
  - Input/output examples match reality
  - Edge cases documented
  - Technical review approved

### Task 1.2: Implement Core PLAN Logic
- [ ] Parse SDS and extract section requirements
- [ ] Implement section ordering logic (intro → verse → chorus → bridge → outro)
- [ ] Calculate duration and bar count per section
- [ ] Generate section-specific goals (harmonic, melodic, rhythmic)
- [ ] Apply blueprint constraints (genre-specific rules)
- **Story Points**: 3
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Sections ordered deterministically
  - Duration calculations accurate
  - Goals generated per rubric
  - Blueprint constraints enforced
  - No floating-point randomness

### Task 1.3: Implement Seed Propagation & Event Emission
- [ ] Integrate seed + 1 derivation
- [ ] Set up decoder settings (temp 0.2, top_p 0.9)
- [ ] Emit START event before execution
- [ ] Emit END event with metrics (section_count, total_bars, duration_s)
- [ ] Add error handling with FAIL event
- **Story Points**: 2
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (determinism focus)
- **Acceptance Criteria**:
  - Seed propagation verified (same seed = same output)
  - Events emitted at correct times
  - Metrics calculated and logged
  - Error handling comprehensive

### Task 1.4: Create Unit Tests for PLAN Skill
- [ ] Test basic section ordering (standard song structure)
- [ ] Test duration calculation (various BPM and time signatures)
- [ ] Test edge cases (very fast, very slow, unusual time)
- [ ] Test determinism (same seed = identical output)
- [ ] Test event emission (all events present)
- [ ] Test error handling (invalid SDS, missing fields)
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - 15+ test cases passing
  - Edge cases covered
  - Determinism tests pass (10-run hashing)
  - Code coverage ≥85% for PLAN logic

### Task 1.5: Integration Test: PLAN Output Format & Validation
- [ ] Validate plan.json structure matches contract
- [ ] Test plan.json consumption by STYLE skill (mock)
- [ ] Verify all required fields present
- [ ] Check for data type compliance
- [ ] Test with 10 diverse SDSs
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - Output schema validated
  - Downstream integration verified
  - All 10 diverse SDSs produce valid output

### Task 1.6: Documentation & Runbook
- [ ] Create troubleshooting guide for common PLAN failures
- [ ] Document performance expectations (latency <2s)
- [ ] Create example plan.json files for each genre
- [ ] Write debugging guide (seed propagation, determinism)
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - Troubleshooting guide comprehensive
  - Performance documented
  - Examples cover all genres
  - Debugging guide useful and clear

## Phase 1 Success Criteria

- [ ] PLAN skill executes without errors
- [ ] plan.json output matches schema
- [ ] Determinism ≥99% (10-run tests)
- [ ] All unit tests passing (15+)
- [ ] Integration tests passing
- [ ] Documentation complete
- [ ] Ready for Phase 2 (STYLE skill) to consume output

---

# PHASE 2: STYLE Skill Implementation

**Duration**: 3-4 days
**Story Points**: 13
**Status**: Not Started
**Dependencies**: Phase 0 (Infrastructure), Phase 1 (PLAN output format)

## Phase Description

Implement the STYLE skill — generates genre-appropriate style specifications with tag sanitization via conflict matrix and blueprint tempo/key validation.

**STYLE Contract**:
- **Input**: SDS + plan.json + seed
- **Output**: style.json (tempo, key, mood, instrumentation, tags)
- **Seed**: seed + 2
- **Constraints**: Conflict matrix validation, blueprint tempo/key ranges

## Detailed Tasks

### Task 2.1: Create STYLE Skill Documentation
- [ ] Write STYLE skill SKILL.md (core instructions, patterns, examples)
- [ ] Define input contract (SDS, plan, genre requirements)
- [ ] Define output contract (style.json with all fields)
- [ ] Create conflict matrix reference
- [ ] Document blueprint constraints per genre
- **Story Points**: 2
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - SKILL.md complete with genre examples
  - Conflict matrix clearly documented
  - Blueprint constraints linked to genre PRDs
  - Technical review approved

### Task 2.2: Implement Style Generation Logic
- [ ] Parse SDS and plan.json
- [ ] Generate tempo within blueprint range (genre-specific)
- [ ] Generate key from allowed_keys (blueprint-defined)
- [ ] Select mood from mood_vocabulary
- [ ] Generate instrumentation tags (max N per blueprint)
- [ ] Apply genre-specific rules (e.g., country requires steel guitar)
- **Story Points**: 3
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Tempo within blueprint range (verified for 5+ genres)
  - Key selection from allowed set
  - Instrumentation respects genre rules
  - No conflicting tags in output
  - Output deterministic

### Task 2.3: Implement Conflict Matrix & Tag Sanitization
- [ ] Load conflict matrix from taxonomies
- [ ] Implement tag conflict detection (e.g., "whisper" + "anthemic")
- [ ] Implement tag resolution (drop lowest-weight tag on conflict)
- [ ] Test conflict resolution with 20+ conflicting tag pairs
- [ ] Log all conflict resolutions with reasons
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Conflict matrix loaded correctly
  - Conflicts detected (20+ test cases)
  - Resolution deterministic
  - Logging clear and auditable

### Task 2.4: Implement Seed Propagation & Event Emission
- [ ] Integrate seed + 2 derivation
- [ ] Set decoder settings (temp 0.25, top_p 0.9)
- [ ] Emit START event
- [ ] Emit END event with metrics (tempo, key, tag_count, conflicts_resolved)
- [ ] Add comprehensive error handling
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (determinism focus)
- **Acceptance Criteria**:
  - Seed + 2 verified
  - Decoder settings enforced
  - Events complete and accurate
  - Error handling comprehensive

### Task 2.5: Create Unit Tests for STYLE Skill
- [ ] Test tempo generation (within blueprint range)
- [ ] Test key selection (allowed_keys only)
- [ ] Test mood selection (from vocabulary)
- [ ] Test instrumentation generation (genre-specific)
- [ ] Test conflict detection and resolution (20+ cases)
- [ ] Test determinism (10-run hashing)
- [ ] Test error handling (invalid plan, missing fields)
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - 20+ test cases passing
  - Conflict matrix coverage ≥90%
  - Determinism tests pass (10-run)
  - Code coverage ≥85%

### Task 2.6: Integration Tests: STYLE Output & Cross-Skill Validation
- [ ] Validate style.json matches schema
- [ ] Test consumption by COMPOSE skill (mock)
- [ ] Verify all required fields present
- [ ] Check data types and ranges
- [ ] Test with 10 diverse SDSs and genres
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - Output schema validated (all genres)
  - Downstream integration verified
  - All 10 test cases pass

### Task 2.7: Documentation & Genre Examples
- [ ] Create genre-specific style examples (pop, country, hiphop, rock, etc.)
- [ ] Document conflict matrix with visual (table or DAG)
- [ ] Create troubleshooting guide (common style failures)
- [ ] Write performance expectations documentation
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - 5+ genre examples provided
  - Conflict matrix visualized
  - Troubleshooting guide complete
  - Performance documented

## Phase 2 Success Criteria

- [ ] STYLE skill executes without errors
- [ ] style.json output matches schema
- [ ] No conflicting tags in output
- [ ] Determinism ≥99% (10-run tests)
- [ ] All unit tests passing (20+)
- [ ] Integration tests passing
- [ ] Genre examples comprehensive
- [ ] Ready for Phase 3 (LYRICS)

---

# PHASE 3: LYRICS Skill Implementation

**Duration**: 5-6 days
**Story Points**: 18
**Status**: Not Started
**Dependencies**: Phase 0 (Infrastructure), Phase 1 (PLAN), Phase 2 (STYLE)
**Risk Level**: HIGH (citation hashing complexity)

## Phase Description

Implement the LYRICS skill — generates lyrics with pinned source retrieval (content hash-based), rhyme scheme enforcement, profanity filtering, and full citation tracking.

**LYRICS Contract**:
- **Input**: SDS + plan.json + style.json + seed
- **Output**: lyrics.json (per-section lyrics + citations with hashes)
- **Seed**: seed + 3
- **Constraints**: Profanity filter, rhyme enforcement, pinned retrieval via content hash

## Detailed Tasks

### Task 3.1: Create LYRICS Skill Documentation
- [ ] Write LYRICS skill SKILL.md (core instructions, citation system, examples)
- [ ] Define input contract (SDS, plan, style + source constraints)
- [ ] Define output contract (lyrics.json + citations.json with hashes)
- [ ] Document citation schema (chunk_hash, source_id, text, weight)
- [ ] Create pinned retrieval explanation and examples
- **Story Points**: 2
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - SKILL.md comprehensive with examples
  - Citation schema clearly documented
  - Pinned retrieval process explained step-by-step
  - Technical review approved

### Task 3.2: Implement Basic Lyrics Generation Logic
- [ ] Parse plan.json and style.json for section requirements
- [ ] Generate section-specific lyrics (verse, chorus, bridge)
- [ ] Enforce section line count constraints (from blueprint)
- [ ] Apply mood and instrumentation to lyrical tone
- [ ] Generate lyrics deterministically (seed + 3)
- **Story Points**: 3
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Lyrics generated per section
  - Line count constraints enforced
  - Lyrics match mood/style
  - Output deterministic (verified with seed)

### Task 3.3: Implement Citation Hashing & Pinned Retrieval
- [ ] Implement SHA-256 hashing for source chunks
- [ ] Create chunk hash index (hash → chunk metadata)
- [ ] Implement pinned retrieval (fetch by chunk hash)
- [ ] Mock external source API for testing
- [ ] Log all source citations with hashes
- [ ] Implement fixed top-k retrieval per source (no dynamic trimming)
- **Story Points**: 4
- **Duration**: 1.5 days
- **Subagent Assignment**: **python-pro** (determinism focus)
- **Acceptance Criteria**:
  - SHA-256 hashing verified (no collisions in test set)
  - Pinned retrieval returns correct chunks
  - Citations logged with hashes
  - Determinism tests show identical citations across 10 runs
  - Top-k sorting deterministic (lexicographic tie-break)

### Task 3.4: Implement Rhyme Scheme Enforcement
- [ ] Load rhyme scheme vocabulary (per genre)
- [ ] Implement rhyme pattern validator (AABB, ABAB, ABCB)
- [ ] Create rhyme fixing logic (swap words, adjust lines)
- [ ] Test with 20+ sections across genres
- [ ] Document rhyme patterns per genre
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Rhyme patterns validated (20+ test cases)
  - Rhyme fixing deterministic
  - Genre-specific patterns enforced
  - Documented with examples

### Task 3.5: Implement Profanity Filter & PII Redaction
- [ ] Load profanity list (parameterized by explicit flag)
- [ ] Implement profanity detection and replacement
- [ ] Implement PII pattern detection (email, phone, address)
- [ ] Create redaction strategy (blur, redact, replace)
- [ ] Test with 30+ test strings (clean, explicit, PII)
- **Story Points**: 2
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (security/policy focus)
- **Acceptance Criteria**:
  - Profanity detected (30+ test cases)
  - PII redacted correctly
  - Redaction respects explicit flag
  - Logging tracks all redactions

### Task 3.6: Implement Seed Propagation & Event Emission
- [ ] Integrate seed + 3 derivation
- [ ] Set decoder settings (temp 0.25, top_p 0.9)
- [ ] Emit START event
- [ ] Emit END event with metrics (lines_written, citations_count, rhyme_score, profanity_redactions)
- [ ] Add error handling with detailed logging
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (determinism focus)
- **Acceptance Criteria**:
  - Seed + 3 verified
  - Decoder settings enforced
  - Events complete
  - Error logging comprehensive

### Task 3.7: Create Unit Tests for LYRICS Skill
- [ ] Test basic lyrics generation (all section types)
- [ ] Test line count enforcement (20+ edge cases)
- [ ] Test citation hashing (no collisions, deterministic)
- [ ] Test pinned retrieval (correct chunks retrieved)
- [ ] Test rhyme scheme validation (20+ patterns)
- [ ] Test profanity filter (30+ test cases)
- [ ] Test PII redaction (edge cases)
- [ ] Test determinism (10-run hashing)
- **Story Points**: 2.5
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - 40+ test cases passing
  - Citation determinism verified
  - Rhyme scheme coverage ≥85%
  - Code coverage ≥80%

### Task 3.8: Integration Tests: LYRICS Output & Downstream Validation
- [ ] Validate lyrics.json + citations.json structure
- [ ] Test consumption by PRODUCER skill (mock)
- [ ] Verify citations are complete and hashable
- [ ] Check for any missing citations
- [ ] Test with 10 diverse SDSs
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - Output schemas validated
  - Citations complete and verifiable
  - All 10 test cases pass

### Task 3.9: Documentation & Citation Examples
- [ ] Create detailed citation system documentation
- [ ] Provide 5+ example lyrics.json outputs (various genres)
- [ ] Document rhyme schemes per genre (visual examples)
- [ ] Create troubleshooting guide (rhyme failures, citation issues)
- [ ] Write performance expectations (latency <3s)
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - Citation system clearly explained
  - 5+ genre examples provided
  - Rhyme scheme examples clear
  - Troubleshooting guide comprehensive

## Phase 3 Success Criteria

- [ ] LYRICS skill executes without errors
- [ ] lyrics.json + citations.json match schemas
- [ ] Citations deterministic (same seed = same hashes)
- [ ] Rhyme schemes enforced
- [ ] Profanity/PII filtered correctly
- [ ] Determinism ≥99% (10-run tests)
- [ ] All unit tests passing (40+)
- [ ] Integration tests passing
- [ ] Documentation complete with examples
- [ ] Ready for Phase 4 (PRODUCER)

---

# PHASE 4: PRODUCER Skill Implementation

**Duration**: 3-4 days
**Story Points**: 12
**Status**: Not Started
**Dependencies**: Phase 0 (Infrastructure), Phase 1 (PLAN), Phase 2 (STYLE), Phase 3 (LYRICS)

## Phase Description

Implement the PRODUCER skill — creates arrangement and mix guidance aligned to style and blueprint constraints, with structure validation.

**PRODUCER Contract**:
- **Input**: SDS + plan.json + style.json + lyrics.json + seed
- **Output**: producer_notes.json (arrangement, structure, mix targets, instrumentation guidance)
- **Seed**: seed + 4
- **Constraints**: Blueprint structure rules, instrumentation limits

## Detailed Tasks

### Task 4.1: Create PRODUCER Skill Documentation
- [ ] Write PRODUCER skill SKILL.md (arrangement concepts, mix targets, examples)
- [ ] Define input contract (plan, style, lyrics)
- [ ] Define output contract (producer_notes.json with arrangement, mix guidance)
- [ ] Document arrangement patterns per genre
- [ ] Create mix target guidelines (drums, bass, melody, harmony levels)
- **Story Points**: 2
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - SKILL.md comprehensive
  - Arrangement patterns documented
  - Mix targets documented with ranges
  - Technical review approved

### Task 4.2: Implement Arrangement Logic
- [ ] Parse plan and style for arrangement requirements
- [ ] Generate section-specific arrangement (intro, verse, chorus, bridge)
- [ ] Implement build-up logic (add instruments per section)
- [ ] Apply genre-specific arrangement rules (e.g., drop in EDM, second verse stripped in country)
- [ ] Enforce blueprint structure constraints
- **Story Points**: 3
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Arrangement generated per section
  - Build-up logic applied
  - Genre rules enforced
  - Output deterministic

### Task 4.3: Implement Mix Target Generation
- [ ] Define mix target schema (drum_level, bass_level, vocal_level, etc.)
- [ ] Generate targets based on style and plan
- [ ] Apply genre-specific mix rules (e.g., bass-heavy hiphop, vocal-forward pop)
- [ ] Validate targets are within reasonable ranges (0-100 scale)
- **Story Points**: 2
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Mix targets generated per section
  - Targets within valid ranges
  - Genre rules applied
  - Deterministic output

### Task 4.4: Implement Instrumentation Guidance
- [ ] Parse style.json instrumentation tags
- [ ] Generate instrument arrangement per section
- [ ] Apply blueprint instrument limits
- [ ] Validate no conflicting instrument combinations
- [ ] Create EQ and effects guidance (high-level)
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Instruments specified per section
  - Limits enforced from blueprint
  - Guidance clear and actionable
  - Deterministic

### Task 4.5: Implement Seed Propagation & Event Emission
- [ ] Integrate seed + 4 derivation
- [ ] Set decoder settings (temp 0.25, top_p 0.9)
- [ ] Emit START event
- [ ] Emit END event with metrics (section_count, instrument_count, mix_target_avg, duration_s)
- [ ] Add error handling
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (determinism focus)
- **Acceptance Criteria**:
  - Seed + 4 verified
  - Events complete
  - Metrics accurate
  - Error handling comprehensive

### Task 4.6: Create Unit Tests for PRODUCER Skill
- [ ] Test arrangement logic (all section types, 15+ cases)
- [ ] Test build-up logic (correct instrument progression)
- [ ] Test mix target generation (valid ranges)
- [ ] Test instrumentation guidance (no conflicts)
- [ ] Test genre-specific rules (5+ genres)
- [ ] Test determinism (10-run hashing)
- [ ] Test error handling (invalid plan/style)
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - 20+ test cases passing
  - Build-up logic verified
  - Genre rules coverage ≥85%
  - Code coverage ≥85%

### Task 4.7: Integration Tests: PRODUCER Output & Downstream Validation
- [ ] Validate producer_notes.json structure
- [ ] Test consumption by COMPOSE skill (mock)
- [ ] Verify all required fields present
- [ ] Check data consistency
- [ ] Test with 10 diverse SDSs
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - Output schema validated (all cases)
  - Downstream integration verified
  - All 10 test cases pass

### Task 4.8: Documentation & Examples
- [ ] Create genre-specific arrangement examples (5+ genres)
- [ ] Document mix target guidelines with visual (table)
- [ ] Create troubleshooting guide (arrangement failures)
- [ ] Write performance expectations documentation
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - 5+ genre examples provided
  - Mix targets visualized
  - Troubleshooting guide complete
  - Performance documented

## Phase 4 Success Criteria

- [ ] PRODUCER skill executes without errors
- [ ] producer_notes.json matches schema
- [ ] Arrangement deterministic
- [ ] Mix targets within valid ranges
- [ ] Determinism ≥99% (10-run tests)
- [ ] All unit tests passing (20+)
- [ ] Integration tests passing
- [ ] Genre examples comprehensive
- [ ] Ready for Phase 5 (COMPOSE)

---

# PHASE 5: COMPOSE Skill Implementation

**Duration**: 3-4 days
**Story Points**: 13
**Status**: Not Started
**Dependencies**: Phase 0, 1, 2, 3, 4 (all prior skills)

## Phase Description

Implement the COMPOSE skill — merges all artifacts (style, lyrics, producer notes) into a single render-ready prompt with model limit enforcement and conflict resolution.

**COMPOSE Contract**:
- **Input**: All prior artifacts (style, lyrics, producer_notes, plan) + seed
- **Output**: composed_prompt.json (final prompt with section tags, model_char_count, metadata)
- **Seed**: seed + 5
- **Constraints**: Model char limit (3000 for Suno), no conflicts

## Detailed Tasks

### Task 5.1: Create COMPOSE Skill Documentation
- [ ] Write COMPOSE skill SKILL.md (prompt merging, format, examples)
- [ ] Define input contract (all artifacts)
- [ ] Define output contract (composed_prompt.json with prompt text, metadata)
- [ ] Document model limits and character counting
- [ ] Create section tag formatting guide
- **Story Points**: 2
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - SKILL.md comprehensive
  - Model limits documented
  - Section tag format clear
  - Technical review approved

### Task 5.2: Implement Artifact Merging Logic
- [ ] Parse all input artifacts (style, lyrics, producer_notes, plan)
- [ ] Create prompt template (structure for style, lyrics, arrangement hints)
- [ ] Merge artifacts into single coherent prompt
- [ ] Add metadata (genre, BPM, key, artist_name, song_title)
- [ ] Validate no conflicting information in merged output
- **Story Points**: 3
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - All artifacts merged
  - Prompt cohesive and logical
  - No conflicts detected
  - Deterministic merge

### Task 5.3: Implement Model Limit Enforcement
- [ ] Create character counter (accurate for Suno 3000-char limit)
- [ ] Implement truncation logic (prioritize lyrics > arrangement > style descriptions)
- [ ] Add compression strategies (abbreviate descriptions, condense tags)
- [ ] Validate prompt under limit before output
- [ ] Log truncation details for observability
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Character counting accurate
  - All outputs under 3000 chars
  - Truncation prioritizes correctly
  - No loss of critical info (lyrics)

### Task 5.4: Implement Section Tag Formatting
- [ ] Create section tag schema ([verse], [chorus], [bridge], etc.)
- [ ] Implement tag insertion in prompt
- [ ] Validate section tags match plan.json
- [ ] Test tag formatting with 10+ prompts
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Tags inserted correctly
  - Tags match plan sections
  - Formatting consistent
  - Deterministic

### Task 5.5: Implement Seed Propagation & Event Emission
- [ ] Integrate seed + 5 derivation
- [ ] Set decoder settings (temp 0.2, top_p 0.9)
- [ ] Emit START event
- [ ] Emit END event with metrics (char_count, section_count, model, truncation_applied)
- [ ] Add error handling
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (determinism focus)
- **Acceptance Criteria**:
  - Seed + 5 verified
  - Events complete
  - Metrics accurate
  - Error handling comprehensive

### Task 5.6: Create Unit Tests for COMPOSE Skill
- [ ] Test artifact merging (all combinations)
- [ ] Test character counting (edge cases, unicode)
- [ ] Test truncation logic (priority validation)
- [ ] Test section tag insertion (all section types)
- [ ] Test determinism (10-run hashing)
- [ ] Test error handling (missing artifacts, invalid data)
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - 20+ test cases passing
  - Truncation priority verified
  - Determinism tests pass
  - Code coverage ≥85%

### Task 5.7: Integration Tests: COMPOSE Output & Render Readiness
- [ ] Validate composed_prompt.json structure
- [ ] Verify prompt is render-ready (no missing sections)
- [ ] Test with mock render connector (if enabled)
- [ ] Verify all metadata present
- [ ] Test with 10 diverse SDSs and models
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - Output schema validated
  - Render readiness verified
  - All metadata present
  - All 10 test cases pass

### Task 5.8: Documentation & Examples
- [ ] Create example composed_prompts (5+ genres)
- [ ] Document truncation strategy with examples
- [ ] Create troubleshooting guide (too long, conflicts)
- [ ] Write performance expectations documentation
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - 5+ examples provided
  - Truncation strategy clear
  - Troubleshooting guide complete
  - Performance documented

## Phase 5 Success Criteria

- [ ] COMPOSE skill executes without errors
- [ ] composed_prompt.json matches schema
- [ ] All prompts under model char limit
- [ ] Section tags correct
- [ ] Determinism ≥99% (10-run tests)
- [ ] All unit tests passing (20+)
- [ ] Integration tests passing
- [ ] Documentation complete with examples
- [ ] Ready for Phase 6 (VALIDATE)

---

# PHASE 6: VALIDATE Skill Implementation

**Duration**: 3-4 days
**Story Points**: 13
**Status**: Not Started
**Dependencies**: Phase 0, 5 (COMPOSE skill for input)

## Phase Description

Implement the VALIDATE skill — scores composed prompt against blueprint rubric, computes quality metrics, and determines pass/fail with detailed issue identification for potential auto-fix.

**VALIDATE Contract**:
- **Input**: composed_prompt.json + blueprint.json + seed
- **Output**: validation_result.json (score, pass/fail, issues list, metrics breakdown)
- **Seed**: seed + 6
- **Metrics**: hook_density, singability, rhyme_tightness, section_completeness, total_score

## Detailed Tasks

### Task 6.1: Create VALIDATE Skill Documentation
- [ ] Write VALIDATE skill SKILL.md (rubric, scoring, metrics definitions)
- [ ] Define input contract (composed_prompt, blueprint)
- [ ] Define output contract (validation_result.json with scores and issues)
- [ ] Document metric calculations (formulas for hook_density, etc.)
- [ ] Create pass/fail decision logic explanation
- **Story Points**: 2
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - SKILL.md comprehensive
  - All metrics clearly defined
  - Scoring formulas documented
  - Decision logic clear

### Task 6.2: Implement Rubric Scoring Logic
- [ ] Load blueprint rubric (weights, thresholds per metric)
- [ ] Implement metric calculators (hook_density, singability, etc.)
- [ ] Calculate weighted total score
- [ ] Implement pass/fail thresholds (≥threshold = pass)
- [ ] Create score breakdown per metric
- **Story Points**: 3
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - All metrics calculated correctly
  - Scoring matches rubric spec
  - Pass/fail decisions accurate
  - Score deterministic

### Task 6.3: Implement Issue Identification Logic
- [ ] Define issue types (low_hook_density, weak_rhyme, short_section, etc.)
- [ ] Implement detection for each issue type
- [ ] Create issue severity levels (critical, warning, info)
- [ ] Generate actionable issue descriptions
- [ ] Test with 30+ prompt samples (various quality levels)
- **Story Points**: 2.5
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - All issue types detected
  - Descriptions actionable
  - Deterministic detection
  - Coverage ≥90% of known issues

### Task 6.4: Implement Policy Guards
- [ ] Implement length guards (total sections, min/max duration)
- [ ] Implement section structure guards (required sections present)
- [ ] Implement conflict guards (no conflicting tags)
- [ ] Implement profanity policy enforcement (honor explicit flag)
- [ ] Test with 20+ edge cases
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (policy/security focus)
- **Acceptance Criteria**:
  - All guards working
  - Edge cases handled
  - Policies enforced
  - Deterministic

### Task 6.5: Implement Seed Propagation & Event Emission
- [ ] Integrate seed + 6 derivation
- [ ] Set decoder settings (temp 0.2, top_p 0.9)
- [ ] Emit START event
- [ ] Emit END event with metrics (total_score, pass, issue_count, duration_ms)
- [ ] Add error handling
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (determinism focus)
- **Acceptance Criteria**:
  - Seed + 6 verified
  - Events complete
  - Metrics accurate
  - Error handling comprehensive

### Task 6.6: Create Unit Tests for VALIDATE Skill
- [ ] Test metric calculations (20+ prompts)
- [ ] Test scoring logic (edge cases)
- [ ] Test pass/fail decisions (boundary cases)
- [ ] Test issue detection (all types, 30+ cases)
- [ ] Test policy guards (20+ edge cases)
- [ ] Test determinism (10-run hashing)
- [ ] Test error handling (invalid prompt, missing fields)
- **Story Points**: 2
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - 40+ test cases passing
  - Metric calculations verified
  - Issue detection comprehensive
  - Code coverage ≥85%

### Task 6.7: Integration Tests: VALIDATE Output & Pass/Fail Decision
- [ ] Validate validation_result.json structure
- [ ] Test with prompts that should pass (high quality)
- [ ] Test with prompts that should fail (low quality)
- [ ] Verify issue descriptions useful for FIX skill
- [ ] Test with 10 diverse SDSs
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - Output schema validated
  - Pass/fail decisions correct
  - Issue descriptions useful
  - All 10 test cases pass

### Task 6.8: Documentation & Examples
- [ ] Create detailed metric definitions (with formulas)
- [ ] Provide example validation_results (pass, fail, borderline)
- [ ] Document issue types and severity levels
- [ ] Create troubleshooting guide (low scores, unexpected failures)
- [ ] Write performance expectations documentation
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - Metrics clearly explained with formulas
  - 3+ example results provided
  - Issue types documented
  - Troubleshooting guide complete

## Phase 6 Success Criteria

- [ ] VALIDATE skill executes without errors
- [ ] validation_result.json matches schema
- [ ] Metrics calculated correctly
- [ ] Pass/fail decisions accurate
- [ ] Issues identified and actionable
- [ ] Determinism ≥99% (10-run tests)
- [ ] All unit tests passing (40+)
- [ ] Integration tests passing
- [ ] Documentation complete with examples
- [ ] Ready for Phase 7 (FIX)

---

# PHASE 7: FIX Skill Implementation

**Duration**: 4-5 days
**Story Points**: 15
**Status**: Not Started
**Dependencies**: Phase 0, 5 (COMPOSE), 6 (VALIDATE)
**Note**: This is the most complex skill - includes auto-fix playbook and iterative refinement

## Phase Description

Implement the FIX skill — applies targeted improvements to fix validation failures, with auto-fix playbook (e.g., low hook density → duplicate/condense chorus) and max 3 iteration loop.

**FIX Contract**:
- **Input**: composed_prompt.json + validation_result.json + seed
- **Output**: fixed_prompt.json (improved prompt with delta logged)
- **Seed**: seed + 7
- **Constraints**: Max 3 iterations, deterministic fixes

## Detailed Tasks

### Task 7.1: Create FIX Skill Documentation
- [ ] Write FIX skill SKILL.md (auto-fix playbook, iteration logic, examples)
- [ ] Define input contract (composed_prompt, validation_result)
- [ ] Define output contract (fixed_prompt.json with delta_applied)
- [ ] Document auto-fix playbook (issue → fix mapping)
- [ ] Create iteration control explanation
- **Story Points**: 2
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - SKILL.md comprehensive
  - Playbook documented with examples
  - Iteration logic clear
  - Technical review approved

### Task 7.2: Implement Auto-Fix Playbook
- [ ] Create issue → fix mapping (from VALIDATE issues)
- [ ] Implement low_hook_density fix (duplicate/condense chorus hooks)
- [ ] Implement weak_rhyme fix (adjust line, swap words)
- [ ] Implement short_section fix (expand or add content)
- [ ] Implement weak_meter fix (adjust syllables/rhythm)
- [ ] Implement tag_conflict fix (remove conflicting tags)
- [ ] Test with 20+ prompts (various issues)
- **Story Points**: 4
- **Duration**: 1.5 days
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - All playbook fixes implemented
  - Fixes deterministic (seed + 7)
  - Fixes effective (improve validation scores)
  - Test coverage ≥80%

### Task 7.3: Implement Iteration Control Logic
- [ ] Create iteration counter (max 3)
- [ ] Implement re-composition logic (call COMPOSE internally)
- [ ] Implement re-validation logic (call VALIDATE internally)
- [ ] Implement convergence detection (no improvement → stop)
- [ ] Track delta and improvements per iteration
- **Story Points**: 2.5
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Iteration counter working
  - Re-composition/validation integrated
  - Convergence detection effective
  - Deterministic iteration sequence

### Task 7.4: Implement Prompt Delta Tracking
- [ ] Create delta schema (what changed, why, improvement achieved)
- [ ] Implement diff between original and fixed prompt
- [ ] Track all iterations' deltas
- [ ] Log reasons for each fix applied
- [ ] Create improvement metrics (score before/after)
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Delta schema complete
  - Diffs accurate
  - Improvement tracked
  - Logging clear

### Task 7.5: Implement Seed Propagation & Event Emission
- [ ] Integrate seed + 7 derivation (with iteration sub-seeds)
- [ ] Set decoder settings (temp 0.25, top_p 0.9)
- [ ] Emit START event
- [ ] Emit END event with metrics (iterations_used, improvements_achieved, final_score, delta_summary)
- [ ] Add iteration-level events (optional: per-iteration progress)
- [ ] Add error handling
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (determinism focus)
- **Acceptance Criteria**:
  - Seed + 7 verified
  - Events complete with iteration data
  - Metrics accurate
  - Error handling comprehensive

### Task 7.6: Create Unit Tests for FIX Skill
- [ ] Test all playbook fixes (low_hook, weak_rhyme, short_section, etc.)
- [ ] Test iteration control (max 3, convergence detection)
- [ ] Test delta tracking (diffs accurate)
- [ ] Test with high-scoring prompts (minimal fixes needed)
- [ ] Test with low-scoring prompts (multiple fixes needed)
- [ ] Test determinism (10-run hashing, iteration sequence identical)
- [ ] Test error handling (invalid validation result, missing fields)
- **Story Points**: 2.5
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - 25+ test cases passing
  - Playbook coverage ≥85%
  - Iteration sequence deterministic
  - Code coverage ≥80%

### Task 7.7: Integration Tests: FIX with COMPOSE & VALIDATE Loop
- [ ] Test FIX → COMPOSE → VALIDATE → FIX loop (simulated)
- [ ] Verify loop convergence (improvements each iteration)
- [ ] Test with 10 diverse failing prompts
- [ ] Verify final output better than input
- [ ] Test determinism across 3 iteration cycles
- **Story Points**: 1.5
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - Loop working correctly
  - Convergence achieved
  - Improvements measurable
  - Determinism ≥99%

### Task 7.8: Documentation & Playbook Examples
- [ ] Create detailed playbook documentation (issue → fix mapping table)
- [ ] Provide 5+ example FIX iterations (before/after comparisons)
- [ ] Document iteration control strategy
- [ ] Create troubleshooting guide (fixes not working, loop not converging)
- [ ] Write performance expectations documentation
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - Playbook clearly documented
  - 5+ examples provided with before/after
  - Iteration strategy explained
  - Troubleshooting guide complete

## Phase 7 Success Criteria

- [ ] FIX skill executes without errors
- [ ] fixed_prompt.json matches schema
- [ ] Auto-fix playbook works (all fixes effective)
- [ ] Iteration control limits to max 3
- [ ] Delta tracking accurate
- [ ] Determinism ≥99% (10-run tests)
- [ ] Integration tests passing (FIX loop)
- [ ] All unit tests passing (25+)
- [ ] Documentation complete with playbook
- [ ] Ready for Phase 8 (REVIEW)

---

# PHASE 8: REVIEW Skill Implementation

**Duration**: 2-3 days
**Story Points**: 10
**Status**: Not Started
**Dependencies**: Phase 0, 5 (COMPOSE/FIX), 6 (VALIDATE)

## Phase Description

Implement the REVIEW skill — finalizes all artifacts, generates summary JSON, persists to S3 (if enabled), and emits final completion event.

**REVIEW Contract**:
- **Input**: All artifacts (style, lyrics, producer_notes, composed_prompt, validation_result) + seed
- **Output**: review_summary.json (final artifact package with hashes, metadata, completion status)
- **Seed**: seed + 8
- **Persistence**: S3 storage if enabled, database record

## Detailed Tasks

### Task 8.1: Create REVIEW Skill Documentation
- [ ] Write REVIEW skill SKILL.md (finalization process, artifact packaging, examples)
- [ ] Define input contract (all artifacts)
- [ ] Define output contract (review_summary.json)
- [ ] Document S3 persistence strategy
- [ ] Create artifact package structure documentation
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - SKILL.md comprehensive
  - Artifact packaging clear
  - S3 strategy documented
  - Technical review approved

### Task 8.2: Implement Artifact Aggregation
- [ ] Parse all input artifacts
- [ ] Create artifact package (combined JSON with all components)
- [ ] Calculate SHA-256 hash for entire package
- [ ] Generate metadata summary (genre, BPM, key, artist, title, created_at, run_id)
- [ ] Validate all artifacts present and valid
- **Story Points**: 2
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Package structure correct
  - Hashes calculated
  - Metadata complete
  - Validation comprehensive

### Task 8.3: Implement S3 Persistence (if enabled)
- [ ] Check feature flag for S3 persistence
- [ ] Create S3 path structure (song_id/run_id/artifacts/)
- [ ] Upload artifact package to S3
- [ ] Store S3 URL and object metadata in database
- [ ] Implement error handling (S3 unavailable, permission issues)
- [ ] Test with mock S3 (moto)
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (infrastructure/integration)
- **Acceptance Criteria**:
  - S3 upload working (with mock)
  - URLs generated correctly
  - Feature flag respected
  - Error handling comprehensive

### Task 8.4: Implement Summary JSON Generation
- [ ] Create summary schema (high-level metrics, status, artifact counts)
- [ ] Calculate final metrics (total_score, pass/fail status, iterations_used)
- [ ] Generate summary statistics
- [ ] Create artifact reference list (with hashes)
- [ ] Include run metadata (duration, seed, timestamp)
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (skill implementation)
- **Acceptance Criteria**:
  - Summary schema complete
  - Metrics accurate
  - References complete
  - Run metadata captured

### Task 8.5: Implement Final Event Emission
- [ ] Integrate seed + 8 derivation
- [ ] Set decoder settings (temp 0.2, top_p 0.9)
- [ ] Emit START event
- [ ] Emit END event with final metrics and completion status
- [ ] Emit artifact_persisted event (if S3 enabled)
- [ ] Create workflow_complete summary event (all artifacts ready)
- [ ] Add error handling with detailed logging
- **Story Points**: 1.5
- **Duration**: 0.5 days
- **Subagent Assignment**: **python-pro** (determinism/events focus)
- **Acceptance Criteria**:
  - Seed + 8 verified
  - All events emitted
  - Completion status accurate
  - Error handling comprehensive

### Task 8.6: Create Unit Tests for REVIEW Skill
- [ ] Test artifact aggregation (all combinations)
- [ ] Test hash calculation (deterministic, no collisions)
- [ ] Test summary JSON generation (completeness)
- [ ] Test S3 persistence (mock S3)
- [ ] Test event emission (all events present)
- [ ] Test determinism (10-run hashing)
- [ ] Test error handling (missing artifacts, S3 errors, invalid data)
- **Story Points**: 1.5
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - 15+ test cases passing
  - Aggregation verified
  - S3 tested with mock
  - Code coverage ≥85%

### Task 8.7: Integration Tests: Full Workflow (PLAN → REVIEW)
- [ ] Test complete workflow execution (all 8 skills in sequence)
- [ ] Verify data flow end-to-end
- [ ] Validate final artifact package
- [ ] Check all events emitted
- [ ] Test with 5 diverse SDSs
- **Story Points**: 2
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - Workflow completes without errors
  - Data flow correct
  - Artifacts valid and complete
  - All 5 test cases pass

## Phase 8 Success Criteria

- [ ] REVIEW skill executes without errors
- [ ] review_summary.json matches schema
- [ ] Artifact aggregation complete
- [ ] S3 persistence working (if enabled)
- [ ] All events emitted correctly
- [ ] Determinism ≥99% (10-run tests)
- [ ] Full workflow integration tests passing
- [ ] All unit tests passing (15+)
- [ ] Documentation complete
- [ ] Ready for Phase 9 (Integration Testing)

---

# PHASE 9: Integration Testing

**Duration**: 3-4 days
**Story Points**: 12
**Status**: Not Started
**Dependencies**: Phase 0-8 (all skills complete)

## Phase Description

Execute comprehensive integration tests across the entire workflow, validating data flow, event streams, and end-to-end determinism.

## Detailed Tasks

### Task 9.1: Create Comprehensive Integration Test Suite
- [ ] Design full workflow test plan (PLAN → REVIEW)
- [ ] Create test data fixtures (50+ diverse SDSs)
- [ ] Implement workflow execution harness
- [ ] Create data validation checks (schema compliance, required fields)
- [ ] Document test coverage matrix (skills × data types)
- **Story Points**: 2.5
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - Test plan comprehensive
  - Test fixtures diverse
  - Harness functional
  - Coverage ≥90%

### Task 9.2: Run Full Workflow Integration Tests
- [ ] Execute workflow with 50 diverse SDSs
- [ ] Validate output structure at each step
- [ ] Check for data loss or corruption
- [ ] Verify all metrics calculated
- [ ] Verify all events emitted
- [ ] Collect timing data (per-skill latency)
- **Story Points**: 2
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - All 50 workflows complete
  - 100% output validation pass
  - No data loss
  - Timing data collected

### Task 9.3: Validate Event Stream Completeness
- [ ] Verify all node events emitted (START, END per skill)
- [ ] Check event ordering and timing
- [ ] Validate event payload structure (all fields present)
- [ ] Test WebSocket delivery (no loss or duplication)
- [ ] Create event flow diagram
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **lead-architect** (orchestration/events)
- **Acceptance Criteria**:
  - All events present in correct order
  - Payloads valid
  - WebSocket delivery reliable
  - Diagram created

### Task 9.4: Test Data Flow Between Skills
- [ ] Trace SDS through PLAN → STYLE → LYRICS → PRODUCER → COMPOSE
- [ ] Verify no data loss at handoffs
- [ ] Validate schema compliance at each step
- [ ] Check for circular dependencies or deadlocks
- [ ] Test with edge case data (extreme values, unusual genres)
- **Story Points**: 2
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - Data flows correctly through all skills
  - No loss or corruption
  - Edge cases handled
  - Schema compliance verified

### Task 9.5: Test Error Handling & Recovery
- [ ] Introduce errors at each skill (invalid input, timeout, etc.)
- [ ] Verify error propagation and logging
- [ ] Test retry logic (if implemented)
- [ ] Verify workflow halts on critical errors
- [ ] Test error recovery scenarios
- **Story Points**: 1.5
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - Error handling comprehensive
  - Errors logged clearly
  - Workflow halts appropriately
  - Recovery tested

### Task 9.6: Performance & Latency Analysis
- [ ] Calculate per-skill latencies (P50, P95, P99)
- [ ] Identify bottlenecks
- [ ] Compare against targets (P95 ≤60s total)
- [ ] Create performance report
- [ ] Recommend optimizations if needed
- **Story Points**: 1.5
- **Duration**: 0.75 days
- **Subagent Assignment**: **lead-architect** (performance analysis)
- **Acceptance Criteria**:
  - Latencies measured for all skills
  - Bottlenecks identified
  - P95 latency ≤60s achieved
  - Report created

### Task 9.7: Create Integration Test Report
- [ ] Document test results (pass/fail summary)
- [ ] List any issues found (with severity)
- [ ] Provide coverage matrix
- [ ] Create recommendations for Phase 10
- [ ] Sign off on integration readiness
- **Story Points**: 1
- **Duration**: 0.5 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - Report comprehensive
  - Issues clearly documented
  - Coverage visible
  - Recommendations clear

## Phase 9 Success Criteria

- [ ] All 50 integration workflows complete successfully
- [ ] 100% data validation pass rate
- [ ] All events emitted and delivered
- [ ] No data loss or corruption
- [ ] Error handling working correctly
- [ ] P95 latency ≤60s achieved
- [ ] Integration test report complete
- [ ] Ready for Phase 10 (Determinism Validation)

---

# PHASE 10: Determinism Validation & Optimization

**Duration**: 3-4 days
**Story Points**: 10
**Status**: Not Started
**Dependencies**: Phase 0-9 (all prior phases)

## Phase Description

Execute final determinism validation at scale, running 50 diverse SDSs × 10 times each (500 total runs), measuring reproducibility, and optimizing performance.

## Detailed Tasks

### Task 10.1: Prepare Extended Test Suite
- [ ] Collect 50 diverse SDSs (various genres, edge cases)
- [ ] Document test set composition
- [ ] Prepare seeded execution harness (10 runs per SDS)
- [ ] Create reproducibility validation framework
- [ ] Set up performance monitoring
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - 50 SDSs prepared and documented
  - Harness functional
  - Monitoring enabled
  - Framework ready

### Task 10.2: Run 500 Determinism Tests (50 SDSs × 10 runs)
- [ ] Execute all 500 workflow runs
- [ ] Collect artifact hashes from each run
- [ ] Log seed and determinism info
- [ ] Monitor for errors or timeouts
- [ ] Capture performance metrics
- **Story Points**: 2
- **Duration**: 1-2 days (parallel execution if possible)
- **Subagent Assignment**: **python-pro** (testing/QA focus)
- **Acceptance Criteria**:
  - All 500 runs complete
  - No errors or timeouts
  - All data collected
  - Performance baseline established

### Task 10.3: Analyze Determinism & Generate Report
- [ ] Compare artifact hashes across 10 runs per SDS
- [ ] Calculate reproducibility % (target ≥99%)
- [ ] Identify any non-deterministic outputs
- [ ] Investigate failures (if any)
- [ ] Generate detailed determinism report
- [ ] Document any seed propagation issues
- **Story Points**: 2
- **Duration**: 1 day
- **Subagent Assignment**: **python-pro** (determinism focus)
- **Acceptance Criteria**:
  - Reproducibility ≥99%
  - All variations identified (if any)
  - Report detailed and actionable
  - Sign-off on determinism acceptance

### Task 10.4: Performance Optimization
- [ ] Analyze latency breakdown by skill
- [ ] Identify optimization opportunities
- [ ] Apply quick wins (if any found)
- [ ] Re-measure performance
- [ ] Document optimization results
- [ ] Compare P50, P95, P99 against targets
- **Story Points**: 1.5
- **Duration**: 0.75 days
- **Subagent Assignment**: **lead-architect** (performance optimization)
- **Acceptance Criteria**:
  - Latencies analyzed
  - Optimizations applied (if available)
  - P95 ≤60s confirmed
  - Results documented

### Task 10.5: Final Validation & Sign-Off
- [ ] Verify all acceptance gates passed
- [ ] Check determinism ≥99%
- [ ] Validate quality metrics (unit tests, integration tests)
- [ ] Confirm documentation complete
- [ ] Create final handoff checklist
- **Story Points**: 2
- **Duration**: 0.75 days
- **Subagent Assignment**: **lead-architect** (architecture validation)
- **Acceptance Criteria**:
  - All gates passed
  - Determinism ≥99% verified
  - Handoff checklist complete
  - Sign-off obtained

### Task 10.6: Create Final Project Report & Documentation
- [ ] Document lessons learned
- [ ] Create operational runbook (skill deployment, monitoring)
- [ ] Generate architecture summary
- [ ] Document performance baseline
- [ ] Create troubleshooting guide
- [ ] Prepare handoff to operations
- **Story Points**: 1.5
- **Duration**: 0.75 days
- **Subagent Assignment**: **documentation-writer**
- **Acceptance Criteria**:
  - All documentation complete
  - Runbook operational
  - Troubleshooting guide comprehensive
  - Handoff ready

## Phase 10 Success Criteria

- [ ] 500 determinism tests completed (50 SDSs × 10 runs)
- [ ] Reproducibility ≥99% verified
- [ ] Performance baseline P95 ≤60s
- [ ] All acceptance gates passed (1-4)
- [ ] Final project report complete
- [ ] Operational runbook ready
- [ ] Handoff documentation complete
- [ ] Ready for production deployment

---

# Acceptance Gates Tracking

## Gate 1: Skill Execution

**Status**: Not Started
**Deadline**: End of Phase 8

| Criterion | Status | Evidence |
|-----------|--------|----------|
| All 8 skills execute without errors | [ ] | Phase 8 integration tests |
| PLAN → REVIEW workflow completes | [ ] | End-to-end test runs |
| All artifacts generated and stored | [ ] | Artifact package validation |
| Event stream outputs all events | [ ] | Event stream completeness test |

**Sign-Off**: [ ] Technical Lead

---

## Gate 2: Determinism Validation

**Status**: Not Started
**Deadline**: End of Phase 10

| Criterion | Status | Evidence |
|-----------|--------|----------|
| 500 runs completed (50 × 10) | [ ] | Test execution logs |
| SHA-256 hash comparison ≥99% reproducibility | [ ] | Determinism report |
| Seed propagation verified | [ ] | Seed tracking audit |
| No floating-point randomness | [ ] | Code audit + determinism tests |

**Sign-Off**: [ ] QA Lead

---

## Gate 3: Quality Metrics

**Status**: Not Started
**Deadline**: End of Phase 10

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Unit test pass rate: 100% | [ ] | Test execution report |
| Integration test pass rate: 100% | [ ] | Phase 9 integration test report |
| Code coverage ≥80% (skill logic) | [ ] | Coverage report |
| Documentation complete with examples | [ ] | SKILL.md files + troubleshooting guides |

**Sign-Off**: [ ] Documentation Lead

---

## Gate 4: Performance

**Status**: Not Started
**Deadline**: End of Phase 10

| Criterion | Status | Evidence |
|-----------|--------|----------|
| P95 latency ≤60s (Plan → Prompt, no render) | [ ] | Phase 10 performance report |
| P50 latency ≤30s | [ ] | Performance baseline |
| No memory leaks (100 executions) | [ ] | Memory profiling results |
| Event latency <1s (emission to UI) | [ ] | Event timing analysis |

**Sign-Off**: [ ] Infrastructure Lead

---

# Summary Metrics

## Overall Progress

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Phases Completed | 11/11 | 0/11 | 0% |
| Tasks Completed | 80+ | 0 | 0% |
| Story Points Complete | 120-150 | 0 | 0% |
| Acceptance Gates Passed | 4/4 | 0/4 | 0% |

## Phase-by-Phase Breakdown

| Phase | Tasks | Story Points | Completion |
|-------|-------|--------------|-----------|
| 0 | 6 | 13 | 0% |
| 1 | 6 | 12 | 0% |
| 2 | 7 | 13 | 0% |
| 3 | 9 | 18 | 0% |
| 4 | 8 | 12 | 0% |
| 5 | 8 | 13 | 0% |
| 6 | 8 | 13 | 0% |
| 7 | 8 | 15 | 0% |
| 8 | 7 | 10 | 0% |
| 9 | 7 | 12 | 0% |
| 10 | 6 | 10 | 0% |
| **TOTAL** | **82** | **141** | **0%** |

---

# Progress Update Template

Use this template for weekly progress updates:

```markdown
## Progress Update [Week #]

**Period**: [Start] - [End]
**Overall Completion**: X%
**On Track**: Yes/No

### Completed Tasks
- [x] [Phase].[Task]: [Brief outcome]

### In Progress
- [ ] [Phase].[Task]: [Status, % complete]

### Blocked
- [ ] [Phase].[Task]: [Blocker description, impact]

### Next Steps
1. [Immediate action]

### Risks
- [Risk]: [Mitigation]

### Metrics Update
- Determinism tests passing: X/10 per skill
- Unit tests passing: X/[total]
- Integration tests passing: X/[total]

### Notes
- [Key observation or decision]
```

---

# Key Contacts & References

## Subagent Assignments

| Role | Agent | Responsibility | Contact |
|------|-------|-----------------|---------|
| Infrastructure Lead | lead-architect | Phases 0, 5, 9, 10 architecture | [TBD] |
| Skill Developer | python-pro | Core skill implementation | [TBD] |
| QA & Testing | python-pro | Unit & integration tests | [TBD] |
| Documentation | documentation-writer | SKILL.md, guides, examples | [TBD] |

## References

- **Main Plan**: `docs/project_plans/implementation_plans/amcs-workflow-skills-v1.md`
- **AMCS Overview**: `docs/amcs-overview.md`
- **PRD Index**: `docs/project_plans/PRDs/`
- **Blueprints**: `docs/hit_song_blueprint/AI/`

---

**Document Status**: Ready for Implementation
**Last Updated**: 2025-11-18
**Next Review**: Upon Phase 0 Completion
**Maintained By**: Implementation Planning Orchestrator
