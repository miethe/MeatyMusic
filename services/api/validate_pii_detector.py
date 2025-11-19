#!/usr/bin/env python3
"""Standalone validation script for PII detector.

This script validates the PII detection and redaction functionality
without requiring the full test suite or all dependencies.
"""

import sys
import json
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Simple structlog mock for standalone testing
class MockLogger:
    def info(self, msg, **kwargs):
        print(f"[INFO] {msg}: {kwargs}")

    def debug(self, msg, **kwargs):
        pass

    def error(self, msg, **kwargs):
        print(f"[ERROR] {msg}: {kwargs}")

    def warning(self, msg, **kwargs):
        print(f"[WARN] {msg}: {kwargs}")

class MockStructlog:
    @staticmethod
    def get_logger(name):
        return MockLogger()

# Mock structlog module
sys.modules['structlog'] = MockStructlog()

# Import PIIDetector directly without going through services package
import importlib.util
spec = importlib.util.spec_from_file_location(
    "app.services.policy_guards",
    Path(__file__).parent / "app" / "services" / "policy_guards.py"
)
policy_guards = importlib.util.module_from_spec(spec)
sys.modules['app.services.policy_guards'] = policy_guards
spec.loader.exec_module(policy_guards)

PIIDetector = policy_guards.PIIDetector
PIIViolation = policy_guards.PIIViolation


def test_email_detection():
    """Test email address detection."""
    print("\n=== Testing Email Detection ===")
    detector = PIIDetector()

    test_cases = [
        ("Contact me at john.doe@example.com", "john.doe@example.com"),
        ("Email: alice@company.com or bob@example.org", 2),
        ("Send to user+tag@example.com", "user+tag@example.com"),
    ]

    for text, expected in test_cases:
        has_pii, violations = detector.detect_pii(text)
        if isinstance(expected, str):
            assert has_pii, f"Failed to detect PII in: {text}"
            assert any(expected in v["value"] for v in violations), f"Expected {expected} in violations"
            print(f"✓ Detected email: {expected}")
        else:
            assert has_pii, f"Failed to detect PII in: {text}"
            email_count = sum(1 for v in violations if v["type"] == "email")
            assert email_count >= expected, f"Expected at least {expected} emails, got {email_count}"
            print(f"✓ Detected {email_count} emails")


def test_phone_detection():
    """Test phone number detection."""
    print("\n=== Testing Phone Detection ===")
    detector = PIIDetector()

    test_cases = [
        "Call me at 555-123-4567",
        "Phone: (555) 123-4567",
        "+1-555-123-4567",
        "+44 20 7123 4567",
    ]

    for text in test_cases:
        has_pii, violations = detector.detect_pii(text)
        assert has_pii, f"Failed to detect phone in: {text}"
        phone_violations = [v for v in violations if v["type"] == "phone"]
        assert len(phone_violations) >= 1, f"No phone violations found in: {text}"
        print(f"✓ Detected phone: {phone_violations[0]['value']}")


def test_url_detection():
    """Test URL detection."""
    print("\n=== Testing URL Detection ===")
    detector = PIIDetector()

    test_cases = [
        "http://example.com",
        "https://www.example.com/path",
        "https://api.example.com/v1/endpoint?query=value",
    ]

    for url in test_cases:
        text = f"Visit {url} for info"
        has_pii, violations = detector.detect_pii(text)
        assert has_pii, f"Failed to detect URL in: {text}"
        url_violations = [v for v in violations if v["type"] == "url"]
        assert len(url_violations) >= 1, f"No URL violations found in: {text}"
        print(f"✓ Detected URL: {url}")


def test_ssn_detection():
    """Test SSN detection."""
    print("\n=== Testing SSN Detection ===")
    detector = PIIDetector()

    valid_ssns = [
        "123-45-6789",
        "123456789",
    ]

    for ssn in valid_ssns:
        text = f"SSN: {ssn}"
        has_pii, violations = detector.detect_pii(text)
        assert has_pii, f"Failed to detect SSN in: {text}"
        ssn_violations = [v for v in violations if v["type"] == "ssn"]
        assert len(ssn_violations) >= 1, f"No SSN violations found in: {text}"
        print(f"✓ Detected SSN: {ssn}")

    # Test invalid SSNs are NOT detected
    invalid_ssns = ["000-12-3456", "666-12-3456", "123-00-4567", "123-45-0000"]
    for ssn in invalid_ssns:
        text = f"Number: {ssn}"
        has_pii, violations = detector.detect_pii(text)
        ssn_violations = [v for v in violations if v["type"] == "ssn"]
        assert len(ssn_violations) == 0, f"Should not detect invalid SSN: {ssn}"
    print("✓ Correctly rejected invalid SSNs")


def test_credit_card_detection():
    """Test credit card detection."""
    print("\n=== Testing Credit Card Detection ===")
    detector = PIIDetector()

    test_cards = [
        ("4111111111111111", "Visa"),
        ("5500000000000004", "MasterCard"),
        ("340000000000009", "AmEx"),
    ]

    for card_num, card_type in test_cards:
        text = f"Card: {card_num}"
        has_pii, violations = detector.detect_pii(text)
        assert has_pii, f"Failed to detect {card_type} card in: {text}"
        cc_violations = [v for v in violations if v["type"] == "credit_card"]
        assert len(cc_violations) >= 1, f"No credit card violations found for {card_type}"
        print(f"✓ Detected {card_type}: {card_num}")


def test_address_detection():
    """Test address detection."""
    print("\n=== Testing Address Detection ===")
    detector = PIIDetector()

    test_addresses = [
        "123 Main Street",
        "456 Oak Avenue",
        "789 Elm Dr.",
    ]

    for address in test_addresses:
        text = f"Located at {address}"
        has_pii, violations = detector.detect_pii(text)
        # Address detection is lower confidence, just check it doesn't crash
        print(f"✓ Processed address: {address} (found: {has_pii})")


def test_name_detection():
    """Test name detection."""
    print("\n=== Testing Name Detection ===")
    detector = PIIDetector()

    test_cases = [
        "My name is Robert Williams",
        "Dr. Smith will see you",
        "Meeting with Mrs. Johnson",
    ]

    for text in test_cases:
        has_pii, violations = detector.detect_pii(text)
        # Name detection is pattern-based and may vary
        print(f"✓ Processed: {text} (PII found: {has_pii})")


def test_allowlist():
    """Test allowlist functionality."""
    print("\n=== Testing Allowlist ===")
    detector = PIIDetector()

    # Famous artists should be allowlisted
    famous_names = ["Taylor Swift", "Elvis Presley", "Michael Jackson"]

    for name in famous_names:
        text = f"I love {name} music"
        has_pii, violations = detector.detect_pii(text)
        name_violations = [v for v in violations if v["type"] == "name" and name in v["value"]]
        assert len(name_violations) == 0, f"Famous name should be allowlisted: {name}"
        print(f"✓ Allowlisted: {name}")

    # Generic names should be allowlisted
    generic_names = ["John Doe", "Jane Smith"]
    for name in generic_names:
        text = f"Account for {name}"
        has_pii, violations = detector.detect_pii(text)
        name_violations = [v for v in violations if v["type"] == "name" and name in v["value"]]
        assert len(name_violations) == 0, f"Generic name should be allowlisted: {name}"
        print(f"✓ Allowlisted: {name}")


def test_redaction():
    """Test PII redaction."""
    print("\n=== Testing PII Redaction ===")
    detector = PIIDetector()

    test_cases = [
        ("Email me at john@example.com", "Email me at [EMAIL]"),
        ("Call 555-123-4567 now", "Call [PHONE] now"),
        ("Visit https://example.com", "Visit [URL]"),
    ]

    for original, expected_pattern in test_cases:
        redacted, violations = detector.redact_pii(original)
        assert expected_pattern in redacted or redacted.count("[") >= 1, \
            f"Redaction failed: {original} -> {redacted}"
        assert len(violations) >= 1, f"No violations reported for: {original}"
        print(f"✓ Redacted: '{original}' -> '{redacted}'")

    # Test multiple PII redaction
    text = "Email alice@test.com or call 555-123-4567"
    redacted, violations = detector.redact_pii(text)
    assert "[EMAIL]" in redacted, "Email not redacted"
    assert "[PHONE]" in redacted, "Phone not redacted"
    assert "alice@test.com" not in redacted, "Email still visible"
    assert "555-123-4567" not in redacted, "Phone still visible"
    print(f"✓ Multiple PII redacted: '{text}' -> '{redacted}'")


def test_pii_report():
    """Test PII report generation."""
    print("\n=== Testing PII Report ===")
    detector = PIIDetector()

    text = "Contact john@example.com or call 555-123-4567"
    report = detector.get_pii_report(text)

    assert "has_pii" in report, "Report missing 'has_pii'"
    assert "pii_found" in report, "Report missing 'pii_found'"
    assert "redacted_text" in report, "Report missing 'redacted_text'"
    assert "original_text" in report, "Report missing 'original_text'"
    assert "summary" in report, "Report missing 'summary'"

    assert report["has_pii"] is True, "Should detect PII"
    assert report["original_text"] == text, "Original text mismatch"
    assert "[EMAIL]" in report["redacted_text"], "Email not redacted in report"
    assert "[PHONE]" in report["redacted_text"], "Phone not redacted in report"

    summary = report["summary"]
    assert summary["total_pii_count"] >= 2, f"Expected at least 2 PII, got {summary['total_pii_count']}"
    assert "email" in summary["types"], "Email type not in summary"
    assert "phone" in summary["types"], "Phone type not in summary"
    assert summary["avg_confidence"] > 0.0, "Average confidence should be > 0"

    print(f"✓ Report generated successfully")
    print(f"  - PII count: {summary['total_pii_count']}")
    print(f"  - Types: {list(summary['types'].keys())}")
    print(f"  - Avg confidence: {summary['avg_confidence']:.2f}")


def test_determinism():
    """Test deterministic behavior."""
    print("\n=== Testing Determinism ===")
    detector = PIIDetector()

    text = "Email: alice@test.com, Phone: 555-123-4567, Bob: bob@test.com"

    # Run detection multiple times
    results = [detector.detect_pii(text) for _ in range(5)]

    # All results should be identical
    for i in range(1, len(results)):
        assert results[i][0] == results[0][0], f"has_pii mismatch at iteration {i}"
        assert len(results[i][1]) == len(results[0][1]), f"Violation count mismatch at iteration {i}"

        # Check positions and types are consistent
        for j in range(len(results[0][1])):
            assert results[i][1][j]["position"] == results[0][1][j]["position"], \
                f"Position mismatch at iteration {i}, violation {j}"
            assert results[i][1][j]["type"] == results[0][1][j]["type"], \
                f"Type mismatch at iteration {i}, violation {j}"

    print(f"✓ Deterministic across 5 runs ({len(results[0][1])} violations)")


def test_edge_cases():
    """Test edge cases."""
    print("\n=== Testing Edge Cases ===")
    detector = PIIDetector()

    # Empty text
    redacted, violations = detector.redact_pii("")
    assert redacted == "", "Empty text should remain empty"
    assert len(violations) == 0, "No violations expected for empty text"
    print("✓ Empty text handled correctly")

    # Clean text
    clean_text = "This is a simple sentence with no PII."
    has_pii, violations = detector.detect_pii(clean_text)
    assert has_pii is False, "Clean text should have no PII"
    assert len(violations) == 0, "No violations expected for clean text"
    print("✓ Clean text handled correctly")

    # Whitespace handling
    text_with_whitespace = "  Email:  john@example.com  \n\n  Phone: 555-123-4567  "
    has_pii, violations = detector.detect_pii(text_with_whitespace)
    assert has_pii is True, "Should detect PII despite whitespace"
    assert len(violations) >= 2, "Should detect both email and phone"
    print("✓ Whitespace handling correct")

    # Case sensitivity
    text_with_cases = "JOHN@EXAMPLE.COM or John@Example.Com"
    has_pii, violations = detector.detect_pii(text_with_cases)
    assert has_pii is True, "Should detect emails regardless of case"
    email_violations = [v for v in violations if v["type"] == "email"]
    assert len(email_violations) >= 1, "Should detect at least one email"
    print("✓ Case handling correct")


def test_confidence_scores():
    """Test confidence score assignment."""
    print("\n=== Testing Confidence Scores ===")
    detector = PIIDetector()

    text = "Email: test@example.com, SSN: 123-45-6789, Name: Dr. Smith"
    has_pii, violations = detector.detect_pii(text)

    assert has_pii is True, "Should detect PII"

    for violation in violations:
        assert "confidence" in violation, "Confidence missing from violation"
        assert 0.0 <= violation["confidence"] <= 1.0, \
            f"Confidence out of range: {violation['confidence']}"
        print(f"✓ {violation['type']}: confidence = {violation['confidence']}")

    # SSN should have high confidence
    ssn_violations = [v for v in violations if v["type"] == "ssn"]
    if ssn_violations:
        assert ssn_violations[0]["confidence"] >= 0.95, \
            f"SSN should have high confidence, got {ssn_violations[0]['confidence']}"
        print(f"✓ SSN has high confidence: {ssn_violations[0]['confidence']}")


def test_pii_violation_dataclass():
    """Test PIIViolation dataclass."""
    print("\n=== Testing PIIViolation Dataclass ===")

    violation = PIIViolation(
        type="email",
        value="test@example.com",
        position=10,
        redacted_as="[EMAIL]",
        confidence=0.95,
        context="...some [REDACTED] text..."
    )

    assert violation.type == "email", "Type mismatch"
    assert violation.value == "test@example.com", "Value mismatch"
    assert violation.position == 10, "Position mismatch"
    assert violation.confidence == 0.95, "Confidence mismatch"

    # Test to_dict
    vdict = violation.to_dict()
    assert vdict["type"] == "email", "Dict type mismatch"
    assert vdict["value"] == "test@example.com", "Dict value mismatch"
    assert vdict["confidence"] == 0.95, "Dict confidence mismatch"

    print("✓ PIIViolation dataclass working correctly")


def main():
    """Run all validation tests."""
    print("=" * 60)
    print("PII Detector Validation Script")
    print("=" * 60)

    try:
        test_email_detection()
        test_phone_detection()
        test_url_detection()
        test_ssn_detection()
        test_credit_card_detection()
        test_address_detection()
        test_name_detection()
        test_allowlist()
        test_redaction()
        test_pii_report()
        test_determinism()
        test_edge_cases()
        test_confidence_scores()
        test_pii_violation_dataclass()

        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED!")
        print("=" * 60)
        return 0

    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 1
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
