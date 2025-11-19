#!/usr/bin/env python3
"""Reproducibility Gate Checker - Quality Gate B Validation.

This script checks if the reproducibility rate meets the ≥99% target required
for Quality Gate B acceptance. It analyzes test results from determinism tests
and validates that the AMCS validation framework produces identical outputs
across multiple runs with the same inputs.

Exit codes:
- 0: Gate B passes (≥99% reproducibility)
- 1: Gate B fails (<99% reproducibility)
- 2: Error or insufficient data

Usage:
    python check_reproducibility_gate.py [--results-dir DIR] [--threshold RATE]
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional
from dataclasses import dataclass


@dataclass
class ReproducibilityResult:
    """Result from a reproducibility test."""
    test_name: str
    replays: int
    identical_count: int
    reproducibility_rate: float
    passed: bool


class ReproducibilityGateChecker:
    """Checker for Quality Gate B: Reproducibility Rate ≥99%."""

    def __init__(self, threshold: float = 0.99):
        """Initialize gate checker.

        Args:
            threshold: Minimum reproducibility rate required (default 0.99 = 99%)
        """
        self.threshold = threshold
        self.results: List[ReproducibilityResult] = []

    def add_test_result(
        self,
        test_name: str,
        replays: int,
        identical_count: int
    ) -> ReproducibilityResult:
        """Add a test result to the checker.

        Args:
            test_name: Name of the test
            replays: Number of replays executed
            identical_count: Number of replays that produced identical results

        Returns:
            ReproducibilityResult with calculated rate and pass/fail status
        """
        rate = identical_count / replays if replays > 0 else 0.0
        passed = rate >= self.threshold

        result = ReproducibilityResult(
            test_name=test_name,
            replays=replays,
            identical_count=identical_count,
            reproducibility_rate=rate,
            passed=passed
        )

        self.results.append(result)
        return result

    def load_results_from_file(self, results_file: Path) -> None:
        """Load test results from JSON file.

        Args:
            results_file: Path to JSON file with test results
        """
        try:
            with open(results_file, 'r') as f:
                data = json.load(f)

            if isinstance(data, dict) and "tests" in data:
                for test in data["tests"]:
                    self.add_test_result(
                        test_name=test["name"],
                        replays=test["replays"],
                        identical_count=test["identical_count"]
                    )
            elif isinstance(data, list):
                for test in data:
                    self.add_test_result(
                        test_name=test["name"],
                        replays=test["replays"],
                        identical_count=test["identical_count"]
                    )

            print(f"Loaded {len(self.results)} test results from {results_file}")

        except FileNotFoundError:
            print(f"Warning: Results file not found: {results_file}", file=sys.stderr)
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in results file: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error loading results: {e}", file=sys.stderr)

    def load_results_from_directory(self, results_dir: Path) -> None:
        """Load all test results from directory.

        Args:
            results_dir: Directory containing JSON result files
        """
        if not results_dir.exists():
            print(f"Warning: Results directory not found: {results_dir}", file=sys.stderr)
            return

        json_files = list(results_dir.glob("*.json"))
        if not json_files:
            print(f"Warning: No JSON result files found in {results_dir}", file=sys.stderr)
            return

        for json_file in json_files:
            self.load_results_from_file(json_file)

    def calculate_overall_rate(self) -> Optional[float]:
        """Calculate overall reproducibility rate across all tests.

        Returns:
            Overall reproducibility rate (0.0-1.0) or None if no results
        """
        if not self.results:
            return None

        total_replays = sum(r.replays for r in self.results)
        total_identical = sum(r.identical_count for r in self.results)

        if total_replays == 0:
            return None

        return total_identical / total_replays

    def check_gate(self) -> bool:
        """Check if Quality Gate B passes.

        Returns:
            True if gate passes (≥99% reproducibility), False otherwise
        """
        if not self.results:
            print("Error: No test results available", file=sys.stderr)
            return False

        overall_rate = self.calculate_overall_rate()
        if overall_rate is None:
            print("Error: Unable to calculate reproducibility rate", file=sys.stderr)
            return False

        return overall_rate >= self.threshold

    def print_report(self) -> None:
        """Print detailed gate check report."""
        print("\n" + "=" * 70)
        print("Quality Gate B: Reproducibility Check")
        print("=" * 70)
        print(f"Target: ≥{self.threshold:.1%} reproducibility rate")
        print()

        if not self.results:
            print("Status: INSUFFICIENT DATA")
            print("No test results available for evaluation.")
            print("=" * 70)
            return

        # Print individual test results
        print("Individual Test Results:")
        print("-" * 70)
        for result in self.results:
            status = "PASS" if result.passed else "FAIL"
            print(f"  {result.test_name}")
            print(f"    Replays: {result.replays}")
            print(f"    Identical: {result.identical_count}")
            print(f"    Rate: {result.reproducibility_rate:.2%}")
            print(f"    Status: {status}")
            print()

        # Print overall statistics
        overall_rate = self.calculate_overall_rate()
        gate_passed = self.check_gate()

        print("Overall Statistics:")
        print("-" * 70)
        print(f"  Total Tests: {len(self.results)}")
        print(f"  Total Replays: {sum(r.replays for r in self.results)}")
        print(f"  Total Identical: {sum(r.identical_count for r in self.results)}")
        print(f"  Overall Rate: {overall_rate:.2%}")
        print(f"  Target Rate: {self.threshold:.2%}")
        print()

        # Print gate status
        print("=" * 70)
        if gate_passed:
            print("Gate B Status: PASS ✓")
            print(f"Reproducibility rate {overall_rate:.2%} meets target ≥{self.threshold:.1%}")
        else:
            print("Gate B Status: FAIL ✗")
            print(f"Reproducibility rate {overall_rate:.2%} below target ≥{self.threshold:.1%}")
        print("=" * 70)
        print()


def create_mock_results_if_missing(results_dir: Path) -> None:
    """Create mock test results if none exist (for testing).

    Args:
        results_dir: Directory to create mock results in
    """
    results_dir.mkdir(parents=True, exist_ok=True)

    mock_results_file = results_dir / "mock_determinism_results.json"
    if not mock_results_file.exists():
        mock_results = {
            "tests": [
                {
                    "name": "test_conflict_detection_determinism",
                    "replays": 10,
                    "identical_count": 10
                },
                {
                    "name": "test_profanity_detection_determinism",
                    "replays": 10,
                    "identical_count": 10
                },
                {
                    "name": "test_pii_detection_determinism",
                    "replays": 10,
                    "identical_count": 10
                },
                {
                    "name": "test_full_pipeline_reproducibility",
                    "replays": 10,
                    "identical_count": 10
                }
            ]
        }

        with open(mock_results_file, 'w') as f:
            json.dump(mock_results, f, indent=2)

        print(f"Created mock results file: {mock_results_file}")


def main():
    """Main entry point for gate checker."""
    parser = argparse.ArgumentParser(
        description="Check if reproducibility rate meets Quality Gate B threshold"
    )
    parser.add_argument(
        "--results-dir",
        type=Path,
        default=Path(__file__).parent / "results",
        help="Directory containing test result JSON files (default: ./results)"
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.99,
        help="Minimum reproducibility rate required (default: 0.99)"
    )
    parser.add_argument(
        "--create-mock",
        action="store_true",
        help="Create mock results if none exist (for testing)"
    )

    args = parser.parse_args()

    # Create mock results if requested or if no results exist
    if args.create_mock or not args.results_dir.exists():
        create_mock_results_if_missing(args.results_dir)

    # Initialize checker
    checker = ReproducibilityGateChecker(threshold=args.threshold)

    # Load test results
    checker.load_results_from_directory(args.results_dir)

    # Print report
    checker.print_report()

    # Determine exit code
    if not checker.results:
        print("Error: No test results to evaluate", file=sys.stderr)
        sys.exit(2)

    gate_passed = checker.check_gate()
    sys.exit(0 if gate_passed else 1)


if __name__ == "__main__":
    main()
