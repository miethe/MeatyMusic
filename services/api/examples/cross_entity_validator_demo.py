"""Demonstration of CrossEntityValidator usage.

This example shows how to use the CrossEntityValidator to validate
cross-entity consistency in a Song Design Spec (SDS).
"""

from app.services.cross_entity_validator import CrossEntityValidator


def main():
    """Demonstrate CrossEntityValidator usage."""
    validator = CrossEntityValidator()

    # Example 1: Valid SDS
    print("=" * 60)
    print("Example 1: Valid SDS")
    print("=" * 60)

    valid_sds = {
        "blueprint_ref": {"genre": "Pop"},
        "style": {
            "genre_detail": {"primary": "Pop", "subgenres": ["Dance-Pop"]},
        },
        "lyrics": {
            "section_order": ["Intro", "Verse", "Chorus", "Bridge", "Outro"],
            "source_citations": [
                {"source_id": "billboard_charts", "chunk_hash": "abc123"},
            ],
        },
        "producer_notes": {
            "structure": "Intro – Verse – Chorus – Bridge – Outro",
        },
        "sources": [
            {"name": "billboard_charts", "type": "web"},
        ],
    }

    is_valid, errors = validator.validate_sds_consistency(valid_sds)
    print(f"Valid: {is_valid}")
    print(f"Errors: {errors}")

    # Example 2: Genre Mismatch
    print("\n" + "=" * 60)
    print("Example 2: Genre Mismatch")
    print("=" * 60)

    genre_mismatch_sds = valid_sds.copy()
    genre_mismatch_sds["blueprint_ref"]["genre"] = "Rock"

    is_valid, errors = validator.validate_sds_consistency(genre_mismatch_sds)
    print(f"Valid: {is_valid}")
    print(f"Errors: {errors}")

    # Example 3: Missing Section in Lyrics
    print("\n" + "=" * 60)
    print("Example 3: Missing Section in Lyrics")
    print("=" * 60)

    section_mismatch_sds = valid_sds.copy()
    section_mismatch_sds["producer_notes"]["structure"] = "Intro – PreChorus – Chorus"

    is_valid, errors = validator.validate_sds_consistency(section_mismatch_sds)
    print(f"Valid: {is_valid}")
    print(f"Errors: {errors}")

    # Example 4: Invalid Source Citation
    print("\n" + "=" * 60)
    print("Example 4: Invalid Source Citation")
    print("=" * 60)

    invalid_citation_sds = valid_sds.copy()
    invalid_citation_sds["lyrics"]["source_citations"] = [
        {"source_id": "nonexistent_source", "chunk_hash": "xyz789"},
    ]

    is_valid, errors = validator.validate_sds_consistency(invalid_citation_sds)
    print(f"Valid: {is_valid}")
    print(f"Errors: {errors}")

    # Example 5: Multiple Errors
    print("\n" + "=" * 60)
    print("Example 5: Multiple Errors")
    print("=" * 60)

    multiple_errors_sds = valid_sds.copy()
    multiple_errors_sds["blueprint_ref"]["genre"] = "Rock"  # Mismatch
    multiple_errors_sds["producer_notes"]["structure"] = "PreChorus – Chorus"  # Missing section
    multiple_errors_sds["lyrics"]["source_citations"] = [
        {"source_id": "missing_source", "chunk_hash": "abc"},
    ]  # Invalid citation

    is_valid, errors = validator.validate_sds_consistency(multiple_errors_sds)
    print(f"Valid: {is_valid}")
    print(f"Errors ({len(errors)}):")
    for i, error in enumerate(errors, 1):
        print(f"  {i}. {error}")


if __name__ == "__main__":
    main()
