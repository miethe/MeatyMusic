#!/usr/bin/env python3
"""
Determinism Test Runner CLI

Runs the AMCS determinism test suite with configurable options and generates
comprehensive reports on reproducibility rates.

Usage:
    # Run full test suite (200 songs × 10 iterations)
    python scripts/run_determinism_tests.py

    # Run with smaller sample size
    python scripts/run_determinism_tests.py --sample-size 50

    # Run fewer iterations per song
    python scripts/run_determinism_tests.py --iterations 3

    # Fail fast on first failure
    python scripts/run_determinism_tests.py --fail-fast

    # Verbose output
    python scripts/run_determinism_tests.py --verbose

    # Run specific test
    python scripts/run_determinism_tests.py --test per-node

Author: AMCS Development Team
Created: 2025-11-20
"""

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


# Test suite configuration
TESTS_DIR = Path(__file__).parent.parent / "tests"
FIXTURES_DIR = TESTS_DIR / "fixtures" / "test_songs"
REPORTS_DIR = Path(__file__).parent.parent / "test_reports"

# Available test modes
TEST_MODES = {
    "full": "test_basic_reproducibility_200_songs_10_runs",
    "per-node": "test_per_node_reproducibility",
    "seed-propagation": "test_seed_propagation",
    "sample": "test_reproducibility_sample_sizes",
    "all": None,  # Run all tests
}


class TestRunner:
    """Orchestrates determinism test execution and reporting."""

    def __init__(
        self,
        sample_size: int = 200,
        iterations: int = 10,
        fail_fast: bool = False,
        verbose: bool = False,
        test_mode: str = "all",
    ):
        self.sample_size = sample_size
        self.iterations = iterations
        self.fail_fast = fail_fast
        self.verbose = verbose
        self.test_mode = test_mode
        self.results = {}

    def generate_fixtures(self) -> bool:
        """
        Generate synthetic song fixtures if they don't exist.

        Returns:
            True if fixtures generated successfully or already exist
        """
        if FIXTURES_DIR.exists() and len(list(FIXTURES_DIR.glob("synthetic-*.json"))) >= self.sample_size:
            if self.verbose:
                print(f"✓ Fixtures already exist ({FIXTURES_DIR})")
            return True

        print(f"Generating {self.sample_size} synthetic song fixtures...")

        try:
            cmd = [
                sys.executable,
                "-m",
                "tests.fixtures.synthetic_songs",
                "--count",
                str(self.sample_size),
            ]

            result = subprocess.run(
                cmd,
                cwd=TESTS_DIR.parent,
                capture_output=True,
                text=True,
            )

            if result.returncode != 0:
                print(f"✗ Fixture generation failed:")
                print(result.stderr)
                return False

            print(f"✓ Generated {self.sample_size} fixtures")
            return True

        except Exception as e:
            print(f"✗ Error generating fixtures: {e}")
            return False

    def run_pytest(self) -> Dict:
        """
        Run pytest with configured options.

        Returns:
            Dict with test results
        """
        # Build pytest command
        pytest_args = [
            "pytest",
            str(TESTS_DIR / "test_determinism.py"),
            "-v" if self.verbose else "-q",
            "--tb=short",
            f"--basetemp={REPORTS_DIR / 'tmp'}",
        ]

        # Add test selection
        if self.test_mode != "all":
            test_name = TEST_MODES.get(self.test_mode)
            if test_name:
                pytest_args.append(f"-k {test_name}")

        # Add markers
        pytest_args.append("-m determinism")

        # Fail fast
        if self.fail_fast:
            pytest_args.append("-x")

        # Sample size parameterization
        if self.test_mode == "sample":
            pytest_args.extend([
                "--parametrize", f"sample_size={self.sample_size}"
            ])

        # Run pytest
        print(f"\nRunning determinism tests...")
        print(f"  Mode: {self.test_mode}")
        print(f"  Sample size: {self.sample_size}")
        print(f"  Iterations: {self.iterations}")
        print(f"  Command: {' '.join(pytest_args)}\n")

        start_time = time.time()

        try:
            result = subprocess.run(
                pytest_args,
                cwd=TESTS_DIR.parent,
                capture_output=True,
                text=True,
            )

            elapsed_time = time.time() - start_time

            # Parse output
            output_lines = result.stdout.split('\n')

            # Extract summary line
            summary_line = None
            for line in reversed(output_lines):
                if 'passed' in line or 'failed' in line:
                    summary_line = line
                    break

            return {
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "elapsed_time": elapsed_time,
                "summary": summary_line or "No summary available",
                "passed": result.returncode == 0,
            }

        except Exception as e:
            return {
                "returncode": -1,
                "stdout": "",
                "stderr": str(e),
                "elapsed_time": 0,
                "summary": f"Error: {e}",
                "passed": False,
            }

    def generate_report(self, test_results: Dict) -> Path:
        """
        Generate comprehensive test report.

        Args:
            test_results: Results from pytest execution

        Returns:
            Path to generated report
        """
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = REPORTS_DIR / f"determinism_report_{timestamp}.json"

        # Load any generated pytest reports
        tmp_dir = REPORTS_DIR / "tmp"
        pytest_reports = []
        if tmp_dir.exists():
            for report_file in tmp_dir.glob("**/reproducibility_report.json"):
                try:
                    with open(report_file) as f:
                        pytest_reports.append(json.load(f))
                except Exception:
                    pass

            for report_file in tmp_dir.glob("**/per_node_reproducibility_report.json"):
                try:
                    with open(report_file) as f:
                        pytest_reports.append(json.load(f))
                except Exception:
                    pass

        # Build comprehensive report
        report = {
            "timestamp": timestamp,
            "configuration": {
                "sample_size": self.sample_size,
                "iterations": self.iterations,
                "test_mode": self.test_mode,
                "fail_fast": self.fail_fast,
            },
            "execution": {
                "passed": test_results["passed"],
                "elapsed_time": round(test_results["elapsed_time"], 2),
                "summary": test_results["summary"],
            },
            "pytest_reports": pytest_reports,
        }

        # Save report
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        return report_path

    def print_summary(self, test_results: Dict, report_path: Path):
        """
        Print test summary to console.

        Args:
            test_results: Results from pytest execution
            report_path: Path to generated report
        """
        print("\n" + "=" * 80)
        print("DETERMINISM TEST SUMMARY")
        print("=" * 80)
        print(f"Mode:         {self.test_mode}")
        print(f"Sample size:  {self.sample_size}")
        print(f"Iterations:   {self.iterations}")
        print(f"Status:       {'PASSED ✓' if test_results['passed'] else 'FAILED ✗'}")
        print(f"Elapsed time: {test_results['elapsed_time']:.2f}s")
        print(f"Summary:      {test_results['summary']}")
        print(f"Report:       {report_path}")
        print("=" * 80)

        if not test_results['passed']:
            print("\nTest failures detected. See output above for details.")
            print(f"Full report: {report_path}")

    def run(self) -> int:
        """
        Run the complete test suite.

        Returns:
            Exit code (0 = success, 1 = failure)
        """
        print("=" * 80)
        print("AMCS Determinism Test Suite")
        print("=" * 80)

        # Step 1: Generate fixtures
        if not self.generate_fixtures():
            print("\n✗ Failed to generate fixtures")
            return 1

        # Step 2: Run tests
        test_results = self.run_pytest()

        # Step 3: Generate report
        report_path = self.generate_report(test_results)

        # Step 4: Print summary
        self.print_summary(test_results, report_path)

        # Print verbose output if requested
        if self.verbose and test_results["stdout"]:
            print("\n" + "=" * 80)
            print("DETAILED OUTPUT")
            print("=" * 80)
            print(test_results["stdout"])

        return 0 if test_results["passed"] else 1


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Run AMCS determinism tests and generate reports",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run full test suite
  python scripts/run_determinism_tests.py

  # Quick test with 50 songs
  python scripts/run_determinism_tests.py --sample-size 50

  # Test with fewer iterations
  python scripts/run_determinism_tests.py --iterations 3

  # Run specific test
  python scripts/run_determinism_tests.py --test per-node

  # Verbose output
  python scripts/run_determinism_tests.py --verbose
        """
    )

    parser.add_argument(
        "--sample-size",
        type=int,
        default=200,
        help="Number of songs to test (default: 200)"
    )

    parser.add_argument(
        "--iterations",
        type=int,
        default=10,
        help="Number of iterations per song (default: 10)"
    )

    parser.add_argument(
        "--test",
        choices=list(TEST_MODES.keys()),
        default="all",
        help="Test mode to run (default: all)"
    )

    parser.add_argument(
        "--fail-fast",
        action="store_true",
        help="Stop on first test failure"
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Show detailed test output"
    )

    args = parser.parse_args()

    # Create runner
    runner = TestRunner(
        sample_size=args.sample_size,
        iterations=args.iterations,
        fail_fast=args.fail_fast,
        verbose=args.verbose,
        test_mode=args.test,
    )

    # Run tests
    exit_code = runner.run()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
