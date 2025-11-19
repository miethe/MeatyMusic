# Conflict Detector Implementation

## Overview

The Conflict Detector service provides comprehensive tag conflict detection and resolution for the MeatyMusic AMCS validation framework. It implements multiple resolution strategies, detailed violation reports, and remediation recommendations.

**Implementation Date**: 2025-11-19
**Phase**: 2.2 - Validation Framework
**Files**:
- `/home/user/MeatyMusic/services/api/app/services/conflict_detector.py` (main implementation)
- `/home/user/MeatyMusic/tests/unit/services/test_conflict_detector.py` (unit tests)

## Features

### 1. Conflict Detection

The `detect_tag_conflicts()` function analyzes a list of tags and returns detailed information about each conflict:

```python
from app.services.conflict_detector import ConflictDetector

detector = ConflictDetector()
conflicts = detector.detect_tag_conflicts(["whisper", "anthemic", "upbeat"])

# Returns:
[
    {
        "tag_a": "whisper",
        "tag_b": "anthemic",
        "reason": "vocal intensity contradiction",
        "category": "vocal_style"
    }
]
```

**Key Features**:
- Case-insensitive tag matching
- Detailed conflict information (reason, category)
- Comprehensive logging of all detections
- Integration with existing conflict matrix

### 2. Conflict Resolution

The `resolve_conflicts()` function removes conflicting tags using one of three strategies:

#### Strategy 1: Keep-First (Default)

Keeps the first occurrence of conflicting tags, removes later ones.

```python
cleaned_tags = detector.resolve_conflicts(
    ["whisper", "anthemic", "upbeat"],
    strategy="keep-first"
)
# Returns: ["whisper", "upbeat"]
# "anthemic" removed (conflicts with "whisper")
```

**Use Case**: Default deterministic resolution when no priority information is available.

#### Strategy 2: Remove-Lowest-Priority

Removes tags with lower priority values, preserves higher-priority tags.

```python
tag_priorities = {
    "whisper": 0.5,
    "anthemic": 0.8,
    "upbeat": 0.6
}

cleaned_tags = detector.resolve_conflicts(
    ["whisper", "anthemic", "upbeat"],
    strategy="remove-lowest-priority",
    tag_priorities=tag_priorities
)
# Returns: ["anthemic", "upbeat"]
# "whisper" removed (lowest priority: 0.5)
```

**Use Case**: When tag importance is known (e.g., from blueprint weights or user preferences).

#### Strategy 3: Remove-Highest-Priority

Removes tags with higher priority values, preserves lower-priority tags.

```python
cleaned_tags = detector.resolve_conflicts(
    ["whisper", "anthemic", "upbeat"],
    strategy="remove-highest-priority",
    tag_priorities=tag_priorities
)
# Returns: ["whisper", "upbeat"]
# "anthemic" removed (highest priority: 0.8)
```

**Use Case**: Rare edge cases where lower-weight tags should be preserved.

### 3. Violation Reports

The `get_violation_report()` function generates comprehensive reports with remediation options:

```python
report = detector.get_violation_report(
    ["whisper", "anthemic", "upbeat"],
    include_remediation=True
)

# Returns:
{
    "is_valid": False,
    "tag_count": 3,
    "conflict_count": 1,
    "conflicts": [
        {
            "tag_a": "whisper",
            "tag_b": "anthemic",
            "reason": "vocal intensity contradiction",
            "category": "vocal_style"
        }
    ],
    "suggested_resolution": ["whisper", "upbeat"],
    "remediation_options": {
        "keep_first": ["whisper", "upbeat"],
        "remove_whisper": ["anthemic", "upbeat"],
        "remove_anthemic": ["whisper", "upbeat"]
    }
}
```

**Use Case**: Providing detailed feedback to users or automated systems about conflicts and how to fix them.

## Architecture

### Class Hierarchy

```
ConflictDetector
├── __init__(conflict_matrix_path)
├── detect_tag_conflicts(tags) → List[ConflictReport]
├── resolve_conflicts(tags, strategy, tag_priorities) → List[str]
├── get_violation_report(tags, include_remediation) → ViolationReport
├── reload_conflict_matrix() → bool
└── _private_methods...
    ├── _load_conflict_matrix_data()
    ├── _get_conflict_details(tag_a, tag_b)
    ├── _resolve_keep_first(tags)
    ├── _resolve_remove_lowest_priority(tags, priorities)
    └── _resolve_remove_highest_priority(tags, priorities)
```

### Integration with Existing Services

The `ConflictDetector` builds on the existing `TagConflictResolver`:

```
ConflictDetector (new)
    ↓ uses
TagConflictResolver (existing)
    ↓ loads
conflict_matrix.json (existing)
```

**Key Design Decisions**:
1. **Composition over Inheritance**: Uses `TagConflictResolver` internally rather than inheriting
2. **Enhanced Functionality**: Adds strategies, detailed reporting, and remediation on top of base resolver
3. **Backward Compatibility**: Existing code using `TagConflictResolver` continues to work

## Determinism Guarantees

All operations are **fully deterministic**:

1. **Conflict Detection**: Same tags → same conflicts (order-independent)
2. **Keep-First Resolution**: Same tags → same result (order-dependent, maintains input order)
3. **Priority Resolution**: Same tags + priorities → same result (maintains original order after resolution)

**Determinism Test**:
```python
# Run 10 times with same input
results = [
    detector.resolve_conflicts(tags, strategy="keep-first")
    for _ in range(10)
]

# All results identical
assert all(r == results[0] for r in results)  # ✓ True
```

## Logging

All operations emit structured logs using `structlog`:

```python
# Detection logs
logger.info(
    "conflict_detector.conflicts_detected",
    tag_count=len(tags),
    conflict_count=len(conflicts),
    conflicts=["whisper ↔ anthemic"]
)

# Resolution logs
logger.info(
    "conflict_detector.conflicts_resolved",
    original_count=3,
    resolved_count=2,
    removed_count=1,
    removed_tags=["anthemic"],
    strategy="keep-first"
)
```

**Log Levels**:
- `debug`: Routine operations (no conflicts, cache hits)
- `info`: Important events (conflicts detected/resolved, matrix loaded)
- `warning`: Unexpected situations (invalid strategy, malformed matrix)
- `error`: Failures (matrix load errors, unknown errors)

## Usage Examples

### Example 1: Simple Conflict Detection

```python
from app.services.conflict_detector import detect_tag_conflicts

# Using convenience function
conflicts = detect_tag_conflicts(["acoustic", "electronic"])

if conflicts:
    for c in conflicts:
        print(f"Conflict: {c['tag_a']} ↔ {c['tag_b']}")
        print(f"Reason: {c['reason']}")
        print(f"Category: {c['category']}")
```

### Example 2: Resolve with Priority

```python
from app.services.conflict_detector import ConflictDetector

detector = ConflictDetector()

# Blueprint weights as priorities
blueprint_weights = {
    "melodic": 0.25,
    "catchy": 0.20,
    "whisper": 0.15,
    "anthemic": 0.40
}

cleaned = detector.resolve_conflicts(
    ["melodic", "whisper", "anthemic"],
    strategy="remove-lowest-priority",
    tag_priorities=blueprint_weights
)
# Returns: ["melodic", "anthemic"]
# Removed "whisper" (lowest weight: 0.15)
```

### Example 3: Integration with Validation Service

```python
from app.services.conflict_detector import ConflictDetector

class StyleValidator:
    def __init__(self):
        self.conflict_detector = ConflictDetector()

    def validate_style_tags(self, tags: List[str]) -> Tuple[bool, List[str], str]:
        """Validate and clean style tags.

        Returns:
            (is_valid, cleaned_tags, error_message)
        """
        # Get violation report
        report = self.conflict_detector.get_violation_report(tags)

        if report["is_valid"]:
            return True, tags, ""

        # Use suggested resolution
        cleaned = report["suggested_resolution"]
        removed = [t for t in tags if t not in cleaned]

        error_msg = f"Removed conflicting tags: {', '.join(removed)}"
        return False, cleaned, error_msg
```

## Testing

### Unit Test Coverage

The test suite (`test_conflict_detector.py`) provides comprehensive coverage:

**Test Classes**:
1. `TestConflictDetectorInit` - Initialization and setup
2. `TestConflictDetection` - Detection logic and edge cases
3. `TestKeepFirstStrategy` - Keep-first resolution
4. `TestPriorityStrategies` - Priority-based resolution
5. `TestViolationReports` - Report generation
6. `TestConvenienceFunctions` - Module-level functions
7. `TestEdgeCases` - Error handling and edge cases
8. `TestDeterminism` - Determinism verification
9. `TestMatrixReload` - Matrix reload functionality

**Total Tests**: 40+ test cases

**Coverage Goals**:
- Line coverage: >95%
- Branch coverage: >90%
- All strategies tested
- All edge cases covered

### Running Tests

```bash
# Run all conflict detector tests
pytest tests/unit/services/test_conflict_detector.py -v

# Run specific test class
pytest tests/unit/services/test_conflict_detector.py::TestConflictDetection -v

# Run with coverage
pytest tests/unit/services/test_conflict_detector.py --cov=app.services.conflict_detector --cov-report=html
```

## Error Handling

### Validation Errors

```python
# Missing priorities for priority strategy
try:
    detector.resolve_conflicts(
        tags,
        strategy="remove-lowest-priority"
        # Missing tag_priorities!
    )
except ValueError as e:
    print(e)  # "Strategy 'remove-lowest-priority' requires tag_priorities"
```

### Graceful Degradation

```python
# Unknown strategy → fallback to keep-first
resolved = detector.resolve_conflicts(
    tags,
    strategy="invalid-strategy"  # Unknown
)
# Logs error, uses "keep-first" as fallback
# Returns valid result
```

### Missing Conflict Matrix

```python
# Matrix file not found
detector = ConflictDetector(conflict_matrix_path="/invalid/path.json")
# Logs warning, initializes with empty matrix
# Detection returns no conflicts (graceful degradation)
```

## Performance Considerations

### Time Complexity

- **Detection**: O(n²) where n = number of tags
  - For each tag, check against all other tags
  - Acceptable for typical tag counts (5-20 tags)

- **Resolution**: O(n²) in worst case
  - Keep-first: O(n²) - check each tag against kept tags
  - Priority-based: O(n log n) sort + O(n²) resolution

### Space Complexity

- **Memory**: O(m) where m = conflict matrix size
  - Matrix cached in memory (one-time load)
  - Typical matrix: ~15 entries, ~50 KB

- **Per-call**: O(n) for storing results

### Optimization Tips

```python
# For repeated calls, reuse detector instance
detector = ConflictDetector()  # Load matrix once

for tags_batch in tag_batches:
    conflicts = detector.detect_tag_conflicts(tags_batch)
    # Reuses cached matrix
```

## Integration Checklist

When integrating ConflictDetector into workflows:

- [ ] Choose appropriate resolution strategy
- [ ] Provide tag priorities if using priority strategies
- [ ] Handle violation reports in user-facing code
- [ ] Log conflict resolutions for audit trail
- [ ] Test with representative tag combinations
- [ ] Verify determinism in integration tests
- [ ] Document which strategy is used and why

## Migration Guide

### From TagConflictResolver to ConflictDetector

**Old code**:
```python
from app.services.tag_conflict_resolver import TagConflictResolver

resolver = TagConflictResolver()
conflicts = resolver.find_conflicts(tags)
cleaned = resolver.resolve_conflicts(tags, weights=weights)
```

**New code**:
```python
from app.services.conflict_detector import ConflictDetector

detector = ConflictDetector()
conflicts = detector.detect_tag_conflicts(tags)
cleaned = detector.resolve_conflicts(
    tags,
    strategy="remove-lowest-priority",
    tag_priorities=weights
)
```

**Key Differences**:
1. `find_conflicts()` → `detect_tag_conflicts()` (returns detailed reports)
2. `resolve_conflicts(tags, weights)` → `resolve_conflicts(tags, strategy, tag_priorities)` (explicit strategy)
3. Violation reports and remediation options now available

## Future Enhancements

Potential improvements for future versions:

1. **Custom Strategies**: Allow users to define custom resolution strategies
2. **Conflict Severity**: Assign severity levels to conflicts (high, medium, low)
3. **Batch Resolution**: Optimize for resolving conflicts across multiple tag sets
4. **Conflict Prediction**: Suggest tags that won't conflict with current selection
5. **Analytics**: Track most common conflicts for matrix refinement
6. **Multi-language Support**: Conflict matrix translations

## References

- **PRD**: `docs/project_plans/PRDs/style.prd.md` (Tag conflicts section)
- **Conflict Matrix**: `/home/user/MeatyMusic/taxonomies/conflict_matrix.json`
- **Base Resolver**: `/home/user/MeatyMusic/services/api/app/services/tag_conflict_resolver.py`
- **Blueprint Service**: `/home/user/MeatyMusic/services/api/app/services/blueprint_service.py`
- **AMCS Overview**: `docs/amcs-overview.md`

## Support

For issues or questions:
1. Check test suite for usage examples
2. Review conflict matrix for available tags
3. Enable debug logging: `structlog.configure(wrapper_class=structlog.make_filtering_bound_logger(logging.DEBUG))`
4. Verify conflict matrix format and content

---

**Status**: ✓ Complete
**Test Coverage**: 40+ test cases
**Documentation**: Complete
**Integration**: Ready for Phase 2.3
