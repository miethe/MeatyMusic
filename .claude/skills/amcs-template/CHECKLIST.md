# AMCS Skill Implementation Checklist

**Purpose**: Quick reference for implementing a new AMCS workflow skill.

**Print this**: Keep visible while coding.

---

## Pre-Implementation

- [ ] Read relevant PRD in `docs/project_plans/PRDs/`
- [ ] Check workflow position in `claude_code_orchestration.prd.md`
- [ ] Review existing similar skill (if any)
- [ ] Understand determinism requirements

---

## Step 1: Setup (30 seconds)

- [ ] Copy template: `cp -r .claude/skills/amcs-template .claude/skills/workflow/{skill_name}`
- [ ] Navigate to new directory: `cd .claude/skills/workflow/{skill_name}`

---

## Step 2: Global Replacements (2 minutes)

Find and replace in all files:

- [ ] `{SKILL_NAME}` → `PLAN` | `STYLE` | `LYRICS` | etc.
- [ ] `{Skill Title}` → `Plan Generator` | `Style Generator` | etc.
- [ ] `{skill_name}` → `plan` | `style` | `lyrics` | etc.
- [ ] `{skill_module}` → `plan` | `style` | `lyrics` | etc.
- [ ] `{skill_function}` → `generate_plan` | `generate_style` | etc.
- [ ] `{ACTION}` → `generate` | `validate` | `compose` | etc.
- [ ] `{NODE_INDEX}` → `0` (PLAN) | `1` (STYLE) | `2` (LYRICS) | etc.
- [ ] `{NODE_NAME}` → `PLAN` | `STYLE` | `LYRICS` | etc.

---

## Step 3: SKILL.md (5 minutes)

### Section 1: Overview
- [ ] Write 2-3 sentence description
- [ ] Explain position in workflow

### Section 2: When to Use
- [ ] Define trigger conditions
- [ ] Specify parallel/sequential execution
- [ ] List upstream/downstream dependencies

### Section 3: Input Contract
- [ ] List all required inputs with schema references
- [ ] List all optional inputs with defaults
- [ ] Include seed parameter

### Section 4: Output Contract
- [ ] Define output structure with schema reference
- [ ] List all output fields with descriptions
- [ ] Include `_hash` field requirement

### Section 5: Determinism Requirements
- [ ] Specify seed usage: `run_seed + {NODE_INDEX}`
- [ ] Set temperature (or N/A): `0.2` | `N/A`
- [ ] Set top_p (or N/A): `0.9` | `N/A`
- [ ] Define retrieval strategy: `None` | `Pinned by hash`
- [ ] Confirm hashing requirement

### Section 6: Constraints & Policies
- [ ] List all blueprint constraints
- [ ] List all policy rules
- [ ] List all validation checks

### Section 7: Implementation Guidance
- [ ] Break into 3-5 major steps
- [ ] Provide algorithm details for each step
- [ ] Include code examples
- [ ] Define error conditions

### Section 8: Examples
- [ ] Add typical use case example
- [ ] Add edge case example
- [ ] Add error case example

### Sections 9-10: Testing & Troubleshooting
- [ ] Describe testing approach
- [ ] List 3-5 common pitfalls
- [ ] Add troubleshooting guide

### Section 11: References
- [ ] Link to relevant PRDs
- [ ] Link to related skills
- [ ] Link to schemas

---

## Step 4: implementation.py (5 minutes)

### TODO 1: Schemas (Optional)
- [ ] Define Pydantic input schema (optional)
- [ ] Define Pydantic output schema (optional)

### TODO 2: Decorator
- [ ] Set skill name: `amcs.{skill}.{action}`
- [ ] Uncomment schemas if defined
- [ ] Set `deterministic=True` (or False for RENDER)

### TODO 3: Extract Inputs
- [ ] Extract all required inputs from `inputs` dict
- [ ] Add logging for skill start

### TODO 4: Seed Random Operations
- [ ] Seed all random operations with `context.seed`
- [ ] Verify no unseeded random calls
- [ ] Verify no datetime dependencies

### TODO 5: Implement Core Logic
- [ ] Implement Step 1 with helper function
- [ ] Validate Step 1 results
- [ ] Implement Step 2 with helper function
- [ ] Log intermediate progress
- [ ] Implement Step 3+ with helper functions

### TODO 6: Assemble Output
- [ ] Create output dictionary
- [ ] Include all required fields
- [ ] Set `_hash` to empty string initially

### TODO 7: Compute Hash
- [ ] Call `compute_hash(output)`
- [ ] Assign to `output["_hash"]`

### TODO 8: Return Output
- [ ] Return `{"{output_key}": output}`
- [ ] Add logging for skill completion

### Helper Functions
- [ ] Implement all `_step_X_implementation` functions
- [ ] Add docstrings to all helpers
- [ ] Add type hints to all helpers

---

## Step 5: test_skill.py (3 minutes)

### Fixtures
- [ ] Update `mock_context` with correct node_index and node_name
- [ ] Create realistic `sample_input` fixture
- [ ] Create `invalid_input` fixture for validation tests

### Basic Tests
- [ ] Customize `test_basic_generation` assertions
- [ ] Verify required fields exist
- [ ] Verify hash format (64 hex chars)

### Determinism Test (CRITICAL)
- [ ] Verify `test_determinism_10_runs` uses correct function
- [ ] Verify correct output key is accessed
- [ ] Add skill-specific field assertions

### Validation Tests
- [ ] Update `test_rejects_invalid_input` with expected error
- [ ] Add constraint validation tests

### Edge Case Tests
- [ ] Add edge case handling tests
- [ ] Test minimal input scenario

### Policy Tests
- [ ] Add policy enforcement tests
- [ ] Verify constraints are checked

---

## Step 6: Verify Determinism (2 minutes)

### Run Determinism Test
```bash
pytest tests/unit/skills/test_{skill_name}.py::test_{skill_name}_determinism_10_runs -v
```

- [ ] All 10 runs PASS
- [ ] All 10 runs produce identical hash

### If Test Fails
- [ ] Check for unseeded random operations
- [ ] Check for datetime dependencies
- [ ] Check LLM temperature/top_p/seed
- [ ] Check retrieval determinism
- [ ] Check JSON serialization (sort_keys)

---

## 10-Point Determinism Checklist

**Before marking skill complete**:

- [ ] **1. Seed**: All random operations use `context.seed`
- [ ] **2. No Unseeded Random**: No `random.random()` without `random.seed()`
- [ ] **3. No Datetime**: No `datetime.now()` or `time.time()`
- [ ] **4. LLM Params**: Temperature ≤ 0.3, top_p ≤ 0.9, seed set
- [ ] **5. Retrieval**: Deterministic (pinned by hash or ordered)
- [ ] **6. Hash**: Output includes `_hash` via `compute_hash()`
- [ ] **7. No Uncontrolled APIs**: External calls mocked or cached
- [ ] **8. JSON Sorting**: `json.dumps(..., sort_keys=True)`
- [ ] **9. Test Passes**: 10-run determinism test passes
- [ ] **10. Logging**: Logs include `run_id`, `seed`, `hash`

---

## Post-Implementation

### Code Quality
- [ ] All functions have docstrings
- [ ] All functions have type hints
- [ ] No TODOs remain in code
- [ ] Code follows project style guide

### Testing
- [ ] All tests pass
- [ ] Coverage ≥ 80%
- [ ] Edge cases covered
- [ ] Error cases covered

### Documentation
- [ ] SKILL.md complete and accurate
- [ ] Examples realistic and correct
- [ ] Common pitfalls documented

### Integration
- [ ] Register in `app/skills/__init__.py`
- [ ] Add to workflow orchestrator
- [ ] Update `docs/amcs-overview.md`
- [ ] Create ADR if significant decisions made

---

## Final Verification

```bash
# Run all tests for this skill
pytest tests/unit/skills/test_{skill_name}.py -v

# Run determinism test specifically
pytest tests/unit/skills/test_{skill_name}.py::test_{skill_name}_determinism_10_runs -v

# Check coverage
pytest tests/unit/skills/test_{skill_name}.py --cov=app.skills.{skill_name} --cov-report=term-missing

# Run full workflow integration test
pytest tests/integration/test_workflow.py -v
```

- [ ] All unit tests pass
- [ ] Determinism test passes (10/10)
- [ ] Coverage ≥ 80%
- [ ] Integration tests pass

---

## Node Index Reference

| Skill | Node Index | Node Name |
|-------|-----------|-----------|
| PLAN | 0 | PLAN |
| STYLE | 1 | STYLE |
| LYRICS | 2 | LYRICS |
| PRODUCER | 3 | PRODUCER |
| COMPOSE | 4 | COMPOSE |
| VALIDATE | 5 | VALIDATE |
| FIX | 6 | FIX |
| RENDER | 7 | RENDER |
| REVIEW | 8 | REVIEW |

---

## Quick Commands

```bash
# Create new skill
cp -r .claude/skills/amcs-template .claude/skills/workflow/{skill_name}

# Run tests
pytest tests/unit/skills/test_{skill_name}.py -v

# Run determinism test
pytest tests/unit/skills/test_{skill_name}.py::test_{skill_name}_determinism_10_runs -v

# Check coverage
pytest tests/unit/skills/test_{skill_name}.py --cov=app.skills.{skill_name} --cov-report=html

# Run all skills tests
pytest tests/unit/skills/ -v

# Run integration tests
pytest tests/integration/test_workflow.py -v
```

---

**Estimated Time**: ~15 minutes total

**Questions?** See `README.md` or existing skills in `.claude/skills/workflow/`
