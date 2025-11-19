#!/usr/bin/env python3
"""Validation script for artist normalization implementation.

This script validates the ArtistNormalizer and PolicyEnforcer implementations
by running a series of tests.
"""

import sys
from pathlib import Path

# Add services/api to path
sys.path.insert(0, str(Path(__file__).parent / "services" / "api"))

from app.services.policy_guards import ArtistNormalizer, PolicyEnforcer


def test_artist_normalizer_initialization():
    """Test that ArtistNormalizer initializes correctly."""
    print("Testing ArtistNormalizer initialization...")
    normalizer = ArtistNormalizer()

    assert normalizer is not None, "Normalizer should be initialized"
    assert len(normalizer.living_artists) > 0, "Should have living artists"
    assert len(normalizer._artist_index) > 0, "Should have artist index"
    assert len(normalizer._compiled_patterns) > 0, "Should have compiled patterns"

    # Check specific artists
    assert "taylor swift" in normalizer._artist_index, "Should have Taylor Swift"
    assert "drake" in normalizer._artist_index, "Should have Drake"
    assert "kendrick lamar" in normalizer._artist_index, "Should have Kendrick Lamar"

    # Check aliases
    assert "drizzy" in normalizer._alias_index, "Should have Drake alias"
    assert normalizer._alias_index["drizzy"] == "drake", "Alias should map to Drake"

    print("✓ ArtistNormalizer initialization test passed")


def test_artist_reference_detection():
    """Test artist reference detection."""
    print("\nTesting artist reference detection...")
    normalizer = ArtistNormalizer()

    # Test 1: Clean text (no references)
    text1 = "This is a song with pop influences and melodic hooks."
    has_refs1, refs1 = normalizer.detect_artist_references(text1)
    assert has_refs1 is False, "Clean text should have no references"
    assert len(refs1) == 0, "Clean text should have no references"
    print("  ✓ Clean text detection")

    # Test 2: "style of" pattern
    text2 = "This song is in the style of Taylor Swift"
    has_refs2, refs2 = normalizer.detect_artist_references(text2)
    assert has_refs2 is True, "Should detect 'style of' pattern"
    assert len(refs2) > 0, "Should have references"
    assert refs2[0]["artist_name"] == "Taylor Swift", "Should detect Taylor Swift"
    assert "pop-influenced with storytelling" in refs2[0]["generic_replacement"]
    print("  ✓ 'style of' pattern detection")

    # Test 3: "sounds like" pattern
    text3 = "This track sounds like Drake"
    has_refs3, refs3 = normalizer.detect_artist_references(text3)
    assert has_refs3 is True, "Should detect 'sounds like' pattern"
    assert refs3[0]["artist_name"] == "Drake", "Should detect Drake"
    print("  ✓ 'sounds like' pattern detection")

    # Test 4: Multiple references
    text4 = "Style of Taylor Swift with production like The Weeknd"
    has_refs4, refs4 = normalizer.detect_artist_references(text4)
    assert has_refs4 is True, "Should detect multiple references"
    assert len(refs4) >= 2, "Should have multiple references"
    artist_names = {ref["artist_name"] for ref in refs4}
    assert "Taylor Swift" in artist_names, "Should detect Taylor Swift"
    assert "The Weeknd" in artist_names, "Should detect The Weeknd"
    print("  ✓ Multiple reference detection")

    # Test 5: Case insensitivity
    text5 = "style of TAYLOR SWIFT"
    has_refs5, refs5 = normalizer.detect_artist_references(text5)
    assert has_refs5 is True, "Should be case-insensitive"
    assert refs5[0]["artist_name"] == "Taylor Swift", "Should normalize to correct case"
    print("  ✓ Case insensitive detection")

    print("✓ Artist reference detection tests passed")


def test_artist_normalization():
    """Test artist influence normalization."""
    print("\nTesting artist normalization...")
    normalizer = ArtistNormalizer()

    # Test 1: Normalize single reference
    text1 = "This song is in the style of Taylor Swift"
    normalized1, changes1 = normalizer.normalize_influences(text1)
    assert normalized1 != text1, "Text should be changed"
    assert "Taylor Swift" not in normalized1, "Artist name should be removed"
    assert "pop-influenced with storytelling" in normalized1, "Generic description should be added"
    assert len(changes1) > 0, "Should have changes"
    assert changes1[0]["artist"] == "Taylor Swift", "Change should reference artist"
    print("  ✓ Single reference normalization")

    # Test 2: Normalize multiple references
    text2 = "Style of Taylor Swift with production like The Weeknd"
    normalized2, changes2 = normalizer.normalize_influences(text2)
    assert "Taylor Swift" not in normalized2, "Taylor Swift should be removed"
    assert "The Weeknd" not in normalized2, "The Weeknd should be removed"
    assert len(changes2) >= 2, "Should have multiple changes"
    print("  ✓ Multiple reference normalization")

    # Test 3: Clean text unchanged
    text3 = "This song has pop influences and melodic hooks."
    normalized3, changes3 = normalizer.normalize_influences(text3)
    assert normalized3 == text3, "Clean text should be unchanged"
    assert len(changes3) == 0, "Should have no changes"
    print("  ✓ Clean text unchanged")

    print("✓ Artist normalization tests passed")


def test_public_release_compliance():
    """Test public release compliance checking."""
    print("\nTesting public release compliance...")
    normalizer = ArtistNormalizer()

    # Test 1: Compliant text
    text1 = "Pop-influenced with melodic hooks and storytelling vocals"
    compliant1, violations1 = normalizer.check_public_release_compliance(text1)
    assert compliant1 is True, "Clean text should be compliant"
    assert len(violations1) == 0, "Should have no violations"
    print("  ✓ Compliant text")

    # Test 2: Non-compliant text
    text2 = "Style of Taylor Swift"
    compliant2, violations2 = normalizer.check_public_release_compliance(text2)
    assert compliant2 is False, "Artist reference should be non-compliant"
    assert len(violations2) > 0, "Should have violations"
    assert "Taylor Swift" in violations2[0], "Violation should mention artist"
    print("  ✓ Non-compliant text")

    # Test 3: Permissive mode
    text3 = "Style of Taylor Swift"
    compliant3, violations3 = normalizer.check_public_release_compliance(
        text3, allow_artist_names=True
    )
    assert compliant3 is True, "Permissive mode should allow artists"
    assert len(violations3) == 0, "Should have no violations"
    print("  ✓ Permissive mode")

    print("✓ Public release compliance tests passed")


def test_policy_enforcer():
    """Test PolicyEnforcer functionality."""
    print("\nTesting PolicyEnforcer...")
    enforcer = PolicyEnforcer()

    # Test 1: Compliant content
    content1 = {
        "style": "Pop-influenced with melodic hooks",
        "lyrics": "Clean lyrics with no references"
    }
    compliant1, violations1 = enforcer.enforce_release_policy(
        content=content1,
        public_release=True,
        mode="strict"
    )
    assert compliant1 is True, "Clean content should be compliant"
    assert len(violations1) == 0, "Should have no violations"
    print("  ✓ Compliant content")

    # Test 2: Non-compliant content
    content2 = {
        "style": "Style of Taylor Swift",
        "lyrics": "Melodic vocals"
    }
    compliant2, violations2 = enforcer.enforce_release_policy(
        content=content2,
        public_release=True,
        mode="strict"
    )
    assert compliant2 is False, "Artist reference should be non-compliant"
    assert len(violations2) > 0, "Should have violations"
    assert "[style]" in violations2[0], "Violation should include field context"
    print("  ✓ Non-compliant content")

    # Test 3: Non-public release always compliant
    content3 = {
        "style": "Style of Taylor Swift with Drake influences"
    }
    compliant3, violations3 = enforcer.enforce_release_policy(
        content=content3,
        public_release=False,
        mode="strict"
    )
    assert compliant3 is True, "Non-public should be compliant"
    assert len(violations3) == 0, "Should have no violations"
    print("  ✓ Non-public release")

    # Test 4: Persona policy
    persona_data_public = {"public_release": True}
    allowed1 = enforcer.check_persona_policy(
        persona_id="persona_1",
        public_release=True,
        persona_data=persona_data_public
    )
    assert allowed1 is True, "Public persona should be allowed"

    persona_data_private = {"public_release": False}
    allowed2 = enforcer.check_persona_policy(
        persona_id="persona_2",
        public_release=True,
        persona_data=persona_data_private
    )
    assert allowed2 is False, "Private persona should not be allowed"
    print("  ✓ Persona policy")

    # Test 5: Audit logging
    enforcer.audit_policy_override(
        content_id="song_123",
        reason="Artist approved usage",
        user_id="user_456",
        approval_level="admin"
    )
    assert len(enforcer.audit_log) > 0, "Should have audit log entry"
    entry = enforcer.audit_log[0]
    assert entry["content_id"] == "song_123", "Entry should have content_id"
    assert entry["reason"] == "Artist approved usage", "Entry should have reason"
    assert entry["user_id"] == "user_456", "Entry should have user_id"
    assert entry["approval_level"] == "admin", "Entry should have approval level"
    print("  ✓ Audit logging")

    print("✓ PolicyEnforcer tests passed")


def test_generic_description_lookup():
    """Test generic description lookup."""
    print("\nTesting generic description lookup...")
    normalizer = ArtistNormalizer()

    # Test 1: Exact match
    desc1 = normalizer.get_generic_description("Taylor Swift")
    assert desc1 is not None, "Should find Taylor Swift"
    assert "pop-influenced with storytelling" in desc1
    print("  ✓ Exact match")

    # Test 2: Case insensitive
    desc2 = normalizer.get_generic_description("taylor swift")
    desc3 = normalizer.get_generic_description("TAYLOR SWIFT")
    assert desc2 == desc1, "Should be case-insensitive"
    assert desc3 == desc1, "Should be case-insensitive"
    print("  ✓ Case insensitive")

    # Test 3: Alias lookup
    desc4 = normalizer.get_generic_description("Drizzy")
    assert desc4 is not None, "Should find Drake via alias"
    assert "hip-hop" in desc4.lower(), "Should get Drake's description"
    print("  ✓ Alias lookup")

    # Test 4: Unknown artist
    desc5 = normalizer.get_generic_description("Unknown Artist Name")
    assert desc5 is None, "Unknown artist should return None"
    print("  ✓ Unknown artist")

    print("✓ Generic description lookup tests passed")


def main():
    """Run all validation tests."""
    print("=" * 70)
    print("Artist Normalization & Policy Enforcement Validation")
    print("=" * 70)

    try:
        test_artist_normalizer_initialization()
        test_artist_reference_detection()
        test_artist_normalization()
        test_public_release_compliance()
        test_policy_enforcer()
        test_generic_description_lookup()

        print("\n" + "=" * 70)
        print("✓ ALL TESTS PASSED")
        print("=" * 70)
        print("\nArtist normalization and policy enforcement implementation is working correctly!")
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
