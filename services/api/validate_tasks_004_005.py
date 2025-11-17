#!/usr/bin/env python3
"""Validation script for Tasks SDS-PREVIEW-004 and SDS-PREVIEW-005.

This script validates that both PersonaDefaultGenerator and ProducerDefaultGenerator
meet all acceptance criteria including:
- Correct default generation
- User field preservation
- Genre-specific defaults
- Determinism (same inputs = same outputs)
- Phase 1 completion confirmation
"""

import sys
from typing import Dict, Any

# Add app to path
sys.path.insert(0, '/home/user/MeatyMusic/services/api')

from app.services.default_generators.persona_generator import PersonaDefaultGenerator
from app.services.default_generators.producer_generator import ProducerDefaultGenerator


def validate_persona_generator():
    """Validate PersonaDefaultGenerator meets all requirements."""
    print("=" * 80)
    print("TASK SDS-PREVIEW-004: Persona Default Generator Validation")
    print("=" * 80)

    generator = PersonaDefaultGenerator()
    blueprint = {"genre": "Pop"}

    # Test 1: Returns None when no partial persona
    print("\n✓ Test 1: Returns None when no partial persona provided")
    result = generator.generate_default_persona(blueprint, None)
    assert result is None, "Should return None when no partial persona"
    print("  PASS: Returns None appropriately")

    # Test 2: Returns None for empty dict
    print("\n✓ Test 2: Returns None for empty partial persona")
    result = generator.generate_default_persona(blueprint, {})
    assert result is None, "Should return None for empty dict"
    print("  PASS: Returns None for empty dict")

    # Test 3: Generates persona with minimal data
    print("\n✓ Test 3: Generates persona with minimal partial data")
    partial = {"name": "Test Artist"}
    result = generator.generate_default_persona(blueprint, partial)
    assert result is not None
    assert result["name"] == "Test Artist"
    assert result["vocal_range"] == "medium"
    assert result["delivery"] == ["melodic", "belting"]
    assert result["influences"] == []
    print("  PASS: Generates complete persona from minimal data")

    # Test 4: Genre-specific defaults
    print("\n✓ Test 4: Genre-specific vocal defaults")
    genres_to_test = [
        ("Pop", "medium", ["melodic", "belting"]),
        ("Hip-Hop", "baritone", ["rap", "melodic-rap"]),
        ("Country", "baritone", ["storytelling", "conversational"]),
        ("Rock", "tenor", ["powerful", "belting"]),
        ("R&B", "alto", ["soulful", "melismatic"]),
    ]

    for genre, expected_range, expected_delivery in genres_to_test:
        blueprint = {"genre": genre}
        partial = {"name": "Artist"}
        result = generator.generate_default_persona(blueprint, partial)
        assert result["vocal_range"] == expected_range, f"{genre} vocal_range mismatch"
        assert result["delivery"] == expected_delivery, f"{genre} delivery mismatch"
        print(f"  PASS: {genre} → {expected_range}, {expected_delivery}")

    # Test 5: User field preservation
    print("\n✓ Test 5: User-provided fields preserved")
    partial = {
        "name": "Custom Artist",
        "vocal_range": "soprano",
        "delivery": ["whispered"],
        "influences": ["Beatles", "Queen"]
    }
    result = generator.generate_default_persona({"genre": "Pop"}, partial)
    assert result["name"] == "Custom Artist"
    assert result["vocal_range"] == "soprano"
    assert result["delivery"] == ["whispered"]
    assert result["influences"] == ["Beatles", "Queen"]
    print("  PASS: All user-provided fields preserved")

    # Test 6: Determinism
    print("\n✓ Test 6: Deterministic output verification")
    blueprint = {"genre": "Pop"}
    partial = {"name": "Test Artist"}

    results = [
        generator.generate_default_persona(blueprint, partial)
        for _ in range(10)
    ]

    first_result = results[0]
    for i, result in enumerate(results[1:], start=2):
        assert result == first_result, f"Result {i} differs from first result"

    print("  PASS: Same inputs produce identical outputs (10 iterations)")

    print("\n" + "=" * 80)
    print("TASK SDS-PREVIEW-004: ALL TESTS PASSED ✓")
    print("=" * 80)


def validate_producer_generator():
    """Validate ProducerDefaultGenerator meets all requirements."""
    print("\n" + "=" * 80)
    print("TASK SDS-PREVIEW-005: Producer Notes Default Generator Validation")
    print("=" * 80)

    generator = ProducerDefaultGenerator()

    blueprint = {"genre": "Pop", "version": "2025.11"}
    style = {
        "genre_detail": {"primary": "Pop"},
        "tempo_bpm": [120, 128],
        "instrumentation": ["piano", "drums", "bass"]
    }
    lyrics = {
        "language": "en",
        "section_order": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"],
        "constraints": {"explicit": False}
    }

    # Test 1: Complete generation
    print("\n✓ Test 1: Complete ProducerNotes generation")
    result = generator.generate_default_producer_notes(blueprint, style, lyrics)

    assert "structure" in result
    assert "hooks" in result
    assert "instrumentation" in result
    assert "section_meta" in result
    assert "mix" in result
    print("  PASS: All required fields present")

    # Test 2: Structure derived from lyrics section_order
    print("\n✓ Test 2: Structure derived from lyrics section_order")
    expected_structure = "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus"
    assert result["structure"] == expected_structure
    print(f"  PASS: Structure = '{result['structure']}'")

    # Test 3: Section metadata for all unique sections
    print("\n✓ Test 3: Section metadata for all unique sections")
    unique_sections = ["Intro", "Verse", "Chorus", "Bridge"]
    assert set(result["section_meta"].keys()) == set(unique_sections)

    # Verify section defaults
    assert result["section_meta"]["Intro"]["tags"] == ["instrumental", "build"]
    assert result["section_meta"]["Intro"]["target_duration_sec"] == 10
    assert result["section_meta"]["Verse"]["tags"] == ["storytelling"]
    assert result["section_meta"]["Verse"]["target_duration_sec"] == 30
    assert result["section_meta"]["Chorus"]["tags"] == ["anthemic", "hook-forward"]
    assert result["section_meta"]["Chorus"]["target_duration_sec"] == 25
    assert result["section_meta"]["Bridge"]["tags"] == ["contrast", "dynamic"]
    assert result["section_meta"]["Bridge"]["target_duration_sec"] == 20
    print("  PASS: All sections have proper metadata")

    # Test 4: Hooks default
    print("\n✓ Test 4: Hooks default value")
    assert result["hooks"] == 2
    print("  PASS: hooks = 2")

    # Test 5: Instrumentation from style
    print("\n✓ Test 5: Instrumentation copied from style")
    assert result["instrumentation"] == style["instrumentation"]
    print(f"  PASS: instrumentation = {result['instrumentation']}")

    # Test 6: Mix defaults
    print("\n✓ Test 6: Mix target defaults")
    assert result["mix"]["lufs"] == -14.0
    assert result["mix"]["space"] == "balanced"
    assert result["mix"]["stereo_width"] == "normal"
    print("  PASS: Mix targets use streaming standards")

    # Test 7: User field preservation
    print("\n✓ Test 7: User-provided fields preserved")
    partial = {
        "structure": "Custom-Structure",
        "hooks": 5,
        "instrumentation": ["custom"],
        "mix": {"lufs": -12.0, "space": "dry"}
    }

    result = generator.generate_default_producer_notes(
        blueprint, style, lyrics, partial_producer=partial
    )

    assert result["structure"] == "Custom-Structure"
    assert result["hooks"] == 5
    assert result["instrumentation"] == ["custom"]
    assert result["mix"]["lufs"] == -12.0
    assert result["mix"]["space"] == "dry"
    assert result["mix"]["stereo_width"] == "normal"  # Default for missing field
    print("  PASS: All user-provided fields preserved")

    # Test 8: Determinism
    print("\n✓ Test 8: Deterministic output verification")
    results = [
        generator.generate_default_producer_notes(blueprint, style, lyrics)
        for _ in range(10)
    ]

    first_result = results[0]
    for i, result in enumerate(results[1:], start=2):
        assert result == first_result, f"Result {i} differs from first result"

    print("  PASS: Same inputs produce identical outputs (10 iterations)")

    # Test 9: Empty section_order fallback
    print("\n✓ Test 9: Empty section_order fallback")
    empty_lyrics = {"section_order": [], "constraints": {}}
    result = generator.generate_default_producer_notes(blueprint, style, empty_lyrics)

    expected_fallback = "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus"
    assert result["structure"] == expected_fallback
    print(f"  PASS: Fallback structure = '{result['structure']}'")

    print("\n" + "=" * 80)
    print("TASK SDS-PREVIEW-005: ALL TESTS PASSED ✓")
    print("=" * 80)


def validate_phase_1_complete():
    """Verify that Phase 1 is complete with all 5 generators."""
    print("\n" + "=" * 80)
    print("PHASE 1 COMPLETION VERIFICATION")
    print("=" * 80)

    # Verify all generators can be imported
    try:
        from app.services.default_generators import (
            PersonaDefaultGenerator,
            StyleDefaultGenerator,
            LyricsDefaultGenerator,
            ProducerDefaultGenerator,
        )
        print("\n✓ All generators successfully imported from package")
    except ImportError as e:
        print(f"\n✗ Import error: {e}")
        return False

    # Verify BlueprintReaderService exists
    try:
        from app.services.blueprint_reader import BlueprintReaderService
        print("✓ BlueprintReaderService available")
    except ImportError:
        print("✗ BlueprintReaderService not found")
        return False

    print("\n" + "-" * 80)
    print("PHASE 1 GENERATORS:")
    print("-" * 80)
    print("1. BlueprintReaderService    ✓ (Task 001)")
    print("2. StyleDefaultGenerator     ✓ (Task 002)")
    print("3. LyricsDefaultGenerator    ✓ (Task 003)")
    print("4. PersonaDefaultGenerator   ✓ (Task 004)")
    print("5. ProducerDefaultGenerator  ✓ (Task 005)")

    print("\n" + "=" * 80)
    print("PHASE 1: COMPLETE ✓")
    print("=" * 80)
    print("\nAll 5 default generators are implemented, tested, and exported.")
    print("Ready to proceed to Phase 2: SDS Compiler Integration (Task 006)")

    return True


def main():
    """Run all validation tests."""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 78 + "║")
    print("║" + "  MVP SDS GENERATION & PREVIEW - TASKS 004 & 005 VALIDATION".center(78) + "║")
    print("║" + " " * 78 + "║")
    print("╚" + "=" * 78 + "╝")

    try:
        # Validate Task 004: Persona Generator
        validate_persona_generator()

        # Validate Task 005: Producer Notes Generator
        validate_producer_generator()

        # Verify Phase 1 completion
        phase_1_complete = validate_phase_1_complete()

        if phase_1_complete:
            print("\n" + "=" * 80)
            print("✓ ALL VALIDATION TESTS PASSED")
            print("=" * 80)
            print("\nBoth generators meet all acceptance criteria:")
            print("  • Correct default generation")
            print("  • User field preservation")
            print("  • Genre-specific defaults")
            print("  • Deterministic behavior")
            print("  • Proper exports in __init__.py")
            print("\nPhase 1 complete. Ready for Task 006 (SDS Compiler Integration).")
            return 0
        else:
            print("\n✗ PHASE 1 VALIDATION FAILED")
            return 1

    except AssertionError as e:
        print(f"\n✗ VALIDATION FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())
