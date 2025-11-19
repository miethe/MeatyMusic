# Artist Normalization Quick Reference

Quick reference guide for using the artist normalization and policy enforcement system in MeatyMusic AMCS.

## Quick Start

```python
from app.services.policy_guards import ArtistNormalizer, PolicyEnforcer

# Initialize
normalizer = ArtistNormalizer()
enforcer = PolicyEnforcer()

# Detect artist references
has_refs, refs = normalizer.detect_artist_references("Style of Taylor Swift")

# Normalize text
normalized, changes = normalizer.normalize_influences("Style of Taylor Swift")

# Check compliance
compliant, violations = enforcer.enforce_release_policy(
    content={"style": "Style of Taylor Swift"},
    public_release=True,
    mode="strict"
)
```

## Common Use Cases

### 1. Detect Artist References in Text

```python
normalizer = ArtistNormalizer()

text = "This song sounds like Drake with production similar to The Weeknd"
has_refs, references = normalizer.detect_artist_references(text)

if has_refs:
    for ref in references:
        print(f"Artist: {ref['artist_name']}")
        print(f"Pattern: {ref['pattern_used']}")
        print(f"Generic: {ref['generic_replacement']}")
        print(f"Position: {ref['position']}")
        print()
```

### 2. Normalize Artist References

```python
normalizer = ArtistNormalizer()

text = "Style of Taylor Swift with Ed Sheeran vibes"
normalized, changes = normalizer.normalize_influences(text)

print(f"Original: {text}")
print(f"Normalized: {normalized}")
print(f"\nChanges:")
for change in changes:
    print(f"  '{change['original']}' → '{change['replacement']}'")
```

### 3. Check Public Release Compliance

```python
normalizer = ArtistNormalizer()

# Check text compliance
text = "Pop-influenced with melodic hooks"
compliant, violations = normalizer.check_public_release_compliance(text)

if compliant:
    print("✓ Text is compliant for public release")
else:
    print("✗ Text has violations:")
    for violation in violations:
        print(f"  - {violation}")
```

### 4. Enforce Release Policy on Content

```python
enforcer = PolicyEnforcer()

content = {
    "style": "Pop-influenced with acoustic elements",
    "lyrics": "Heartfelt storytelling",
    "producer_notes": "Clear mix with emotional depth"
}

# Strict mode (no artist references)
compliant, violations = enforcer.enforce_release_policy(
    content=content,
    public_release=True,
    mode="strict"
)

if compliant:
    print("✓ Content approved for public release")
else:
    print("✗ Content has policy violations:")
    for violation in violations:
        print(f"  {violation}")
```

### 5. Check Persona Policy

```python
enforcer = PolicyEnforcer()

persona_data = {
    "public_release": False,
    "influences": ["Taylor Swift", "Ed Sheeran"]
}

allowed = enforcer.check_persona_policy(
    persona_id="persona_123",
    public_release=True,
    persona_data=persona_data
)

if allowed:
    print("✓ Persona approved for public release")
else:
    print("✗ Persona not approved for public release")
```

### 6. Audit Policy Override

```python
enforcer = PolicyEnforcer()

# Log a policy override
enforcer.audit_policy_override(
    content_id="song_456",
    reason="Artist provided written approval under contract #2024-001",
    user_id="admin_001",
    approval_level="admin"
)

# Retrieve audit log
log_entries = enforcer.get_audit_log(content_id="song_456")
for entry in log_entries:
    print(f"Override at {entry['timestamp']}")
    print(f"  Reason: {entry['reason']}")
    print(f"  By: {entry['user_id']} ({entry['approval_level']})")
```

## Supported Detection Patterns

The system detects these patterns (case-insensitive):

1. **"style of {artist}"**
   - Example: "style of Taylor Swift"
   - Replacement: "{generic_description}"

2. **"sounds like {artist}"**
   - Example: "sounds like Drake"
   - Replacement: "{generic_description}"

3. **"similar to {artist}"**
   - Example: "similar to The Weeknd"
   - Replacement: "{generic_description}"

4. **"like {artist}"**
   - Example: "vocals like Ariana Grande"
   - Replacement: "{generic_description}"

5. **"in the vein of {artist}"**
   - Example: "in the vein of Foo Fighters"
   - Replacement: "{genre}-influenced"

6. **"reminiscent of {artist}"**
   - Example: "reminiscent of Arctic Monkeys"
   - Replacement: "{genre}-influenced"

7. **"{artist}-inspired"**
   - Example: "Travis Scott-inspired"
   - Replacement: "{genre}-influenced"

8. **"{artist} vibes"**
   - Example: "The Weeknd vibes"
   - Replacement: "{generic_description}"

## Supported Artists (32 total)

### Pop
- Taylor Swift, Ariana Grande, Ed Sheeran, Billie Eilish, Dua Lipa

### Hip-Hop
- Kendrick Lamar, Drake, Cardi B, Travis Scott, Post Malone

### Rock
- Foo Fighters, Imagine Dragons, Arctic Monkeys, Twenty One Pilots

### R&B
- The Weeknd, SZA, Bruno Mars, H.E.R.

### Country
- Luke Combs, Kacey Musgraves, Morgan Wallen, Chris Stapleton

### Electronic
- The Chainsmokers, Calvin Harris, Marshmello, Deadmau5

### Indie
- Tame Impala, The 1975, Vampire Weekend

### Latin
- Bad Bunny, J Balvin, Rosalía

## Policy Modes

### Strict Mode (Recommended for Public Releases)
```python
compliant, violations = enforcer.enforce_release_policy(
    content=content,
    public_release=True,
    mode="strict"  # No artist references allowed
)
```

### Warn Mode (Allows with Approval)
```python
compliant, violations = enforcer.enforce_release_policy(
    content=content,
    public_release=True,
    mode="warn"  # Warn but allow with approval
)
```

### Permissive Mode (Internal Use)
```python
compliant, violations = enforcer.enforce_release_policy(
    content=content,
    public_release=False,
    mode="permissive"  # Allow all references
)
```

## Fuzzy Matching

The system uses fuzzy matching (0.85 similarity threshold) to catch misspellings:

```python
normalizer = ArtistNormalizer()

# These all match "Taylor Swift"
texts = [
    "style of Taylor Swift",   # Exact match
    "style of TAYLOR SWIFT",   # Case variation
    "style of Tayler Swift",   # Misspelling (if close enough)
]

for text in texts:
    has_refs, refs = normalizer.detect_artist_references(text)
    if has_refs:
        print(f"Detected: {refs[0]['artist_name']}")
```

## Alias Support

Artists can be referenced by aliases:

```python
normalizer = ArtistNormalizer()

# These all match "Drake"
texts = [
    "style of Drake",
    "style of Drizzy",  # Drake's alias
]

for text in texts:
    has_refs, refs = normalizer.detect_artist_references(text)
    if has_refs:
        print(f"Canonical name: {refs[0]['artist_name']}")  # Always "Drake"
```

## Reference Structure

Detected references include:

```python
{
    "artist_name": "Taylor Swift",           # Canonical name
    "position": 15,                          # Character position
    "pattern_used": "style of {artist}",     # Pattern matched
    "matched_text": "style of Taylor Swift", # Full matched text
    "generic_replacement": "pop-influenced with storytelling vocals and melodic hooks",
    "requires_normalization": True,
    "confidence": 1.0,                       # 1.0 = exact, 0.9 = fuzzy
    "genre": "pop",
    "style_tags": ["pop", "melodic", "storytelling", ...]
}
```

## Persona Policy Fields

Persona data should include:

```python
persona_data = {
    "public_release": bool,      # True = can use in public, False = internal only
    "influences": List[str],     # List of artist influences (optional)
    # ... other persona fields
}
```

## Audit Log Entry Structure

```python
{
    "content_id": "song_123",
    "reason": "Artist provided written approval",
    "user_id": "admin_001",
    "approval_level": "admin",  # user, admin, or system
    "timestamp": "2025-11-19T10:30:45.123456+00:00",
    "metadata": {}  # Optional additional data
}
```

## Integration with ValidationService

Future integration example:

```python
from app.services.validation_service import ValidationService

class ValidationService:
    def __init__(self):
        # Existing
        self.conflict_detector = ConflictDetector()

        # Add artist normalization
        self.artist_normalizer = ArtistNormalizer()
        self.policy_enforcer = PolicyEnforcer(
            artist_normalizer=self.artist_normalizer
        )

    def validate_for_public_release(self, content: Dict) -> Tuple[bool, List[str]]:
        """Validate content for public release."""
        errors = []

        # Schema validation
        # ... existing validation

        # Artist policy enforcement
        compliant, violations = self.policy_enforcer.enforce_release_policy(
            content=content,
            public_release=True,
            mode="strict"
        )

        if not compliant:
            errors.extend(violations)

        return len(errors) == 0, errors
```

## Common Patterns

### Pattern 1: Validate Before Save

```python
def save_style_spec(style: Dict, public_release: bool) -> bool:
    enforcer = PolicyEnforcer()

    # Check policy
    compliant, violations = enforcer.enforce_release_policy(
        content={"style": style},
        public_release=public_release,
        mode="strict"
    )

    if not compliant:
        raise ValueError(f"Style spec violates policy: {violations}")

    # Save to database
    # ...
    return True
```

### Pattern 2: Auto-Normalize with Warning

```python
def auto_normalize_style(style_text: str) -> Tuple[str, bool, List[str]]:
    normalizer = ArtistNormalizer()

    # Check for references
    has_refs, refs = normalizer.detect_artist_references(style_text)

    if has_refs:
        # Auto-normalize
        normalized, changes = normalizer.normalize_influences(style_text)

        # Log changes
        warnings = [
            f"Auto-normalized: {c['original']} → {c['replacement']}"
            for c in changes
        ]

        return normalized, True, warnings
    else:
        return style_text, False, []
```

### Pattern 3: Compliance Report

```python
def generate_compliance_report(content: Dict) -> Dict:
    enforcer = PolicyEnforcer()

    # Check compliance
    compliant, violations = enforcer.enforce_release_policy(
        content=content,
        public_release=True,
        mode="strict"
    )

    # Check each field individually
    field_reports = {}
    for field in ["style", "lyrics", "producer_notes"]:
        if field in content:
            field_compliant, field_violations = enforcer.enforce_release_policy(
                content={field: content[field]},
                public_release=True,
                mode="strict"
            )
            field_reports[field] = {
                "compliant": field_compliant,
                "violations": field_violations
            }

    return {
        "overall_compliant": compliant,
        "total_violations": len(violations),
        "violations": violations,
        "field_reports": field_reports
    }
```

## Error Handling

```python
from app.services.policy_guards import ArtistNormalizer

try:
    normalizer = ArtistNormalizer()
except FileNotFoundError:
    # Taxonomy file missing
    logger.error("Artist normalization taxonomy not found")
except ValueError:
    # Malformed taxonomy
    logger.error("Artist normalization taxonomy is invalid")
```

## Performance Tips

1. **Reuse instances**: Create once, use many times
   ```python
   # Good
   normalizer = ArtistNormalizer()  # Once
   for text in texts:
       normalizer.detect_artist_references(text)

   # Bad
   for text in texts:
       normalizer = ArtistNormalizer()  # Every iteration
       normalizer.detect_artist_references(text)
   ```

2. **Batch processing**: Process multiple texts efficiently
   ```python
   normalizer = ArtistNormalizer()
   results = [
       normalizer.detect_artist_references(text)
       for text in texts
   ]
   ```

3. **Cache results**: For repeated checks
   ```python
   from functools import lru_cache

   @lru_cache(maxsize=1000)
   def check_text_compliance(text: str) -> bool:
       normalizer = ArtistNormalizer()
       compliant, _ = normalizer.check_public_release_compliance(text)
       return compliant
   ```

## Logging

All operations are logged with structlog:

```python
# Detection logged automatically
normalizer.detect_artist_references(text)
# Log: artist_normalizer.detect_start, artist_normalizer.reference_detected, ...

# Normalization logged
normalizer.normalize_influences(text)
# Log: artist_normalizer.normalized, artist_normalizer.normalize_complete

# Policy enforcement logged
enforcer.enforce_release_policy(content, True, "strict")
# Log: policy_enforcer.release_policy_checked, policy_enforcer.release_policy_violation
```

## Testing

Run tests:

```bash
# All artist normalization tests
pytest services/api/tests/unit/services/test_policy_guards.py::TestArtistNormalizer -v

# Specific test class
pytest services/api/tests/unit/services/test_policy_guards.py::TestArtistReferenceDetection -v

# All policy enforcer tests
pytest services/api/tests/unit/services/test_policy_guards.py::TestPolicyEnforcer -v

# Validation script
python validate_artist_normalization_simple.py
```

## Troubleshooting

### "FileNotFoundError: Artist normalization taxonomy not found"
- Check that `taxonomies/artist_normalization.json` exists
- Verify path configuration
- Check file permissions

### "Artist not detected despite reference"
- Check artist is in taxonomy
- Verify pattern format matches supported patterns
- Check fuzzy matching threshold (0.85)
- Artist may need to be added to taxonomy

### "False positive detection"
- Check whitelist configuration
- Verify pattern matching boundaries
- Consider adjusting fuzzy threshold

### "Normalized text incorrect"
- Verify generic_description in taxonomy
- Check pattern replacement template
- Review normalization logic

## Adding New Artists

To add a new artist to the taxonomy:

1. Open `taxonomies/artist_normalization.json`

2. Find the appropriate genre section

3. Add artist entry:
   ```json
   {
     "name": "Artist Name",
     "aliases": ["Alias1", "Alias2"],
     "generic_description": "genre-influenced with specific characteristics",
     "style_tags": ["tag1", "tag2", "tag3"]
   }
   ```

4. Restart services to reload taxonomy

5. Test detection:
   ```python
   normalizer = ArtistNormalizer()
   desc = normalizer.get_generic_description("Artist Name")
   assert desc is not None
   ```

## References

- **Implementation**: `services/api/app/services/policy_guards.py`
- **Tests**: `services/api/tests/unit/services/test_policy_guards.py`
- **Taxonomy**: `taxonomies/artist_normalization.json`
- **Summary**: `TASK_3.3_ARTIST_NORMALIZATION_SUMMARY.md`
- **Validation**: `validate_artist_normalization_simple.py`

---

**Last Updated**: 2025-11-19
**Version**: 1.0.0
