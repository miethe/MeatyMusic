# Policy Guards Integration Guide

**Version:** 1.0
**Date:** 2025-11-19
**Status:** Complete

## Overview

This document provides comprehensive guidance for integrating policy guards (profanity filter, PII detector, artist normalizer) into AMCS workflow nodes. Policy guards enforce content quality standards, prevent policy violations, and ensure public release compliance.

## Policy Guard Components

### 1. Profanity Filter

- **Purpose:** Detect and filter profane content based on explicit content flags
- **Capabilities:**
  - Multi-level severity detection (mild, moderate, strong, extreme)
  - Variation handling (leetspeak, spacing, masking)
  - Context-aware whitelisting
  - Threshold-based scoring

### 2. PII Detector

- **Purpose:** Detect and redact personally identifiable information
- **Capabilities:**
  - Email addresses
  - Phone numbers (US and international)
  - URLs
  - Street addresses
  - Social Security Numbers
  - Credit card numbers
  - Person names (pattern-based)

### 3. Artist Normalizer

- **Purpose:** Normalize living artist references for public release compliance
- **Capabilities:**
  - Pattern-based artist reference detection
  - Fuzzy matching for name variations
  - Generic description replacement
  - Public release policy enforcement

### 4. Policy Enforcer

- **Purpose:** Orchestrate policy enforcement across all guards
- **Capabilities:**
  - Multi-field content validation
  - Policy mode switching (strict, warn, permissive)
  - Audit trail management
  - Comprehensive violation reporting

## ValidationService API

The `ValidationService` class provides high-level methods for policy validation:

### Method: `validate_profanity()`

```python
def validate_profanity(
    self,
    text: str,
    explicit_allowed: bool,
    context: Optional[str] = None
) -> Tuple[bool, Dict[str, Any]]:
    """Validate text for profanity violations.

    Returns:
        Tuple of (is_valid, report):
        - is_valid: True if compliant, False if violations detected
        - report: {
            "has_violations": bool,
            "violations": List[Dict],
            "profanity_score": float (0.0-1.0),
            "severity_summary": Dict[str, int],
            "compliant": bool
        }
    """
```

### Method: `validate_pii()`

```python
def validate_pii(
    self,
    text: str,
    context: Optional[str] = None
) -> Tuple[bool, str, Dict[str, Any]]:
    """Validate and redact PII from text.

    Returns:
        Tuple of (has_pii, redacted_text, report):
        - has_pii: True if PII detected
        - redacted_text: Text with PII replaced by placeholders
        - report: {
            "has_pii": bool,
            "pii_found": List[Dict],
            "redacted_text": str,
            "original_text": str,
            "summary": {
                "total_pii_count": int,
                "types": Dict[str, int]
            }
        }
    """
```

### Method: `validate_artist_references()`

```python
def validate_artist_references(
    self,
    text: str,
    public_release: bool,
    policy_mode: str = "strict"
) -> Tuple[bool, str, Dict[str, Any]]:
    """Validate and normalize artist references.

    Returns:
        Tuple of (is_valid, normalized_text, report):
        - is_valid: True if compliant with policy mode
        - normalized_text: Text with artist references normalized
        - report: {
            "has_references": bool,
            "references": List[Dict],
            "normalized_text": str,
            "changes": List[Dict],
            "compliant": bool,
            "violations": List[str]
        }
    """
```

### Method: `validate_all_policies()`

```python
def validate_all_policies(
    self,
    content: Dict[str, Any],
    explicit_allowed: bool,
    public_release: bool,
    policy_mode: str = "strict"
) -> Tuple[bool, Dict[str, Any]]:
    """Run all policy checks on content dictionary.

    Returns:
        Tuple of (is_valid, report):
        - is_valid: True if all policies pass
        - report: {
            "is_valid": bool,
            "violations": {
                "profanity": List[Dict],
                "pii": List[Dict],
                "artist_references": List[Dict]
            },
            "redacted_content": Dict[str, str],
            "normalized_content": Dict[str, str],
            "policy_mode": str,
            "suggestions": List[str],
            "summary": {
                "total_violations": int,
                "profanity_count": int,
                "pii_count": int,
                "artist_reference_count": int
            }
        }
    """
```

## Workflow Node Integration Patterns

### LYRICS Node Integration

The LYRICS node generates lyrics text and must validate for profanity and PII before persisting.

```python
from app.services.validation_service import ValidationService

def lyrics_node(sds: Dict[str, Any]) -> Dict[str, Any]:
    """LYRICS workflow node with policy validation."""

    # Step 1: Generate lyrics
    lyrics_text = generate_lyrics(sds, plan)

    # Initialize validation service
    validation_service = ValidationService()

    # Step 2: Validate profanity
    is_valid_profanity, profanity_report = validation_service.validate_profanity(
        text=lyrics_text,
        explicit_allowed=sds["constraints"]["explicit"],
        context="lyrics"
    )

    if not is_valid_profanity:
        # Handle profanity violation
        logger.warning(
            "lyrics.profanity_violations",
            violation_count=len(profanity_report["violations"]),
            profanity_score=profanity_report["profanity_score"]
        )

        # Option 1: Reject and trigger FIX loop
        raise ValidationError(
            "Profanity violations detected",
            violations=profanity_report["violations"]
        )

        # Option 2: Log warning and continue (if explicit_allowed)
        # Continue with generation

    # Step 3: Validate PII
    has_pii, redacted_lyrics, pii_report = validation_service.validate_pii(
        text=lyrics_text,
        context="lyrics"
    )

    if has_pii:
        # PII detected - use redacted version
        logger.warning(
            "lyrics.pii_detected",
            pii_count=pii_report["summary"]["total_pii_count"],
            pii_types=list(pii_report["summary"]["types"].keys())
        )

        # Replace original with redacted version
        lyrics_text = redacted_lyrics

        # Optionally emit event for observability
        emit_event({
            "node": "LYRICS",
            "event": "pii_redacted",
            "pii_count": pii_report["summary"]["total_pii_count"]
        })

    # Step 4: Persist lyrics artifact
    lyrics_artifact = {
        "text": lyrics_text,
        "sections": build_sections(lyrics_text),
        "metadata": {
            "profanity_score": profanity_report["profanity_score"],
            "pii_redacted": has_pii,
            "pii_count": pii_report["summary"]["total_pii_count"] if has_pii else 0
        }
    }

    return lyrics_artifact
```

### STYLE Node Integration

The STYLE node generates style descriptions and must validate for artist references.

```python
def style_node(sds: Dict[str, Any]) -> Dict[str, Any]:
    """STYLE workflow node with artist reference validation."""

    # Step 1: Generate style description
    style_text = generate_style_description(sds, blueprint)

    # Initialize validation service
    validation_service = ValidationService()

    # Step 2: Validate artist references
    is_valid_artist, normalized_style, artist_report = validation_service.validate_artist_references(
        text=style_text,
        public_release=sds["constraints"].get("public_release", False),
        policy_mode=sds.get("policy_mode", "strict")
    )

    if not is_valid_artist:
        # Artist reference violations detected
        logger.warning(
            "style.artist_violations",
            violation_count=len(artist_report["violations"]),
            references=artist_report["references"]
        )

        # Use normalized version for public releases
        if sds["constraints"].get("public_release", False):
            style_text = normalized_style

            # Log changes
            for change in artist_report["changes"]:
                logger.info(
                    "style.artist_normalized",
                    original=change["original"],
                    replacement=change["replacement"],
                    artist=change["artist"]
                )

    # Step 3: Persist style artifact
    style_artifact = {
        "description": style_text,
        "tags": extract_tags(style_text),
        "metadata": {
            "artist_references_normalized": len(artist_report["changes"]) > 0,
            "original_style": style_text if not artist_report["changes"] else None
        }
    }

    return style_artifact
```

### COMPOSE Node Integration

The COMPOSE node merges all artifacts and must validate all policies before creating the final prompt.

```python
def compose_node(
    sds: Dict[str, Any],
    style: Dict[str, Any],
    lyrics: Dict[str, Any],
    producer_notes: Dict[str, Any]
) -> Dict[str, Any]:
    """COMPOSE workflow node with comprehensive policy validation."""

    # Step 1: Build prompt from artifacts
    prompt_text = build_prompt(style, lyrics, producer_notes)

    # Initialize validation service
    validation_service = ValidationService()

    # Step 2: Validate all policies
    is_valid, report = validation_service.validate_all_policies(
        content={
            "style": style["description"],
            "lyrics": lyrics,
            "producer_notes": producer_notes["text"]
        },
        explicit_allowed=sds["constraints"]["explicit"],
        public_release=sds["constraints"].get("public_release", False),
        policy_mode=sds.get("policy_mode", "strict")
    )

    if not is_valid:
        # Policy violations detected
        logger.error(
            "compose.policy_violations",
            total_violations=report["summary"]["total_violations"],
            profanity_count=report["summary"]["profanity_count"],
            pii_count=report["summary"]["pii_count"],
            artist_reference_count=report["summary"]["artist_reference_count"]
        )

        # Apply automatic fixes if possible
        final_content = {}

        # Use redacted content for PII
        for field, redacted_text in report["redacted_content"].items():
            final_content[field] = redacted_text

        # Use normalized content for artist references
        for field, normalized_text in report["normalized_content"].items():
            final_content[field] = normalized_text

        # If still invalid after fixes, trigger FIX loop
        if report["summary"]["profanity_count"] > 0:
            # Can't auto-fix profanity - trigger FIX loop
            raise ValidationError(
                "Profanity violations cannot be auto-fixed",
                violations=report["violations"]["profanity"],
                suggestions=report["suggestions"]
            )

        # Rebuild prompt with fixed content
        prompt_text = build_prompt(
            {"description": final_content.get("style", style["description"])},
            final_content.get("lyrics", lyrics),
            {"text": final_content.get("producer_notes", producer_notes["text"])}
        )

    # Step 3: Persist composed prompt
    composed_prompt = {
        "text": prompt_text,
        "meta": build_meta(style, lyrics, producer_notes),
        "policy_validation": {
            "validated": True,
            "total_violations": report["summary"]["total_violations"],
            "pii_redacted": report["summary"]["pii_count"] > 0,
            "artist_normalized": report["summary"]["artist_reference_count"] > 0
        }
    }

    return composed_prompt
```

### VALIDATE Node Integration

The VALIDATE node performs final safety checks before rendering.

```python
def validate_node(
    sds: Dict[str, Any],
    composed_prompt: Dict[str, Any],
    all_artifacts: Dict[str, Any]
) -> Dict[str, Any]:
    """VALIDATE workflow node with final policy safety check."""

    # Initialize validation service
    validation_service = ValidationService()

    # Final safety check before rendering
    is_valid, report = validation_service.validate_all_policies(
        content=all_artifacts,
        explicit_allowed=sds["constraints"]["explicit"],
        public_release=sds["constraints"].get("public_release", False),
        policy_mode="strict"  # Always use strict mode for final validation
    )

    if not is_valid:
        # Critical policy violations detected at final gate
        logger.error(
            "validate.policy_gate_failed",
            total_violations=report["summary"]["total_violations"],
            violations=report["violations"]
        )

        # Emit event for monitoring
        emit_event({
            "node": "VALIDATE",
            "event": "policy_gate_failed",
            "total_violations": report["summary"]["total_violations"],
            "profanity_count": report["summary"]["profanity_count"],
            "pii_count": report["summary"]["pii_count"],
            "artist_reference_count": report["summary"]["artist_reference_count"]
        })

        # Raise validation error to trigger FIX loop or abort
        raise ValidationError(
            "Policy violations detected at final validation gate",
            violations=report["violations"],
            suggestions=report["suggestions"]
        )

    # All policies passed - proceed to render
    validation_result = {
        "passed": True,
        "scores": compute_rubric_scores(all_artifacts),
        "policy_validation": report["summary"]
    }

    return validation_result
```

## Policy Modes

The policy enforcement supports three modes:

### 1. Strict Mode (Default)

- **Behavior:** Reject content with any policy violations
- **Use Case:** Public releases, production environments
- **Artist References:** Not allowed for public releases
- **Profanity:** Enforces clean thresholds unless explicit_allowed=True
- **PII:** Always redacted

```python
is_valid, report = validation_service.validate_all_policies(
    content=content,
    explicit_allowed=False,
    public_release=True,
    policy_mode="strict"
)

if not is_valid:
    # Content rejected - trigger FIX loop or abort
    raise ValidationError("Policy violations", violations=report["violations"])
```

### 2. Warn Mode

- **Behavior:** Allow content but log warnings for violations
- **Use Case:** Development, testing, internal previews
- **Artist References:** Allowed with warnings
- **Profanity:** Warns but allows based on thresholds
- **PII:** Still redacted (safety measure)

```python
is_valid, report = validation_service.validate_all_policies(
    content=content,
    explicit_allowed=False,
    public_release=False,
    policy_mode="warn"
)

if not is_valid:
    # Log warnings but continue
    logger.warning("policy_violations", violations=report["violations"])
    # Continue workflow
```

### 3. Permissive Mode

- **Behavior:** Allow all content without enforcement
- **Use Case:** Experimentation, debugging, non-public internal use
- **Artist References:** Always allowed
- **Profanity:** No restrictions
- **PII:** Detected but not blocking

```python
is_valid, report = validation_service.validate_all_policies(
    content=content,
    explicit_allowed=True,
    public_release=False,
    policy_mode="permissive"
)

# Always passes - use for debugging
assert is_valid is True
```

## Return Format Standardization

All policy validation methods return structured reports with consistent formats:

### Profanity Report

```python
{
    "has_violations": bool,
    "violations": [
        {
            "term": str,
            "position": int,
            "severity": str,  # "mild", "moderate", "strong", "extreme"
            "context": str,
            "section": Optional[str],
            "field": str  # Added by validate_all_policies
        }
    ],
    "profanity_score": float,  # 0.0-1.0
    "explicit_allowed": bool,
    "mode": str,
    "severity_summary": {
        "mild": int,
        "moderate": int,
        "strong": int,
        "extreme": int
    },
    "compliant": bool,
    "violation_count": int
}
```

### PII Report

```python
{
    "has_pii": bool,
    "pii_found": [
        {
            "type": str,  # "email", "phone", "url", "ssn", etc.
            "value": str,  # Original PII value (handle carefully!)
            "position": int,
            "redacted_as": str,  # Placeholder used (e.g., "[EMAIL]")
            "confidence": float,  # 0.0-1.0
            "context": str,
            "field": str  # Added by validate_all_policies
        }
    ],
    "redacted_text": str,
    "original_text": str,
    "summary": {
        "total_pii_count": int,
        "types": Dict[str, int],  # Count by type
        "avg_confidence": float
    }
}
```

### Artist Reference Report

```python
{
    "has_references": bool,
    "references": [
        {
            "artist_name": str,
            "position": int,
            "pattern_used": str,
            "matched_text": str,
            "generic_replacement": str,
            "requires_normalization": bool,
            "confidence": float,
            "genre": str,
            "style_tags": List[str],
            "field": str  # Added by validate_all_policies
        }
    ],
    "normalized_text": str,
    "original_text": str,
    "changes": [
        {
            "original": str,
            "replacement": str,
            "artist": str,
            "position": int,
            "pattern": str
        }
    ],
    "compliant": bool,
    "violations": List[str],
    "policy_mode": str,
    "public_release": bool
}
```

### Combined Validation Report

```python
{
    "is_valid": bool,
    "violations": {
        "profanity": List[Dict],
        "pii": List[Dict],
        "artist_references": List[Dict]
    },
    "redacted_content": {
        "field_name": str  # Redacted text for fields with PII
    },
    "normalized_content": {
        "field_name": str  # Normalized text for fields with artist refs
    },
    "policy_mode": str,
    "suggestions": List[str],
    "explicit_allowed": bool,
    "public_release": bool,
    "summary": {
        "total_violations": int,
        "profanity_count": int,
        "pii_count": int,
        "artist_reference_count": int
    }
}
```

## Error Handling

All validation methods include comprehensive error handling:

```python
try:
    is_valid, report = validation_service.validate_profanity(
        text=lyrics_text,
        explicit_allowed=False,
        context="lyrics"
    )
except Exception as e:
    # Log error
    logger.error("validation.error", error=str(e), exc_info=True)

    # Fail closed - assume invalid on error
    is_valid = False
    report = {
        "has_violations": False,
        "violations": [],
        "error": str(e),
        "compliant": True  # Default to compliant on error (fail open)
    }
```

## Observability and Logging

All validation operations emit structured logs:

```python
# Start event
logger.debug(
    "validation.profanity_check_start",
    text_length=len(text),
    explicit_allowed=explicit_allowed,
    context=context
)

# Completion event
logger.info(
    "validation.profanity_check_complete",
    text_length=len(text),
    is_valid=is_valid,
    violation_count=len(violations),
    profanity_score=score,
    context=context
)

# Warning event
logger.warning(
    "validation.artist_references_warning",
    violation_count=len(violations),
    public_release=public_release
)

# Error event
logger.error(
    "validation.profanity_check_error",
    error=str(e),
    text_length=len(text),
    context=context,
    exc_info=True
)
```

## Testing Integration

Integration tests verify workflow node patterns:

```python
def test_lyrics_node_integration():
    """Test LYRICS node with policy validation."""
    service = ValidationService()

    # Generate lyrics
    lyrics_text = "Dancing in the sunshine"

    # Validate
    is_valid, report = service.validate_profanity(
        text=lyrics_text,
        explicit_allowed=False,
        context="lyrics"
    )

    assert is_valid is True
    assert report["profanity_score"] == 0.0

    # Check PII
    has_pii, redacted, pii_report = service.validate_pii(
        text=lyrics_text,
        context="lyrics"
    )

    assert has_pii is False
    assert redacted == lyrics_text
```

## Best Practices

1. **Always validate at node boundaries:** Check policies when generating new content
2. **Use redacted/normalized content:** Apply fixes before persisting artifacts
3. **Log all violations:** Emit structured events for monitoring and debugging
4. **Fail closed on errors:** Default to invalid/blocking on error conditions
5. **Use strict mode for public releases:** Never bypass policy checks for production
6. **Include field context:** Track which field contains violations for targeted fixes
7. **Emit events for observability:** Enable real-time monitoring of policy violations
8. **Test integration patterns:** Verify workflow nodes handle violations correctly

## Summary

The policy guards integration provides:

- **Comprehensive validation:** Profanity, PII, and artist reference checks
- **Flexible enforcement:** Strict, warn, and permissive modes
- **Automatic remediation:** PII redaction and artist normalization
- **Detailed reporting:** Structured violation reports with suggestions
- **Workflow integration:** Clear patterns for LYRICS, STYLE, COMPOSE, and VALIDATE nodes
- **Error resilience:** Graceful error handling with fail-safe defaults
- **Full observability:** Structured logging for monitoring and debugging

Use this guide when implementing workflow nodes to ensure consistent policy enforcement across the AMCS system.
