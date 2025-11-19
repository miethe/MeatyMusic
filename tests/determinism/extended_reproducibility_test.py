#!/usr/bin/env python3
"""Extended Reproducibility Test - Stress test for determinism validation.

This script performs extended reproducibility testing with a large number of
replays to validate that the AMCS validation framework maintains perfect
determinism under stress conditions.

It runs the complete validation pipeline multiple times with identical inputs
and verifies that all outputs are identical across all replays.

Usage:
    python extended_reproducibility_test.py [--replays N] [--output FILE]
"""

import sys
import json
import argparse
import hashlib
from pathlib import Path
from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone

# Add services/api to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "services" / "api"))

from app.services.validation_service import ValidationService


def hash_dict(data: Dict[str, Any]) -> str:
    """Generate deterministic hash of dictionary.

    Args:
        data: Dictionary to hash

    Returns:
        SHA256 hex digest of dictionary
    """
    # Convert to JSON with sorted keys for determinism
    json_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(json_str.encode()).hexdigest()


def run_validation_pipeline(
    service: ValidationService,
    lyrics: Dict[str, Any],
    style: Dict[str, Any],
    producer_notes: Dict[str, Any]
) -> Dict[str, Any]:
    """Run complete validation pipeline and capture results.

    Args:
        service: ValidationService instance
        lyrics: Lyrics dictionary
        style: Style dictionary
        producer_notes: Producer notes dictionary

    Returns:
        Dictionary with validation results
    """
    results = {}

    # Schema validation
    style_valid, style_errors = service.validate_style(style)
    results["style_valid"] = style_valid
    results["style_errors"] = style_errors

    lyrics_valid, lyrics_errors = service.validate_lyrics(lyrics)
    results["lyrics_valid"] = lyrics_valid
    results["lyrics_errors"] = lyrics_errors

    # Policy validation
    content = {
        "style": str(style),
        "lyrics": lyrics
    }
    policies_valid, policy_report = service.validate_all_policies(
        content=content,
        explicit_allowed=False,
        public_release=True,
        policy_mode="strict"
    )
    results["policies_valid"] = policies_valid
    results["policy_violations_count"] = policy_report["summary"]["total_violations"]

    # Conflict detection
    conflicts = service.conflict_detector.detect_tag_conflicts(style["tags"])
    results["conflict_count"] = len(conflicts)

    # Rubric scoring
    score_report = service.score_artifacts(
        lyrics=lyrics,
        style=style,
        producer_notes=producer_notes,
        genre="pop",
        explicit_allowed=False
    )
    results["total_score"] = score_report.total
    results["hook_density"] = score_report.hook_density
    results["singability"] = score_report.singability
    results["rhyme_tightness"] = score_report.rhyme_tightness
    results["section_completeness"] = score_report.section_completeness
    results["profanity_score"] = score_report.profanity_score

    # Threshold validation
    passed, actionable_report = service.evaluate_compliance(
        score_report=score_report,
        genre="pop"
    )
    results["threshold_passed"] = passed
    results["threshold_decision"] = actionable_report.decision.value

    return results


def run_extended_test(replays: int = 100) -> Tuple[bool, Dict[str, Any]]:
    """Run extended reproducibility test.

    Args:
        replays: Number of replays to execute

    Returns:
        Tuple of (all_identical, report_dict)
    """
    print(f"\nStarting Extended Reproducibility Test ({replays} replays)")
    print("=" * 70)

    # Define test inputs
    sample_lyrics = {
        "sections": [
            {
                "name": "verse_1",
                "text": "Walking down the street on a sunny day",
                "line": 1
            },
            {
                "name": "chorus",
                "text": "This is the chorus, feeling so alive",
                "line": 5
            }
        ],
        "structure": ["verse_1", "chorus"]
    }

    sample_style = {
        "genre": "pop",
        "tags": ["upbeat", "melodic", "major-key"],
        "tempo": 120,
        "key": "C major"
    }

    sample_producer_notes = {
        "structure": "Verse-Chorus-Verse-Chorus-Bridge-Chorus",
        "arrangement": "Full band with emphasis on vocals"
    }

    # Run validation pipeline multiple times
    print(f"\nRunning validation pipeline {replays} times...")

    service = ValidationService()
    all_results = []
    all_hashes = []

    for i in range(replays):
        if (i + 1) % 10 == 0:
            print(f"  Completed {i + 1}/{replays} replays...")

        results = run_validation_pipeline(
            service=service,
            lyrics=sample_lyrics,
            style=sample_style,
            producer_notes=sample_producer_notes
        )

        all_results.append(results)
        result_hash = hash_dict(results)
        all_hashes.append(result_hash)

    # Check if all results are identical
    unique_hashes = set(all_hashes)
    all_identical = len(unique_hashes) == 1

    # Calculate reproducibility rate
    if all_identical:
        identical_count = replays
        reproducibility_rate = 1.0
    else:
        # Count how many match the first result
        first_hash = all_hashes[0]
        identical_count = sum(1 for h in all_hashes if h == first_hash)
        reproducibility_rate = identical_count / replays

    # Build report
    report = {
        "test_name": "extended_reproducibility_test",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "replays": replays,
        "identical_count": identical_count,
        "reproducibility_rate": reproducibility_rate,
        "all_identical": all_identical,
        "unique_result_count": len(unique_hashes),
        "first_result": all_results[0],
        "first_result_hash": all_hashes[0]
    }

    if not all_identical:
        # Find which replays differ
        differing_indices = [i for i, h in enumerate(all_hashes) if h != all_hashes[0]]
        report["differing_replays"] = differing_indices[:10]  # Limit to first 10
        report["unique_hashes"] = list(unique_hashes)

    # Print results
    print("\n" + "=" * 70)
    print("Extended Reproducibility Test Results")
    print("=" * 70)
    print(f"Total Replays: {replays}")
    print(f"Identical Results: {identical_count}")
    print(f"Reproducibility Rate: {reproducibility_rate:.2%}")
    print(f"Unique Results: {len(unique_hashes)}")
    print()

    if all_identical:
        print("Status: PASS ✓")
        print("All replays produced identical results (100% reproducibility)")
    else:
        print("Status: FAIL ✗")
        print(f"Reproducibility rate {reproducibility_rate:.2%} below 100%")
        print(f"Found {len(unique_hashes)} unique result variations")

    print("=" * 70)

    return all_identical, report


def main():
    """Main entry point for extended test."""
    parser = argparse.ArgumentParser(
        description="Run extended reproducibility test with multiple replays"
    )
    parser.add_argument(
        "--replays",
        type=int,
        default=100,
        help="Number of replays to execute (default: 100)"
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent / "results" / "extended_test_results.json",
        help="Output file for test results (default: ./results/extended_test_results.json)"
    )

    args = parser.parse_args()

    # Validate replays
    if args.replays < 2:
        print("Error: Replays must be at least 2", file=sys.stderr)
        sys.exit(2)

    # Run test
    try:
        all_identical, report = run_extended_test(replays=args.replays)
    except Exception as e:
        print(f"\nError during test execution: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(2)

    # Save results
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\nResults saved to: {args.output}")

    # Exit with appropriate code
    sys.exit(0 if all_identical else 1)


if __name__ == "__main__":
    main()
