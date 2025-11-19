# Policy Guards Guide

## Overview

Policy Guards enforce content policies across the MeatyMusic AMCS workflow to ensure compliance with safety, privacy, and release requirements. The framework includes three complementary guards:

1. **Profanity Filter** - Detects and validates profanity based on content rating
2. **PII Detector** - Detects personally identifiable information and redacts it
3. **Artist Normalizer** - Detects and normalizes living artist references for public release

Used by the VALIDATE workflow node to check all generated content before rendering.

## Quick Start

```python
from app.services.policy_guards import (
    ProfanityFilter,
    PIIDetector,
    ArtistNormalizer,
    PolicyEnforcer
)

# Initialize guards
profanity = ProfanityFilter()
pii = PIIDetector()
normalizer = ArtistNormalizer()
enforcer = PolicyEnforcer()

# Check profanity
has_violations, violations = profanity.detect_profanity(
    text="This is a damn good song",
    explicit_allowed=False
)
print(f"Profanity violations: {len(violations)}")

# Detect and redact PII
has_pii, redacted, report = pii.detect_pii(
    text="Contact john@example.com or call 555-123-4567"
)
print(f"Redacted: {redacted}")

# Normalize artist references
has_refs, normalized = normalizer.normalize_influences(
    text="style of Taylor Swift"
)
print(f"Normalized: {normalized}")

# Check all policies
compliant, violations = enforcer.enforce_release_policy(
    content={
        "style": "style of Taylor Swift",
        "lyrics": "Contact me at john@example.com"
    },
    public_release=True
)
print(f"Policy compliant: {compliant}")
```

## Profanity Filter

### Overview

The Profanity Filter detects profanity across severity levels (mild, moderate, strong, extreme) with:
- Variation handling (leetspeak, spacing, masking)
- Context-aware whitelisting
- Threshold-based enforcement
- Severity categorization

### How It Works

**1. Taxonomy Loading**
```
/taxonomies/profanity_list.json
├── Categories
│   ├── mild: [damn, hell]
│   ├── moderate: [shit, piss]
│   ├── strong: [fuck]
│   └── extreme: [...]
├── Severity Weights (0.25, 0.5, 0.75, 1.0)
├── Thresholds (by mode)
└── Whitelists (e.g., "assessment" contains "ass")
```

**2. Pattern Compilation**
- Word boundary patterns (exact matches)
- Variation patterns (leetspeak, spacing, masking)
- Compiled at initialization for performance

**3. Text Normalization**
- Remove masking characters: `f**k` → `fk`
- Collapse spacing: `f u c k` → `fuck`
- Preserve word boundaries

**4. Detection**
- Check word boundary patterns
- Check variation patterns
- Validate against whitelist
- Categorize by severity

**5. Threshold Checking**
- Count violations by severity
- Check total score
- Compare against mode thresholds
- Return compliance decision

### Severity Levels

```
mild (0.25 weight)
├── Mild profanity generally acceptable
├── Examples: damn, hell, crap
└── Allowed in most contexts except children's content

moderate (0.5 weight)
├── Moderate language, not all-ages
├── Examples: shit, piss
└── Needs explicit content flag

strong (0.75 weight)
├── Strong language, mature audiences
├── Examples: fuck, bastard
└── Requires explicit content flag

extreme (1.0 weight)
├── Extremely offensive language
├── Examples: [varies]
└── Usually not allowed
```

### Detection Examples

```python
filter = ProfanityFilter()

# Example 1: Basic profanity
has_violations, violations = filter.detect_profanity(
    text="This is a damn good song",
    explicit_allowed=False
)
print(f"Violations: {len(violations)}")  # 1
print(f"Term: {violations[0]['term']}")  # "damn"
print(f"Severity: {violations[0]['severity']}")  # "mild"

# Example 2: Leetspeak variation
has_violations, violations = filter.detect_profanity(
    text="This is sh1t",
    explicit_allowed=False
)
print(f"Violations: {len(violations)}")  # 1 (sh1t matches "shit")

# Example 3: Whitelisted term
has_violations, violations = filter.detect_profanity(
    text="This is an assessment",
    explicit_allowed=False
)
print(f"Violations: {len(violations)}")  # 0 (assessment is whitelisted)

# Example 4: Explicit content allowed
has_violations, violations = filter.detect_profanity(
    text="This is shit",
    explicit_allowed=True
)
print(f"Violations: {len(violations)}")  # 0 (explicit allowed)
```

### Configuration

**Edit `/taxonomies/profanity_list.json`:**

```json
{
  "categories": {
    "mild": ["damn", "hell", "crap"],
    "moderate": ["shit", "piss"],
    "strong": ["fuck"],
    "extreme": []
  },
  "severity_weights": {
    "mild": 0.25,
    "moderate": 0.5,
    "strong": 0.75,
    "extreme": 1.0
  },
  "thresholds": {
    "clean": {
      "max_mild_count": 0,
      "max_moderate_count": 0,
      "max_strong_count": 0,
      "max_extreme_count": 0,
      "max_score": 0.0
    },
    "mild_allowed": {
      "max_mild_count": -1,
      "max_moderate_count": 0,
      "max_strong_count": 0,
      "max_extreme_count": 0,
      "max_score": 0.25
    },
    "moderate_allowed": {
      "max_mild_count": -1,
      "max_moderate_count": -1,
      "max_strong_count": 0,
      "max_extreme_count": 0,
      "max_score": 0.5
    },
    "explicit": {
      "max_mild_count": -1,
      "max_moderate_count": -1,
      "max_strong_count": -1,
      "max_extreme_count": -1,
      "max_score": 1.0
    }
  },
  "whitelist": {
    "terms": ["assessment", "classic", "Scunthorpe"]
  },
  "variations": {
    "leetspeak_patterns": {
      "a": ["@", "4"],
      "e": ["3"],
      "i": ["!", "1"],
      "o": ["0"]
    }
  }
}
```

### Score Calculation

```python
# Profanity score based on violations
profanity_score = filter.get_profanity_score(text)

# Score = (sum of violation weights) / word_count * 100
# Examples:
# - No violations: 1.0 (perfect)
# - 1 mild violation in 20 words: 0.875
# - 2 moderate violations in 20 words: 0.75
# - 5 strong violations in 20 words: 0.25
```

### Best Practices

1. **Use whitelists aggressively** - Reduce false positives
2. **Adjust severity weights** - Based on your audience
3. **Test with examples** - Know what passes/fails
4. **Document exceptions** - Why terms are whitelisted
5. **Monitor violations** - Track what's detected

## PII Detector

### Overview

The PII Detector identifies personally identifiable information and redacts it:
- Emails, phone numbers, URLs
- Social Security Numbers, credit cards
- Street addresses
- Person names (pattern-based)

### PII Types

```
email
├── RFC-compliant email detection
├── Confidence: 0.95
└── Placeholder: [EMAIL]

phone_us
├── US phone number patterns (555-123-4567, (555) 123-4567)
├── Confidence: 0.9
└── Placeholder: [PHONE]

phone_international
├── International phone patterns
├── Confidence: 0.9
└── Placeholder: [PHONE]

url
├── HTTP/HTTPS URLs
├── Confidence: 0.95
└── Placeholder: [URL]

ssn
├── Social Security Numbers (XXX-XX-XXXX)
├── Confidence: 0.98
└── Placeholder: [SSN]

credit_card
├── Credit card numbers
├── Confidence: 0.92
└── Placeholder: [CREDIT_CARD]

street_address
├── Street addresses (123 Main St)
├── Confidence: 0.8
└── Placeholder: [ADDRESS]

name
├── Person names (pattern-based)
├── Confidence: 0.7
└── Placeholder: [NAME]
```

### Detection Examples

```python
detector = PIIDetector()

# Example 1: Email detection
has_pii, violations = detector.detect_pii(
    text="Contact me at john@example.com"
)
print(f"PII found: {has_pii}")  # True
print(f"Type: {violations[0]['type']}")  # "email"
print(f"Value: {violations[0]['value']}")  # "john@example.com"

# Example 2: Phone number detection
has_pii, violations = detector.detect_pii(
    text="Call me at 555-123-4567"
)
print(f"Violations: {len(violations)}")  # 1
print(f"Type: {violations[0]['type']}")  # "phone"

# Example 3: Redaction
redacted, violations = detector.redact_pii(
    text="Email john@example.com or call 555-123-4567"
)
print(f"Redacted: {redacted}")
# "Email [EMAIL] or call [PHONE]"

# Example 4: Comprehensive report
report = detector.get_pii_report(
    text="Contact john@example.com"
)
print(f"Has PII: {report['has_pii']}")  # True
print(f"Redacted: {report['redacted_text']}")
print(f"Summary: {report['summary']}")
```

### Allowlisting

Configure allowlist in `/taxonomies/pii_patterns.json`:

```json
{
  "patterns": {
    "email": {
      "regex": "...",
      "placeholder": "[EMAIL]",
      "confidence": 0.95
    }
  },
  "allowlist": {
    "brands": ["main.com", "example.com"],
    "addresses": ["Main Street", "Wall Street"],
    "names": ["John", "Jane"]
  }
}
```

### Redaction Process

```python
# Step 1: Detect all PII types
has_pii = True
violations = [
    {"type": "email", "value": "john@example.com", "position": 8, ...},
    {"type": "phone", "value": "555-123-4567", "position": 40, ...}
]

# Step 2: Sort by position (reverse order to preserve positions)
violations.sort(key=lambda v: v["position"], reverse=True)

# Step 3: Replace from end to start
text = "Contact john@example.com or 555-123-4567"
# Position 40: replace "555-123-4567" with "[PHONE]"
text = "Contact john@example.com or [PHONE]"
# Position 8: replace "john@example.com" with "[EMAIL]"
text = "Contact [EMAIL] or [PHONE]"

# Step 4: Return redacted text and violations
```

### Best Practices

1. **Always redact before storing** - Don't log actual PII
2. **Use confidence scores** - Know detection reliability
3. **Maintain allowlists** - Reduce false positives
4. **Test with real data** - Use anonymized examples
5. **Handle gracefully** - Don't fail on PII detection

## Artist Normalizer

### Overview

The Artist Normalizer detects living artist references and normalizes them to generic descriptions for public release compliance:

**Examples:**
- "style of Taylor Swift" → "pop-influenced with storytelling vocals"
- "sounds like Drake" → "melodic hip-hop with introspective lyrics"
- "inspired by Beyoncé" → "powerful vocals with dynamic arrangements"

### How It Works

**1. Taxonomy Structure**
```
/taxonomies/artist_normalization.json
├── living_artists (by genre)
│   ├── pop: [{name, aliases, generic_description, style_tags}, ...]
│   ├── country: [...]
│   └── hiphop: [...]
├── normalization_patterns
│   ├── "style of {artist}"
│   ├── "sounds like {artist}"
│   └── "inspired by {artist}"
├── fuzzy_matching (enable/disable, threshold)
└── policy_modes
    ├── strict (no living artist references)
    ├── warn (allow with approval)
    └── permissive (allow all)
```

**2. Pattern Matching**
```
Input: "style of Taylor Swift"

Patterns checked:
1. "style of {artist}" - MATCH
2. Artist "Taylor Swift" found in living_artists.pop
3. Generic description: "pop-influenced with storytelling vocals"
4. Build replacement: "style of pop-influenced with storytelling vocals"
```

**3. Fuzzy Matching**
```
Input: "sounds like Tayler Swift" (misspelled)

Exact match fails, try fuzzy:
- Calculate similarity between "Tayler" and known artists
- "Taylor Swift" has 0.9+ similarity
- Match accepted, use Taylor's generic description
```

### Detection Examples

```python
normalizer = ArtistNormalizer()

# Example 1: Basic detection
has_refs, references = normalizer.detect_artist_references(
    text="style of Taylor Swift"
)
print(f"References found: {has_refs}")  # True
print(f"Artist: {references[0]['artist_name']}")  # "Taylor Swift"
print(f"Matched: {references[0]['matched_text']}")  # "style of Taylor Swift"
print(f"Generic: {references[0]['generic_replacement']}")
# "style of pop-influenced with storytelling vocals"

# Example 2: Normalization
normalized, changes = normalizer.normalize_influences(
    text="style of Taylor Swift with catchy hooks"
)
print(f"Original: style of Taylor Swift with catchy hooks")
print(f"Normalized: {normalized}")
# "style of pop-influenced with storytelling vocals with catchy hooks"

# Example 3: Compliance check
compliant, violations = normalizer.check_public_release_compliance(
    text="style of Taylor Swift",
    allow_artist_names=False  # strict mode
)
print(f"Compliant: {compliant}")  # False
print(f"Violations: {violations}")
# ["Living artist reference detected: 'style of Taylor Swift' ..."]

# Example 4: Fuzzy matching
has_refs, references = normalizer.detect_artist_references(
    text="sounds like Tayler Swift"  # misspelled
)
print(f"References found: {has_refs}")  # True (fuzzy matched)
```

### Policy Modes

```
strict
├── Policy: No living artist references in public releases
├── Action: Reject content with artist references
├── Use case: Copyright protection
└── Example: Publishing to official releases

warn
├── Policy: Warn about references but allow with approval
├── Action: Log warning, require manual approval
├── Use case: Internal/collaborative use
└── Example: Demo versions, artist collaboration

permissive
├── Policy: Allow all references (for internal use)
├── Action: Allow without restriction
├── Use case: Non-public releases
└── Example: Demo, test, private sharing
```

### Configuration

Edit `/taxonomies/artist_normalization.json`:

```json
{
  "living_artists": {
    "pop": [
      {
        "name": "Taylor Swift",
        "aliases": ["TS", "Tswift"],
        "genre": "pop",
        "generic_description": "pop-influenced with storytelling vocals and melodic hooks",
        "style_tags": ["storytelling", "melodic", "pop", "catchy"]
      }
    ]
  },
  "normalization_patterns": [
    {
      "pattern": "style of {artist}",
      "replacement": "style of {generic_description}",
      "context": "influence"
    },
    {
      "pattern": "sounds like {artist}",
      "replacement": "sounds like {generic_description}",
      "context": "influence"
    }
  ],
  "fuzzy_matching": {
    "enabled": true,
    "min_similarity_threshold": 0.85
  },
  "policy_modes": {
    "strict": {
      "allow_artist_names": false,
      "reject_on_violation": true,
      "require_approval": false
    },
    "warn": {
      "allow_artist_names": false,
      "reject_on_violation": false,
      "require_approval": true
    },
    "permissive": {
      "allow_artist_names": true,
      "reject_on_violation": false,
      "require_approval": false
    }
  }
}
```

### Fuzzy Matching

```python
# Disabled (exact match only)
has_refs, _ = normalizer.detect_artist_references("Tayler Swfit")
print(f"Found: {has_refs}")  # False

# Enabled (fuzzy match)
normalizer.fuzzy_config['enabled'] = True
has_refs, refs = normalizer.detect_artist_references("Tayler Swfit")
print(f"Found: {has_refs}")  # True
print(f"Matched to: {refs[0]['artist_name']}")  # "Taylor Swift"
```

### Best Practices

1. **Add artists regularly** - Keep taxonomy up-to-date
2. **Use generic descriptions** - Should be meaningful
3. **Test fuzzy matching** - Know what variations work
4. **Document policy mode** - Be clear about restrictions
5. **Provide alternatives** - Help users comply

## PolicyEnforcer

### Overview

The PolicyEnforcer provides unified policy checking across all guards:

```python
enforcer = PolicyEnforcer()

# Check all policies at once
compliant, violations = enforcer.enforce_release_policy(
    content={
        "style": "style of Taylor Swift",
        "lyrics": "Contact john@example.com"
    },
    public_release=True,
    mode="strict"
)

# Audit policy override
enforcer.audit_policy_override(
    content_id="song_123",
    reason="Artist-approved usage",
    user_id="user_456",
    approval_level="admin"
)
```

### Audit Trail

```python
# Get audit log
log = enforcer.get_audit_log(content_id="song_123")
for entry in log:
    print(f"Content: {entry['content_id']}")
    print(f"User: {entry['user_id']}")
    print(f"Reason: {entry['reason']}")
    print(f"Approval level: {entry['approval_level']}")
    print(f"Timestamp: {entry['timestamp']}")
```

## Integration Examples

### Workflow Integration

```python
# VALIDATE node
async def validate_node(state):
    # Check all policies
    compliant, report = service.validate_all_policies(
        content={
            "style": state.style.to_dict(),
            "lyrics": state.lyrics.to_dict(),
            "producer_notes": state.producer_notes.to_dict()
        },
        explicit_allowed=state.sds.explicit_content,
        public_release=state.sds.public_release
    )

    if not compliant:
        # Log violations
        logger.warning(f"Policy violations: {report['suggestions']}")

        # Trigger remediation
        state.needs_fix = True
        state.fix_targets = list(report['violations'].keys())

    return state
```

### Content Review

```python
# Before rendering
def can_render(content, render_config):
    enforcer = PolicyEnforcer()

    # Check policies
    compliant, violations = enforcer.enforce_release_policy(
        content=content,
        public_release=render_config.public_release,
        mode=render_config.policy_mode
    )

    if not compliant:
        logger.error(f"Cannot render: {violations}")
        return False

    return True
```

## Troubleshooting

### Issue: Profanity Not Detected

**Symptoms:**
- Profanity passes validation
- No violations reported

**Debug:**
```python
filter = ProfanityFilter()

# Check if term is in taxonomy
print(f"Categories: {filter.categories}")

# Test detection directly
has_violations, violations = filter.detect_profanity(
    text="This is shit",
    explicit_allowed=False
)
print(f"Detected: {has_violations}")
print(f"Violations: {violations}")

# Check whitelist
print(f"Whitelist: {filter.whitelist}")

# Verify severity
if violations:
    print(f"Severity: {violations[0]['severity']}")
```

**Fix:**
1. Add term to taxonomy
2. Reload filter: `filter = ProfanityFilter()`
3. Verify whitelist doesn't exclude term
4. Check threshold configuration

### Issue: PII False Positives

**Symptoms:**
- Innocent text flagged as PII
- Email addresses detected incorrectly

**Debug:**
```python
detector = PIIDetector()

# Test specific PII type
emails = detector.detect_emails("Your company@example.com")
print(f"Detected: {emails}")

# Check allowlist
print(f"Allowlist: {detector.allowlist}")

# Verify pattern
print(f"Email pattern: {detector.patterns['email']}")
```

**Fix:**
1. Add to allowlist in taxonomy
2. Adjust confidence threshold
3. Update regex pattern
4. Reload detector

### Issue: Artist Not Detected

**Symptoms:**
- Artist references not found
- Normalization not applied

**Debug:**
```python
normalizer = ArtistNormalizer()

# Check artist index
print(f"Artists: {normalizer._artist_index.keys()}")

# Check aliases
print(f"Aliases: {normalizer._alias_index}")

# Test detection
has_refs, refs = normalizer.detect_artist_references(
    text="style of Taylor Swift"
)
print(f"Found: {has_refs}")
print(f"References: {refs}")

# Check fuzzy matching
print(f"Fuzzy enabled: {normalizer.fuzzy_config.get('enabled')}")
```

**Fix:**
1. Add artist to taxonomy
2. Add aliases for variations
3. Enable fuzzy matching
4. Reload normalizer

## See Also

- [Validation Service Guide](validation-service-guide.md) - Using policy guards
- [Rubric Scoring Guide](rubric-scoring-guide.md) - Profanity in scoring
- [Determinism Validation Guide](determinism-validation-guide.md) - Policy determinism
- [CLAUDE.md](../CLAUDE.md) - Project architecture
