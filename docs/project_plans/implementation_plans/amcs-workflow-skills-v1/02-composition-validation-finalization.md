# Implementation Plan: Phase 5-10 Details
## Composition, Validation, Fix, Review & Integration Testing

**Part 2 of 4 in the WP-N1 Implementation Plan Series**
**Version**: 1.0
**Created**: 2025-11-14

---

## Phase 5: COMPOSE Skill

### Objective
Create the COMPOSE skill that merges all artifacts into a final render-ready prompt. This is the bottleneck before VALIDATE.

### Requirement Overview
- **Input**: Style, Lyrics, Producer Notes, Engine Limits
- **Output**: Composed Prompt (text + metadata)
- **Determinism**: `seed + 5`
- **Key Constraints**: Model character limits (3000 for Suno), section tag formatting, conflict resolution

### Deliverables

#### 5.1: Prompt Composition Logic
**Story**: "As a composer, I want the COMPOSE skill to merge all artifacts into a coherent prompt so that the music engine receives proper instructions"

**Assigned To**: Skill Developer #1 (after PLAN refinement)

**Tasks**:
- [ ] Create `.claude/skills/amcs-compose/` directory
- [ ] Implement `compose_prompt(style: Style, lyrics: Lyrics, producer_notes: ProducerNotes, engine_limits: EngineConfig, seed: int) → ComposedPrompt`:
  - Title line: "Title: {title}, Genre/Style: {genre} | BPM: {tempo_bpm} | Mood: {moods}"
  - Style tags: comma-separated, one per category (Era → Genre → Energy → etc.)
  - Structure line: "{structure}" from producer notes
  - Voice description: from persona or style
  - Lyrics with section tags: "[Verse]\n{verse_text}\n[Chorus]\n{chorus_text}..."
  - Production notes: instrumentation, mix targets, hook count
  - Policy section: explicit content allowed?, language
  - Return ComposedPrompt with text + metadata
- [ ] Track character count against engine limits
- [ ] Use seed for any selection/ordering decisions

**Acceptance Criteria**:
- [ ] Output matches ComposedPrompt schema
- [ ] Text ≤ model limit (3000 for Suno)
- [ ] All sections included and properly tagged
- [ ] Determinism: 10 runs identical

**Effort**: 8 story points
**Duration**: 9-11 hours

---

#### 5.2: Model Limit Enforcement
**Story**: "As an engine integrator, I want character limits enforced so that prompts never exceed engine limits"

**Assigned To**: Skill Developer #1

**Tasks**:
- [ ] Implement `enforce_char_limit(prompt_text: str, limit: int, priority_sections: List[str]) → (text_truncated, warnings)`:
  - Prioritize: Title, Style Tags, Structure, Chorus, Verses, Bridge, Production Notes
  - If over limit, truncate in reverse priority order
  - Keep at least title and chorus
  - Return truncated text and warnings about what was removed
- [ ] Add length checking with clear warnings
- [ ] Handle edge cases: limit too small (< 500 chars)

**Acceptance Criteria**:
- [ ] Text never exceeds limit
- [ ] Priority sections preserved
- [ ] Clear warnings on truncation

**Effort**: 3 story points
**Duration**: 3-4 hours

---

#### 5.3: Tag Formatting & Conflict Resolution
**Story**: "As a prompt engineer, I want tags formatted correctly and conflicts resolved so that the engine receives clean input"

**Assigned To**: Skill Developer #1

**Tasks**:
- [ ] Implement `format_style_tags(style: Style, conflict_matrix: dict, seed: int) → List[str]`:
  - One tag per category (Era, Genre, Energy, Instrumentation, Rhythm, Vocal, Mix)
  - Resolve conflicts by dropping lower-priority tags
  - Return clean list in alphabetical order
- [ ] Implement `format_section_tags(section_name: str, section_tags: List[str]) → str`:
  - Format as "[Verse]" or "[Chorus]" etc.
  - Include section-specific tags as comments or metadata
- [ ] Test with conflict matrix

**Acceptance Criteria**:
- [ ] Tags properly formatted
- [ ] No conflicts in output
- [ ] Section tags clearly labeled

**Effort**: 3 story points
**Duration**: 3-4 hours

---

#### 5.4: COMPOSE Skill Events, Tests & Documentation
**Story**: "As QA, I want COMPOSE tested for limit enforcement and determinism"

**Assigned To**: QA Automation

**Tasks**:
- [ ] Add event emission (START, END, FAIL)
- [ ] Create `tests/skills/test_compose.py`:
  - Test prompt composition with various inputs
  - Test character limit enforcement
  - Test tag formatting
  - Test with long lyrics (test truncation)
  - Test determinism: 10 runs identical
  - Coverage ≥95%
- [ ] Write SKILL.md with example prompts
- [ ] Document engine limits per model

**Acceptance Criteria**:
- [ ] Tests pass
- [ ] Determinism ≥99%
- [ ] Limit enforcement validated
- [ ] Coverage ≥95%

**Effort**: 4 story points
**Duration**: 4-6 hours

---

### Phase 5 Summary

| Task | Effort | Duration | Owner |
|------|--------|----------|-------|
| 5.1: Core Implementation | 8 pts | 9-11h | Skill Dev #1 |
| 5.2: Limit Enforcement | 3 pts | 3-4h | Skill Dev #1 |
| 5.3: Tag Formatting | 3 pts | 3-4h | Skill Dev #1 |
| 5.4: Events, Tests, Docs | 4 pts | 4-6h | QA Automation |
| **PHASE 5 TOTAL** | **18 pts** | **19-25h** | Multiple |

**Success Criteria**: COMPOSE merges artifacts correctly, enforces character limits, ≥99% reproducibility

---

## Phase 6: VALIDATE Skill

### Objective
Create the VALIDATE skill that scores artifacts against the rubric. This determines PASS/FAIL and triggers FIX if needed.

### Requirement Overview
- **Input**: Lyrics, Style, Producer Notes, Blueprint (with rubric), Composed Prompt
- **Output**: Validation Report (scores, metrics, issues, pass/fail decision)
- **Determinism**: `seed + 6`
- **Key Constraints**: Rubric weights sum to 1.0, thresholds configurable, comprehensive issue identification

### Deliverables

#### 6.1: Rubric Scoring Engine
**Story**: "As a quality assurance, I want the VALIDATE skill to score outputs against the blueprint rubric so that I know which songs are production-ready"

**Assigned To**: Skill Developer #1 + Risk Assessor

**Tasks**:
- [ ] Create `.claude/skills/amcs-validate/` directory
- [ ] Implement `validate_rubric(lyrics: Lyrics, style: Style, produced_notes: ProducerNotes, blueprint: Blueprint, seed: int) → ValidationReport`:
  - Load blueprint.eval_rubric with weights and thresholds
  - Calculate metrics:
    - `hook_density`: memorable phrases per section (0-1, higher is better)
    - `singability`: % of lines at target syllable count (0-1)
    - `rhyme_tightness`: % of lines with proper rhymes (0-1)
    - `section_completeness`: % of required sections present (0-1)
    - `profanity_score`: 1.0 if no profanity, 0.0 if profanity found (when explicit=false)
  - Weight and sum: `total = sum(metric * weight for each metric)`
  - Compare against thresholds:
    - `total >= min_total` → PASS
    - `profanity_score <= max_profanity` → PASS
  - Return ValidationReport with scores, total, pass/fail decision
- [ ] Make weights/thresholds configurable per genre
- [ ] Use seed for deterministic random sampling if needed

**Acceptance Criteria**:
- [ ] All metrics calculated correctly
- [ ] Weights sum to 1.0
- [ ] Pass/fail decision unambiguous
- [ ] Determinism: 10 runs identical

**Effort**: 8 story points
**Duration**: 9-11 hours

---

#### 6.2: Issue Identification
**Story**: "As a fixer, I want detailed issues identified so that I can apply targeted fixes"

**Assigned To**: Skill Developer #1

**Tasks**:
- [ ] Implement `identify_issues(lyrics: Lyrics, style: Style, producer_notes: ProducerNotes, blueprint: Blueprint) → List[Issue]`:
  - Check each metric and identify specific failures:
    - Low hook_density: "Chorus could have more memorable hooks"
    - Low singability: "Line count deviates from target in Verse 2"
    - Low rhyme_tightness: "Verse 1 has weak rhymes (line 3-4, line 7-8)"
    - Low section_completeness: "Missing Bridge section"
    - Profanity: "Contains profanity: [list]"
  - Return prioritized issues list with severity
- [ ] Add suggestions for fixes for each issue

**Acceptance Criteria**:
- [ ] All issues identified with specific evidence
- [ ] Suggestions provided for fixes
- [ ] Issues prioritized by impact on score

**Effort**: 4 story points
**Duration**: 4-6 hours

---

#### 6.3: Blueprint Constraint Validation
**Story**: "As a validator, I want blueprint constraints checked so that outputs respect genre rules"

**Assigned To**: Skill Developer #1

**Tasks**:
- [ ] Implement `validate_blueprint_constraints(style: Style, lyrics: Lyrics, producer_notes: ProducerNotes, blueprint: Blueprint) → List[Constraint]`:
  - Check tempo_bpm against blueprint range
  - Check required sections present
  - Check section_lines (min/max lines per section)
  - Check banned terms not present in lyrics
  - Check lexicon (positive terms should appear, negative should not)
  - Return list of constraint violations
- [ ] Make constraints warnings or errors (configurable)

**Acceptance Criteria**:
- [ ] All blueprint constraints validated
- [ ] Violations identified with specificity
- [ ] Severity properly assigned

**Effort**: 4 story points
**Duration**: 4-6 hours

---

#### 6.4: VALIDATE Skill Events, Tests & Documentation
**Story**: "As QA, I want VALIDATE tested comprehensively with realistic test data"

**Assigned To**: QA Automation

**Tasks**:
- [ ] Add event emission (START, END, FAIL)
- [ ] Create `tests/skills/test_validate.py`:
  - Test with passing lyrics (good hook density, rhyme, etc.)
  - Test with failing lyrics (low metrics)
  - Test with all blueprint constraints
  - Test issue identification
  - Test pass/fail decision logic
  - Test determinism: 10 runs identical
  - Coverage ≥95%
- [ ] Write SKILL.md with rubric examples
- [ ] Document metric calculations with formulas

**Acceptance Criteria**:
- [ ] Tests pass
- [ ] Determinism ≥99%
- [ ] Coverage ≥95%
- [ ] Rubric thresholds validated

**Effort**: 5 story points
**Duration**: 5-7 hours

---

### Phase 6 Summary

| Task | Effort | Duration | Owner |
|------|--------|----------|-------|
| 6.1: Rubric Scoring | 8 pts | 9-11h | Skill Dev #1 + Risk Assessor |
| 6.2: Issue Identification | 4 pts | 4-6h | Skill Dev #1 |
| 6.3: Blueprint Constraints | 4 pts | 4-6h | Skill Dev #1 |
| 6.4: Events, Tests, Docs | 5 pts | 5-7h | QA Automation |
| **PHASE 6 TOTAL** | **21 pts** | **22-30h** | Multiple |

**Success Criteria**: VALIDATE calculates correct scores, identifies fixable issues, ≥99% reproducibility

---

## Phase 7: FIX Skill

### Objective
Create the FIX skill that applies targeted improvements. This runs in a loop with COMPOSE/VALIDATE (≤3 iterations).

### Requirement Overview
- **Input**: ValidationReport with issues, Lyrics, Style, Producer Notes, Blueprint
- **Output**: Patched artifacts (updated Lyrics, Style, Producer Notes)
- **Determinism**: `seed + 7`
- **Key Constraints**: Max 3 iterations, targeted fixes only, no complete rewrites

### Deliverables

#### 7.1: Auto-Fix Playbook
**Story**: "As a composer, I want the FIX skill to automatically improve artifacts so that most songs pass validation"

**Assigned To**: Skill Developer #3 (with LYRICS experience)

**Tasks**:
- [ ] Create `.claude/skills/amcs-fix/` directory
- [ ] Implement `apply_fixes(issues: List[Issue], lyrics: Lyrics, style: Style, producer_notes: ProducerNotes, blueprint: Blueprint, seed: int) → (patched_lyrics, patched_style, patched_producer)`:
  - For each issue, apply targeted fix:
    - **Low hook_density**: Duplicate/condense chorus (add memorable lines)
    - **Low singability**: Adjust syllable counts in problematic lines
    - **Low rhyme_tightness**: Adjust line endings to improve rhyme (seed-based)
    - **Low section_completeness**: Add missing bridge section
    - **Profanity**: Replace banned terms with alternatives
  - Return patched artifacts
  - Use seed for deterministic modifications
- [ ] Document playbook rules

**Acceptance Criteria**:
- [ ] Each issue type has specific fix logic
- [ ] Fixes are targeted, not wholesale rewrites
- [ ] Determinism: 10 runs identical

**Effort**: 8 story points
**Duration**: 9-11 hours

---

#### 7.2: FIX Logic for Each Issue Type
**Story**: "As a fixer, I want targeted fix methods for each issue category"

**Assigned To**: Skill Developer #3

**Tasks**:
- [ ] Implement `fix_hook_density(lyrics: Lyrics, seed: int) → Lyrics`:
  - Identify chorus
  - Add memorable hooks or condense redundant lines
  - Increase hook count in producer notes
- [ ] Implement `fix_singability(lyrics: Lyrics, target_syllables: int, seed: int) → Lyrics`:
  - Find lines deviating from target
  - Adjust syllables (add/remove words)
  - Preserve rhyme scheme
- [ ] Implement `fix_rhyme_tightness(lyrics: Lyrics, seed: int) → Lyrics`:
  - Identify weak rhymes
  - Suggest alternative endings (seed-based)
  - Adjust lines to improve rhyme
- [ ] Implement `fix_section_completeness(lyrics: Lyrics, required_sections: List[str], seed: int) → Lyrics`:
  - Add missing required sections
  - Generate content for new sections
- [ ] Implement `fix_profanity(lyrics: Lyrics, banned_terms: List[str], seed: int) → Lyrics`:
  - Find and replace banned terms
  - Keep meaning/rhyme intact where possible

**Acceptance Criteria**:
- [ ] Each fix method works independently
- [ ] Fixes preserve musical structure
- [ ] Deterministic with seed

**Effort**: 6 story points
**Duration**: 7-9 hours

---

#### 7.3: FIX Loop Management
**Story**: "As an orchestrator, I want the FIX skill to integrate with COMPOSE/VALIDATE loops"

**Assigned To**: Skill Developer #3

**Tasks**:
- [ ] Implement `should_fix(validation_report: ValidationReport) → bool`:
  - Return True if total < min_total or profanity_score > max_profanity
  - Return False if already passing
- [ ] Implement `get_most_impactful_issue(issues: List[Issue]) → Issue`:
  - Sort by impact on total score
  - Return the issue with highest impact
- [ ] Implement iteration tracking:
  - Max 3 FIX iterations
  - Track improvement per iteration (prevent infinite loops)
  - If no improvement in iteration N, stop and return best attempt
- [ ] Document loop expectations

**Acceptance Criteria**:
- [ ] Loop condition clear
- [ ] Iteration limit enforced
- [ ] Best attempt returned on no improvement

**Effort**: 3 story points
**Duration**: 3-4 hours

---

#### 7.4: FIX Skill Events, Tests & Documentation
**Story**: "As QA, I want FIX tested for targeted fixes and loop convergence"

**Assigned To**: QA Automation

**Tasks**:
- [ ] Add event emission (START, END, FAIL)
- [ ] Create `tests/skills/test_fix.py`:
  - Test each fix method independently
  - Test fix loop with multiple issues
  - Test max iteration limit
  - Test determinism: 10 runs identical
  - Test convergence: most songs pass within 3 iterations
  - Coverage ≥95%
- [ ] Write SKILL.md with fix playbook
- [ ] Document loop statistics (avg iterations to pass)

**Acceptance Criteria**:
- [ ] Tests pass
- [ ] Determinism ≥99%
- [ ] Coverage ≥95%
- [ ] Most songs converge within 3 iterations

**Effort**: 5 story points
**Duration**: 5-7 hours

---

### Phase 7 Summary

| Task | Effort | Duration | Owner |
|------|--------|----------|-------|
| 7.1: Auto-Fix Playbook | 8 pts | 9-11h | Skill Dev #3 |
| 7.2: Fix Methods | 6 pts | 7-9h | Skill Dev #3 |
| 7.3: Loop Management | 3 pts | 3-4h | Skill Dev #3 |
| 7.4: Events, Tests, Docs | 5 pts | 5-7h | QA Automation |
| **PHASE 7 TOTAL** | **22 pts** | **24-31h** | Multiple |

**Success Criteria**: FIX applies targeted improvements, ≥90% convergence within 3 iterations, ≥99% reproducibility

---

## Phase 8: REVIEW Skill

### Objective
Create the REVIEW skill that finalizes artifacts and prepares for output. Final step in workflow.

### Requirement Overview
- **Input**: All artifacts (Plan, Style, Lyrics, Producer Notes, Composed Prompt), Validation Report
- **Output**: Summary JSON with provenance, emit final event
- **Determinism**: `seed + 8`
- **Key Constraints**: Full traceability, asset persistence (S3 optional), completion event

### Deliverables

#### 8.1: REVIEW Skill Core Implementation
**Story**: "As a workflow manager, I want the REVIEW skill to finalize outputs with full provenance so that the run is complete and auditable"

**Assigned To**: Skill Developer #3

**Tasks**:
- [ ] Create `.claude/skills/amcs-review/` directory
- [ ] Implement `review_finalize(artifacts: ArtifactBundle, validation_report: ValidationReport, seed: int) → ReviewSummary`:
  - Aggregate all artifacts into single summary
  - Create provenance record: seed, timestamps, node chain
  - Calculate final metrics and scores
  - Add metadata: generation model version, decoder settings
  - Optionally persist to S3 (if feature flag enabled)
  - Return ReviewSummary with complete run info
- [ ] Generate summary JSON with nested structure

**Acceptance Criteria**:
- [ ] Output matches ReviewSummary schema
- [ ] All artifacts referenced with hashes
- [ ] Provenance complete and traceable
- [ ] Determinism: 10 runs identical

**Effort**: 6 story points
**Duration**: 7-9 hours

---

#### 8.2: Artifact Hashing & Provenance
**Story**: "As an auditor, I want all artifacts hashed and provenance recorded so that I can verify generation"

**Assigned To**: Skill Developer #3

**Tasks**:
- [ ] Implement `create_provenance_record(run_id: str, seed: int, artifacts: ArtifactBundle, timeline: List[Event]) → ProvenanceRecord`:
  - Hash each artifact: Style, Lyrics, Producer Notes, Composed Prompt
  - Record: node execution times, seed values, model versions
  - Include event log from orchestrator
  - Create manifest showing all dependencies
- [ ] Create `ProvenanceRecord` schema with full traceability
- [ ] Document provenance format

**Acceptance Criteria**:
- [ ] All artifacts hashed with SHA-256
- [ ] Provenance includes full timeline
- [ ] Reproducible from provenance record

**Effort**: 3 story points
**Duration**: 3-4 hours

---

#### 8.3: S3 Persistence (Optional)
**Story**: "As a storage manager, I want run artifacts optionally persisted to S3 so that I can retrieve them later"

**Assigned To**: Skill Developer #3 (infrastructure experience)

**Tasks**:
- [ ] Implement `persist_to_s3(run_id: str, summary: ReviewSummary) → S3Paths`:
  - Gate on `FEATURE_FLAGS.storage.s3_enabled`
  - Create S3 key structure: `runs/{run_id}/{artifact_type}.json`
  - Upload all artifacts with metadata (Content-Type, cache headers)
  - Return S3 paths for reference
- [ ] Add error handling for S3 failures (log but don't fail workflow)
- [ ] Document S3 bucket structure

**Acceptance Criteria**:
- [ ] Optional feature (flag-controlled)
- [ ] S3 failures don't crash workflow
- [ ] Paths returned for reference

**Effort**: 3 story points
**Duration**: 3-4 hours

---

#### 8.4: REVIEW Skill Events, Tests & Documentation
**Story**: "As QA, I want REVIEW tested for completeness and tested final event emission"

**Assigned To**: QA Automation

**Tasks**:
- [ ] Add event emission (START, END, FAIL)
- [ ] Create `tests/skills/test_review.py`:
  - Test summary generation with all artifacts
  - Test provenance record creation
  - Test artifact hashing (verify hashes stable)
  - Test S3 persistence (mock S3)
  - Test determinism: 10 runs identical
  - Coverage ≥95%
- [ ] Write SKILL.md with summary examples
- [ ] Document provenance record format
- [ ] Document S3 bucket layout

**Acceptance Criteria**:
- [ ] Tests pass
- [ ] Determinism ≥99%
- [ ] Coverage ≥95%
- [ ] Provenance verified

**Effort**: 4 story points
**Duration**: 4-6 hours

---

### Phase 8 Summary

| Task | Effort | Duration | Owner |
|------|--------|----------|-------|
| 8.1: Core Implementation | 6 pts | 7-9h | Skill Dev #3 |
| 8.2: Provenance | 3 pts | 3-4h | Skill Dev #3 |
| 8.3: S3 Persistence | 3 pts | 3-4h | Skill Dev #3 |
| 8.4: Events, Tests, Docs | 4 pts | 4-6h | QA Automation |
| **PHASE 8 TOTAL** | **16 pts** | **17-23h** | Multiple |

**Success Criteria**: REVIEW finalizes all artifacts, creates provenance, ≥99% reproducibility

---

## Phase 9: Full Workflow Integration Testing

### Objective
Validate that all skills work together in the full PLAN → REVIEW workflow.

### Deliverables

#### 9.1: End-to-End Workflow Tests
**Story**: "As an integration tester, I want E2E tests of PLAN→REVIEW so that the complete workflow works"

**Assigned To**: QA Automation + Integration Specialist

**Tasks**:
- [ ] Create `tests/integration/test_workflow_e2e.py`:
  - Load 10 diverse SDSs from fixtures (all genres)
  - Execute full workflow: PLAN → STYLE → LYRICS → PRODUCER → COMPOSE → VALIDATE → [FIX if needed] → REVIEW
  - Verify each output matches expected schema
  - Track event count (8-11 events expected: START/END for each node)
  - Measure total latency
  - Test with and without FIX loop
- [ ] Test data flow: each node's output matches next node's input schema
- [ ] Test event ordering: events in correct sequence

**Acceptance Criteria**:
- [ ] Full workflow executes without errors
- [ ] All outputs valid JSON
- [ ] Event count ≥7 (all nodes fire events)
- [ ] Latency ≤120s per workflow (P95)

**Effort**: 6 story points
**Duration**: 7-9 hours

---

#### 9.2: Determinism Validation (10 Runs)
**Story**: "As QA, I want determinism validated across full workflow for all 10 fixtures"

**Assigned To**: QA Automation

**Tasks**:
- [ ] Create `tests/determinism/test_full_determinism.py`:
  - For each of 10 SDSs:
    - Run workflow 10 times with same seed
    - SHA-256 hash all artifacts at each node
    - Compare hashes across runs (must be 100% identical)
    - Track any divergence
  - Generate determinism report: % reproducible per SDS
  - Target: ≥99% (at least 99 out of 100 runs identical)
- [ ] Log which runs differ (for debugging)
- [ ] Identify non-deterministic node if present

**Acceptance Criteria**:
- [ ] ≥99% reproducibility (at minimum 99/100 runs identical)
- [ ] No floating-point differences in artifacts
- [ ] Seed propagation verified end-to-end

**Effort**: 5 story points
**Duration**: 6-8 hours

---

#### 9.3: Event Stream Validation
**Story**: "As an observability engineer, I want event emission validated across full workflow"

**Assigned To**: QA Automation

**Tasks**:
- [ ] Create `tests/integration/test_event_stream.py`:
  - Mock WebSocket endpoint
  - Execute workflow and capture all events
  - Verify event count: ≥7 (one per node)
  - Verify event schema: all required fields present
  - Verify event ordering: START → ... → END (or FAIL)
  - Check timestamps: each event has valid timestamp
  - Check run_id consistency: all events reference same run_id
  - Measure event latency: <1s from emission to receipt

**Acceptance Criteria**:
- [ ] All nodes emit START and END events
- [ ] Events properly formatted (JSON schema valid)
- [ ] Event ordering correct
- [ ] Latency <1s

**Effort**: 4 story points
**Duration**: 4-6 hours

---

#### 9.4: Data Flow Integration Tests
**Story**: "As an integrator, I want data flow between skills validated so that schemas match"

**Assigned To**: Integration Specialist

**Tasks**:
- [ ] Create `tests/integration/test_data_flow.py`:
  - Test each skill pair:
    - PLAN output → STYLE input
    - PLAN output → LYRICS input
    - PLAN output → PRODUCER input
    - STYLE output → COMPOSE input
    - LYRICS output → COMPOSE input
    - PRODUCER output → COMPOSE input
    - COMPOSE output → VALIDATE input
    - VALIDATE output → FIX input
  - Verify types match, required fields present
  - Use Pydantic validation from Phase 0.2
- [ ] Create matrix of compatible pairs

**Acceptance Criteria**:
- [ ] All skill pairs compatible
- [ ] No schema mismatches
- [ ] Type validation passes

**Effort**: 3 story points
**Duration**: 3-4 hours

---

### Phase 9 Summary

| Task | Effort | Duration | Owner |
|------|--------|----------|-------|
| 9.1: E2E Workflow Tests | 6 pts | 7-9h | QA + Integration |
| 9.2: Determinism (10 runs) | 5 pts | 6-8h | QA Automation |
| 9.3: Event Stream Tests | 4 pts | 4-6h | QA Automation |
| 9.4: Data Flow Tests | 3 pts | 3-4h | Integration Spec |
| **PHASE 9 TOTAL** | **18 pts** | **20-27h** | QA + Integration |

**Success Criteria**: Full workflow executes, ≥99% determinism on 100 runs, all events emitted, no schema mismatches

---

## Phase 10: Extended Determinism & Performance Validation

### Objective
Extended testing with 50 diverse SDSs and optimization. Final acceptance gate.

### Deliverables

#### 10.1: Extended Determinism Suite (50 SDSs × 10 runs)
**Story**: "As QA, I want comprehensive determinism validation on 50 SDSs so that the workflow meets ≥99% reproducibility requirement"

**Assigned To**: QA Automation

**Tasks**:
- [ ] Generate/collect 50 diverse SDSs covering:
  - All 12 major genres (pop, rock, hip-hop, country, R&B, electronic, indie, Christmas, CCM, K-pop, Latin, Afrobeats)
  - Varying complexity: simple (4 sections) → complex (20 sections)
  - Edge cases: unusual BPM, key modulations, multiple hook strategies
- [ ] Create `tests/determinism/test_500_runs.py`:
  - For each SDS: run workflow 10 times with same seed
  - SHA-256 hash all final artifacts (composed_prompt, validation_report)
  - Compare hashes across 10 runs
  - Calculate reproducibility: % of runs with perfect hash match
  - Generate detailed report: reproducibility per genre, per complexity
- [ ] Acceptance: ≥99% of 500 runs produce identical artifacts

**Acceptance Criteria**:
- [ ] 50 diverse SDSs available
- [ ] All 500 runs complete (50 × 10)
- [ ] Determinism report shows ≥99% reproducibility
- [ ] Any failures identified and debugged

**Effort**: 8 story points
**Duration**: 10-12 hours (includes investigation)

---

#### 10.2: Performance Profiling & Optimization
**Story**: "As a performance engineer, I want the workflow optimized so that it meets latency targets"

**Assigned To**: Skill Developer Lead + QA Automation

**Tasks**:
- [ ] Profile each node:
  - Measure execution time for each node
  - Identify bottlenecks (which node takes longest?)
  - Typical breakdown: LYRICS > COMPOSE > VALIDATE > others
- [ ] Optimize top bottlenecks:
  - LYRICS: Cache common phrases, optimize retrieval
  - COMPOSE: Simplify prompt formatting
  - VALIDATE: Batch metric calculations
- [ ] Measure latency before/after:
  - P50, P95, P99 (target P95 ≤60s)
  - Memory usage per node
- [ ] Generate performance report

**Acceptance Criteria**:
- [ ] P95 latency ≤60s (Plan → Prompt)
- [ ] P50 ≤30s
- [ ] No memory leaks over 100 runs
- [ ] Optimizations documented

**Effort**: 5 story points
**Duration**: 6-8 hours

---

#### 10.3: Acceptance Gate Validation
**Story**: "As a release manager, I want all acceptance gates validated so that the workflow is production-ready"

**Assigned To**: QA Automation

**Tasks**:
- [ ] Validate Gate 1 (Skill Execution):
  - [ ] All 8 skills execute without errors
  - [ ] Full workflow PLAN → REVIEW completes
  - [ ] All artifacts generated and stored
- [ ] Validate Gate 2 (Determinism):
  - [ ] 500 runs (50 × 10) produce ≥99% identical outputs
  - [ ] Seed propagation verified end-to-end
  - [ ] No randomness detected
- [ ] Validate Gate 3 (Quality):
  - [ ] Unit test pass rate: 100%
  - [ ] Integration test pass rate: 100%
  - [ ] Code coverage: ≥80% for skill logic
  - [ ] Documentation: All skills documented
- [ ] Validate Gate 4 (Performance):
  - [ ] P95 latency ≤60s
  - [ ] P50 ≤30s
  - [ ] No memory leaks
  - [ ] Event latency <1s
- [ ] Create acceptance gate report

**Acceptance Criteria**:
- [ ] All 4 gates PASSED
- [ ] Report signed off
- [ ] Ready for production

**Effort**: 5 story points
**Duration**: 6-8 hours

---

#### 10.4: Final Documentation & Handoff
**Story**: "As a knowledge keeper, I want comprehensive documentation so that others can maintain and extend the workflow"

**Assigned To**: Skill Developers + Documentation

**Tasks**:
- [ ] Create `docs/WORKFLOW-SKILLS-GUIDE.md`:
  - Overview of all 8 skills
  - Skill contract reference (input/output schemas)
  - Determinism requirements and implementation
  - Event schema and examples
  - Troubleshooting guide
- [ ] Create `docs/DETERMINISM-CHECKLIST.md`:
  - 10-point determinism checklist
  - Common pitfalls and how to avoid
  - Testing procedures
- [ ] Create `docs/PERFORMANCE-GUIDE.md`:
  - Latency targets per node
  - Bottleneck identification
  - Optimization strategies
- [ ] Create runbook for developers extending workflow

**Acceptance Criteria**:
- [ ] All documentation complete
- [ ] Troubleshooting guide comprehensive
- [ ] Easy for new developers to understand

**Effort**: 4 story points
**Duration**: 4-6 hours

---

### Phase 10 Summary

| Task | Effort | Duration | Owner |
|------|--------|----------|-------|
| 10.1: Determinism (500 runs) | 8 pts | 10-12h | QA Automation |
| 10.2: Performance Optimization | 5 pts | 6-8h | Skill Dev Lead |
| 10.3: Acceptance Gates | 5 pts | 6-8h | QA Automation |
| 10.4: Final Documentation | 4 pts | 4-6h | Skill Devs + Docs |
| **PHASE 10 TOTAL** | **22 pts** | **26-34h** | Multiple |

**Success Criteria**: ≥99% determinism on 500 runs, P95 latency ≤60s, all gates PASSED, production-ready

---

## Summary: All Phases

### Effort by Phase

| Phase | Effort | Duration | Status |
|-------|--------|----------|--------|
| Phase 0: Infrastructure | 27 pts | 30-42h | Foundation |
| Phase 1: PLAN | 17 pts | 18-25h | Generation |
| Phase 2: STYLE | 19 pts | 20-28h | Generation |
| Phase 3: LYRICS | 38 pts | 44-54h | Generation (complex) |
| Phase 4: PRODUCER | 23 pts | 24-31h | Generation |
| Phase 5: COMPOSE | 18 pts | 19-25h | Composition |
| Phase 6: VALIDATE | 21 pts | 22-30h | Composition |
| Phase 7: FIX | 22 pts | 24-31h | Composition |
| Phase 8: REVIEW | 16 pts | 17-23h | Finalization |
| Phase 9: Integration | 18 pts | 20-27h | Testing |
| Phase 10: Determinism | 22 pts | 26-34h | Testing |
| **TOTAL** | **241 pts** | **264-350 hours** | Full Implementation |

### Timeline with Parallelization

**Ideal** (2-3 agents, 4 weeks):
- Week 1: Phase 0 (3-4 days) + Phases 1-4 in parallel
- Week 2: Phases 2-4 completion + Phases 5-6 start
- Week 3: Phases 5-7 completion + Phase 9 start
- Week 4: Phase 8 + Phase 10 (determinism & optimization)

**Total Human Effort**: ~6-7 agents × 4 weeks ≈ 240-280 hours (aligns with 241 points)

---

**End of Phase 5-10 Documentation**
**See amcs-workflow-skills-v1.md for main plan and Phase 0-4 for foundation**

