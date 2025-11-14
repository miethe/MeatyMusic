# Implementation Plan: Phase 0-4 Details
## Skill Infrastructure Setup & Generation Skills (PLAN, STYLE, LYRICS, PRODUCER)

**Part 1 of 4 in the WP-N1 Implementation Plan Series**
**Version**: 1.0
**Created**: 2025-11-14

---

## Phase 0: Skill Infrastructure Setup

### Objective
Establish templates, contracts, and frameworks that all 8 skills will use. This is critical for consistency and determinism.

### Deliverables

#### 0.1: Skill Template & Directory Structure
**Story**: "As a skill developer, I want a template directory with standard structure so that I can implement skills consistently"

**Assigned To**: Story Writer (Haiku) + Skill Developer Lead

**Tasks**:
- [ ] Create `.claude/skills/amcs-template/` directory
- [ ] Create `SKILL.md` template with sections: Overview, Input Contract, Output Contract, Determinism, Events, Tests
- [ ] Create `implementation.py` skeleton with stub methods
- [ ] Create `test_skill.py` template with determinism test case
- [ ] Create `examples/` directory with sample I/O
- [ ] Document in README: How to use template

**Acceptance Criteria**:
- [ ] Template directory exists with all files
- [ ] Developers can copy template → create new skill in <15 min
- [ ] Template includes determinism best practices comments

**Effort**: 4 story points
**Duration**: 4-6 hours

---

#### 0.2: Skill Contract Definitions (Pydantic Schemas)
**Story**: "As a skill integrator, I want formal input/output schemas so that I can validate data types and catch mismatches early"

**Assigned To**: Dependency Mapper (Sonnet) + Skill Developer

**Tasks**:
- [ ] Define `SkillInput` base class (run_id, seed, sds, artifacts dict)
- [ ] Define `SkillOutput` base class (status, result, metrics, events, errors)
- [ ] For each skill, create input/output Pydantic models:
  - `PlanInput`, `PlanOutput`
  - `StyleInput`, `StyleOutput`
  - `LyricsInput`, `LyricsOutput`
  - `ProducerInput`, `ProducerOutput`
  - `ComposeInput`, `ComposeOutput`
  - `ValidateInput`, `ValidateOutput`
  - `FixInput`, `FixOutput`
  - `ReviewInput`, `ReviewOutput`
- [ ] Add docstrings explaining each field
- [ ] Create examples for each schema pair
- [ ] Add validation rules (e.g., seed must be ≥0)

**Acceptance Criteria**:
- [ ] All schemas defined in `schemas/skill_contracts.py`
- [ ] Validators defined for required fields
- [ ] Examples show realistic data
- [ ] Circular import issues resolved

**Effort**: 5 story points
**Duration**: 6-8 hours

---

#### 0.3: Determinism Enforcement Framework
**Story**: "As a skill developer, I want built-in helpers for determinism so that I don't accidentally introduce randomness"

**Assigned To**: Skill Developer Lead + Risk Assessor

**Tasks**:
- [ ] Create `determinism.py` module with:
  - `SeededRandom(seed: int)` class wrapping Python's `random` module
  - `get_node_seed(base_seed: int, node_index: int) → int` helper
  - `hash_artifact(artifact: dict) → str` SHA-256 hasher
  - `validate_decoder_settings(temp: float, top_p: float) → bool` checker
  - `NO_TIME_LOGIC` decorator to prevent date/time usage
  - `@determinism_safe` decorator for skill methods
- [ ] Create checklist for skill developers: "Determinism 10-Point Check"
- [ ] Add warnings if non-deterministic operations detected
- [ ] Create test template for reproducibility tests

**Acceptance Criteria**:
- [ ] Helpers callable and documented
- [ ] 10-point checklist integrated into SKILL.md template
- [ ] Decorator prevents common non-deterministic patterns
- [ ] Test template demonstrates 10-run reproducibility

**Effort**: 5 story points
**Duration**: 6-8 hours

---

#### 0.4: Event Emission Framework
**Story**: "As an orchestrator, I want standardized event emission so that all workflow events are consistent"

**Assigned To**: Skill Developer + Dependency Mapper

**Tasks**:
- [ ] Create `events.py` module with:
  - `WorkflowEvent` dataclass (ts, run_id, node, phase, duration_ms, metrics, issues)
  - `emit_event(event: WorkflowEvent)` function
  - Integration with existing EventPublisher in orchestrator
- [ ] Create event type constants: `PHASE_START`, `PHASE_END`, `PHASE_FAIL`
- [ ] Add event timing helpers (measure duration automatically)
- [ ] Create context manager: `with skill_execution(run_id, node_name):`
- [ ] Document event schema and examples

**Acceptance Criteria**:
- [ ] Events emit to database and WebSocket
- [ ] Timestamps are accurate (within 100ms)
- [ ] All required fields present
- [ ] Context manager reduces boilerplate by 80%

**Effort**: 4 story points
**Duration**: 4-6 hours

---

#### 0.5: Citation Hashing for LYRICS
**Story**: "As a LYRICS skill developer, I want citation utilities so that I can track source chunks deterministically"

**Assigned To**: Skill Developer + Data Flow Mapper

**Tasks**:
- [ ] Create `citations.py` module with:
  - `CitationRecord` dataclass (chunk_hash, source_id, text, weight)
  - `hash_chunk(text: str) → str` SHA-256 hasher
  - `create_citations_json(records: List[CitationRecord]) → dict`
  - `pinned_retrieval(sources, query, chunk_hashes: List[str], top_k: int) → List[Chunk]`
- [ ] Implement deterministic retrieval:
  - Fixed top-k (no dynamic trimming)
  - Lexicographic sort for tie-breaking
  - Hash-based chunk matching
- [ ] Create test fixtures: sample sources with pre-computed hashes
- [ ] Document pinned retrieval algorithm

**Acceptance Criteria**:
- [ ] Citations created with consistent hashes
- [ ] Retrieval returns same chunks given same hashes
- [ ] Fixed top-k enforced
- [ ] Lexicographic sorting validated

**Effort**: 5 story points
**Duration**: 6-8 hours

---

#### 0.6: Test Harness & Fixtures
**Story**: "As a test developer, I want reusable test fixtures so that all skills use consistent test data"

**Assigned To**: QA Automation (Haiku) + Skill Developer

**Tasks**:
- [ ] Create `tests/fixtures/` directory:
  - `sample_sds.json` - 10 diverse SDS examples (pop, rock, hip-hop, country, etc.)
  - `sample_blueprints/` - 5 genre blueprints
  - `sample_sources/` - 3 source documents with pre-computed hashes
- [ ] Create test base class: `SkillTestCase` with:
  - `setUp()` that loads fixtures
  - `assert_deterministic(skill_fn, run_count=10)` helper
  - `assert_event_emitted(node_name, phase)` helper
  - `assert_artifact_hash_valid(artifact)` helper
- [ ] Create seed constants for reproducible tests: `TEST_SEED`, `TEST_SEED_PLAN`, etc.
- [ ] Document test data generation process

**Acceptance Criteria**:
- [ ] 10+ sample SDSs cover all genres
- [ ] Test base class reduces boilerplate by 60%
- [ ] Determinism tests run in <5 seconds per skill
- [ ] Fixtures are version-controlled and stable

**Effort**: 4 story points
**Duration**: 4-6 hours

---

### Phase 0 Summary

| Task | Effort | Duration | Owner |
|------|--------|----------|-------|
| 0.1: Skill Template | 4 pts | 4-6h | Skill Dev Lead |
| 0.2: Contract Schemas | 5 pts | 6-8h | Dependency Mapper |
| 0.3: Determinism Framework | 5 pts | 6-8h | Risk Assessor |
| 0.4: Event Emission | 4 pts | 4-6h | Skill Dev |
| 0.5: Citation Hashing | 5 pts | 6-8h | Data Mapper |
| 0.6: Test Harness | 4 pts | 4-6h | QA Automation |
| **PHASE 0 TOTAL** | **27 pts** | **30-42h** | Multiple |

**Success Criteria**: All infrastructure in place, skills can be developed using templates

---

## Phase 1: PLAN Skill

### Objective
Create the PLAN skill that expands a Song Design Spec into ordered work targets. This is the entry point to the workflow.

### Requirement Overview
- **Input**: Song Design Spec (SDS)
- **Output**: Plan (section order, target word counts, evaluation targets)
- **Determinism**: `seed + 1`
- **Dependencies**: None (first in workflow)
- **Key Constraint**: Generate reproducible section ordering and structure

### Deliverables

#### 1.1: PLAN Skill Core Implementation
**Story**: "As a workflow orchestrator, I want the PLAN skill to analyze an SDS and generate ordered work targets so that downstream skills have clear structure"

**Assigned To**: Skill Developer #1 (Haiku code generation)

**Tasks**:
- [ ] Create `.claude/skills/amcs-plan/` directory
- [ ] Copy template from Phase 0 and customize
- [ ] Implement `plan_generate(sds: SDS, seed: int) → Plan`:
  - Determine section order based on SDS.lyrics.section_order
  - Calculate target word counts per section (proportional to structure)
  - Identify evaluation targets (rubric metrics to focus on)
  - Return Plan object with: sections, wordCounts, evaluationTargets
- [ ] Use seed-derived RNG for any ordering decisions (deterministic)
- [ ] Add comprehensive docstrings
- [ ] Write 5 example input/output pairs

**Acceptance Criteria**:
- [ ] Function signature matches contract from Phase 0.2
- [ ] Output follows Plan schema
- [ ] Determinism: 10 runs with same SDS + seed produce identical Plans
- [ ] Examples cover: simple (4 sections), complex (12 sections), edge cases

**Effort**: 6 story points
**Duration**: 7-9 hours

---

#### 1.2: PLAN Skill Input Validation
**Story**: "As a developer, I want robust input validation so that invalid SDSs are caught immediately"

**Assigned To**: Skill Developer #1

**Tasks**:
- [ ] Validate SDS structure:
  - SDS has required fields: title, style, lyrics, producer_notes, blueprint_ref
  - Section order is non-empty
  - Seed is non-negative integer
- [ ] Validate section order against lyrics:
  - All sections in lyrics.section_order are valid
  - At least one "Chorus" section
- [ ] Return error list if validation fails
- [ ] Add specific error messages (not generic)

**Acceptance Criteria**:
- [ ] Invalid SDSs rejected with clear error messages
- [ ] Valid SDSs accepted
- [ ] Edge cases: empty sections, missing chorus, invalid seed

**Effort**: 3 story points
**Duration**: 3-4 hours

---

#### 1.3: PLAN Skill Event Emission
**Story**: "As an orchestrator, I want PLAN to emit structured events so that I can track execution"

**Assigned To**: Skill Developer #1

**Tasks**:
- [ ] Emit `PHASE_START` event when PLAN begins
- [ ] Emit `PHASE_END` event when PLAN completes with metrics:
  - `section_count`: number of sections
  - `total_word_count`: sum of target words
  - `duration_ms`: execution time
- [ ] If validation fails, emit `PHASE_FAIL` with issues list
- [ ] Use event context manager from Phase 0.4

**Acceptance Criteria**:
- [ ] 3 events emitted (START, END, optionally FAIL)
- [ ] Metrics present and reasonable
- [ ] Timestamps accurate

**Effort**: 2 story points
**Duration**: 2-3 hours

---

#### 1.4: PLAN Skill Tests
**Story**: "As QA, I want comprehensive tests so that PLAN skill is reliable"

**Assigned To**: QA Automation

**Tasks**:
- [ ] Create `tests/skills/test_plan.py`:
  - Test with sample SDSs from fixtures
  - Test determinism: 10 runs produce identical output
  - Test input validation: invalid SDSs rejected
  - Test event emission: all events present
  - Test edge cases: 4 sections, 20 sections, complex structure
- [ ] Create `.claude/skills/amcs-plan/test_plan.py` for unit tests
- [ ] Aim for 95%+ code coverage

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Determinism validated (≥99%)
- [ ] Coverage ≥95%
- [ ] Tests run in <5 seconds

**Effort**: 4 story points
**Duration**: 4-6 hours

---

#### 1.5: PLAN Skill Documentation
**Story**: "As a developer, I want clear documentation so that I understand PLAN's contract and usage"

**Assigned To**: Skill Developer #1 + Documentation

**Tasks**:
- [ ] Write SKILL.md with sections:
  - Overview: What PLAN does
  - Input Contract: SDS schema, required fields
  - Output Contract: Plan schema
  - Determinism: How seed is used
  - Examples: 3 input/output pairs
  - Troubleshooting: Common errors
- [ ] Add docstrings to all functions
- [ ] Create example notebook showing PLAN usage

**Acceptance Criteria**:
- [ ] SKILL.md is complete and readable
- [ ] Contract is unambiguous
- [ ] Examples are realistic

**Effort**: 2 story points
**Duration**: 2-3 hours

---

### Phase 1 Summary

| Task | Effort | Duration | Owner |
|------|--------|----------|-------|
| 1.1: Core Implementation | 6 pts | 7-9h | Skill Dev #1 |
| 1.2: Input Validation | 3 pts | 3-4h | Skill Dev #1 |
| 1.3: Event Emission | 2 pts | 2-3h | Skill Dev #1 |
| 1.4: Tests | 4 pts | 4-6h | QA Automation |
| 1.5: Documentation | 2 pts | 2-3h | Skill Dev #1 |
| **PHASE 1 TOTAL** | **17 pts** | **18-25h** | Skill Dev #1 |

**Success Criteria**: PLAN skill executes deterministically, passes all tests, ≥99% reproducibility on 10 runs

---

## Phase 2: STYLE Skill

### Objective
Create the STYLE skill that generates a style specification with tag sanitization. Parallel with Phase 1.

### Requirement Overview
- **Input**: SDS, Plan from Phase 1, Blueprint
- **Output**: Style spec (genre, BPM, tags, instrumentation, mood)
- **Determinism**: `seed + 2`
- **Key Constraints**: Enforce tempo_bpm range, tag conflict checking, instrumentation limit

### Deliverables

#### 2.1: STYLE Skill Core Implementation
**Story**: "As a composer, I want the STYLE skill to generate a genre-appropriate style spec so that the song has coherent musical identity"

**Assigned To**: Skill Developer #2

**Tasks**:
- [ ] Create `.claude/skills/amcs-style/` directory
- [ ] Implement `style_generate(sds: SDS, plan: Plan, blueprint: Blueprint, seed: int) → Style`:
  - Accept user's style preferences from SDS.style
  - Validate against blueprint tempo_bpm range
  - Sanitize tags using conflict matrix
  - Apply instrumentation limit (≤3 items)
  - Fill in defaults from blueprint if missing
  - Return Style object
- [ ] Use seed for any generation decisions
- [ ] Add examples showing conflict resolution

**Acceptance Criteria**:
- [ ] Output matches Style schema
- [ ] Tempo within blueprint range
- [ ] No conflicting tags (verified against conflict matrix)
- [ ] Instrumentation ≤3 items
- [ ] Determinism: 10 runs identical

**Effort**: 7 story points
**Duration**: 8-10 hours

---

#### 2.2: Tag Conflict Matrix Enforcement
**Story**: "As a validator, I want tag conflicts detected and resolved so that the style is coherent"

**Assigned To**: Skill Developer #2

**Tasks**:
- [ ] Load `taxonomies/conflict_matrix.json`
- [ ] Implement `check_tag_conflicts(tags: List[str], conflict_matrix: dict) → (valid_tags, removed_tags, warnings)`:
  - Identify conflicting tag pairs
  - Remove lower-priority tag from each conflict
  - Return warnings for user awareness
- [ ] Add examples: what happens when "whisper" + "anthemic" both selected?
- [ ] Handle edge cases: missing conflict matrix, unknown tags

**Acceptance Criteria**:
- [ ] Conflicts detected correctly
- [ ] Removed tags logged with reasoning
- [ ] Warnings provided to user
- [ ] Examples show resolution

**Effort**: 4 story points
**Duration**: 4-6 hours

---

#### 2.3: Blueprint Tempo Validation
**Story**: "As a composer, I want tempo validated against genre blueprints so that the style fits the genre"

**Assigned To**: Skill Developer #2

**Tasks**:
- [ ] Load genre blueprint's `rules.tempo_bpm` range
- [ ] Implement `enforce_tempo_range(tempo: int or [min, max], blueprint: Blueprint) → tempo_adjusted`:
  - Clamp to blueprint range if out of bounds
  - If range [min, max] provided, ensure min ≤ max and both within blueprint
  - Return clamped tempo and warning if adjusted
- [ ] Add examples and edge cases

**Acceptance Criteria**:
- [ ] Tempo clamped to blueprint range
- [ ] Range validation works
- [ ] Warnings logged

**Effort**: 2 story points
**Duration**: 2-3 hours

---

#### 2.4: STYLE Skill Event Emission & Tests
**Story**: "As QA, I want STYLE to emit events and pass comprehensive tests"

**Assigned To**: QA Automation

**Tasks**:
- [ ] Add event emission (START, END, FAIL) using Phase 0.4 framework
- [ ] Create `tests/skills/test_style.py`:
  - Test with 5 sample SDSs (different genres)
  - Test determinism: 10 runs identical
  - Test tag conflict resolution
  - Test tempo range clamping
  - Test instrumentation limit
- [ ] Coverage ≥95%

**Acceptance Criteria**:
- [ ] Tests pass
- [ ] Determinism ≥99%
- [ ] Coverage ≥95%
- [ ] All constraints validated

**Effort**: 4 story points
**Duration**: 4-6 hours

---

#### 2.5: STYLE Skill Documentation
**Story**: "As a developer, I want clear STYLE documentation so I understand conflict resolution"

**Assigned To**: Skill Developer #2

**Tasks**:
- [ ] Write SKILL.md with conflict matrix examples
- [ ] Document tempo clamping logic
- [ ] Show example transformation: input style → output style with conflicts resolved

**Acceptance Criteria**:
- [ ] Documentation complete
- [ ] Examples clear

**Effort**: 2 story points
**Duration**: 2-3 hours

---

### Phase 2 Summary

| Task | Effort | Duration | Owner |
|------|--------|----------|-------|
| 2.1: Core Implementation | 7 pts | 8-10h | Skill Dev #2 |
| 2.2: Conflict Matrix | 4 pts | 4-6h | Skill Dev #2 |
| 2.3: Tempo Validation | 2 pts | 2-3h | Skill Dev #2 |
| 2.4: Events & Tests | 4 pts | 4-6h | QA Automation |
| 2.5: Documentation | 2 pts | 2-3h | Skill Dev #2 |
| **PHASE 2 TOTAL** | **19 pts** | **20-28h** | Skill Dev #2 |

**Success Criteria**: STYLE skill generates valid specs, enforces constraints, ≥99% reproducibility

---

## Phase 3: LYRICS Skill

### Objective
Create the LYRICS skill with citation hashing and rhyme scheme enforcement. Most complex skill.

### Requirement Overview
- **Input**: SDS, Plan, Style, Sources, Blueprint
- **Output**: Lyrics (sections with text, citations, metrics)
- **Determinism**: `seed + 3` - CRITICAL with pinned retrieval
- **Key Constraints**: Rhyme scheme, profanity filter, citation hashing, section requirements

### Deliverables

#### 3.1: LYRICS Skill Core Implementation (Part 1)
**Story**: "As a songwriter, I want the LYRICS skill to generate coherent lyrics with proper citations so that content is trackable and reproducible"

**Assigned To**: Skill Developer #3 (Haiku) + Risk Assessor

**Tasks**:
- [ ] Create `.claude/skills/amcs-lyrics/` directory
- [ ] Implement `lyrics_generate(sds: SDS, plan: Plan, style: Style, sources: List[Source], blueprint: Blueprint, seed: int) → Lyrics`:
  - For each section in plan:
    - Generate section text with target word count
    - Extract citations from sources using pinned retrieval
    - Apply rhyme scheme constraints
    - Apply profanity filter
  - Return Lyrics object with: sections, citations, metrics
- [ ] Use seed + section_index for generation
- [ ] Add cite every reference using citation hashing (Phase 0.5)

**Acceptance Criteria**:
- [ ] Output matches Lyrics schema
- [ ] Each section has citations
- [ ] Determinism critical: MUST use pinned retrieval

**Effort**: 10 story points
**Duration**: 12-14 hours

---

#### 3.2: Pinned Retrieval Implementation
**Story**: "As a determinism engineer, I want pinned retrieval so that LYRICS produces identical citations across runs"

**Assigned To**: Skill Developer #3 + Risk Assessor

**Tasks**:
- [ ] Implement `pinned_retrieve(query: str, sources: List[Source], required_chunk_hashes: List[str], top_k: int, seed: int) → List[Chunk]`:
  - For each required hash, find matching chunk in sources
  - For remaining slots (top_k - matched), retrieve via lexicographic sort
  - No relevance scoring (deterministic only)
  - Return chunks in order
- [ ] Test with sample sources from Phase 0.6 fixtures
- [ ] Handle edge cases: hash not found, sources empty

**Acceptance Criteria**:
- [ ] Same hashes → same chunks
- [ ] Lexicographic sorting deterministic
- [ ] Fixed top-k enforced
- [ ] Edge cases handled

**Effort**: 6 story points
**Duration**: 7-9 hours

---

#### 3.3: Rhyme Scheme Enforcement
**Story**: "As a lyricist, I want rhyme scheme constraints enforced so that verses follow musical structure"

**Assigned To**: Skill Developer #3

**Tasks**:
- [ ] Implement `apply_rhyme_scheme(text: str, rhyme_scheme: str, syllables_per_line: int, seed: int) → (text_adjusted, issues)`:
  - Parse rhyme scheme (e.g., "AABB")
  - Check line-ending rhyme pairs
  - Flag non-rhyming lines
  - Suggest adjustments (seed-based)
- [ ] Handle syllable constraints: each line ≈ syllables_per_line (±2 tolerance)
- [ ] Return adjusted text and issues list

**Acceptance Criteria**:
- [ ] Rhyme scheme validated
- [ ] Syllable counts checked
- [ ] Suggestions provided for fixes

**Effort**: 5 story points
**Duration**: 6-7 hours

---

#### 3.4: Profanity & Policy Guards
**Story**: "As a policy enforcer, I want profanity filtering and PII redaction so that outputs are safe"

**Assigned To**: Skill Developer #3

**Tasks**:
- [ ] Implement `apply_policy_guards(text: str, constraints: Constraints) → (text_cleaned, violations, warnings)`:
  - If `constraints.explicit == false`: filter profanity (use banned terms from blueprint)
  - Redact PII: email, phone, address patterns
  - Normalize influences: remove "style of <living artist>" references
  - Return cleaned text and violation list
- [ ] Add configurable wordlists for profanity
- [ ] Log all redactions for audit trail

**Acceptance Criteria**:
- [ ] Profanity filtered per explicit flag
- [ ] PII patterns detected and redacted
- [ ] Artist normalization working

**Effort**: 5 story points
**Duration**: 6-7 hours

---

#### 3.5: Citation JSON & Metrics
**Story**: "As an auditor, I want citations recorded with hashes so that I can verify source attribution"

**Assigned To**: Skill Developer #3

**Tasks**:
- [ ] Implement `create_citations_json(citations: List[Citation]) → dict`:
  - Record: chunk_hash, source_id, text snippet, weight, section
  - Sort by section order for easy verification
  - Include metadata: generation timestamp, seed used
- [ ] Implement metrics calculation:
  - `hook_density`: memorable phrases per section
  - `singability`: avg syllables per line vs target
  - `rhyme_tightness`: % of correctly rhymed lines
  - Return metrics dict

**Acceptance Criteria**:
- [ ] Citations JSON includes all required fields
- [ ] Hashes match pinned retrieval
- [ ] Metrics calculated correctly

**Effort**: 4 story points
**Duration**: 4-5 hours

---

#### 3.6: LYRICS Skill Tests & Integration
**Story**: "As QA, I want comprehensive LYRICS tests including determinism validation"

**Assigned To**: QA Automation

**Tasks**:
- [ ] Create `tests/skills/test_lyrics.py`:
  - Test pinned retrieval determinism (10 runs, compare hashes)
  - Test rhyme scheme enforcement
  - Test profanity filtering
  - Test citation creation
  - Test metrics calculation
  - Test with sample sources (Phase 0.6)
- [ ] Create integration test: PLAN output → LYRICS input
- [ ] Coverage ≥95%

**Acceptance Criteria**:
- [ ] Tests pass
- [ ] Determinism ≥99% (CRITICAL for LYRICS)
- [ ] Coverage ≥95%
- [ ] Citation hashes validated

**Effort**: 6 story points
**Duration**: 7-9 hours

---

#### 3.7: LYRICS Skill Documentation
**Story**: "As a developer, I want LYRICS documentation with pinned retrieval examples"

**Assigned To**: Skill Developer #3

**Tasks**:
- [ ] Write comprehensive SKILL.md
- [ ] Include pinned retrieval algorithm with examples
- [ ] Show determinism validation results
- [ ] Document citation format with examples
- [ ] Troubleshooting: common profanity/PII issues

**Acceptance Criteria**:
- [ ] Documentation complete
- [ ] Pinned retrieval clearly explained

**Effort**: 2 story points
**Duration**: 2-3 hours

---

### Phase 3 Summary

| Task | Effort | Duration | Owner |
|------|--------|----------|-------|
| 3.1: Core Implementation | 10 pts | 12-14h | Skill Dev #3 |
| 3.2: Pinned Retrieval | 6 pts | 7-9h | Risk Assessor |
| 3.3: Rhyme Scheme | 5 pts | 6-7h | Skill Dev #3 |
| 3.4: Policy Guards | 5 pts | 6-7h | Skill Dev #3 |
| 3.5: Citations & Metrics | 4 pts | 4-5h | Skill Dev #3 |
| 3.6: Tests | 6 pts | 7-9h | QA Automation |
| 3.7: Documentation | 2 pts | 2-3h | Skill Dev #3 |
| **PHASE 3 TOTAL** | **38 pts** | **44-54h** | Multiple |

**Success Criteria**: LYRICS skill generates coherent lyrics with citations, ≥99% determinism, all profanity/PII guards working

---

## Phase 4: PRODUCER Skill

### Objective
Create the PRODUCER skill that generates arrangement and mix guidance. Moderate complexity.

### Requirement Overview
- **Input**: SDS, Plan, Style
- **Output**: Producer Notes (structure, hooks, instrumentation, mix targets)
- **Determinism**: `seed + 4`
- **Key Constraints**: Structure alignment with lyrics, blueprint rules, mix levels

### Deliverables

#### 4.1: PRODUCER Skill Core Implementation
**Story**: "As a producer, I want the PRODUCER skill to create arrangement guidance so that the song has cohesive production"

**Assigned To**: Skill Developer #2 (after STYLE completion)

**Tasks**:
- [ ] Create `.claude/skills/amcs-producer/` directory
- [ ] Implement `producer_generate(sds: SDS, plan: Plan, style: Style, blueprint: Blueprint, seed: int) → ProducerNotes`:
  - Design structure: intro → verses → choruses → bridge → outro
  - Align with SDS.lyrics.section_order
  - Determine hook count (based on genre and hook strategy)
  - Generate instrumentation notes aligned to style
  - Create mix targets (LUFS, space, stereo width)
  - Generate section-specific tags and durations
- [ ] Use seed for any generation decisions
- [ ] Return ProducerNotes object

**Acceptance Criteria**:
- [ ] Output matches ProducerNotes schema
- [ ] Structure aligns with lyrics section order
- [ ] Determinism: 10 runs identical

**Effort**: 8 story points
**Duration**: 9-11 hours

---

#### 4.2: Structure & Hook Planning
**Story**: "As an arranger, I want structure planning to ensure hooks and sections are well-positioned"

**Assigned To**: Skill Developer #2

**Tasks**:
- [ ] Implement `plan_structure(section_order: List[str], hook_strategy: str, seed: int) → Structure`:
  - Create song structure: "Intro–Verse–PreChorus–Chorus–..."
  - Calculate section durations (from blueprint or defaults)
  - Place hooks strategically (chorus, bridge, final chorus)
  - Return structure object with ordered sections and target durations
- [ ] Validate structure against blueprint required sections

**Acceptance Criteria**:
- [ ] Structure matches lyrics
- [ ] Hooks positioned per hook_strategy
- [ ] Durations reasonable (total ~3-4 min)

**Effort**: 4 story points
**Duration**: 4-5 hours

---

#### 4.3: Mix Configuration
**Story**: "As a mix engineer, I want mix targets configured so that the song has consistent loudness and space"

**Assigned To**: Skill Developer #2

**Tasks**:
- [ ] Implement `configure_mix(style: Style, energy: str, seed: int) → MixConfig`:
  - Determine LUFS based on energy: low energy → -14, high → -10
  - Choose space (reverb) based on mood: energetic → tight, ballad → lush
  - Determine stereo width based on instrumentation
  - Return MixConfig object
- [ ] Add reasonable defaults from genre blueprint

**Acceptance Criteria**:
- [ ] LUFS reasonable for genre
- [ ] Space and stereo width appropriate
- [ ] Reproducible with seed

**Effort**: 3 story points
**Duration**: 3-4 hours

---

#### 4.4: Section Meta Tags
**Story**: "As a producer, I want per-section tags so that I can give specific production guidance per section"

**Assigned To**: Skill Developer #2

**Tasks**:
- [ ] Implement `generate_section_tags(structure: Structure, style: Style, seed: int) → Dict[str, List[str]]`:
  - For each section, generate tags: "anthemic", "stripped-down", "build-up", "minimal", etc.
  - Intro: less instrumentation, lower energy
  - Chorus: anthemic, hook-forward, high energy
  - Bridge: contrast (minimal or dramatic)
  - Outro: fade-out or powerful close
- [ ] Return dict mapping section name → tags list

**Acceptance Criteria**:
- [ ] All sections have tags
- [ ] Tags are musically appropriate
- [ ] Deterministic with seed

**Effort**: 3 story points
**Duration**: 3-4 hours

---

#### 4.5: PRODUCER Skill Events, Tests & Documentation
**Story**: "As QA and documentation, I want PRODUCER tested and documented"

**Assigned To**: QA Automation + Skill Developer #2

**Tasks**:
- [ ] Add event emission (START, END, FAIL)
- [ ] Create `tests/skills/test_producer.py`:
  - Test structure alignment with lyrics
  - Test hook count generation
  - Test mix configuration
  - Test section tags generation
  - Test determinism: 10 runs identical
  - Coverage ≥95%
- [ ] Write SKILL.md with structure examples
- [ ] Document mix guidelines

**Acceptance Criteria**:
- [ ] Tests pass
- [ ] Determinism ≥99%
- [ ] Coverage ≥95%

**Effort**: 5 story points
**Duration**: 5-7 hours

---

### Phase 4 Summary

| Task | Effort | Duration | Owner |
|------|--------|----------|-------|
| 4.1: Core Implementation | 8 pts | 9-11h | Skill Dev #2 |
| 4.2: Structure Planning | 4 pts | 4-5h | Skill Dev #2 |
| 4.3: Mix Configuration | 3 pts | 3-4h | Skill Dev #2 |
| 4.4: Section Tags | 3 pts | 3-4h | Skill Dev #2 |
| 4.5: Events, Tests, Docs | 5 pts | 5-7h | QA + Skill Dev |
| **PHASE 4 TOTAL** | **23 pts** | **24-31h** | Skill Dev #2 |

**Success Criteria**: PRODUCER generates valid arrangement, ≥99% reproducibility, structure aligns with lyrics

---

## Phase Sequence Recommendation

- **Weeks 1-2 Parallel**:
  - Phase 0 (Infrastructure): Week 1, Days 1-3
  - Phase 1 (PLAN): Week 1, Days 3-5 + Week 2 Day 1
  - Phase 2 (STYLE): Week 1, Days 4-5 + Week 2
  - Phase 3 (LYRICS): Week 1 Days 5 + Week 2 (overlaps, longer duration)
  - Phase 4 (PRODUCER): Week 2 (after STYLE output available)

**Critical Path**: Phase 0 → Phase 1 → Phases 2,3,4 in parallel

---

**Document continues with Phase 5-10 in separate files or sections**

