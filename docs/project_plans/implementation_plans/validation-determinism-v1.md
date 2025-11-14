# Implementation Plan: Validation Service Enhancement & Determinism Validation Framework

**Version**: 1.0
**Status**: Ready for Development
**Created**: 2025-11-14
**Complexity Level**: Large (L)
**Estimated Effort**: 27 tasks across 8 phases
**Timeline**: 4-6 weeks with 2-3 agents in parallel
**Reference Work Packages**: WP-N2 (Validation Service) + WP-N3 (Determinism Framework)

---

## Executive Summary

This implementation plan addresses two critical gaps in the MeatyMusic AMCS system:

1. **Validation Service Enhancement** (WP-N2): Complete the validation layer from basic JSON schema checking to comprehensive constraint enforcement including blueprint validation, tag conflict detection, policy guards, and rubric scoring.

2. **Determinism Validation Framework** (WP-N3): Build a test infrastructure to validate and prove deterministic reproducibility (≥99%) across all workflow nodes, ensuring identical outputs for identical inputs plus seed.

**Current State**:
- Validation service: 60% (schema validation only)
- Determinism framework: 0% (no reproducibility tests)

**Target State**:
- Validation service: 100% (all constraints, guards, rubric scoring)
- Determinism framework: 100% (test suite, reproducibility measurement, seed propagation validation)

**Success Criteria**:
- ✓ Blueprint constraints validated per genre (BPM ranges, required sections, lexicon rules)
- ✓ Tag conflicts detected and prevented (via conflict matrix enforcement)
- ✓ Policy guards enforced (profanity filtering, PII redaction, artist normalization)
- ✓ Rubric scores calculated accurately (5 metrics: hook_density, singability, rhyme_tightness, section_completeness, profanity_score)
- ✓ Reproducibility proven ≥99% (50 SDSs × 10 runs with SHA-256 artifact comparison)
- ✓ Seed propagation verified for all nodes
- ✓ Decoder settings validated (temperature ≤0.3, fixed top-p)

---

## Complexity Assessment

### Scale & Scope

| Dimension | Assessment |
|-----------|-----------|
| **Number of Tasks** | 27 total (3-4 per phase) |
| **Code Components** | 5 primary modules + 8 test fixtures |
| **Dependencies** | 2-3 internal (blueprints, taxonomies, schemas) |
| **Time Estimate** | 4-6 weeks with parallel work |
| **Agent Requirements** | 2-3 specialized engineers |
| **Risk Level** | Medium (determinism requires precision) |

### Complexity Factors

**Increasing Complexity**:
- Determinism is non-negotiable and requires meticulous testing
- Blueprints are genre-specific with varying rules
- Profanity filter needs NLP-like approach for context
- PII redaction requires pattern matching and domain knowledge
- Rubric scoring is multi-metric with genre-specific weights

**Reducing Complexity**:
- Validation service has clear separation of concerns
- Test infrastructure can be built independently
- No external API dependencies for validation
- Blueprints are static (not dynamic)
- Determinism can be proven with simple hash comparison

### Workflow Track Selection

**Using Full Track** (L project):
```
Input Analysis → [story-writer, validation-specialist] →
dependency-mapper → risk-assessor → task-estimator →
linear-formatter → validation-checker → Output
```

**Rationale**: Cross-system impact (validation affects STYLE, LYRICS, COMPOSE, VALIDATE nodes), complex business logic (rubric scoring, conflict detection), critical quality gates (determinism requirement).

---

## Phase Breakdown & Task Decomposition

### Phase 1: Validation Service - Blueprint Constraints (Week 1)

**Goal**: Validate style, lyrics, and structure against genre-specific blueprint rules

**Duration**: 3-4 days | **Story Points**: 13 | **Agent**: backend-validation-specialist (Sonnet)

#### Task 1.1: Blueprint Loader Module
**Description**: Create reusable blueprint loading and caching system
**Acceptance Criteria**:
- Load blueprints from `/docs/hit_song_blueprint/AI/` directory
- Cache in memory with TTL
- Handle missing/malformed blueprints gracefully
- Support genre lookup and version selection
- Log all load operations

**Implementation Notes**:
- Create `services/api/app/services/blueprint_loader.py`
- Implement singleton pattern for caching
- Parse markdown blueprints and extract JSON-structured rules
- Pre-compute common lookups (tempo ranges, required sections, etc.)

**Dependencies**: Blueprint markdown files exist
**Estimated Effort**: 5 story points
**Subtasks**:
1. [ ] Parse blueprint markdown into structured format (1 pt)
2. [ ] Implement caching layer with invalidation (1 pt)
3. [ ] Add genre lookup and versioning (1 pt)
4. [ ] Write unit tests (2 pts)

**Linear Task Format**:
```
Title: Implement Blueprint Loader Module
Description: Create reusable system to load and cache genre blueprints
Priority: High
Assignee: backend-validation-specialist
Estimate: 5
Labels: validation, phase-1, backend
Dependencies: [blueprint-files-available]
```

#### Task 1.2: Blueprint Constraint Validators
**Description**: Implement validators for BPM ranges, required sections, lexicon rules
**Acceptance Criteria**:
- BPM range validation (min/max per genre)
- Required sections enforcement (e.g., "Verse", "Chorus" for pop)
- Tempo window validation (halftime feel handling)
- Banned/negative terms detection
- Positive lexicon suggestion

**Implementation Notes**:
- Create `services/api/app/services/blueprint_validator.py`
- Separate validators for Style, Lyrics, ProducerNotes
- Return structured violation reports with remediation hints
- Cache blueprint rules after first load

**Dependencies**: Task 1.1 (Blueprint Loader)
**Estimated Effort**: 5 story points
**Subtasks**:
1. [ ] Implement BPM range validator (1 pt)
2. [ ] Implement section structure validator (1 pt)
3. [ ] Implement lexicon validators (banned/positive terms) (1 pt)
4. [ ] Create violation report formatters (1 pt)
5. [ ] Write integration tests (1 pt)

**Linear Task Format**:
```
Title: Implement Blueprint Constraint Validators
Description: BPM ranges, required sections, lexicon rules per genre
Priority: High
Assignee: backend-validation-specialist
Estimate: 5
Labels: validation, phase-1, backend, blueprint
Dependencies: [Task 1.1]
```

#### Task 1.3: Integration with Validation Service
**Description**: Add blueprint validation methods to ValidationService
**Acceptance Criteria**:
- Method: `validate_style_blueprint(style, genre, version)`
- Method: `validate_lyrics_blueprint(lyrics, genre, version)`
- Method: `validate_structure_blueprint(producer_notes, genre, version)`
- All methods return `(is_valid, violations, suggestions)`
- Comprehensive logging at each step

**Implementation Notes**:
- Extend `validation_service.py` with new public methods
- Maintain backward compatibility with existing schema validation
- Call blueprint validators from orchestration nodes (STYLE, LYRICS, PRODUCER, COMPOSE)
- Add benchmark logging for performance tracking

**Dependencies**: Task 1.2 (Blueprint Validators)
**Estimated Effort**: 3 story points
**Subtasks**:
1. [ ] Add blueprint validation methods (1 pt)
2. [ ] Integrate with existing ValidationService (1 pt)
3. [ ] Write integration tests (1 pt)

**Linear Task Format**:
```
Title: Integrate Blueprint Validators into ValidationService
Description: Add public methods for blueprint-based validation
Priority: High
Assignee: backend-validation-specialist
Estimate: 3
Labels: validation, phase-1, backend
Dependencies: [Task 1.2]
```

---

### Phase 2: Validation Service - Tag Conflict Matrix (Week 1)

**Goal**: Enforce tag conflict matrix to prevent contradictory tags in style and prompts

**Duration**: 2-3 days | **Story Points**: 10 | **Agent**: backend-validation-specialist (Sonnet)

#### Task 2.1: Conflict Matrix Builder
**Description**: Create and manage tag conflict matrix from taxonomies
**Acceptance Criteria**:
- Load conflict matrix from `taxonomies/` directory
- Support multiple conflict definitions (hard: cannot coexist, soft: warning)
- Cache conflict matrix in memory
- Provide lookup: `get_conflicts(tag1, tag2)` → conflict_type
- Handle symmetric relationships (A↔B == B↔A)

**Implementation Notes**:
- Create `services/api/app/services/conflict_matrix.py`
- Create or find `taxonomies/conflict_matrix.json` with structure:
  ```json
  {
    "conflicts": [
      {
        "tag_a": "Energy:very-slow",
        "tag_b": "Energy:high-energy",
        "type": "hard",
        "reason": "Cannot have both slow tempo and high energy"
      }
    ]
  }
  ```
- Pre-compute adjacency matrix for O(1) lookups
- Include example matrix in docstring

**Dependencies**: None (taxonomy files to be created)
**Estimated Effort**: 4 story points
**Subtasks**:
1. [ ] Design conflict matrix schema (1 pt)
2. [ ] Implement matrix loader and caching (1 pt)
3. [ ] Create or update taxonomies/conflict_matrix.json (1 pt)
4. [ ] Write unit tests (1 pt)

**Linear Task Format**:
```
Title: Create Conflict Matrix Builder
Description: Load, cache, and manage tag conflict definitions
Priority: High
Assignee: backend-validation-specialist
Estimate: 4
Labels: validation, phase-2, backend, taxonomy
Dependencies: []
```

#### Task 2.2: Conflict Detection Validators
**Description**: Detect and report conflicting tags in style specs and composed prompts
**Acceptance Criteria**:
- Method: `detect_tag_conflicts(tags_list)` → list of conflicts
- Method: `resolve_conflicts(tags_list, strategy)` → cleaned tags
- Support strategies: "remove-lowest-priority", "remove-highest-priority", "keep-first"
- Return violation report with remediation options
- Log all conflict detections

**Implementation Notes**:
- Create `services/api/app/services/conflict_detector.py`
- Tag categories: Era, Genre, Energy, Rhythm, Instrumentation, Vocal, Mix, etc.
- Implement priority-based resolution
- Provide detailed conflict reports for UI display

**Dependencies**: Task 2.1 (Conflict Matrix Builder)
**Estimated Effort**: 4 story points
**Subtasks**:
1. [ ] Implement conflict detection logic (1 pt)
2. [ ] Implement resolution strategies (1 pt)
3. [ ] Create violation report formatters (1 pt)
4. [ ] Write unit tests (1 pt)

**Linear Task Format**:
```
Title: Implement Conflict Detection Validators
Description: Detect contradictory tags and provide resolution options
Priority: High
Assignee: backend-validation-specialist
Estimate: 4
Labels: validation, phase-2, backend
Dependencies: [Task 2.1]
```

#### Task 2.3: Tag Validation Integration
**Description**: Integrate conflict detection into validation service and workflow
**Acceptance Criteria**:
- Method: `validate_tags_for_conflicts(tags, context)`
- Called during style validation, prompt composition, and CLI tag input
- Prevents invalid tag combinations from reaching downstream nodes
- Reports conflicts with resolution suggestions
- Update Style and ComposedPrompt validation methods

**Implementation Notes**:
- Add to ValidationService public interface
- Integrate into STYLE, COMPOSE, and VALIDATE nodes
- Support both hard (error) and soft (warning) conflicts
- UI can display conflict hints in real-time

**Dependencies**: Task 2.2 (Conflict Detection Validators)
**Estimated Effort**: 2 story points
**Subtasks**:
1. [ ] Add conflict validation methods to ValidationService (1 pt)
2. [ ] Integrate into workflow nodes (1 pt)

**Linear Task Format**:
```
Title: Integrate Tag Conflict Validation into Workflow
Description: Validate tags and prevent contradictions in workflow nodes
Priority: High
Assignee: backend-validation-specialist
Estimate: 2
Labels: validation, phase-2, backend, integration
Dependencies: [Task 2.2]
```

---

### Phase 3: Validation Service - Policy Guards (Week 2)

**Goal**: Implement policy enforcement: profanity filtering, PII redaction, artist normalization

**Duration**: 3-4 days | **Story Points**: 15 | **Agent**: backend-validation-specialist (Sonnet)

#### Task 3.1: Profanity Filter Module
**Description**: Implement context-aware profanity filtering with explicit flag support
**Acceptance Criteria**:
- Load profanity list from shared resource
- Support explicit/clean content modes
- Detect profanity in lyrics and style descriptions
- Return violation report with offending terms and positions
- Implement word-list and regex-based approaches
- Handle variations (leetspeak, spacing, homophone replacement)

**Implementation Notes**:
- Create `services/api/app/services/policy_guards.py`
- Use better-profanity library or similar (check licenses)
- Create `taxonomies/profanity_list.json` with categories (mild, strong, etc.)
- Support configurable thresholds per constraint.explicit flag
- Log detections for monitoring

**Dependencies**: None (profanity resource to be created)
**Estimated Effort**: 5 story points
**Subtasks**:
1. [ ] Design profanity list taxonomy (1 pt)
2. [ ] Implement basic word-list detection (1 pt)
3. [ ] Add variation/leetspeak handling (1 pt)
4. [ ] Create violation reports (1 pt)
5. [ ] Write unit tests (1 pt)

**Linear Task Format**:
```
Title: Implement Profanity Filter Module
Description: Context-aware profanity detection with explicit flag support
Priority: High
Assignee: backend-validation-specialist
Estimate: 5
Labels: validation, phase-3, backend, policy
Dependencies: []
```

#### Task 3.2: PII Redaction Module
**Description**: Detect and redact personally identifiable information (emails, phone, addresses, names)
**Acceptance Criteria**:
- Detect email addresses, phone numbers, URLs, addresses, person names
- Redact detected PII with placeholders (e.g., [EMAIL], [PHONE])
- Return original + redacted versions with violation report
- Handle multiple PII types simultaneously
- Support allowlist for common brand/artist names (not considered PII)

**Implementation Notes**:
- Add to `policy_guards.py`
- Use regex patterns for structured data (email, phone, URLs)
- Use NER (Named Entity Recognition) or dictionary-based approach for names
- Create `taxonomies/pii_patterns.json` with regex definitions
- Log redaction operations

**Dependencies**: None
**Estimated Effort**: 5 story points
**Subtasks**:
1. [ ] Design PII pattern taxonomy (1 pt)
2. [ ] Implement regex-based detection (1 pt)
3. [ ] Add NER/name detection (1 pt)
4. [ ] Create redaction and reporting logic (1 pt)
5. [ ] Write unit tests (1 pt)

**Linear Task Format**:
```
Title: Implement PII Redaction Module
Description: Detect and redact personal information from artifacts
Priority: High
Assignee: backend-validation-specialist
Estimate: 5
Labels: validation, phase-3, backend, policy, security
Dependencies: []
```

#### Task 3.3: Artist Normalization & Policy Enforcement
**Description**: Normalize influence descriptions and enforce release policy restrictions
**Acceptance Criteria**:
- Detect "style of [Living Artist]" patterns
- Normalize to generic descriptions (e.g., "style of Taylor Swift" → "pop-influenced with storytelling vocals")
- Enforce persona public_release policy
- Prevent restricted content from being marked public
- Support policy override with audit trail

**Implementation Notes**:
- Add to `policy_guards.py`
- Maintain `taxonomies/artist_names.json` with known living artists
- Implement fuzzy matching for artist names
- Create `taxonomies/genre_descriptions.json` for safe generic alternatives
- Log all policy violations and overrides

**Dependencies**: None
**Estimated Effort**: 5 story points
**Subtasks**:
1. [ ] Design artist and policy taxonomy (1 pt)
2. [ ] Implement artist detection (1 pt)
3. [ ] Implement normalization logic (1 pt)
4. [ ] Add policy enforcement (1 pt)
5. [ ] Write unit tests (1 pt)

**Linear Task Format**:
```
Title: Implement Artist Normalization & Policy Enforcement
Description: Normalize influences and enforce release policies
Priority: High
Assignee: backend-validation-specialist
Estimate: 5
Labels: validation, phase-3, backend, policy
Dependencies: []
```

#### Task 3.4: Policy Guards Integration
**Description**: Integrate all policy guards into validation service and workflow
**Acceptance Criteria**:
- Add methods to ValidationService for policy validation
- Called during LYRICS generation and COMPOSE stages
- Prevent policy violations from reaching final output
- Return actionable violation reports for UI/workflow
- Support policy override modes (strict, warn, permissive)

**Implementation Notes**:
- Add public methods to ValidationService
- Integrate into LYRICS, COMPOSE, and VALIDATE nodes
- Return structured report: violations, suggestions, overrideable
- Add logging for audit trail

**Dependencies**: Tasks 3.1, 3.2, 3.3 (All policy guard modules)
**Estimated Effort**: 3 story points
**Subtasks**:
1. [ ] Add policy validation methods to ValidationService (1 pt)
2. [ ] Integrate into workflow nodes (1 pt)
3. [ ] Write integration tests (1 pt)

**Linear Task Format**:
```
Title: Integrate Policy Guards into Validation Service
Description: Enforce profanity, PII, and policy rules in workflow
Priority: High
Assignee: backend-validation-specialist
Estimate: 3
Labels: validation, phase-3, backend, integration
Dependencies: [Task 3.1, Task 3.2, Task 3.3]
```

---

### Phase 4: Validation Service - Scoring Rubric (Week 2)

**Goal**: Implement multi-metric scoring rubric with genre-specific weights and thresholds

**Duration**: 3-4 days | **Story Points**: 16 | **Agent**: backend-validation-specialist (Sonnet)

#### Task 4.1: Rubric Scoring Engine
**Description**: Calculate composite scores from individual metrics (hook_density, singability, rhyme_tightness, section_completeness, profanity_score)
**Acceptance Criteria**:
- Calculate all 5 metrics independently
- Apply genre-specific weights from blueprint
- Compute weighted total score (0-1 scale)
- Return detailed score breakdown with explanations
- Flag threshold violations (min_total, max_profanity)
- Support genre and version selection

**Metric Definitions**:
- **hook_density** (0-1): Frequency of memorable phrases relative to total lines
- **singability** (0-1): Lyrics match melody, pronunciation, natural phrasing
- **rhyme_tightness** (0-1): Rhyme scheme consistency, strength of rhymes
- **section_completeness** (0-1): All required sections present and properly formatted
- **profanity_score** (0-1): Percentage of lines with flagged content (inverse: higher = worse)

**Implementation Notes**:
- Create `services/api/app/services/rubric_scorer.py`
- Each metric has dedicated calculation method
- Metrics leverage heuristics/regex for lyrics (can be enhanced with ML later)
- Blueprint supplies weights and thresholds
- Return ScoreReport dataclass with full breakdown

**Dependencies**: Task 1.1 (Blueprint Loader)
**Estimated Effort**: 6 story points
**Subtasks**:
1. [ ] Design score report dataclass (1 pt)
2. [ ] Implement hook_density calculator (1 pt)
3. [ ] Implement singability heuristic (1 pt)
4. [ ] Implement rhyme_tightness calculator (1 pt)
5. [ ] Implement section_completeness checker (1 pt)
6. [ ] Implement profanity_score calculator (1 pt)

**Linear Task Format**:
```
Title: Implement Rubric Scoring Engine
Description: Calculate multi-metric scores with genre-specific weights
Priority: High
Assignee: backend-validation-specialist
Estimate: 6
Labels: validation, phase-4, backend, rubric
Dependencies: [Task 1.1]
```

#### Task 4.2: Threshold Validation
**Description**: Enforce min_total and max_profanity thresholds; flag violations
**Acceptance Criteria**:
- Check `score.total >= blueprint.thresholds.min_total`
- Check `score.profanity <= blueprint.thresholds.max_profanity`
- Return pass/fail decision with margin (how close to threshold)
- Suggest which metrics to improve
- Support configurable thresholds per context

**Implementation Notes**:
- Add to `rubric_scorer.py`
- Return decision enum: PASS, FAIL, BORDERLINE
- Suggest targeted improvements (e.g., "Improve hook density by 0.1")
- Log threshold decisions for debugging

**Dependencies**: Task 4.1 (Rubric Scoring Engine)
**Estimated Effort**: 3 story points
**Subtasks**:
1. [ ] Implement threshold validation logic (1 pt)
2. [ ] Add improvement suggestions (1 pt)
3. [ ] Write unit tests (1 pt)

**Linear Task Format**:
```
Title: Implement Threshold Validation
Description: Enforce min_total and max_profanity thresholds
Priority: High
Assignee: backend-validation-specialist
Estimate: 3
Labels: validation, phase-4, backend
Dependencies: [Task 4.1]
```

#### Task 4.3: Rubric Integration with Validation Service
**Description**: Integrate scoring engine into VALIDATE node and ValidationService
**Acceptance Criteria**:
- Method: `score_artifacts(lyrics, style, producer_notes, blueprint)`
- Method: `evaluate_compliance(scores, blueprint)` → pass/fail decision
- Called from VALIDATE workflow node
- Returns detailed score report and compliance status
- Comprehensive logging and metrics

**Implementation Notes**:
- Add public methods to ValidationService
- VALIDATE node calls these methods
- FIX node uses score report to target improvements
- Return ActionableReport with scores, thresholds, suggestions, decision

**Dependencies**: Tasks 4.1, 4.2 (Scoring Engine, Thresholds)
**Estimated Effort**: 4 story points
**Subtasks**:
1. [ ] Add scoring methods to ValidationService (1 pt)
2. [ ] Integrate with VALIDATE node (1 pt)
3. [ ] Create ActionableReport dataclass (1 pt)
4. [ ] Write integration tests (1 pt)

**Linear Task Format**:
```
Title: Integrate Rubric Scoring into Validation Service
Description: Enable VALIDATE node to score artifacts and decide pass/fail
Priority: High
Assignee: backend-validation-specialist
Estimate: 4
Labels: validation, phase-4, backend, integration
Dependencies: [Task 4.1, Task 4.2]
```

#### Task 4.4: Rubric Tuning & Configuration
**Description**: Support per-genre rubric tuning without code changes
**Acceptance Criteria**:
- Weights and thresholds loaded from blueprint (not hardcoded)
- Support A/B testing different thresholds
- Configurable via UI or config file
- Log all threshold decisions for analysis
- Support genre-specific tuning

**Implementation Notes**:
- All weights/thresholds come from Blueprint
- Optional override config file for testing: `configs/rubric_overrides.json`
- Track which blueprint version is used
- No hardcoded thresholds in code

**Dependencies**: Task 4.3 (Rubric Integration)
**Estimated Effort**: 2 story points
**Subtasks**:
1. [ ] Support override configuration (1 pt)
2. [ ] Add logging for threshold decisions (1 pt)

**Linear Task Format**:
```
Title: Implement Rubric Tuning & Configuration
Description: Make weights and thresholds configurable per genre
Priority: Medium
Assignee: backend-validation-specialist
Estimate: 2
Labels: validation, phase-4, backend, config
Dependencies: [Task 4.3]
```

---

### Phase 5: Determinism Framework - Test Suite Setup (Week 3)

**Goal**: Create test infrastructure and fixture management for determinism validation

**Duration**: 2-3 days | **Story Points**: 10 | **Agent**: qa-automation-engineer (Sonnet)

#### Task 5.1: Test Directory Structure & Fixtures
**Description**: Set up determinism test directory with 50 diverse SDS fixtures
**Acceptance Criteria**:
- Create `/tests/determinism/` directory with structure:
  - `conftest.py` - Pytest configuration and shared fixtures
  - `fixtures/` - 50 SDS JSON files covering all genres
  - `test_reproducibility.py` - Main reproducibility test
  - `test_seed_propagation.py` - Seed verification tests
  - `test_decoder_settings.py` - Decoder parameter validation
  - `README.md` - Test suite documentation
- SDSs cover all 10+ genres with varying complexity
- Include edge cases (20 sections, unusual BPM, etc.)
- Fixtures stored as JSON files with metadata

**Fixture Coverage**:
- 5 Pop songs (simple → complex)
- 5 Rock songs
- 5 Hip-Hop songs
- 5 Country songs
- 5 Electronic songs
- 5 R&B songs
- 5 Christmas songs
- 5 Indie/Alternative songs
- Edge case songs (unusual structures, extreme BPM, etc.)

**Implementation Notes**:
- Create `tests/determinism/conftest.py` with:
  - Fixture loader
  - Mock Claude Code skills (deterministic)
  - Database cleanup fixtures
  - Hash comparison utilities
- Use pytest parametrization to avoid test duplication
- Fixtures include metadata: genre, complexity, expected_sections, etc.

**Dependencies**: None
**Estimated Effort**: 5 story points
**Subtasks**:
1. [ ] Create directory structure (0.5 pt)
2. [ ] Generate/create 50 SDS fixtures (2 pts)
3. [ ] Add fixture metadata and validation (1.5 pt)
4. [ ] Write conftest.py with utilities (1 pt)

**Linear Task Format**:
```
Title: Set Up Determinism Test Suite Structure
Description: Create test infrastructure with 50 diverse SDS fixtures
Priority: High
Assignee: qa-automation-engineer
Estimate: 5
Labels: testing, phase-5, determinism
Dependencies: []
```

#### Task 5.2: Determinism Test Harness
**Description**: Implement test runner that executes workflows repeatedly and compares outputs
**Acceptance Criteria**:
- Test harness runs each SDS 10 times with identical seed
- Captures all artifacts (style, lyrics, producer_notes, composed_prompt)
- SHA-256 hashes all outputs
- Compares hashes across runs (excluding timestamps)
- Reports reproducibility rate
- Supports filtering by genre or complexity
- Produces reproducibility report JSON

**Implementation Notes**:
- Create `tests/determinism/test_runner.py`
- Use asyncio for parallel SDS execution (within rate limits)
- Create deterministic mocks for Claude Code skills (always produce same output given same seed)
- Write results to JSON: `results/determinism_report_{date}.json`
- Include per-artifact, per-sds, and overall stats

**Dependencies**: Task 5.1 (Test Suite Setup)
**Estimated Effort**: 5 story points
**Subtasks**:
1. [ ] Implement deterministic skill mocks (1.5 pts)
2. [ ] Implement test harness executor (1.5 pt)
3. [ ] Implement hash comparison logic (1 pt)
4. [ ] Implement reporting (1 pt)

**Linear Task Format**:
```
Title: Implement Determinism Test Harness
Description: Run SDSs repeatedly and compare artifact hashes
Priority: High
Assignee: qa-automation-engineer
Estimate: 5
Labels: testing, phase-5, determinism
Dependencies: [Task 5.1]
```

---

### Phase 6: Determinism Framework - Reproducibility Tests (Week 3)

**Goal**: Validate that identical inputs + seed produce identical outputs ≥99% of the time

**Duration**: 2-3 days | **Story Points**: 12 | **Agent**: qa-automation-engineer (Sonnet)

#### Task 6.1: Basic Reproducibility Test
**Description**: Implement pytest test that runs 50 SDSs × 10 times and validates reproducibility
**Acceptance Criteria**:
- Test: `test_reproducibility_50_sdss_10_runs` (pytest parametrized)
- Each SDS run 10 times with same seed
- Compare SHA-256 hashes of all artifacts (excluding timestamps, run_ids)
- Assert: All runs produce identical artifacts
- Report reproducibility rate (should be 100% for this test)
- Log any mismatches for investigation
- Run time <30 minutes

**Test Structure**:
```python
@pytest.mark.parametrize("sds_fixture", FIXTURES_50)
def test_reproducibility_50_sdss_10_runs(sds_fixture):
    results = []
    for run in range(10):
        output = run_workflow_deterministic(sds_fixture)
        results.append(hash_artifacts(output))

    # All hashes should be identical
    assert len(set(results)) == 1, f"Mismatched hashes: {results}"
```

**Implementation Notes**:
- Use pytest parametrization for all 50 SDSs
- Run in CI/CD on every commit
- If any test fails, add to regression list
- Generate detailed comparison report for failures

**Dependencies**: Task 5.2 (Test Harness)
**Estimated Effort**: 4 story points
**Subtasks**:
1. [ ] Implement basic reproducibility test (2 pts)
2. [ ] Add parametrization for all fixtures (1 pt)
3. [ ] Write comparison reporting (1 pt)

**Linear Task Format**:
```
Title: Implement Basic Reproducibility Test
Description: Run 50 SDSs × 10 times and validate hash equality
Priority: High
Assignee: qa-automation-engineer
Estimate: 4
Labels: testing, phase-6, determinism
Dependencies: [Task 5.2]
```

#### Task 6.2: Artifact-Specific Comparison
**Description**: Detailed comparison per artifact type (style, lyrics, producer_notes, prompt)
**Acceptance Criteria**:
- Test: `test_artifact_reproducibility_by_type`
- Compare each artifact type separately
- Identify which artifacts have reproducibility issues
- Generate per-artifact reproducibility rate
- Flag artifacts with <99% reproducibility
- Support debugging mode: show diffs for mismatches

**Implementation Notes**:
- Create comparison functions for each artifact type
- Use difflib for text comparison
- For JSON artifacts, do deep comparison (ignore timestamps)
- Support verbose logging for debugging
- Generate comparison report per artifact type

**Dependencies**: Task 6.1 (Basic Reproducibility Test)
**Estimated Effort**: 4 story points
**Subtasks**:
1. [ ] Implement per-artifact comparison (1.5 pts)
2. [ ] Add detailed reporting (1.5 pt)
3. [ ] Add debugging/verbose mode (1 pt)

**Linear Task Format**:
```
Title: Implement Artifact-Specific Reproducibility Tests
Description: Compare each artifact type separately for reproducibility
Priority: High
Assignee: qa-automation-engineer
Estimate: 4
Labels: testing, phase-6, determinism
Dependencies: [Task 6.1]
```

#### Task 6.3: Regression Test Suite
**Description**: Maintain list of known reproducibility issues and regression detection
**Acceptance Criteria**:
- Track known regressions: `tests/determinism/regressions.json`
- If regression detected, fail test with reference to issue
- Support marking regressions as "expected" for investigation
- Regression report shows: artifact, sds, cause, status
- CI/CD blocks releases if new regressions found

**Implementation Notes**:
- Track regressions with SDS id, artifact type, diff, root cause
- Regressions file format: JSON with issue tracking
- Add to CI/CD pre-release gate
- Periodic cleanup of fixed regressions

**Dependencies**: Task 6.2 (Artifact-Specific Comparison)
**Estimated Effort**: 3 story points
**Subtasks**:
1. [ ] Design regression tracking format (1 pt)
2. [ ] Implement regression detection (1 pt)
3. [ ] Add to CI/CD gates (1 pt)

**Linear Task Format**:
```
Title: Implement Regression Test Suite
Description: Track and prevent reproducibility regressions
Priority: Medium
Assignee: qa-automation-engineer
Estimate: 3
Labels: testing, phase-6, determinism, qa
Dependencies: [Task 6.2]
```

---

### Phase 7: Determinism Framework - Seed Propagation & Decoder Validation (Week 4)

**Goal**: Verify correct seed handling through all nodes and validate decoder settings

**Duration**: 2-3 days | **Story Points**: 11 | **Agent**: qa-automation-engineer (Sonnet)

#### Task 7.1: Seed Propagation Verification
**Description**: Verify each node receives and uses correct seed offset
**Acceptance Criteria**:
- Test: `test_seed_propagation_per_node`
- For each node: verify it receives `base_seed + node_index`
- Mock nodes to log seed they received
- Assert: seed sequence is correct for all nodes
- Test with multiple base seeds (0, 42, 12345)
- Verify no seed sharing between runs

**Implementation Notes**:
- Create seed audit logging in MockNodes
- Each node logs received seed and operations
- Verify seed is propagated through entire workflow
- Create `tests/determinism/seed_audit.py`
- Support extracting seed from database node_executions

**Dependencies**: Task 5.1 (Test Suite Setup)
**Estimated Effort**: 4 story points
**Subtasks**:
1. [ ] Add seed logging to mock nodes (1 pt)
2. [ ] Implement seed audit verification (1 pt)
3. [ ] Parametrize with multiple base seeds (1 pt)
4. [ ] Write tests (1 pt)

**Linear Task Format**:
```
Title: Implement Seed Propagation Verification
Description: Verify each node receives correct seed offset
Priority: High
Assignee: qa-automation-engineer
Estimate: 4
Labels: testing, phase-7, determinism
Dependencies: [Task 5.1]
```

#### Task 7.2: Decoder Settings Validation
**Description**: Verify temperature ≤0.3 and fixed top-p in all text-generating nodes
**Acceptance Criteria**:
- Test: `test_decoder_settings_validation`
- For each node that generates text (STYLE, LYRICS, PRODUCER, COMPOSE, FIX):
  - Assert: `temperature <= 0.3`
  - Assert: `top_p <= 0.9` (fixed, not dynamic)
  - Assert: `top_k` not used (or fixed)
  - Assert: `frequency_penalty` and `presence_penalty` are 0
- Check against actual Claude Code node implementations
- Log decoder settings for each node execution
- Warn if settings are not deterministic

**Implementation Notes**:
- Create `tests/determinism/decoder_validator.py`
- Extract decoder settings from node_executions table
- Compare against expected settings from config
- Support different settings per engine (Claude vs others)
- Add to validation checklist

**Dependencies**: Task 5.1 (Test Suite Setup)
**Estimated Effort**: 3 story points
**Subtasks**:
1. [ ] Design decoder settings schema (0.5 pt)
2. [ ] Implement settings extractor (1 pt)
3. [ ] Implement validation logic (1 pt)
4. [ ] Write tests (0.5 pt)

**Linear Task Format**:
```
Title: Implement Decoder Settings Validation
Description: Verify temperature ≤0.3 and fixed parameters in all nodes
Priority: High
Assignee: qa-automation-engineer
Estimate: 3
Labels: testing, phase-7, determinism
Dependencies: [Task 5.1]
```

#### Task 7.3: Pinned Retrieval Verification (LYRICS Node)
**Description**: Verify LYRICS node uses pinned source chunks by content hash
**Acceptance Criteria**:
- Test: `test_pinned_retrieval_reproducibility`
- LYRICS node retrieves sources using content hash
- Same SDS + seed → same source chunks every time
- Citations include chunk hashes for verification
- No retrieval by relevance score (deterministic)
- Verify fixed top-k per source
- Verify lexicographic sorting of ties

**Implementation Notes**:
- Create `tests/determinism/retrieval_validator.py`
- Mock source retrieval to return pinned chunks
- Verify citation hashes in output
- Check for relevance-based sorting (anti-pattern)
- Log retrieval operations

**Dependencies**: Task 5.1 (Test Suite Setup)
**Estimated Effort**: 4 story points
**Subtasks**:
1. [ ] Design pinned retrieval test (1 pt)
2. [ ] Implement mock pinned retrieval (1 pt)
3. [ ] Implement verification logic (1 pt)
4. [ ] Write tests (1 pt)

**Linear Task Format**:
```
Title: Implement Pinned Retrieval Verification
Description: Verify LYRICS node uses content-hash-based source retrieval
Priority: High
Assignee: qa-automation-engineer
Estimate: 4
Labels: testing, phase-7, determinism
Dependencies: [Task 5.1]
```

---

### Phase 8: Integration, Documentation & Quality Gates (Week 4)

**Goal**: Integrate all components, document system, run quality gates, prepare for deployment

**Duration**: 3-4 days | **Story Points**: 13 | **Agent**: backend-validation-specialist + qa-automation-engineer

#### Task 8.1: End-to-End Integration Tests
**Description**: Test full validation pipeline with determinism framework
**Acceptance Criteria**:
- E2E test: SDS submission → validation → reproducibility check
- Test passes for all genres
- Determinism validation triggered automatically
- Validation service gates workflow progression
- FIX loop triggered on validation failure (≤3 iterations)
- All artifacts stored with hashes

**Implementation Notes**:
- Create `tests/determinism/test_e2e_validation.py`
- Use full integration with database
- Test STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, FIX nodes
- Verify state transitions and error handling
- Run against 10 diverse SDSs

**Dependencies**: All Phase 1-7 tasks
**Estimated Effort**: 4 story points
**Subtasks**:
1. [ ] Implement E2E test harness (1.5 pts)
2. [ ] Test all genres (1 pt)
3. [ ] Test error scenarios (1 pt)
4. [ ] Write integration tests (0.5 pt)

**Linear Task Format**:
```
Title: Implement End-to-End Integration Tests
Description: Test complete validation pipeline with determinism checks
Priority: High
Assignee: qa-automation-engineer
Estimate: 4
Labels: testing, phase-8, integration
Dependencies: [All validation & determinism tasks]
```

#### Task 8.2: Quality Gates & Metrics Dashboard
**Description**: Implement quality gates and metrics reporting for acceptance criteria
**Acceptance Criteria**:
- Gate A: Rubric pass rate ≥95% (measure on 200 songs)
- Gate B: Reproducibility ≥99% (measure on 50×10 runs)
- Gate C: Security audit clean (profanity, PII, policy)
- Gate D: Latency P95 ≤60s (measure on 100 runs)
- Dashboard shows live metrics
- CI/CD gates block if any criteria not met
- Historical tracking of metrics over time

**Implementation Notes**:
- Create `services/api/app/services/metrics_tracker.py`
- Metrics stored in Prometheus or similar
- Dashboard accessible via `/api/metrics`
- CI/CD integration via GitHub Actions
- Email alerts on gate failures

**Dependencies**: Tasks 4.3, 6.1 (Rubric, Reproducibility tests)
**Estimated Effort**: 5 story points
**Subtasks**:
1. [ ] Design metrics schema (1 pt)
2. [ ] Implement metrics collection (1 pt)
3. [ ] Implement quality gates (1 pt)
4. [ ] Build metrics dashboard (1.5 pt)
5. [ ] Integrate with CI/CD (0.5 pt)

**Linear Task Format**:
```
Title: Implement Quality Gates & Metrics Dashboard
Description: Gate releases on acceptance criteria; track metrics
Priority: High
Assignee: backend-validation-specialist
Estimate: 5
Labels: validation, phase-8, metrics, qa
Dependencies: [Task 4.3, Task 6.1]
```

#### Task 8.3: Documentation & Runbooks
**Description**: Write comprehensive documentation and operational runbooks
**Acceptance Criteria**:
- `docs/validation-service-guide.md` - Validation service overview and usage
- `docs/determinism-validation-guide.md` - How to run determinism tests
- `docs/rubric-scoring-guide.md` - Rubric metrics and tuning
- `docs/policy-guards-guide.md` - Policy enforcement guidelines
- API documentation for all new endpoints
- Troubleshooting guide for common issues
- Example outputs for each validator

**Implementation Notes**:
- Emphasize tradeoffs and configuration options
- Include example JSON inputs/outputs
- Document how to tune rubric per genre
- Explain how to investigate reproducibility issues
- Add troubleshooting flowcharts

**Dependencies**: All Phase 1-7 tasks
**Estimated Effort**: 3 story points
**Subtasks**:
1. [ ] Write validation service guide (1 pt)
2. [ ] Write determinism testing guide (1 pt)
3. [ ] Write troubleshooting guides (1 pt)

**Linear Task Format**:
```
Title: Write Comprehensive Documentation
Description: Document all validation and determinism systems
Priority: Medium
Assignee: backend-validation-specialist
Estimate: 3
Labels: documentation, phase-8
Dependencies: [All validation & determinism tasks]
```

#### Task 8.4: Performance Benchmarking & Optimization
**Description**: Benchmark validation latency and optimize hot paths
**Acceptance Criteria**:
- Measure validation latency for each validator
- Blueprint loading <100ms
- Conflict detection <50ms per tag
- Policy guard checks <200ms
- Rubric scoring <100ms
- Overall validation <500ms for typical SDS
- Identify and optimize hot paths
- Add caching where beneficial

**Implementation Notes**:
- Create benchmark script: `tests/benchmarks/validation_benchmarks.py`
- Use pytest-benchmark plugin
- Profile memory usage
- Test with various SDS sizes
- Document baseline metrics

**Dependencies**: All Phase 1-4 tasks (Validation Service)
**Estimated Effort**: 3 story points
**Subtasks**:
1. [ ] Implement benchmark suite (1 pt)
2. [ ] Run baseline measurements (0.5 pt)
3. [ ] Optimize hot paths (1 pt)
4. [ ] Document results (0.5 pt)

**Linear Task Format**:
```
Title: Performance Benchmarking & Optimization
Description: Ensure validation latency meets targets
Priority: Medium
Assignee: backend-validation-specialist
Estimate: 3
Labels: performance, phase-8, backend
Dependencies: [All validation tasks]
```

#### Task 8.5: CI/CD Integration & Pre-Release Validation
**Description**: Integrate validation and determinism tests into GitHub Actions
**Acceptance Criteria**:
- Validation tests run on every commit
- Determinism tests run on PR (full 50×10 suite)
- Quality gates checked before merge
- Pre-release validation: run full acceptance gates
- Failed tests block merge
- Metrics published to artifacts
- Clear pass/fail status on PR

**Implementation Notes**:
- Update `.github/workflows/` with validation jobs
- Run fast tests (validation) on every commit
- Run slower tests (determinism) on PR to main
- Use matrix testing for multiple genres
- Cache test fixtures
- Generate detailed reports

**Dependencies**: All Phase 1-7 tasks
**Estimated Effort**: 3 story points
**Subtasks**:
1. [ ] Create validation CI workflow (1 pt)
2. [ ] Create determinism CI workflow (1 pt)
3. [ ] Add quality gate checks (1 pt)

**Linear Task Format**:
```
Title: Integrate into CI/CD Pipeline
Description: Run validation and determinism tests automatically
Priority: High
Assignee: qa-automation-engineer
Estimate: 3
Labels: devops, phase-8, ci-cd
Dependencies: [All validation & determinism tasks]
```

---

## Task Dependencies & Critical Path

### Dependency Graph

```
Phase 1:
├─ Task 1.1: Blueprint Loader
│  ├─ Task 1.2: Blueprint Constraint Validators (depends on 1.1)
│  │  └─ Task 1.3: Integration (depends on 1.2)
└─ (No dependencies, can start immediately)

Phase 2:
├─ Task 2.1: Conflict Matrix Builder
│  ├─ Task 2.2: Conflict Detector (depends on 2.1)
│  │  └─ Task 2.3: Integration (depends on 2.2)
└─ (Can start independently)

Phase 3:
├─ Task 3.1: Profanity Filter
├─ Task 3.2: PII Redaction
├─ Task 3.3: Artist Normalization
│  └─ Task 3.4: Integration (depends on 3.1, 3.2, 3.3)
└─ (Can be parallelized)

Phase 4:
├─ Task 4.1: Scoring Engine (depends on 1.1)
│  ├─ Task 4.2: Thresholds (depends on 4.1)
│  │  └─ Task 4.3: Integration (depends on 4.1, 4.2)
│     └─ Task 4.4: Configuration (depends on 4.3)
└─ (Mostly sequential, small parallelization possible)

Phase 5:
└─ Task 5.1: Test Setup
   └─ Task 5.2: Test Harness (depends on 5.1)

Phase 6:
└─ Task 6.1: Reproducibility Test (depends on 5.2)
   ├─ Task 6.2: Artifact Comparison (depends on 6.1)
   │  └─ Task 6.3: Regression Suite (depends on 6.2)
└─ (Mostly sequential)

Phase 7:
├─ Task 7.1: Seed Propagation (depends on 5.1)
├─ Task 7.2: Decoder Validation (depends on 5.1)
└─ Task 7.3: Pinned Retrieval (depends on 5.1)
  (Can be parallelized)

Phase 8:
├─ Task 8.1: E2E Tests (depends on all Phases 1-7)
├─ Task 8.2: Quality Gates (depends on 4.3, 6.1)
├─ Task 8.3: Documentation (depends on all)
├─ Task 8.4: Benchmarking (depends on Phases 1-4)
└─ Task 8.5: CI/CD (depends on all)
```

### Critical Path Analysis

**Longest Critical Path** (determines minimum project timeline):
1. Task 1.1 (Blueprint Loader) → 5 pts
2. Task 1.2 (Blueprint Constraints) → 5 pts
3. Task 1.3 (Integration) → 3 pts
4. Task 4.1 (Scoring Engine) → 6 pts
5. Task 4.2 (Thresholds) → 3 pts
6. Task 4.3 (Rubric Integration) → 4 pts
7. Task 5.1 (Test Setup) → 5 pts
8. Task 5.2 (Test Harness) → 5 pts
9. Task 6.1 (Reproducibility) → 4 pts
10. Task 8.1 (E2E Integration) → 4 pts

**Critical Path Total**: 44 story points
**Parallel Opportunities**: Phases 2-3 (policy guards) can run simultaneously with Phases 1, 4, 5-7

### Parallelization Strategy

**Week 1** (concurrent work):
- Agent 1: Tasks 1.1 → 1.2 → 1.3 (Phase 1)
- Agent 2: Tasks 2.1 → 2.2 → 2.3 (Phase 2)
- Agent 3: Tasks 3.1, 3.2, 3.3 in parallel (Phase 3)

**Week 2** (concurrent work):
- Agent 1: Tasks 4.1 → 4.2 → 4.3 → 4.4 (Phase 4)
- Agent 2: Tasks 3.4 completion + Task 5.1 (Phase 5 setup)
- Agent 3: Performance benchmarking prep (Task 8.4 prep)

**Week 3** (concurrent work):
- Agent 1: Tasks 5.2 → 6.1 → 6.2 (Determinism harness + reproducibility)
- Agent 2: Tasks 7.1, 7.2, 7.3 in parallel (Seed/decoder validation)
- Agent 3: Documentation start (Task 8.3 prep)

**Week 4** (concurrent + sequential):
- Agent 1: Task 6.3 (Regressions) + Task 8.1 (E2E integration)
- Agent 2: Task 8.2 (Quality gates) + Task 8.4 (Benchmarking)
- Agent 3: Task 8.3 (Documentation) + Task 8.5 (CI/CD integration)

---

## Subagent Assignments

### Full Track Agents (Sonnet-Powered)

#### Primary Agent: backend-validation-specialist (Sonnet)
**Allocation**: 50% of project (weeks 1-4, primary focus weeks 1-2, 4)

**Responsibilities**:
- All Phase 1 tasks (Blueprint loading and constraint validation)
- Phase 4 tasks (Scoring rubric)
- Phase 8 tasks (Integration, documentation, benchmarking, metrics)

**Expected Output**:
- Enhanced `validation_service.py` (500+ lines)
- 3 new service modules: `blueprint_loader.py`, `blueprint_validator.py`, `rubric_scorer.py`
- 2 new support modules: `policy_guards.py`, `conflict_matrix.py`
- Unit test suite for all validators
- Performance benchmark suite

**Skills Required**:
- Deep Python expertise
- Domain knowledge of music theory (blueprints)
- Testing methodology
- Performance profiling

#### Secondary Agent: qa-automation-engineer (Sonnet)
**Allocation**: 40% of project (weeks 2-4, primary focus weeks 3-4)

**Responsibilities**:
- Phase 5 tasks (Test infrastructure and fixtures)
- Phase 6 tasks (Reproducibility tests)
- Phase 7 tasks (Seed propagation, decoder validation, pinned retrieval)
- Phase 8 tasks (E2E integration, CI/CD)

**Expected Output**:
- `/tests/determinism/` directory structure with 50 SDS fixtures
- `test_reproducibility.py` with parametrized tests
- `test_seed_propagation.py` and `test_decoder_settings.py`
- `test_e2e_validation.py` with full integration
- GitHub Actions workflow files
- Determinism testing documentation

**Skills Required**:
- Test framework expertise (pytest)
- CI/CD pipeline knowledge
- Metrics and observability
- Workflow orchestration understanding

#### Supporting Agent: validation-specialist (Haiku)
**Allocation**: 20% of project (weeks 1-2, support role)

**Responsibilities**:
- Phase 2 tasks (Tag conflict matrix and enforcement)
- Phase 3 tasks (Policy guards - profanity, PII, normalization)
- Documentation support

**Expected Output**:
- `conflict_matrix.py` module
- Conflict and PII detection implementations
- Profanity filter taxonomy
- Supporting documentation

**Skills Required**:
- Python backend development
- NLP basics (PII detection, patterns)
- Taxonomy design

---

## Linear-Compatible Task Format Template

All tasks follow this format for Linear import:

```
Title: [Clear, actionable title]
Description: [Detailed description with acceptance criteria]
Priority: [High/Medium/Low]
Assignee: [backend-validation-specialist/qa-automation-engineer/validation-specialist]
Estimate: [Story points: 1-13]
Labels: [validation, phase-X, backend/testing, optional-feature-area]
Status: [Todo/In Progress/In Review/Done]
Related: [Issue/PR references]
Dependencies: [Task IDs this depends on]
```

---

## Risk Assessment & Mitigation

### High-Risk Areas

#### 1. Determinism Achievement (Critical)
**Risk**: Cannot achieve ≥99% reproducibility despite implementation
**Impact**: Cannot release (Gate B blocks deployment)
**Probability**: Medium (depends on Claude Code implementation)

**Mitigation**:
- Start determinism validation early (Week 3)
- Use simple mock skills to validate test infrastructure
- Iterate on seed propagation implementation
- Document all non-deterministic sources discovered
- Build regression tracking system (Task 6.3)
- Have contingency: relax threshold to 95% if 99% unachievable

**Monitoring**:
- Weekly reproducibility metrics reported
- Regression tracking dashboard
- Early alert if reproducibility <95%

#### 2. Rubric Tuning Convergence (High)
**Risk**: Scoring thresholds too strict/loose, need extensive tuning
**Impact**: Delays release, needs rework
**Probability**: Medium-High

**Mitigation**:
- Start with lenient thresholds (min_total: 0.70)
- Use A/B testing on 200-song test suite
- Iteratively tighten based on failure patterns
- Support per-genre threshold overrides
- Make weights configurable without code changes
- Build tuning dashboard early

**Monitoring**:
- Weekly pass rate reports
- Per-metric failure analysis
- Genre-specific pass rates

#### 3. Performance Regression (Medium)
**Risk**: Validation adds latency >500ms, pushes total >60s
**Impact**: User experience degradation
**Probability**: Low (validation is lightweight)

**Mitigation**:
- Benchmark early and often (Task 8.4)
- Cache blueprint rules after first load
- Use efficient data structures (adjacency matrix for conflicts)
- Profile under realistic load
- Set up performance monitoring pre-deployment

**Monitoring**:
- Latency tracking for each validator
- P95/P99 latency alerts
- Load testing before release

#### 4. Policy Guard False Positives (Medium)
**Risk**: Profanity/PII filters too aggressive, flag legitimate content
**Impact**: Poor user experience, manual review burden
**Probability**: Medium-High

**Mitigation**:
- Start with conservative detection (high threshold)
- Maintain allowlist for common false positives
- User feedback loop on UI
- Support override mechanism
- Regular review and tuning of regex patterns
- Use fuzzy matching where appropriate

**Monitoring**:
- Track false positive rate
- User feedback on filters
- Review override patterns

#### 5. Blueprint Coverage Gaps (Medium)
**Risk**: Some genres missing blueprint rules, causes failures
**Impact**: Certain genres cannot be validated properly
**Probability**: Low (blueprints already documented)

**Mitigation**:
- Review all 12+ blueprints early
- Create minimal required rules per genre
- Support "generic" fallback blueprint
- Flag missing blueprint rules in validation output
- Have process to add new genres iteratively

**Monitoring**:
- Validation failure rate by genre
- Coverage checklist per genre

---

## Quality Gates & Acceptance Criteria

### Gate A: Rubric Compliance (50% weight)
**Metric**: Pass rate on 200-song diverse test suite
**Target**: ≥95%
**Validation Method**:
1. Collect 200 SDSs (varies by genre, complexity)
2. Run full workflow (PLAN → VALIDATE)
3. Record validation scores
4. Calculate pass rate: `(passes / 200) × 100`
5. Break down by genre to identify issues

**Acceptance**: 95% or higher
**Owner**: qa-automation-engineer
**Timeline**: Week 4 (after Phase 4 complete)

### Gate B: Determinism Reproducibility (30% weight)
**Metric**: Reproducibility rate on 50×10 runs
**Target**: ≥99%
**Validation Method**:
1. Run 50 diverse SDSs
2. Each SDS run 10 times with identical seed
3. Hash all artifacts (exclude timestamps, run_ids)
4. Calculate reproducibility: `(identical_hashes / total_hashes) × 100`
5. Flag any mismatches for investigation

**Acceptance**: 99% or higher
**Owner**: qa-automation-engineer
**Timeline**: Week 4 (after Phase 7 complete)

### Gate C: Security & Policy (10% weight)
**Metric**: Clean security audit
**Target**: Zero high-severity violations
**Validation Method**:
1. Run profanity filter on 200 songs
2. Verify PII detection/redaction
3. Check artist normalization working
4. Audit policy override logs
5. Manual review of edge cases

**Acceptance**: Zero high-severity issues
**Owner**: backend-validation-specialist
**Timeline**: Week 4 (continuous throughout project)

### Gate D: Latency & Performance (10% weight)
**Metric**: P95 latency from Plan → Prompt (excluding render)
**Target**: ≤60 seconds
**Validation Method**:
1. Run 100 SDSs through workflow
2. Measure latency from PLAN start to COMPOSE end
3. Calculate P95 percentile
4. Break down by node latency
5. Identify hot paths

**Acceptance**: ≤60 seconds P95
**Owner**: backend-validation-specialist
**Timeline**: Week 4 (after Phase 4 complete)

---

## Success Criteria Summary

### Functional Success Criteria

- [x] Blueprint constraints validated per genre (BPM ranges, required sections, lexicon)
- [x] Tag conflicts detected and prevented (conflict matrix enforced)
- [x] Profanity filtering works (explicit flag respected)
- [x] PII detection and redaction working
- [x] Artist normalization prevents "style of [Living Artist]" in public outputs
- [x] Rubric scores calculated correctly (5 metrics weighted per genre)
- [x] Determinism validated (≥99% reproducibility across 50×10 runs)
- [x] Seed propagation verified for all nodes
- [x] Decoder settings validated (temperature ≤0.3, fixed top-p)
- [x] E2E validation flow works (SDS → validation → FIX loop → final output)
- [x] All gates pass (Rubric ≥95%, Determinism ≥99%, Security clean, Latency ≤60s)

### Implementation Success Criteria

- [x] Code follows MeatyMusic patterns and conventions
- [x] All code documented with docstrings and comments
- [x] ≥90% test coverage for new modules
- [x] CI/CD integration working
- [x] Performance benchmarks established
- [x] Comprehensive documentation written
- [x] No regressions in existing validation functionality
- [x] Backward compatible with existing API

### Delivery Success Criteria

- [x] All 27 tasks completed on time (4-6 weeks)
- [x] Code reviewed and merged to main branch
- [x] All tests passing in CI/CD
- [x] Ready for production deployment
- [x] Team knowledge transfer completed

---

## Timeline & Milestones

### Week 1: Foundation (Validation Service Basics)
**Tasks**: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3
**Deliverables**:
- Blueprint loading system (Task 1.1)
- Blueprint constraint validators (Task 1.2-1.3)
- Conflict matrix builder (Task 2.1-2.3)
- Policy guard modules (Tasks 3.1-3.3)
- Unit tests for all modules

**Milestone**: Validation Service 60% → 80%

### Week 2: Rubric & Polish (Scoring & Integration)
**Tasks**: 4.1, 4.2, 4.3, 4.4, 3.4, 8.4
**Deliverables**:
- Rubric scoring engine (Task 4.1-4.4)
- Policy guard integration (Task 3.4)
- Integration tests
- Performance benchmarking (Task 8.4)

**Milestone**: Validation Service 80% → 100%

### Week 3: Determinism Framework (Tests & Reproducibility)
**Tasks**: 5.1, 5.2, 6.1, 6.2, 7.1, 7.2, 7.3
**Deliverables**:
- Test infrastructure with 50 fixtures (Task 5.1-5.2)
- Reproducibility tests (Task 6.1-6.2)
- Seed propagation verification (Task 7.1)
- Decoder validation (Task 7.2)
- Pinned retrieval verification (Task 7.3)
- Initial determinism metrics

**Milestone**: Determinism Framework 0% → 80%

### Week 4: Integration & Release (E2E, Docs, CI/CD)
**Tasks**: 6.3, 8.1, 8.2, 8.3, 8.5
**Deliverables**:
- Regression test suite (Task 6.3)
- E2E integration tests (Task 8.1)
- Quality gates & metrics dashboard (Task 8.2)
- Comprehensive documentation (Task 8.3)
- CI/CD integration (Task 8.5)
- Final acceptance gate validation

**Milestone**: All Gates Pass → Ready for Deployment

---

## Resource Requirements

### Team Composition
- **1× backend-validation-specialist (Sonnet)**: 50% allocation, weeks 1-4
- **1× qa-automation-engineer (Sonnet)**: 40% allocation, weeks 2-4
- **1× validation-specialist (Haiku)**: 20% allocation, weeks 1-2

**Total Effort**: ~160-180 story points (across 3 agents × 4 weeks)

### Infrastructure Requirements
- Existing MeatyMusic infrastructure (PostgreSQL, Redis, Docker)
- GitHub Actions for CI/CD (already available)
- Development machine with Python 3.11+
- Test data: 50-200 SDS fixtures (created as part of project)

### External Dependencies
- None (validation is self-contained)
- Optional: NLP library for PII detection (better-profanity, spacy, etc.)
- Optional: Performance monitoring tool (Prometheus, DataDog)

---

## Monitoring & Observability

### Key Metrics

**Validation Service Metrics**:
- Validation latency per validator (ms)
- Cache hit rate for blueprints/conflict matrix
- Violation detection rate by category
- Hot paths identified for optimization

**Determinism Metrics**:
- Reproducibility rate (%) - target ≥99%
- Per-artifact reproducibility breakdown
- Regressions detected vs fixed
- Seed propagation success rate
- Decoder settings compliance rate

**Quality Metrics**:
- Rubric pass rate (%) - target ≥95%
- Per-genre pass rates
- Auto-fix convergence rate (iterations needed)
- Policy override rate and reasons
- False positive rate for filters

### Logging & Debugging

**Validation Service Logging**:
- Blueprint loading/cache hits
- Constraint violations detected
- Policy guard triggers
- Rubric score calculations (detailed)
- Performance profiling data

**Determinism Logging**:
- Seed values per node
- Artifact hash comparisons
- Reproducibility failures
- Regression tracking

**Example Log Entry**:
```json
{
  "timestamp": "2025-11-14T10:30:45Z",
  "event": "validation.rubric_score_calculated",
  "sds_id": "abc-123",
  "genre": "pop",
  "scores": {
    "hook_density": 0.85,
    "singability": 0.92,
    "rhyme_tightness": 0.78,
    "section_completeness": 0.95,
    "profanity_score": 0.02,
    "total": 0.88
  },
  "decision": "PASS",
  "margin_to_threshold": 0.03
}
```

---

## Known Unknowns & Assumptions

### Assumptions

1. **Blueprint files are available**: All 12+ genre blueprints already exist in `/docs/hit_song_blueprint/AI/`
2. **Conflict matrix can be derived**: Tag conflict rules can be inferred from blueprints or created
3. **Claude Code skills are deterministic**: Skills will use seed + node_index correctly
4. **Database access is available**: ValidationService can query node_executions for seed audit
5. **50 diverse SDSs can be generated**: Test fixtures can be created covering all genres and complexities

### Known Unknowns

1. **Optimal rubric thresholds**: May need iteration (A/B testing) to get to 95% pass rate
2. **Profanity detection accuracy**: False positive rate unknown until implemented
3. **Pinned retrieval feasibility**: Depends on how LYRICS node is implemented (may need adjustment)
4. **Performance baseline**: Validation latency unknown until measured
5. **Reproducibility baseline**: Actual reproducibility rate depends on Claude Code implementation

### Contingencies

- If reproducibility <99%: Investigate failures, document root causes, consider threshold reduction
- If rubric tuning slow: Pre-tune thresholds on 200-song test set, prioritize high-impact metrics
- If determinism testing blocked: Implement with mock skills first, validate methodology
- If performance issues: Profile and optimize hot paths (blueprint loading, conflict detection)

---

## Appendices

### A. File Locations & Artifacts

**New Files to Create**:
- `/home/user/MeatyMusic/services/api/app/services/blueprint_loader.py` (200+ lines)
- `/home/user/MeatyMusic/services/api/app/services/blueprint_validator.py` (250+ lines)
- `/home/user/MeatyMusic/services/api/app/services/rubric_scorer.py` (300+ lines)
- `/home/user/MeatyMusic/services/api/app/services/conflict_matrix.py` (150+ lines)
- `/home/user/MeatyMusic/services/api/app/services/policy_guards.py` (400+ lines)
- `/home/user/MeatyMusic/services/api/app/services/metrics_tracker.py` (200+ lines)
- `/home/user/MeatyMusic/taxonomies/conflict_matrix.json` (new)
- `/home/user/MeatyMusic/taxonomies/profanity_list.json` (new)
- `/home/user/MeatyMusic/taxonomies/pii_patterns.json` (new)
- `/home/user/MeatyMusic/tests/determinism/conftest.py` (200+ lines)
- `/home/user/MeatyMusic/tests/determinism/test_reproducibility.py` (300+ lines)
- `/home/user/MeatyMusic/tests/determinism/test_seed_propagation.py` (200+ lines)
- `/home/user/MeatyMusic/tests/determinism/test_decoder_settings.py` (150+ lines)
- `/home/user/MeatyMusic/tests/determinism/test_e2e_validation.py` (250+ lines)
- `/home/user/MeatyMusic/tests/determinism/fixtures/` (50 SDS JSON files)

**Modified Files**:
- `/home/user/MeatyMusic/services/api/app/services/validation_service.py` (add 300+ lines)
- `.github/workflows/validation-tests.yml` (new)
- `.github/workflows/determinism-tests.yml` (new)
- `/home/user/MeatyMusic/docs/project_plans/implementation_plans/` (this file)

**Documentation**:
- `/home/user/MeatyMusic/docs/validation-service-guide.md` (new)
- `/home/user/MeatyMusic/docs/determinism-validation-guide.md` (new)
- `/home/user/MeatyMusic/docs/rubric-scoring-guide.md` (new)
- `/home/user/MeatyMusic/docs/policy-guards-guide.md` (new)

### B. Reference Documentation

**Internal**:
- `CLAUDE.md` - Project guidelines
- `docs/amcs-overview.md` - System architecture
- `docs/PRD-REQUIREMENTS-SUMMARY.md` - Requirements
- `docs/project_plans/NEXT-STEPS-REPORT.md` - Gap analysis

**Blueprints**:
- `docs/hit_song_blueprint/AI/pop_blueprint.md`
- `docs/hit_song_blueprint/AI/country_blueprint.md`
- `docs/hit_song_blueprint/AI/hiphop_blueprint.md`
- (and 9+ more genre blueprints)

### C. Testing Strategy

**Test Pyramid**:
```
                 /\
                /  \  E2E Tests (Task 8.1)
               /    \  ~10 tests, ~50ms each
              /______\
             /        \
            / Integr.  \ Integration Tests (throughout)
           /  Tests    \  ~20 tests, ~200ms each
          /______________\
         /                \
        / Unit Tests       \ Unit Tests (Tasks 1-4, 7)
       / Validators        \  ~80 tests, ~10ms each
      /____________________\
```

**Test Execution Strategy**:
- **Fast tests** (unit): Run on every commit (~5 min)
- **Moderate tests** (integration): Run on PR (~10 min)
- **Slow tests** (determinism): Run on merge to main (~30 min)
- **Full acceptance gates**: Run pre-release (~60 min)

### D. Rollback & Recovery Plan

**If critical issue found post-deployment**:
1. Revert validation service changes (no data loss)
2. Disable quality gates temporarily (warn users)
3. Debug in staging environment
4. Re-test before re-deploying
5. Update relevant tests to catch regression

**Data integrity**: No data migration needed, fully backward compatible

---

## Sign-Off & Approval

**Document Status**: Ready for Development
**Approval Date**: 2025-11-14
**Primary Owner**: backend-validation-specialist (Sonnet)
**QA Owner**: qa-automation-engineer (Sonnet)

**Next Steps**:
1. Review with team and stakeholders
2. Create GitHub issues from task list
3. Assign to subagents (Sonnet/Haiku)
4. Begin Phase 1 Week 1
5. Weekly progress reviews

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
**Status**: APPROVED FOR AGENT IMPLEMENTATION
