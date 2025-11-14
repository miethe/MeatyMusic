# SDS Validation Services

This document describes the implementation of **SDS-003: Blueprint Constraint Validator** and **SDS-004: Tag Conflict Resolver** for the SDS Aggregation feature.

## Overview

Two services were implemented to support SDS validation and tag conflict resolution:

1. **BlueprintValidatorService** - Validates SDS against genre-specific blueprint constraints
2. **TagConflictResolver** - Detects and resolves conflicting style tags

## BlueprintValidatorService

**Location**: `/home/user/MeatyMusic/services/api/app/services/blueprint_validator_service.py`

### Purpose

Validates a Song Design Spec (SDS) against blueprint constraints to ensure genre-specific rules are followed before workflow execution.

### Key Features

- **BPM Range Validation**: Ensures tempo_bpm is within blueprint's allowed range
- **Required Sections**: Verifies all required sections are present in lyrics
- **Banned Terms Check**: Placeholder for profanity validation (deferred to LYRICS node)
- **Section Line Count**: Validates section line count requirements are defined

### API

```python
class BlueprintValidatorService:
    def __init__(self, blueprint_repo: BlueprintRepository)

    async def validate_sds_against_blueprint(
        self,
        sds: Dict[str, Any],
        blueprint_id: str
    ) -> Tuple[bool, List[str]]:
        """Validate SDS against blueprint constraints.

        Args:
            sds: Complete SDS dictionary
            blueprint_id: Blueprint UUID string

        Returns:
            (is_valid, error_messages)
        """
```

### Validation Rules

#### 1. BPM Validation
- Checks `style.tempo_bpm` against `blueprint.rules.tempo_bpm` range
- Supports single BPM value or range [min, max]
- Error format: `"BPM {value} outside blueprint range [{min}, {max}]"`

#### 2. Required Sections
- Checks `lyrics.section_order` contains all `blueprint.rules.required_sections`
- Error format: `"Missing required sections: {section1}, {section2}"`

#### 3. Banned Terms (Placeholder)
- Currently defers actual text checking to LYRICS workflow node
- Validates explicit constraint is properly set

#### 4. Section Line Counts
- Validates that `lyrics.constraints.section_requirements` defines line counts for sections
- Error format: `"Section '{name}' requires line count constraints (min: {n})"`

### Usage Example

```python
from app.services.blueprint_validator_service import BlueprintValidatorService
from app.repositories.blueprint_repo import BlueprintRepository

# Initialize service
validator = BlueprintValidatorService(blueprint_repo)

# Validate SDS
sds = {
    "style": {"tempo_bpm": 120},
    "lyrics": {
        "section_order": ["verse", "chorus", "bridge"],
        "constraints": {
            "explicit": False,
            "section_requirements": {
                "verse": {"min_lines": 4},
                "chorus": {"min_lines": 2}
            }
        }
    }
}

is_valid, errors = await validator.validate_sds_against_blueprint(
    sds,
    blueprint_id="uuid-string"
)

if not is_valid:
    print(f"Validation failed: {errors}")
```

## TagConflictResolver

**Location**: `/home/user/MeatyMusic/services/api/app/services/tag_conflict_resolver.py`

### Purpose

Detects and resolves conflicting style tags using a conflict matrix to ensure coherent style specifications.

### Key Features

- **Bidirectional Conflict Map**: Loads conflict matrix and builds efficient lookup structure
- **Case-Insensitive Matching**: Normalizes tags to lowercase for matching
- **Deterministic Resolution**: Always produces same output for same input
- **Weight-Based Priority**: Drops lower-weight tags when resolving conflicts
- **Graceful Degradation**: Handles missing or invalid conflict matrix

### API

```python
class TagConflictResolver:
    def __init__(self, conflict_matrix_path: str = None)

    def find_conflicts(self, tags: List[str]) -> List[Tuple[str, str]]:
        """Find all conflicting tag pairs.

        Args:
            tags: List of style tags

        Returns:
            List of conflicting pairs: [(tag_a, tag_b), ...]
        """

    def resolve_conflicts(
        self,
        tags: List[str],
        weights: Dict[str, float] = None
    ) -> List[str]:
        """Resolve conflicts by dropping lower-weight tags.

        Args:
            tags: List of tags
            weights: Optional weight map (higher = higher priority)

        Returns:
            Conflict-free tag list
        """

    def reload_conflict_matrix(self) -> bool:
        """Reload conflict matrix from file."""
```

### Conflict Matrix Format

**Location**: `/home/user/MeatyMusic/taxonomies/conflict_matrix.json`

```json
[
  {
    "tag_a": "whisper",
    "tag_b": "anthemic",
    "reason": "vocal intensity contradiction",
    "category": "vocal_style"
  },
  {
    "tag_a": "upbeat",
    "tag_b": "melancholic",
    "reason": "mood contradiction",
    "category": "mood"
  }
]
```

### Resolution Algorithm

1. **Sort by weight**: If weights provided, sort tags descending by weight
2. **Iterate tags**: Process each tag in order
3. **Check conflicts**: For each tag, check if it conflicts with already-kept tags
4. **Drop or keep**: If conflict, drop current tag; otherwise add to kept set
5. **Return result**: Return conflict-free tag list

### Usage Example

```python
from app.services.tag_conflict_resolver import TagConflictResolver

# Initialize resolver
resolver = TagConflictResolver()

# Find conflicts
tags = ["whisper", "anthemic", "upbeat", "melancholic"]
conflicts = resolver.find_conflicts(tags)
# Returns: [('anthemic', 'whisper'), ('melancholic', 'upbeat')]

# Resolve conflicts with weights
weights = {
    "whisper": 0.5,
    "anthemic": 0.8,
    "upbeat": 0.9,
    "melancholic": 0.3
}
resolved = resolver.resolve_conflicts(tags, weights)
# Returns: ['upbeat', 'anthemic']  (kept higher-weight tags)
```

## Integration Workflow

Typical SDS validation workflow:

1. **Client submits SDS** with style tags
2. **TagConflictResolver.find_conflicts()** checks for tag conflicts
3. **If conflicts found**: `TagConflictResolver.resolve_conflicts()` drops lower-weight tags
4. **BlueprintValidatorService.validate_sds_against_blueprint()** validates against blueprint
5. **If validation passes**: Proceed to workflow execution (PLAN → STYLE → LYRICS → ...)
6. **If validation fails**: Return errors to client

## Testing

### Test Coverage

**BlueprintValidatorService**: 17 tests
- Valid/invalid SDS scenarios
- BPM range validation (single value, range, out of bounds)
- Required sections validation
- Section line count validation
- Multiple error accumulation
- Missing blueprint handling
- Graceful handling of missing style/lyrics

**TagConflictResolver**: 25 tests
- Conflict matrix loading (success, not found, invalid JSON)
- Bidirectional conflict map building
- Case-insensitive matching
- Finding conflicts (single, multiple, none)
- Resolving conflicts (with/without weights)
- Deterministic output
- Original case preservation
- Chain conflicts
- Empty inputs

### Running Tests

```bash
cd /home/user/MeatyMusic/services/api

# Run all validation tests
.venv/bin/python -m pytest tests/unit/test_blueprint_validator_service.py tests/unit/test_tag_conflict_resolver.py -v

# Run specific test
.venv/bin/python -m pytest tests/unit/test_blueprint_validator_service.py::TestBlueprintValidatorService::test_validate_bpm_out_of_range -v
```

### Example Output

```bash
# Run example demonstrating both services
.venv/bin/python examples/sds_validation_example.py
```

## Implementation Notes

### Design Decisions

1. **Async vs Sync**: BlueprintValidatorService uses async methods to match repository pattern, but TagConflictResolver is synchronous (no I/O)

2. **Case-Insensitive Matching**: Tags are normalized to lowercase for conflict checking but original case is preserved in output

3. **Graceful Degradation**: Both services handle missing files/data gracefully with logging rather than crashing

4. **Deterministic Output**: TagConflictResolver sorts conflicts lexicographically to ensure deterministic output

5. **Logging Strategy**: Uses structlog for structured logging with context (blueprint_id, tag counts, conflicts, etc.)

### MeatyMusic Patterns

- **Type hints**: Full type annotations on all methods
- **Structured logging**: Using structlog with context fields
- **Error messages**: Clear, user-facing error descriptions
- **Repository pattern**: BlueprintValidatorService depends on BlueprintRepository abstraction
- **No async for pure logic**: TagConflictResolver is synchronous (no I/O operations)

## Future Enhancements

1. **Banned Terms**: Implement actual text scanning in `_validate_banned_terms()`
2. **Conflict Weights**: Store default weights in conflict matrix for auto-resolution
3. **Conflict Categories**: Use category field for more targeted conflict resolution
4. **Performance**: Cache loaded conflict matrix globally for multiple requests
5. **Metrics**: Add prometheus metrics for validation pass/fail rates, conflict counts

## References

- **Implementation Plan**: `docs/project_plans/implementation_plans/sds-aggregation-implementation-v1.md`
- **Blueprint PRD**: `docs/project_plans/PRDs/blueprint.prd.md`
- **Style PRD**: `docs/project_plans/PRDs/style.prd.md`
- **SDS PRD**: `docs/project_plans/PRDs/sds.prd.md`
- **Conflict Matrix**: `taxonomies/conflict_matrix.json`

## Files Created

### Services
- `/home/user/MeatyMusic/services/api/app/services/blueprint_validator_service.py` (278 lines)
- `/home/user/MeatyMusic/services/api/app/services/tag_conflict_resolver.py` (260 lines)

### Tests
- `/home/user/MeatyMusic/services/api/tests/unit/test_blueprint_validator_service.py` (17 tests, 284 lines)
- `/home/user/MeatyMusic/services/api/tests/unit/test_tag_conflict_resolver.py` (25 tests, 343 lines)

### Documentation
- `/home/user/MeatyMusic/services/api/examples/sds_validation_example.py` (190 lines)
- `/home/user/MeatyMusic/services/api/app/services/README_VALIDATION.md` (this file)

## Test Results

```
================================ test session starts =================================
platform linux -- Python 3.11.14, pytest-8.4.2, pluggy-1.6.0
rootdir: /home/user/MeatyMusic/services/api
configfile: pytest.ini
plugins: anyio-4.11.0, asyncio-0.23.8, cov-7.0.0
asyncio: mode=Mode.AUTO
collected 42 items

test_blueprint_validator_service.py::TestBlueprintValidatorService     17 PASSED
test_tag_conflict_resolver.py::TestTagConflictResolver                 25 PASSED

================================ 42 passed in 2.19s ==================================
```

All tests passing! ✓
