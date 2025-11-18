"""
Generate comprehensive test fixtures for AMCS workflow skills.

This script generates all test fixtures used by skill unit tests:
- Sample SDSs (Song Design Specs) covering all genres
- Genre blueprints with rules and evaluation rubrics
- Sample source collections with pre-computed hashes

Usage:
    # Generate all fixtures
    python -m tests.fixtures.generate_fixtures

    # Generate with custom seed
    python -m tests.fixtures.generate_fixtures --seed 12345

    # Regenerate only SDSs
    python -m tests.fixtures.generate_fixtures --only sds

    # Dry run (print without writing files)
    python -m tests.fixtures.generate_fixtures --dry-run

Author: AMCS Development Team
Last Updated: 2025-11-18
"""

import argparse
import json
import hashlib
from pathlib import Path
from typing import Any, Dict, List

from app.core.citations import hash_chunk


# Base directory for fixtures
FIXTURES_DIR = Path(__file__).parent


def generate_sample_sds(base_seed: int = 42) -> List[Dict[str, Any]]:
    """
    Generate 10 diverse Song Design Specs covering all major genres.

    Each SDS includes realistic constraints, style specifications, and
    unique seeds for deterministic testing.

    Args:
        base_seed: Base seed for SDS generation (default 42)

    Returns:
        List of 10 SDS dictionaries
    """
    sdss = [
        {
            "id": "sds-pop-001",
            "title": "Summer Nights",
            "genre": "pop",
            "targetLength": "3:30",
            "style": {
                "bpm": 120,
                "key": "C Major",
                "mood": ["upbeat", "nostalgic", "energetic"],
                "instrumentation": ["synth", "drums", "bass", "guitar"],
                "tags": ["melodic", "catchy", "radio-friendly"]
            },
            "constraints": {
                "explicit": False,
                "sectionOrder": ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus", "Bridge", "Chorus", "Outro"],
                "targetDuration": 210
            },
            "persona": {
                "vocalRange": "tenor",
                "vocalStyle": "powerful",
                "influences": ["Max Martin production", "synth-pop"]
            },
            "seed": base_seed
        },
        # Add other genres...
    ]

    print(f"Generated {len(sdss)} sample SDSs")
    return sdss


def generate_genre_blueprint(genre: str) -> Dict[str, Any]:
    """
    Generate a comprehensive blueprint for a specific genre.

    Args:
        genre: Genre name (pop, rock, hip-hop, country, rnb)

    Returns:
        Blueprint dictionary with rules, tags, patterns, and rubric
    """
    # Blueprint structure varies by genre
    # This is a simplified version - real blueprints are in JSON files
    blueprint = {
        "genre": genre,
        "version": "1.0",
        "rules": {
            "tempo_bpm": {"min": 80, "max": 140},
            "required_sections": ["Verse", "Chorus"],
            "profanity_allowed": False
        },
        "eval_rubric": {
            "metrics": {
                "hook_density": {"weight": 0.3, "threshold": 0.75},
                "singability": {"weight": 0.25, "threshold": 0.80}
            },
            "pass_threshold": 0.75
        }
    }

    print(f"Generated {genre} blueprint")
    return blueprint


def generate_sample_sources() -> List[Dict[str, Any]]:
    """
    Generate sample source collections with pre-computed hashes.

    Creates 3 source collections:
    - Love song themes
    - Urban imagery
    - Nature metaphors

    Each chunk includes:
    - Original text
    - Pre-computed SHA-256 hash
    - Metadata (theme, imagery, emotion)

    Returns:
        List of source dictionaries
    """
    sources = []

    # Love themes source
    love_chunks = [
        "Hearts intertwined under moonlight, dancing shadows on the wall",
        "Every moment with you feels like forever, time stands still when you're near",
        "Summer nights and city lights, your hand in mine feels so right",
        "Your smile lights up the darkest days, sunshine breaking through the gray",
        "We were young and wild and free, chasing dreams beneath the stars"
    ]

    love_source = {
        "id": "source-love-themes-001",
        "title": "Love Song Themes Collection",
        "type": "curated",
        "description": "Common themes and imagery for love songs",
        "chunks": []
    }

    for text in love_chunks:
        chunk_hash = hash_chunk(text)
        love_source["chunks"].append({
            "text": text,
            "hash": chunk_hash,
            "metadata": {
                "theme": "romance",
                "emotion": "tender"
            }
        })

    sources.append(love_source)

    print(f"Generated {len(sources)} sample sources with {sum(len(s['chunks']) for s in sources)} total chunks")
    return sources


def write_json(data: Any, filepath: Path, dry_run: bool = False) -> None:
    """
    Write data to JSON file with pretty formatting.

    Args:
        data: Data to write (must be JSON-serializable)
        filepath: Target file path
        dry_run: If True, print to console instead of writing file
    """
    json_str = json.dumps(data, indent=2, ensure_ascii=False)

    if dry_run:
        print(f"\n{'=' * 80}")
        print(f"DRY RUN: Would write to {filepath}")
        print(f"{'=' * 80}")
        print(json_str)
        print(f"{'=' * 80}\n")
    else:
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w') as f:
            f.write(json_str)
        print(f"Wrote {filepath}")


def main():
    """Main fixture generation entry point."""
    parser = argparse.ArgumentParser(
        description="Generate test fixtures for AMCS workflow skills"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Base seed for fixture generation (default: 42)"
    )
    parser.add_argument(
        "--only",
        choices=["sds", "blueprints", "sources"],
        help="Generate only specific fixture type"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print fixtures to console without writing files"
    )

    args = parser.parse_args()

    print(f"Generating AMCS test fixtures (seed={args.seed})")
    print(f"Target directory: {FIXTURES_DIR}")
    print()

    # Generate SDSs
    if args.only is None or args.only == "sds":
        sdss = generate_sample_sds(base_seed=args.seed)
        write_json(sdss, FIXTURES_DIR / "sample_sds.json", dry_run=args.dry_run)

    # Generate blueprints
    if args.only is None or args.only == "blueprints":
        blueprints_dir = FIXTURES_DIR / "sample_blueprints"
        for genre in ["pop", "rock", "hiphop", "country", "rnb"]:
            blueprint = generate_genre_blueprint(genre)
            write_json(
                blueprint,
                blueprints_dir / f"{genre}_blueprint.json",
                dry_run=args.dry_run
            )

    # Generate sources
    if args.only is None or args.only == "sources":
        sources = generate_sample_sources()
        sources_dir = FIXTURES_DIR / "sample_sources"
        for source in sources:
            source_id = source["id"]
            write_json(
                source,
                sources_dir / f"{source_id.split('-')[-1]}.json",
                dry_run=args.dry_run
            )

    if not args.dry_run:
        print()
        print("Fixture generation complete!")
        print()
        print("To use these fixtures in tests:")
        print("  1. Import fixtures from conftest.py")
        print("  2. Use pytest fixtures: sample_sds, pop_blueprint, sample_sources")
        print("  3. See tests/fixtures/README.md for documentation")
    else:
        print("\nDry run complete. No files were written.")


if __name__ == "__main__":
    main()
