# ConflictDetector Quick Reference

## Import
```python
from app.services.conflict_detector import ConflictDetector, detect_tag_conflicts, resolve_conflicts
```

## Basic Usage

### 1. Detect Conflicts
```python
detector = ConflictDetector()
conflicts = detector.detect_tag_conflicts(["whisper", "anthemic", "upbeat"])

# Returns:
# [
#     {
#         "tag_a": "whisper",
#         "tag_b": "anthemic",
#         "reason": "vocal intensity contradiction",
#         "category": "vocal_style"
#     }
# ]
```

### 2. Resolve Conflicts - Keep First (Default)
```python
cleaned = detector.resolve_conflicts(
    ["whisper", "anthemic", "upbeat"],
    strategy="keep-first"
)
# Returns: ["whisper", "upbeat"]
```

### 3. Resolve with Priority (Remove Lowest)
```python
cleaned = detector.resolve_conflicts(
    ["whisper", "anthemic", "upbeat"],
    strategy="remove-lowest-priority",
    tag_priorities={"whisper": 0.5, "anthemic": 0.8, "upbeat": 0.6}
)
# Returns: ["anthemic", "upbeat"]  # Removed "whisper" (lowest priority)
```

### 4. Resolve with Priority (Remove Highest)
```python
cleaned = detector.resolve_conflicts(
    ["whisper", "anthemic", "upbeat"],
    strategy="remove-highest-priority",
    tag_priorities={"whisper": 0.5, "anthemic": 0.8, "upbeat": 0.6}
)
# Returns: ["whisper", "upbeat"]  # Removed "anthemic" (highest priority)
```

### 5. Get Violation Report
```python
report = detector.get_violation_report(
    ["whisper", "anthemic", "upbeat"],
    include_remediation=True
)

# Access report fields:
print(report["is_valid"])              # False
print(report["conflict_count"])         # 1
print(report["conflicts"])              # List of conflicts
print(report["suggested_resolution"])   # ["whisper", "upbeat"]
print(report["remediation_options"])    # Dict of alternatives
```

## Convenience Functions

```python
# Quick detection
conflicts = detect_tag_conflicts(["whisper", "anthemic"])

# Quick resolution
cleaned = resolve_conflicts(["whisper", "anthemic", "upbeat"])
```

## Integration Examples

### Style Validator
```python
class StyleValidator:
    def __init__(self):
        self.detector = ConflictDetector()

    def validate(self, tags):
        report = self.detector.get_violation_report(tags)
        if report["is_valid"]:
            return True, tags
        return False, report["suggested_resolution"]
```

### Blueprint Integration
```python
blueprint_weights = {"melodic": 0.25, "catchy": 0.20, "whisper": 0.15}

cleaned = detector.resolve_conflicts(
    user_tags,
    strategy="remove-lowest-priority",
    tag_priorities=blueprint_weights
)
```

## Error Handling

```python
# Missing priorities - raises ValueError
try:
    detector.resolve_conflicts(
        tags,
        strategy="remove-lowest-priority"  # Missing tag_priorities!
    )
except ValueError as e:
    print(f"Error: {e}")

# Unknown strategy - logs warning, uses fallback
cleaned = detector.resolve_conflicts(tags, strategy="invalid")
# Logs: "Unknown strategy, using keep-first"
```

## Files

- **Implementation**: `services/api/app/services/conflict_detector.py`
- **Tests**: `tests/unit/services/test_conflict_detector.py`
- **Docs**: `docs/conflict_detector_implementation.md`
- **Examples**: `services/api/app/services/conflict_detector_examples.py`
