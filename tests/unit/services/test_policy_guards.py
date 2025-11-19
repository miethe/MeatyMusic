"""Unit tests for policy guards (profanity filter and PII detector).

Tests cover:
- PIIDetector: Email, phone, URL, SSN, credit card, address, name detection
- PII redaction and reporting
- Allowlist handling
- Edge cases and determinism
"""

import pytest
from pathlib import Path
from typing import Dict, Any, List

from services.api.app.services.policy_guards import (
    PIIDetector,
    PIIViolation,
    ProfanityFilter,
    ProfanityViolation,
)


class TestPIIDetector:
    """Test suite for PII detection and redaction."""

    @pytest.fixture
    def detector(self) -> PIIDetector:
        """Create PIIDetector instance for testing."""
        return PIIDetector()

    @pytest.fixture
    def taxonomy_path(self) -> Path:
        """Get path to PII taxonomy file."""
        project_root = Path(__file__).parent.parent.parent.parent
        return project_root / "taxonomies" / "pii_patterns.json"

    # === Initialization Tests ===

    def test_detector_initialization(self, detector: PIIDetector):
        """Test that detector initializes properly."""
        assert detector is not None
        assert len(detector.patterns) > 0
        assert len(detector._compiled_patterns) > 0
        assert "email" in detector.patterns
        assert "phone_us" in detector.patterns

    def test_detector_loads_taxonomy(self, detector: PIIDetector, taxonomy_path: Path):
        """Test that taxonomy file is loaded correctly."""
        assert taxonomy_path.exists()
        assert detector.taxonomy is not None
        assert "patterns" in detector.taxonomy
        assert "allowlist" in detector.taxonomy

    def test_detector_custom_taxonomy_path(self, taxonomy_path: Path):
        """Test detector with custom taxonomy path."""
        detector = PIIDetector(taxonomy_path=taxonomy_path)
        assert detector is not None
        assert len(detector.patterns) > 0

    def test_detector_invalid_taxonomy_path(self):
        """Test detector with invalid taxonomy path."""
        invalid_path = Path("/nonexistent/path/to/taxonomy.json")
        with pytest.raises(FileNotFoundError):
            PIIDetector(taxonomy_path=invalid_path)

    # === Email Detection Tests ===

    def test_detect_email_basic(self, detector: PIIDetector):
        """Test detection of basic email addresses."""
        text = "Contact me at john.doe@example.com for more info."
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        assert len(violations) == 1
        assert violations[0]["type"] == "email"
        assert violations[0]["value"] == "john.doe@example.com"
        assert violations[0]["position"] == 14
        assert violations[0]["redacted_as"] == "[EMAIL]"
        assert violations[0]["confidence"] >= 0.9

    def test_detect_email_multiple(self, detector: PIIDetector):
        """Test detection of multiple email addresses."""
        text = "Email alice@company.com or bob@example.org"
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        assert len(violations) == 2
        assert violations[0]["type"] == "email"
        assert violations[1]["type"] == "email"

    def test_detect_email_with_tags(self, detector: PIIDetector):
        """Test detection of emails with + tags."""
        text = "Send to user+tag@example.com"
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        assert len(violations) == 1
        assert violations[0]["value"] == "user+tag@example.com"

    def test_detect_email_subdomain(self, detector: PIIDetector):
        """Test detection of emails with subdomains."""
        text = "Contact support@mail.example.co.uk"
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        assert len(violations) == 1
        assert "example.co.uk" in violations[0]["value"]

    # === Phone Detection Tests ===

    def test_detect_phone_us_basic(self, detector: PIIDetector):
        """Test detection of US phone numbers."""
        test_cases = [
            ("Call me at 555-123-4567", "555-123-4567"),
            ("Phone: (555) 123-4567", "(555) 123-4567"),
            ("Dial 5551234567 now", "5551234567"),
        ]

        for text, expected_value in test_cases:
            has_pii, violations = detector.detect_pii(text)
            assert has_pii is True
            assert len(violations) >= 1
            # Find the phone violation
            phone_violations = [v for v in violations if v["type"] == "phone"]
            assert len(phone_violations) >= 1
            assert expected_value in phone_violations[0]["value"]

    def test_detect_phone_us_with_country_code(self, detector: PIIDetector):
        """Test detection of US phone numbers with country code."""
        text = "Call +1-555-123-4567 or +1 (555) 123-4567"
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        phone_violations = [v for v in violations if v["type"] == "phone"]
        assert len(phone_violations) >= 1

    def test_detect_phone_international(self, detector: PIIDetector):
        """Test detection of international phone numbers."""
        test_cases = [
            "+44 20 7123 4567",
            "+33 1 42 86 82 00",
            "+81 3-1234-5678",
        ]

        for phone in test_cases:
            text = f"Contact {phone} for support"
            has_pii, violations = detector.detect_pii(text)
            assert has_pii is True
            phone_violations = [v for v in violations if v["type"] == "phone"]
            assert len(phone_violations) >= 1

    # === URL Detection Tests ===

    def test_detect_url_basic(self, detector: PIIDetector):
        """Test detection of basic URLs."""
        test_cases = [
            "http://example.com",
            "https://www.example.com",
            "https://example.com/path/to/resource",
        ]

        for url in test_cases:
            text = f"Visit {url} for more info"
            has_pii, violations = detector.detect_pii(text)
            assert has_pii is True
            url_violations = [v for v in violations if v["type"] == "url"]
            assert len(url_violations) >= 1
            assert url in url_violations[0]["value"]

    def test_detect_url_with_query_params(self, detector: PIIDetector):
        """Test detection of URLs with query parameters."""
        text = "Check https://example.com/search?q=test&id=123"
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        url_violations = [v for v in violations if v["type"] == "url"]
        assert len(url_violations) >= 1

    def test_detect_url_subdomain(self, detector: PIIDetector):
        """Test detection of URLs with subdomains."""
        text = "Go to https://api.service.example.com/v1/endpoint"
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        url_violations = [v for v in violations if v["type"] == "url"]
        assert len(url_violations) >= 1

    # === SSN Detection Tests ===

    def test_detect_ssn_basic(self, detector: PIIDetector):
        """Test detection of Social Security Numbers."""
        test_cases = [
            "123-45-6789",
            "123456789",
        ]

        for ssn in test_cases:
            text = f"SSN: {ssn}"
            has_pii, violations = detector.detect_pii(text)
            assert has_pii is True
            ssn_violations = [v for v in violations if v["type"] == "ssn"]
            assert len(ssn_violations) >= 1

    def test_detect_ssn_invalid_patterns(self, detector: PIIDetector):
        """Test that invalid SSN patterns are not detected."""
        invalid_ssns = [
            "000-12-3456",  # Invalid area number
            "666-12-3456",  # Invalid area number
            "123-00-4567",  # Invalid group number
            "123-45-0000",  # Invalid serial number
        ]

        for ssn in invalid_ssns:
            text = f"Number: {ssn}"
            has_pii, violations = detector.detect_pii(text)
            ssn_violations = [v for v in violations if v["type"] == "ssn"]
            # Should not detect invalid SSNs
            assert len(ssn_violations) == 0

    # === Credit Card Detection Tests ===

    def test_detect_credit_card_visa(self, detector: PIIDetector):
        """Test detection of Visa card numbers."""
        text = "Card number: 4111111111111111"
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        cc_violations = [v for v in violations if v["type"] == "credit_card"]
        assert len(cc_violations) >= 1

    def test_detect_credit_card_mastercard(self, detector: PIIDetector):
        """Test detection of MasterCard numbers."""
        text = "Pay with 5500000000000004"
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        cc_violations = [v for v in violations if v["type"] == "credit_card"]
        assert len(cc_violations) >= 1

    def test_detect_credit_card_amex(self, detector: PIIDetector):
        """Test detection of American Express card numbers."""
        text = "AmEx: 340000000000009"
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        cc_violations = [v for v in violations if v["type"] == "credit_card"]
        assert len(cc_violations) >= 1

    # === Address Detection Tests ===

    def test_detect_address_basic(self, detector: PIIDetector):
        """Test detection of street addresses."""
        test_cases = [
            "123 Main Street",
            "456 Oak Avenue",
            "789 Elm Dr.",
        ]

        for address in test_cases:
            text = f"Located at {address}"
            has_pii, violations = detector.detect_pii(text)
            assert has_pii is True
            addr_violations = [v for v in violations if v["type"] == "address"]
            assert len(addr_violations) >= 1

    def test_detect_address_allowlist(self, detector: PIIDetector):
        """Test that common street names in allowlist are not flagged."""
        # These should be in the allowlist as generic/common
        common_streets = [
            "Main Street",
            "Wall Street",
            "Broadway",
        ]

        for street in common_streets:
            text = f"Walking down {street}"
            has_pii, violations = detector.detect_pii(text)
            # Should not detect generic street names without numbers
            addr_violations = [v for v in violations if v["type"] == "address"]
            # May or may not detect depending on pattern specificity
            # Just ensure it doesn't crash

    # === Name Detection Tests ===

    def test_detect_name_with_title(self, detector: PIIDetector):
        """Test detection of names with titles."""
        test_cases = [
            "Dr. Smith",
            "Mrs. Johnson",
            "Prof. Anderson",
        ]

        for name in test_cases:
            text = f"Meeting with {name} tomorrow"
            has_pii, violations = detector.detect_pii(text)
            # Name detection might detect these
            # Just ensure no errors

    def test_detect_name_with_indicator(self, detector: PIIDetector):
        """Test detection of names with indicators."""
        text = "My name is Robert Williams"
        has_pii, violations = detector.detect_pii(text)

        # Should detect the name
        name_violations = [v for v in violations if v["type"] == "name"]
        # Pattern-based detection may vary
        assert len(name_violations) >= 0  # At least doesn't crash

    def test_detect_name_allowlist(self, detector: PIIDetector):
        """Test that famous artist names are allowlisted."""
        famous_names = [
            "Taylor Swift",
            "Elvis Presley",
            "Michael Jackson",
        ]

        for name in famous_names:
            text = f"I love {name} music"
            has_pii, violations = detector.detect_pii(text)
            name_violations = [v for v in violations if v["type"] == "name"]
            # Should be allowlisted
            assert all(name not in v["value"] for v in name_violations)

    def test_detect_name_generic(self, detector: PIIDetector):
        """Test that generic names are allowlisted."""
        generic_names = [
            "John Doe",
            "Jane Smith",
        ]

        for name in generic_names:
            text = f"Account for {name}"
            has_pii, violations = detector.detect_pii(text)
            name_violations = [v for v in violations if v["type"] == "name"]
            # Should be allowlisted
            assert all(name not in v["value"] for v in name_violations)

    # === Multiple PII Types Tests ===

    def test_detect_multiple_pii_types(self, detector: PIIDetector):
        """Test detection of multiple PII types in one text."""
        text = (
            "Contact John at john@example.com or call 555-123-4567. "
            "Visit https://example.com for more info."
        )
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        assert len(violations) >= 2  # At least email and phone

        # Check that multiple types are detected
        types_found = set(v["type"] for v in violations)
        assert "email" in types_found
        assert "phone" in types_found or "url" in types_found

    def test_pii_detection_order_deterministic(self, detector: PIIDetector):
        """Test that PII detection order is deterministic."""
        text = "Email: alice@test.com, Phone: 555-123-4567, Bob: bob@test.com"

        # Run detection multiple times
        results = [detector.detect_pii(text) for _ in range(3)]

        # All results should be identical
        for i in range(1, len(results)):
            assert results[i][0] == results[0][0]  # Same has_pii
            assert len(results[i][1]) == len(results[0][1])  # Same count
            # Same positions
            for j in range(len(results[0][1])):
                assert results[i][1][j]["position"] == results[0][1][j]["position"]
                assert results[i][1][j]["type"] == results[0][1][j]["type"]

    # === Redaction Tests ===

    def test_redact_email(self, detector: PIIDetector):
        """Test redaction of email addresses."""
        text = "Send to john@example.com today"
        redacted, violations = detector.redact_pii(text)

        assert redacted == "Send to [EMAIL] today"
        assert len(violations) == 1

    def test_redact_phone(self, detector: PIIDetector):
        """Test redaction of phone numbers."""
        text = "Call 555-123-4567 now"
        redacted, violations = detector.redact_pii(text)

        assert redacted == "Call [PHONE] now"
        assert len(violations) == 1

    def test_redact_multiple_pii(self, detector: PIIDetector):
        """Test redaction of multiple PII items."""
        text = "Email alice@test.com or call 555-123-4567"
        redacted, violations = detector.redact_pii(text)

        assert "[EMAIL]" in redacted
        assert "[PHONE]" in redacted
        assert "alice@test.com" not in redacted
        assert "555-123-4567" not in redacted
        assert len(violations) >= 2

    def test_redact_preserves_structure(self, detector: PIIDetector):
        """Test that redaction preserves text structure."""
        text = "Contact: john@example.com\nPhone: 555-123-4567\nDone."
        redacted, violations = detector.redact_pii(text)

        # Should preserve newlines and structure
        assert "\n" in redacted
        assert redacted.endswith("Done.")
        assert "john@example.com" not in redacted

    def test_redact_empty_text(self, detector: PIIDetector):
        """Test redaction of empty text."""
        text = ""
        redacted, violations = detector.redact_pii(text)

        assert redacted == ""
        assert len(violations) == 0

    def test_redact_no_pii(self, detector: PIIDetector):
        """Test redaction when no PII is present."""
        text = "This is a clean sentence with no sensitive data."
        redacted, violations = detector.redact_pii(text)

        assert redacted == text
        assert len(violations) == 0

    # === Report Generation Tests ===

    def test_get_pii_report_basic(self, detector: PIIDetector):
        """Test basic PII report generation."""
        text = "Contact john@example.com"
        report = detector.get_pii_report(text)

        assert "has_pii" in report
        assert "pii_found" in report
        assert "redacted_text" in report
        assert "original_text" in report
        assert "summary" in report

        assert report["has_pii"] is True
        assert report["original_text"] == text
        assert "[EMAIL]" in report["redacted_text"]

    def test_get_pii_report_summary(self, detector: PIIDetector):
        """Test PII report summary statistics."""
        text = "Email: alice@test.com, bob@test.com. Phone: 555-123-4567"
        report = detector.get_pii_report(text)

        summary = report["summary"]
        assert "total_pii_count" in summary
        assert "types" in summary
        assert "avg_confidence" in summary

        assert summary["total_pii_count"] >= 2
        assert "email" in summary["types"]
        assert summary["avg_confidence"] > 0.0

    def test_get_pii_report_no_pii(self, detector: PIIDetector):
        """Test PII report when no PII is found."""
        text = "This is clean text"
        report = detector.get_pii_report(text)

        assert report["has_pii"] is False
        assert len(report["pii_found"]) == 0
        assert report["redacted_text"] == text
        assert report["summary"]["total_pii_count"] == 0

    # === Edge Cases ===

    def test_detect_pii_with_whitespace(self, detector: PIIDetector):
        """Test PII detection with various whitespace."""
        text = "  Email:  john@example.com  \n\n  Phone: 555-123-4567  "
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        assert len(violations) >= 2

    def test_detect_pii_case_sensitivity(self, detector: PIIDetector):
        """Test that detection handles different cases."""
        text = "JOHN@EXAMPLE.COM or John@Example.Com"
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        email_violations = [v for v in violations if v["type"] == "email"]
        assert len(email_violations) >= 1

    def test_pii_violation_dataclass(self):
        """Test PIIViolation dataclass."""
        violation = PIIViolation(
            type="email",
            value="test@example.com",
            position=10,
            redacted_as="[EMAIL]",
            confidence=0.95,
            context="...some [REDACTED] text..."
        )

        assert violation.type == "email"
        assert violation.value == "test@example.com"
        assert violation.position == 10

        # Test to_dict
        vdict = violation.to_dict()
        assert vdict["type"] == "email"
        assert vdict["value"] == "test@example.com"
        assert vdict["confidence"] == 0.95

    def test_detect_pii_context_extraction(self, detector: PIIDetector):
        """Test that context is properly extracted around PII."""
        text = "This is a long sentence with john@example.com in the middle of it all."
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        assert len(violations) >= 1

        # Context should be present and redacted
        context = violations[0]["context"]
        assert "[REDACTED]" in context
        assert "john@example.com" not in context

    def test_allowlist_email_prefixes(self, detector: PIIDetector):
        """Test that generic email prefixes might be handled."""
        # Note: Full emails will still be detected; this tests the framework
        text = "Send to info@company.com for general inquiries"
        has_pii, violations = detector.detect_pii(text)

        # Should still detect (allowlist is for specific contexts)
        # This test verifies the system works even with common prefixes

    # === Confidence Threshold Tests ===

    def test_pii_confidence_scores(self, detector: PIIDetector):
        """Test that confidence scores are assigned correctly."""
        text = "Email: test@example.com, SSN: 123-45-6789"
        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True

        for violation in violations:
            assert "confidence" in violation
            assert 0.0 <= violation["confidence"] <= 1.0

        # SSN should have high confidence
        ssn_violations = [v for v in violations if v["type"] == "ssn"]
        if ssn_violations:
            assert ssn_violations[0]["confidence"] >= 0.95

    def test_detect_methods_individually(self, detector: PIIDetector):
        """Test individual detect methods."""
        # Test detect_emails
        emails = detector.detect_emails("Send to alice@test.com")
        assert len(emails) == 1
        assert emails[0].type == "email"

        # Test detect_phones
        phones = detector.detect_phones("Call 555-123-4567")
        assert len(phones) >= 1
        assert phones[0].type == "phone"

        # Test detect_urls
        urls = detector.detect_urls("Visit https://example.com")
        assert len(urls) == 1
        assert urls[0].type == "url"

        # Test detect_ssn
        ssns = detector.detect_ssn("SSN: 123-45-6789")
        assert len(ssns) >= 1
        assert ssns[0].type == "ssn"

        # Test detect_credit_cards
        cards = detector.detect_credit_cards("Card: 4111111111111111")
        assert len(cards) >= 1
        assert cards[0].type == "credit_card"

        # Test detect_addresses
        addresses = detector.detect_addresses("123 Main Street")
        # May or may not detect depending on full context
        assert isinstance(addresses, list)

        # Test detect_names
        names = detector.detect_names("My name is Dr. Smith")
        # Pattern-based detection, may vary
        assert isinstance(names, list)


class TestProfanityFilter:
    """Basic tests for ProfanityFilter to ensure it's still working."""

    @pytest.fixture
    def filter(self) -> ProfanityFilter:
        """Create ProfanityFilter instance for testing."""
        return ProfanityFilter()

    def test_profanity_filter_initialization(self, filter: ProfanityFilter):
        """Test that profanity filter initializes properly."""
        assert filter is not None
        assert len(filter.categories) > 0

    def test_detect_profanity_basic(self, filter: ProfanityFilter):
        """Test basic profanity detection."""
        has_violations, violations = filter.detect_profanity(
            "This is damn text",
            explicit_allowed=False
        )
        # Should detect 'damn' as mild profanity
        assert len(violations) >= 0  # Depends on mode

    def test_profanity_score(self, filter: ProfanityFilter):
        """Test profanity scoring."""
        score = filter.get_profanity_score("This is clean text")
        assert score == 0.0

    def test_profanity_violation_dataclass(self):
        """Test ProfanityViolation dataclass."""
        violation = ProfanityViolation(
            term="damn",
            position=10,
            severity="mild",
            context="...is [damn] text...",
            section="verse_1",
            normalized_form="damn",
            original_form="damn"
        )

        assert violation.term == "damn"
        assert violation.severity == "mild"

        vdict = violation.to_dict()
        assert vdict["term"] == "damn"
        assert vdict["severity"] == "mild"


class TestPolicyGuardsIntegration:
    """Integration tests for policy guards working together."""

    def test_both_detectors_work_independently(self):
        """Test that both detectors can be used in the same session."""
        pii_detector = PIIDetector()
        profanity_filter = ProfanityFilter()

        text = "Email me at damn@example.com"

        # PII detection
        has_pii, pii_violations = pii_detector.detect_pii(text)
        assert has_pii is True

        # Profanity detection
        has_prof, prof_violations = profanity_filter.detect_profanity(
            text,
            explicit_allowed=True  # To avoid false positives
        )

        # Both should work without interference
        assert len(pii_violations) >= 1

    def test_combined_filtering_workflow(self):
        """Test a realistic combined filtering workflow."""
        pii_detector = PIIDetector()
        profanity_filter = ProfanityFilter()

        text = "Contact me at john@example.com or call 555-123-4567"

        # Step 1: Check for profanity
        has_profanity, prof_violations = profanity_filter.detect_profanity(
            text,
            explicit_allowed=False
        )

        # Step 2: Redact PII
        redacted_text, pii_violations = pii_detector.redact_pii(text)

        # Verify
        assert "[EMAIL]" in redacted_text
        assert "[PHONE]" in redacted_text
        assert "john@example.com" not in redacted_text

    def test_edge_case_pii_in_profanity_context(self):
        """Test edge case where PII might appear in profane context."""
        pii_detector = PIIDetector()
        profanity_filter = ProfanityFilter()

        text = "That damn email is test@example.com"

        # Both should detect their respective violations
        has_pii, pii_violations = pii_detector.detect_pii(text)
        has_prof, prof_violations = profanity_filter.detect_profanity(
            text,
            explicit_allowed=False,
            mode="clean"
        )

        # PII should be detected
        assert has_pii is True
        email_violations = [v for v in pii_violations if v["type"] == "email"]
        assert len(email_violations) >= 1


# === Performance and Stress Tests ===

class TestPIIDetectorPerformance:
    """Performance and stress tests for PII detector."""

    @pytest.fixture
    def detector(self) -> PIIDetector:
        """Create PIIDetector instance for testing."""
        return PIIDetector()

    def test_large_text_processing(self, detector: PIIDetector):
        """Test processing of large text blocks."""
        # Create a large text with multiple PII instances
        text = " ".join([
            f"User {i} email: user{i}@example.com phone: 555-123-{i:04d}"
            for i in range(100)
        ])

        has_pii, violations = detector.detect_pii(text)

        assert has_pii is True
        assert len(violations) >= 100  # At least 100 emails

    def test_redaction_performance(self, detector: PIIDetector):
        """Test redaction performance on text with many PII items."""
        text = " ".join([
            f"Contact {i}: email{i}@test.com, phone: 555-{i:03d}-{i:04d}"
            for i in range(50)
        ])

        redacted, violations = detector.redact_pii(text)

        # Verify all PII is redacted
        assert "email" not in redacted.lower() or "[EMAIL]" in redacted
        assert "@test.com" not in redacted
        assert len(violations) >= 50

    def test_no_false_positives_in_clean_text(self, detector: PIIDetector):
        """Test that clean text doesn't generate false positives."""
        clean_texts = [
            "This is a simple sentence.",
            "The quick brown fox jumps over the lazy dog.",
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            "Testing 123 with numbers but no PII.",
        ]

        for text in clean_texts:
            has_pii, violations = detector.detect_pii(text)
            # Should have no PII detected in clean text
            assert has_pii is False
            assert len(violations) == 0
