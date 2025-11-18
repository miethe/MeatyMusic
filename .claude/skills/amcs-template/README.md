# AMCS Skill Template

**Purpose**: Reusable template for creating deterministic workflow skills for the Agentic Music Creation System (AMCS).

**Target Time**: <15 minutes to create a new skill using this template.

## What This Template Provides

This template ensures consistency across all 8 AMCS workflow skills:

1. **SKILL.md**: Comprehensive documentation with 8 required sections
2. **implementation.py**: Python skeleton with determinism patterns
3. **test_skill.py**: Test suite including 10-run determinism validation
4. **examples/**: Sample inputs, outputs, and verification guide

## Quick Start: Create a New Skill in <15 Minutes

### Step 1: Copy Template (30 seconds)

```bash
# Copy template to new skill directory
cp -r .claude/skills/amcs-template .claude/skills/workflow/{skill_name}

# Example: Create PLAN skill
cp -r .claude/skills/amcs-template .claude/skills/workflow/plan
```

### Step 2: Global Find & Replace (2 minutes)

Open all template files and replace these placeholders:

| Placeholder | Replace With | Example |
|------------|--------------|---------|
| `{SKILL_NAME}` | Skill name (uppercase) | `PLAN`, `STYLE`, `LYRICS` |
| `{Skill Title}` | Skill title (title case) | `Plan Generator`, `Style Generator` |
| `{skill_name}` | Skill name (lowercase) | `plan`, `style`, `lyrics` |
| `{skill_module}` | Python module name | `plan`, `style`, `lyrics` |
| `{skill_function}` | Main function name | `generate_plan`, `generate_style` |
| `{ACTION}` | Skill action verb | `generate`, `validate`, `compose` |
| `{NODE_INDEX}` | Node index (0-7) | `0` (PLAN), `1` (STYLE), etc. |
| `{NODE_NAME}` | Node name | `PLAN`, `STYLE`, etc. |

**Pro Tip**: Use your editor's multi-file find-and-replace to do this in seconds.

### Step 3: Fill in SKILL.md (5 minutes)

Open `SKILL.md` and fill in these sections:

1. **Overview**: 2-3 sentences describing what the skill does
2. **Input Contract**: List all required and optional inputs
3. **Output Contract**: Define the output structure
4. **Determinism Requirements**: Specify seed usage, temperature, retrieval
5. **Constraints & Policies**: List all rules to enforce
6. **Implementation Guidance**: Step-by-step instructions (3-5 steps)
7. **Examples**: 3+ realistic input/output pairs
8. **Common Pitfalls**: 3-5 things that commonly go wrong

**Reference**: See existing skills in `.claude/skills/workflow/{plan,style,validate}/SKILL.md`

### Step 4: Implement Python Skeleton (5 minutes)

Open `implementation.py` and complete the TODOs:

```python
# TODO 1: Define Input/Output Schemas (optional)
# TODO 2: Configure @workflow_skill decorator
# TODO 3: Extract inputs from inputs dict
# TODO 4: Seed random operations (CRITICAL!)
# TODO 5: Implement core logic (3-5 steps)
# TODO 6: Assemble output dictionary
# TODO 7: Compute hash for provenance
# TODO 8: Return output
```

**Key Pattern**:
```python
@workflow_skill(
    name="amcs.{skill_name}.{action}",
    deterministic=True,
)
async def {function_name}(inputs: Dict[str, Any], context: WorkflowContext) -> Dict[str, Any]:
    # Extract inputs
    sds = inputs["sds"]

    # Implement logic (use context.seed for randomness!)
    result = process(sds, seed=context.seed)

    # Assemble output
    output = {
        "result": result,
        "_hash": compute_hash(result),
    }

    return {"output_key": output}
```

### Step 5: Update Tests (3 minutes)

Open `test_skill.py` and:

1. Update fixtures with realistic sample data
2. Customize assertions in `test_basic_generation`
3. Add skill-specific test cases
4. Verify determinism test runs

**Critical Test**:
```python
@pytest.mark.parametrize("run_number", range(10))
async def test_{skill_name}_determinism(sample_input, context, run_number):
    result = await {skill_function}(sample_input, context)

    if run_number == 0:
        pytest.first_hash = result["output"]["_hash"]

    assert result["output"]["_hash"] == pytest.first_hash
```

### Step 6: Verify Determinism (2 minutes)

```bash
# Run determinism test
pytest tests/unit/skills/test_{skill_name}.py::test_{skill_name}_determinism_10_runs -v

# Expected: All 10 runs PASS with identical hashes
```

## Template Structure

```
amcs-template/
├── SKILL.md                          # Comprehensive skill documentation
├── implementation.py                 # Python skeleton with patterns
├── test_skill.py                     # Test suite with determinism tests
├── examples/
│   ├── sample_input.json            # Example input
│   ├── sample_output.json           # Example output
│   └── determinism_verification.md  # Verification guide
└── README.md                         # This file
```

## 8 Required SKILL.md Sections

Every skill MUST include these sections:

1. **Overview**: What and why
2. **When to Use**: Position in workflow, triggers
3. **Input Contract**: Schema references and requirements
4. **Output Contract**: Schema references and structure
5. **Determinism Requirements**: Seed, temperature, retrieval
6. **Constraints & Policies**: Rules to enforce
7. **Implementation Guidance**: Step-by-step instructions
8. **Examples**: 3+ realistic scenarios

**Plus**:
- Testing guidance
- Common pitfalls
- Troubleshooting
- Related skills
- References

## Determinism Patterns

### Pattern 1: Seeded Random Selection

```python
import random

def select_tags(candidates: list, count: int, seed: int) -> list:
    """Select tags deterministically."""
    rng = random.Random(seed)  # CRITICAL: Seed the RNG
    return rng.sample(candidates, count)
```

### Pattern 2: Seeded LLM Generation

```python
async def generate_lyrics(prompt: str, seed: int) -> str:
    """Generate lyrics deterministically."""
    response = await llm.generate(
        prompt=prompt,
        temperature=0.2,  # CRITICAL: Low temperature
        top_p=0.9,
        seed=seed,  # CRITICAL: Seed the LLM
    )
    return response
```

### Pattern 3: Deterministic Retrieval

```python
def get_blueprint(genre: str) -> dict:
    """Retrieve blueprint deterministically."""
    # CRITICAL: Deterministic ordering
    results = db.query(
        "SELECT * FROM blueprints WHERE genre = ? ORDER BY id",
        genre
    )
    return results[0]
```

### Pattern 4: Hash Computation

```python
from app.workflows.skill import compute_hash

def finalize_output(data: dict) -> dict:
    """Add hash to output."""
    data["_hash"] = compute_hash(data)  # CRITICAL: Always hash
    return data
```

## 10-Point Determinism Checklist

Before marking a skill as complete:

- [ ] 1. All random operations use `context.seed`
- [ ] 2. No unseeded `random.random()`, `random.choice()`, etc.
- [ ] 3. No `datetime.now()` or `time.time()` calls
- [ ] 4. LLM calls use temperature ≤ 0.3, top_p ≤ 0.9, seed
- [ ] 5. Retrieval is deterministic (pinned by hash or ordered)
- [ ] 6. Output includes `_hash` field via `compute_hash()`
- [ ] 7. No external API calls without mocking/caching
- [ ] 8. JSON serialization uses `sort_keys=True`
- [ ] 9. Test with 10 identical runs, verify identical `_hash`
- [ ] 10. Logs include `run_id`, `seed`, and `hash`

## Testing Commands

```bash
# Run all tests for a skill
pytest tests/unit/skills/test_{skill_name}.py -v

# Run only determinism test (critical!)
pytest tests/unit/skills/test_{skill_name}.py::test_{skill_name}_determinism_10_runs -v

# Run with coverage
pytest tests/unit/skills/test_{skill_name}.py --cov=app.skills.{skill_name} --cov-report=term-missing

# Run fast tests (exclude slow performance tests)
pytest tests/unit/skills/test_{skill_name}.py -m "not slow" -v
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Not Using context.seed

```python
# WRONG
import random
tags = random.sample(all_tags, 5)  # Non-deterministic!

# RIGHT
import random
rng = random.Random(context.seed)
tags = rng.sample(all_tags, 5)  # Deterministic
```

### ❌ Mistake 2: High LLM Temperature

```python
# WRONG
lyrics = await llm.generate(prompt, temperature=0.9)  # Too variable!

# RIGHT
lyrics = await llm.generate(
    prompt,
    temperature=0.2,
    top_p=0.9,
    seed=context.seed
)
```

### ❌ Mistake 3: Missing Hash

```python
# WRONG
return {"plan": plan}  # No hash!

# RIGHT
plan["_hash"] = compute_hash(plan)
return {"plan": plan}
```

### ❌ Mistake 4: Datetime Dependencies

```python
# WRONG
run_id = f"run_{datetime.now().timestamp()}"  # Non-deterministic!

# RIGHT
run_id = str(context.run_id)  # Deterministic
```

### ❌ Mistake 5: Unordered Iteration

```python
# WRONG
for tag in tags_dict:  # Order not guaranteed!
    process(tag)

# RIGHT
for tag in sorted(tags_dict):  # Deterministic order
    process(tag)
```

## File Placement Guide

### SKILL.md
**Location**: `.claude/skills/workflow/{skill_name}/SKILL.md`

**Purpose**: AI-facing documentation that describes the skill contract, implementation guidance, and examples.

### implementation.py
**Location**: `services/api/app/skills/{skill_name}.py`

**Purpose**: Actual Python implementation of the skill.

### test_skill.py
**Location**: `services/api/tests/unit/skills/test_{skill_name}.py`

**Purpose**: Pytest test suite for the skill.

### examples/
**Location**: `.claude/skills/workflow/{skill_name}/examples/`

**Purpose**: Reference examples for documentation and testing.

## Integration with Workflow

Once your skill is complete:

1. **Register Skill**: Import in `services/api/app/skills/__init__.py`
2. **Add to Workflow**: Update orchestrator to call your skill
3. **Update Schemas**: Ensure input/output schemas exist
4. **Add to Tests**: Run full workflow integration tests
5. **Document**: Update `docs/amcs-overview.md` with skill details

## Example: Creating PLAN Skill

Here's how you'd create the PLAN skill:

```bash
# 1. Copy template
cp -r .claude/skills/amcs-template .claude/skills/workflow/plan

# 2. Replace placeholders (use find-replace in editor)
{SKILL_NAME} → PLAN
{skill_name} → plan
{skill_function} → generate_plan
{NODE_INDEX} → 0
{NODE_NAME} → PLAN

# 3. Fill in SKILL.md (see .claude/skills/workflow/plan/SKILL.md)

# 4. Implement app/skills/plan.py (see existing implementation)

# 5. Update tests/unit/skills/test_plan.py

# 6. Run tests
pytest tests/unit/skills/test_plan.py::test_plan_determinism_10_runs -v

# ✅ All 10 runs pass with identical hashes
```

## Support

**Questions?** Reference these files:
- Existing skills: `.claude/skills/workflow/{plan,style,validate}/`
- Workflow decorator: `services/api/app/workflows/skill.py`
- Test examples: `services/api/tests/unit/skills/`
- PRDs: `docs/project_plans/PRDs/`

**Issues?** Check:
- Determinism verification: `examples/determinism_verification.md`
- Common pitfalls in SKILL.md
- 10-point checklist at bottom of `implementation.py`

## References

- **Workflow PRD**: `docs/project_plans/PRDs/claude_code_orchestration.prd.md`
- **AMCS Overview**: `docs/amcs-overview.md`
- **Skill Creator**: `.claude/skills/skill-creator/SKILL.md`
- **Existing Skills**: `.claude/skills/workflow/{plan,style,lyrics,producer,compose,validate,fix,render,review}/`
