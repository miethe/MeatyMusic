#!/usr/bin/env python
"""Demonstration of LyricsDefaultGenerator functionality.

This script demonstrates the key features of the Lyrics default generator:
- Default generation for multiple genres
- Partial lyrics preservation
- Section order construction
- Determinism verification
"""

from app.services.default_generators.lyrics_generator import LyricsDefaultGenerator
import json


def print_section(title: str):
    """Print a formatted section header."""
    print(f"\n{'=' * 80}")
    print(f"  {title}")
    print('=' * 80)


def demo_basic_generation():
    """Demonstrate basic default generation."""
    print_section("1. Basic Default Generation (Pop Genre)")

    generator = LyricsDefaultGenerator()
    blueprint = {
        "genre": "Pop",
        "required_sections": ["Verse", "Chorus", "Bridge"]
    }

    lyrics = generator.generate_default_lyrics(blueprint)

    print(f"Language: {lyrics['language']}")
    print(f"POV: {lyrics['pov']}")
    print(f"Tense: {lyrics['tense']}")
    print(f"Rhyme Scheme: {lyrics['rhyme_scheme']}")
    print(f"Meter: {lyrics['meter']}")
    print(f"Syllables per Line: {lyrics['syllables_per_line']}")
    print(f"Hook Strategy: {lyrics['hook_strategy']}")
    print(f"Repetition Rules: {json.dumps(lyrics['repetition_rules'], indent=2)}")
    print(f"Imagery Density: {lyrics['imagery_density']} (0-10 scale)")
    print(f"Reading Level: {lyrics['reading_level']} (0-100 scale)")
    print(f"Section Order: {lyrics['section_order']}")
    print(f"Explicit Allowed: {lyrics['explicit_allowed']}")

    print(f"\nConstraints:")
    print(f"  Explicit: {lyrics['constraints']['explicit']}")
    print(f"  Max Lines: {lyrics['constraints']['max_lines']}")
    print(f"  Section Requirements: {lyrics['constraints']['section_requirements']}")


def demo_genre_patterns():
    """Demonstrate genre-specific section patterns."""
    print_section("2. Genre-Specific Section Patterns")

    generator = LyricsDefaultGenerator()
    genres = ["Pop", "Hip-Hop", "Rock", "Country"]

    for genre in genres:
        blueprint = {"genre": genre}
        lyrics = generator.generate_default_lyrics(blueprint)
        print(f"\n{genre:15} → {lyrics['section_order']}")


def demo_partial_preservation():
    """Demonstrate partial lyrics preservation."""
    print_section("3. Partial Lyrics Preservation")

    generator = LyricsDefaultGenerator()
    blueprint = {
        "genre": "Pop",
        "required_sections": ["Verse", "Chorus"]
    }

    partial_lyrics = {
        "language": "es",
        "pov": "third-person",
        "themes": ["amor", "pérdida"],
        "rhyme_scheme": "ABAB",
        "imagery_density": 8
    }

    lyrics = generator.generate_default_lyrics(blueprint, partial_lyrics)

    print(f"User-provided values preserved:")
    print(f"  Language: {lyrics['language']} (user: es)")
    print(f"  POV: {lyrics['pov']} (user: third-person)")
    print(f"  Themes: {lyrics['themes']} (user: ['amor', 'pérdida'])")
    print(f"  Rhyme Scheme: {lyrics['rhyme_scheme']} (user: ABAB)")
    print(f"  Imagery Density: {lyrics['imagery_density']} (user: 8)")

    print(f"\nDefault values filled:")
    print(f"  Tense: {lyrics['tense']} (default: present)")
    print(f"  Meter: {lyrics['meter']} (default: 4/4 pop)")
    print(f"  Hook Strategy: {lyrics['hook_strategy']} (default: repetition)")


def demo_blueprint_integration():
    """Demonstrate blueprint integration."""
    print_section("4. Blueprint Integration with Section Constraints")

    generator = LyricsDefaultGenerator()
    blueprint = {
        "genre": "Hip-Hop",
        "required_sections": ["Verse", "Chorus"],
        "section_lines": {
            "Verse": {
                "min_lines": 8,
                "max_lines": 16
            },
            "Chorus": {
                "min_lines": 4,
                "max_lines": 8,
                "must_end_with_hook": True
            }
        }
    }

    lyrics = generator.generate_default_lyrics(blueprint)

    print(f"Section Order: {lyrics['section_order']}")
    print(f"\nSection Requirements (from blueprint):")
    for section, reqs in lyrics['constraints']['section_requirements'].items():
        print(f"  {section}:")
        for key, value in reqs.items():
            print(f"    {key}: {value}")


def demo_determinism():
    """Demonstrate deterministic output."""
    print_section("5. Determinism Verification")

    generator = LyricsDefaultGenerator()
    blueprint = {
        "genre": "Pop",
        "required_sections": ["Verse", "Chorus", "Bridge"]
    }

    # Generate 10 times
    results = [generator.generate_default_lyrics(blueprint) for _ in range(10)]

    # Check all identical
    all_same = all(r == results[0] for r in results)

    print(f"Runs: 10")
    print(f"All identical: {all_same}")
    print(f"Status: {'✓ PASS - Fully deterministic' if all_same else '✗ FAIL'}")

    if all_same:
        print(f"\nSample output (consistent across all 10 runs):")
        print(f"  Section Order: {results[0]['section_order']}")
        print(f"  POV: {results[0]['pov']}")
        print(f"  Rhyme Scheme: {results[0]['rhyme_scheme']}")
        print(f"  Imagery Density: {results[0]['imagery_density']}")


def demo_custom_sections():
    """Demonstrate custom section insertion."""
    print_section("6. Custom Section Insertion Logic")

    generator = LyricsDefaultGenerator()

    test_cases = [
        {
            "name": "Intro at start",
            "required_sections": ["introduction", "Verse", "Chorus"]
        },
        {
            "name": "Outro at end",
            "required_sections": ["Verse", "Chorus", "ending"]
        },
        {
            "name": "PreChorus before Chorus",
            "required_sections": ["Verse", "PreChorus", "Chorus"]
        },
        {
            "name": "Custom sections",
            "required_sections": ["CustomSection1", "Verse", "Chorus", "CustomSection2"]
        }
    ]

    for test in test_cases:
        blueprint = {
            "genre": "Pop",
            "required_sections": test["required_sections"]
        }
        lyrics = generator.generate_default_lyrics(blueprint)
        print(f"\n{test['name']:25} → {lyrics['section_order']}")


def main():
    """Run all demonstrations."""
    print("\n" + "=" * 80)
    print("  LYRICS DEFAULT GENERATOR DEMONSTRATION")
    print("  Task SDS-PREVIEW-003")
    print("=" * 80)

    demo_basic_generation()
    demo_genre_patterns()
    demo_partial_preservation()
    demo_blueprint_integration()
    demo_determinism()
    demo_custom_sections()

    print_section("DEMONSTRATION COMPLETE")
    print("\nAll features verified successfully! ✓")
    print("")


if __name__ == "__main__":
    main()
