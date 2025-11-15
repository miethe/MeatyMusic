"""Standalone validation script for ProducerDefaultGenerator.

This script can be run without pytest to verify basic functionality.
"""

import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.services.default_generators.producer_generator import ProducerDefaultGenerator


def validate_basic_generation():
    """Validate basic default generation."""
    print("Test 1: Basic default generation")
    generator = ProducerDefaultGenerator()

    blueprint = {"genre": "Pop", "version": "2025.11"}
    style = {"genre_detail": {"primary": "Pop"}, "tempo_bpm": [120, 128]}
    lyrics = {
        "language": "en",
        "section_order": ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus"],
        "constraints": {},
    }

    result = generator.generate_default_producer_notes(
        blueprint=blueprint,
        style=style,
        lyrics=lyrics,
    )

    assert "structure" in result, "Missing structure field"
    assert "hooks" in result, "Missing hooks field"
    assert "instrumentation" in result, "Missing instrumentation field"
    assert "section_meta" in result, "Missing section_meta field"
    assert "mix" in result, "Missing mix field"

    assert result["structure"] == "Intro-Verse-Chorus-Verse-Chorus-Bridge-Chorus"
    assert result["hooks"] == 2
    assert result["instrumentation"] == []
    assert result["mix"]["lufs"] == -14.0
    assert result["mix"]["space"] == "balanced"
    assert result["mix"]["stereo_width"] == "normal"

    print("✓ Basic generation works correctly")


def validate_structure_derivation():
    """Validate structure is derived from lyrics section_order."""
    print("\nTest 2: Structure derivation")
    generator = ProducerDefaultGenerator()

    lyrics = {
        "section_order": ["Verse", "Chorus", "Verse", "Chorus"],
        "constraints": {},
    }

    result = generator.generate_default_producer_notes(
        blueprint={},
        style={},
        lyrics=lyrics,
    )

    assert result["structure"] == "Verse-Chorus-Verse-Chorus"
    print("✓ Structure derivation works correctly")


def validate_section_metadata():
    """Validate section metadata generation."""
    print("\nTest 3: Section metadata")
    generator = ProducerDefaultGenerator()

    lyrics = {
        "section_order": ["Intro", "Verse", "PreChorus", "Chorus", "Bridge", "Outro"],
        "constraints": {},
    }

    result = generator.generate_default_producer_notes(
        blueprint={},
        style={},
        lyrics=lyrics,
    )

    section_meta = result["section_meta"]

    # Check Intro
    assert section_meta["Intro"]["tags"] == ["instrumental", "build"]
    assert section_meta["Intro"]["target_duration_sec"] == 10

    # Check Verse
    assert section_meta["Verse"]["tags"] == ["storytelling"]
    assert section_meta["Verse"]["target_duration_sec"] == 30

    # Check PreChorus
    assert section_meta["PreChorus"]["tags"] == ["build"]
    assert section_meta["PreChorus"]["target_duration_sec"] == 15

    # Check Chorus
    assert section_meta["Chorus"]["tags"] == ["anthemic", "hook-forward"]
    assert section_meta["Chorus"]["target_duration_sec"] == 25

    # Check Bridge
    assert section_meta["Bridge"]["tags"] == ["contrast", "dynamic"]
    assert section_meta["Bridge"]["target_duration_sec"] == 20

    # Check Outro
    assert section_meta["Outro"]["tags"] == ["fade-out"]
    assert section_meta["Outro"]["target_duration_sec"] == 10

    print("✓ Section metadata generation works correctly")


def validate_partial_preservation():
    """Validate that partial producer notes are preserved."""
    print("\nTest 4: Partial producer notes preservation")
    generator = ProducerDefaultGenerator()

    partial = {
        "structure": "Custom-Structure",
        "hooks": 5,
        "instrumentation": ["guitar", "drums"],
        "mix": {"lufs": -12.0, "space": "dry", "stereo_width": "wide"},
    }

    result = generator.generate_default_producer_notes(
        blueprint={},
        style={},
        lyrics={"section_order": ["Verse", "Chorus"], "constraints": {}},
        partial_producer=partial,
    )

    assert result["structure"] == "Custom-Structure"
    assert result["hooks"] == 5
    assert result["instrumentation"] == ["guitar", "drums"]
    assert result["mix"]["lufs"] == -12.0
    assert result["mix"]["space"] == "dry"
    assert result["mix"]["stereo_width"] == "wide"

    print("✓ Partial producer notes preservation works correctly")


def validate_instrumentation_from_style():
    """Validate instrumentation is copied from style."""
    print("\nTest 5: Instrumentation from style")
    generator = ProducerDefaultGenerator()

    style = {"instrumentation": ["brass", "sleigh bells", "upright bass"]}

    result = generator.generate_default_producer_notes(
        blueprint={},
        style=style,
        lyrics={"section_order": ["Verse", "Chorus"], "constraints": {}},
    )

    assert result["instrumentation"] == ["brass", "sleigh bells", "upright bass"]
    print("✓ Instrumentation copying works correctly")


def validate_determinism():
    """Validate that generation is deterministic."""
    print("\nTest 6: Determinism")
    generator = ProducerDefaultGenerator()

    blueprint = {"genre": "Pop"}
    style = {"instrumentation": ["piano"]}
    lyrics = {"section_order": ["Verse", "Chorus", "Bridge"], "constraints": {}}

    # Generate 5 times
    results = [
        generator.generate_default_producer_notes(
            blueprint=blueprint,
            style=style,
            lyrics=lyrics,
        )
        for _ in range(5)
    ]

    # All should be identical
    first = results[0]
    for result in results[1:]:
        assert result == first, "Results not deterministic!"

    print("✓ Determinism validated")


def validate_helper_methods():
    """Validate helper methods."""
    print("\nTest 7: Helper methods")

    # Test get_default_section_tags
    assert ProducerDefaultGenerator.get_default_section_tags("Intro") == ["instrumental", "build"]
    assert ProducerDefaultGenerator.get_default_section_tags("Verse") == ["storytelling"]
    assert ProducerDefaultGenerator.get_default_section_tags("PreChorus") == ["build"]
    assert ProducerDefaultGenerator.get_default_section_tags("Chorus") == ["anthemic", "hook-forward"]
    assert ProducerDefaultGenerator.get_default_section_tags("Bridge") == ["contrast", "dynamic"]
    assert ProducerDefaultGenerator.get_default_section_tags("Outro") == ["fade-out"]
    assert ProducerDefaultGenerator.get_default_section_tags("Unknown") == []

    # Test get_default_section_duration
    assert ProducerDefaultGenerator.get_default_section_duration("Intro") == 10
    assert ProducerDefaultGenerator.get_default_section_duration("Verse") == 30
    assert ProducerDefaultGenerator.get_default_section_duration("PreChorus") == 15
    assert ProducerDefaultGenerator.get_default_section_duration("Chorus") == 25
    assert ProducerDefaultGenerator.get_default_section_duration("Bridge") == 20
    assert ProducerDefaultGenerator.get_default_section_duration("Outro") == 10
    assert ProducerDefaultGenerator.get_default_section_duration("Unknown") == 20

    print("✓ Helper methods work correctly")


def main():
    """Run all validation tests."""
    print("=" * 60)
    print("ProducerDefaultGenerator Validation")
    print("=" * 60)

    try:
        validate_basic_generation()
        validate_structure_derivation()
        validate_section_metadata()
        validate_partial_preservation()
        validate_instrumentation_from_style()
        validate_determinism()
        validate_helper_methods()

        print("\n" + "=" * 60)
        print("✓ ALL VALIDATION TESTS PASSED")
        print("=" * 60)
        return 0

    except AssertionError as e:
        print(f"\n✗ Validation failed: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
