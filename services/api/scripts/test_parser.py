"""Standalone test script for blueprint parser (no DB required)."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.blueprint_parser_service import BlueprintParserService


def main():
    """Test the blueprint parser without database dependencies."""
    print("\n=== Blueprint Parser Test (Standalone) ===\n")

    parser = BlueprintParserService()

    # Get all available genres
    genres = parser.get_all_blueprint_genres()
    print(f"Found {len(genres)} blueprint files:\n")

    # Test parsing each genre
    success_count = 0
    failed_count = 0

    for genre in genres:
        try:
            data = parser.parse_blueprint_file(genre)

            # Display parsed data
            print(f"✓ {genre:<20} version={data['version']}")
            print(f"  - Tempo: {data['rules'].get('tempo_bpm', 'N/A')}")
            print(f"  - Sections: {', '.join(data['rules'].get('required_sections', []))}")
            print(f"  - Length: {data['rules'].get('length_minutes', 'N/A')} min")
            print(f"  - Time: {data['rules'].get('time_signature', 'N/A')}")
            print(f"  - Keys: {', '.join(data['rules'].get('key_signatures', [])[:5])}")
            print(f"  - Rubric min_total: {data['eval_rubric']['thresholds']['min_total']}")
            print()

            success_count += 1

        except Exception as e:
            print(f"✗ {genre:<20} FAILED: {str(e)}\n")
            failed_count += 1

    print("=" * 60)
    print(f"Total: {len(genres)} blueprints")
    print(f"Success: {success_count}")
    print(f"Failed: {failed_count}")
    print("=" * 60)

    if failed_count > 0:
        sys.exit(1)
    else:
        print("\n✓ All blueprints parsed successfully!\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
