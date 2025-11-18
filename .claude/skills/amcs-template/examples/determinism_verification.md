# Determinism Verification Example

This document demonstrates how to verify determinism for your AMCS workflow skill.

## What is Determinism?

**Determinism** means: **Same inputs + same seed => identical outputs**

This is critical for AMCS because:
- Users must be able to reproduce exact results
- Debugging requires consistent behavior
- Version control of creative decisions needs repeatability
- A/B testing requires controlled variations

## How to Verify Determinism

### 1. Run the Determinism Test

```bash
# Run 10 identical runs and verify same output
pytest tests/unit/skills/test_{skill_name}.py::test_{skill_name}_determinism_10_runs -v
```

**Expected Output:**
```
test_{skill_name}_determinism_10_runs[0] PASSED
test_{skill_name}_determinism_10_runs[1] PASSED
test_{skill_name}_determinism_10_runs[2] PASSED
test_{skill_name}_determinism_10_runs[3] PASSED
test_{skill_name}_determinism_10_runs[4] PASSED
test_{skill_name}_determinism_10_runs[5] PASSED
test_{skill_name}_determinism_10_runs[6] PASSED
test_{skill_name}_determinism_10_runs[7] PASSED
test_{skill_name}_determinism_10_runs[8] PASSED
test_{skill_name}_determinism_10_runs[9] PASSED
```

### 2. Manual Verification

Run the skill twice with same inputs and compare hashes:

```python
import asyncio
from app.skills.{skill_module} import {skill_function}
from app.workflows.skill import WorkflowContext
from uuid import uuid4

async def verify_determinism():
    # Fixed context
    context = WorkflowContext(
        run_id=uuid4(),
        song_id=uuid4(),
        seed=42,  # FIXED SEED
        node_index=0,
        node_name="TEST",
    )

    # Fixed input
    inputs = {
        "sds": {...}  # Your test input
    }

    # Run twice
    result1 = await {skill_function}(inputs, context)
    result2 = await {skill_function}(inputs, context)

    # Compare hashes
    hash1 = result1["{output_key}"]["_hash"]
    hash2 = result2["{output_key}"]["_hash"]

    print(f"Run 1 hash: {hash1}")
    print(f"Run 2 hash: {hash2}")
    print(f"Deterministic: {hash1 == hash2}")

    return hash1 == hash2

# Run verification
asyncio.run(verify_determinism())
```

**Expected Output:**
```
Run 1 hash: a1b2c3d4e5f6789012345678901234567890abcdef123456789012345678901234
Run 2 hash: a1b2c3d4e5f6789012345678901234567890abcdef123456789012345678901234
Deterministic: True
```

## Common Determinism Violations

### ❌ Violation 1: Unseeded Random

**Problem:**
```python
import random

def generate_tags():
    return random.choice(["tag1", "tag2"])  # WRONG: Not seeded!
```

**Solution:**
```python
import random

def generate_tags(seed: int):
    rng = random.Random(seed)
    return rng.choice(["tag1", "tag2"])  # CORRECT: Seeded
```

### ❌ Violation 2: Datetime Dependencies

**Problem:**
```python
from datetime import datetime

def generate_id():
    return f"id_{datetime.now().timestamp()}"  # WRONG: Non-deterministic!
```

**Solution:**
```python
def generate_id(seed: int):
    return f"id_{seed}"  # CORRECT: Deterministic
```

### ❌ Violation 3: Non-Deterministic Retrieval

**Problem:**
```python
def get_blueprint(genre: str):
    results = db.query("SELECT * FROM blueprints WHERE genre = ?", genre)
    return results[0]  # WRONG: Database order not guaranteed!
```

**Solution:**
```python
def get_blueprint(genre: str):
    results = db.query(
        "SELECT * FROM blueprints WHERE genre = ? ORDER BY id",  # CORRECT: Deterministic order
        genre
    )
    return results[0]
```

### ❌ Violation 4: High LLM Temperature

**Problem:**
```python
response = llm.generate(
    prompt="Write a verse",
    temperature=0.9  # WRONG: Too high for determinism!
)
```

**Solution:**
```python
response = llm.generate(
    prompt="Write a verse",
    temperature=0.2,  # CORRECT: Low temperature
    top_p=0.9,
    seed=context.seed  # CORRECT: Seeded
)
```

### ❌ Violation 5: Unordered Dictionary Iteration

**Problem:**
```python
tags = {}
for genre in genres:  # WRONG: Dict iteration order not guaranteed in old Python
    tags[genre] = get_tags(genre)
```

**Solution:**
```python
tags = {}
for genre in sorted(genres):  # CORRECT: Sorted iteration
    tags[genre] = get_tags(genre)
```

## Determinism Checklist

Before marking your skill as deterministic, verify:

- [ ] **Seed Propagation**: All random operations use `context.seed`
- [ ] **No Unseeded Random**: No `random.random()` without `random.seed()`
- [ ] **No Datetime**: No `datetime.now()` or `time.time()`
- [ ] **LLM Parameters**: Temperature ≤ 0.3, top_p ≤ 0.9, seed set
- [ ] **Ordered Retrieval**: All DB queries have deterministic `ORDER BY`
- [ ] **Hash Pinning**: Source retrieval uses content hash, not IDs
- [ ] **Sorted Iteration**: Iterate over sorted collections
- [ ] **JSON Stability**: Use `sort_keys=True` in `json.dumps()`
- [ ] **Test Passes**: 10-run determinism test passes
- [ ] **Logs Include Seed**: All logs include `run_id` and `seed`

## Example Test Results

### ✅ Good: Deterministic Skill

```bash
$ pytest tests/unit/skills/test_plan.py::test_plan_determinism -v

test_plan_determinism[0] PASSED  # Hash: abc123...
test_plan_determinism[1] PASSED  # Hash: abc123... (SAME)
test_plan_determinism[2] PASSED  # Hash: abc123... (SAME)
test_plan_determinism[3] PASSED  # Hash: abc123... (SAME)
test_plan_determinism[4] PASSED  # Hash: abc123... (SAME)
test_plan_determinism[5] PASSED  # Hash: abc123... (SAME)
test_plan_determinism[6] PASSED  # Hash: abc123... (SAME)
test_plan_determinism[7] PASSED  # Hash: abc123... (SAME)
test_plan_determinism[8] PASSED  # Hash: abc123... (SAME)
test_plan_determinism[9] PASSED  # Hash: abc123... (SAME)

✅ All hashes identical: DETERMINISTIC
```

### ❌ Bad: Non-Deterministic Skill

```bash
$ pytest tests/unit/skills/test_bad_skill.py::test_bad_skill_determinism -v

test_bad_skill_determinism[0] PASSED  # Hash: abc123...
test_bad_skill_determinism[1] FAILED  # Hash: def456... (DIFFERENT!)

AssertionError: Run 1: Hash mismatch! Determinism broken.
Expected: abc123...
Got: def456...

❌ Hashes differ: NON-DETERMINISTIC
```

## References

- PRD: `docs/project_plans/PRDs/claude_code_orchestration.prd.md` (Section 2.3: Determinism)
- Workflow Decorator: `services/api/app/workflows/skill.py`
- Hash Computation: `app.workflows.skill.compute_hash()`
- Test Examples: `services/api/tests/unit/skills/test_determinism.py`

## Next Steps

1. Run determinism test: `pytest tests/unit/skills/test_{skill_name}.py::test_{skill_name}_determinism_10_runs -v`
2. If fails: Review code for violations above
3. Fix violations: Add seeding, remove datetime, lower temperature
4. Re-run test: Verify all 10 runs produce identical hash
5. Document: Update SKILL.md with determinism requirements
