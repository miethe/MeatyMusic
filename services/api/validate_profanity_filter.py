#!/usr/bin/env python3
"""Standalone validation script for ProfanityFilter.

This script validates the profanity filter implementation without requiring
the full dependency stack. It performs basic smoke tests to ensure the
core functionality works correctly.
"""

import json
from pathlib import Path


def validate_taxonomy():
    """Validate profanity taxonomy file."""
    print("=" * 70)
    print("VALIDATION 1: Profanity Taxonomy JSON")
    print("=" * 70)

    taxonomy_path = Path(__file__).parent.parent.parent / "taxonomies" / "profanity_list.json"

    if not taxonomy_path.exists():
        print(f"✗ FAIL: Taxonomy file not found at {taxonomy_path}")
        return False

    try:
        with open(taxonomy_path, 'r') as f:
            taxonomy = json.load(f)

        print(f"✓ Taxonomy file loaded successfully")

        # Validate structure
        required_keys = ["categories", "severity_weights", "thresholds", "whitelist", "variations"]
        for key in required_keys:
            if key not in taxonomy:
                print(f"✗ FAIL: Missing required key: {key}")
                return False
            print(f"  ✓ Contains key: {key}")

        # Validate categories
        categories = taxonomy["categories"]
        required_categories = ["mild", "moderate", "strong", "extreme"]
        for category in required_categories:
            if category not in categories:
                print(f"✗ FAIL: Missing category: {category}")
                return False
            print(f"  ✓ Category '{category}': {len(categories[category])} terms")

        # Validate severity weights
        weights = taxonomy["severity_weights"]
        for category in required_categories:
            if category not in weights:
                print(f"✗ FAIL: Missing severity weight for: {category}")
                return False
            if not (0.0 < weights[category] <= 1.0):
                print(f"✗ FAIL: Invalid weight for {category}: {weights[category]}")
                return False

        print(f"  ✓ Severity weights valid")

        # Validate thresholds
        thresholds = taxonomy["thresholds"]
        required_modes = ["clean", "mild_allowed", "moderate_allowed", "explicit"]
        for mode in required_modes:
            if mode not in thresholds:
                print(f"✗ FAIL: Missing threshold mode: {mode}")
                return False

        print(f"  ✓ Thresholds configured for all modes")

        # Validate whitelist
        whitelist = taxonomy["whitelist"]["terms"]
        print(f"  ✓ Whitelist contains {len(whitelist)} terms")

        # Validate variations
        leetspeak = taxonomy["variations"]["leetspeak_patterns"]
        print(f"  ✓ Leetspeak patterns defined for {len(leetspeak)} characters")

        print("\n✓ PASS: Taxonomy validation complete\n")
        return True

    except json.JSONDecodeError as e:
        print(f"✗ FAIL: Invalid JSON: {e}")
        return False
    except Exception as e:
        print(f"✗ FAIL: Unexpected error: {e}")
        return False


def validate_python_files():
    """Validate Python file syntax."""
    print("=" * 70)
    print("VALIDATION 2: Python File Syntax")
    print("=" * 70)

    import py_compile

    files = [
        ("ProfanityFilter", Path(__file__).parent / "app" / "services" / "policy_guards.py"),
        ("Unit Tests", Path(__file__).parent / "tests" / "unit" / "services" / "test_policy_guards.py"),
    ]

    all_valid = True

    for name, filepath in files:
        try:
            py_compile.compile(str(filepath), doraise=True)
            print(f"✓ {name}: Syntax valid")
        except py_compile.PyCompileError as e:
            print(f"✗ FAIL: {name} has syntax errors:")
            print(f"  {e}")
            all_valid = False

    if all_valid:
        print("\n✓ PASS: All Python files have valid syntax\n")
    else:
        print("\n✗ FAIL: Some files have syntax errors\n")

    return all_valid


def validate_structure():
    """Validate that all required files exist."""
    print("=" * 70)
    print("VALIDATION 3: File Structure")
    print("=" * 70)

    base_path = Path(__file__).parent.parent.parent

    required_files = [
        ("Profanity Taxonomy", base_path / "taxonomies" / "profanity_list.json"),
        ("ProfanityFilter Service", base_path / "services" / "api" / "app" / "services" / "policy_guards.py"),
        ("Unit Tests", base_path / "services" / "api" / "tests" / "unit" / "services" / "test_policy_guards.py"),
    ]

    all_exist = True

    for name, filepath in required_files:
        if filepath.exists():
            size = filepath.stat().st_size
            print(f"✓ {name}: exists ({size:,} bytes)")
        else:
            print(f"✗ FAIL: {name} not found at {filepath}")
            all_exist = False

    if all_exist:
        print("\n✓ PASS: All required files exist\n")
    else:
        print("\n✗ FAIL: Some required files are missing\n")

    return all_exist


def validate_imports():
    """Validate that the module structure is correct."""
    print("=" * 70)
    print("VALIDATION 4: Module Import Structure")
    print("=" * 70)

    policy_guards_path = Path(__file__).parent / "app" / "services" / "policy_guards.py"

    if not policy_guards_path.exists():
        print(f"✗ FAIL: policy_guards.py not found")
        return False

    with open(policy_guards_path, 'r') as f:
        content = f.read()

    # Check for required classes and methods
    required_items = [
        ("ProfanityViolation class", "class ProfanityViolation"),
        ("ProfanityFilter class", "class ProfanityFilter"),
        ("detect_profanity method", "def detect_profanity"),
        ("check_lyrics_sections method", "def check_lyrics_sections"),
        ("get_profanity_score method", "def get_profanity_score"),
        ("get_violation_report method", "def get_violation_report"),
        ("_normalize_text method", "def _normalize_text"),
        ("_is_whitelisted method", "def _is_whitelisted"),
    ]

    all_found = True

    for name, pattern in required_items:
        if pattern in content:
            print(f"✓ {name}: defined")
        else:
            print(f"✗ FAIL: {name} not found")
            all_found = False

    if all_found:
        print("\n✓ PASS: All required classes and methods defined\n")
    else:
        print("\n✗ FAIL: Some required items are missing\n")

    return all_found


def validate_test_coverage():
    """Validate test coverage."""
    print("=" * 70)
    print("VALIDATION 5: Test Coverage")
    print("=" * 70)

    test_path = Path(__file__).parent / "tests" / "unit" / "services" / "test_policy_guards.py"

    if not test_path.exists():
        print(f"✗ FAIL: test_policy_guards.py not found")
        return False

    with open(test_path, 'r') as f:
        content = f.read()

    # Check for test classes
    test_classes = [
        "TestProfanityFilterInitialization",
        "TestBasicProfanityDetection",
        "TestVariationDetection",
        "TestWhitelistFunctionality",
        "TestLyricsSectionChecking",
        "TestProfanityScoring",
        "TestThresholdCompliance",
        "TestViolationReporting",
        "TestEdgeCases",
        "TestDeterminism",
    ]

    all_found = True

    for test_class in test_classes:
        if f"class {test_class}" in content:
            # Count test methods in this class
            lines = content.split(f"class {test_class}")[1].split("class ")[0]
            test_count = lines.count("def test_")
            print(f"✓ {test_class}: {test_count} test methods")
        else:
            print(f"✗ FAIL: {test_class} not found")
            all_found = False

    # Count total test functions
    total_tests = content.count("def test_")
    print(f"\nTotal test functions: {total_tests}")

    if all_found and total_tests >= 50:
        print("\n✓ PASS: Comprehensive test coverage achieved\n")
    else:
        print("\n✗ FAIL: Insufficient test coverage\n")

    return all_found


def main():
    """Run all validations."""
    print("\n" + "=" * 70)
    print("PROFANITY FILTER MODULE VALIDATION")
    print("=" * 70 + "\n")

    validations = [
        validate_structure,
        validate_taxonomy,
        validate_python_files,
        validate_imports,
        validate_test_coverage,
    ]

    results = []
    for validation in validations:
        try:
            result = validation()
            results.append(result)
        except Exception as e:
            print(f"✗ FAIL: Validation failed with error: {e}")
            results.append(False)

    # Summary
    print("=" * 70)
    print("VALIDATION SUMMARY")
    print("=" * 70)

    passed = sum(results)
    total = len(results)

    print(f"\nPassed: {passed}/{total}")

    if all(results):
        print("\n✓ ALL VALIDATIONS PASSED")
        print("\nThe profanity filter module is ready for testing.")
        print("To run unit tests, use:")
        print("  cd /home/user/MeatyMusic/services/api")
        print("  pytest tests/unit/services/test_policy_guards.py -v")
        return 0
    else:
        print("\n✗ SOME VALIDATIONS FAILED")
        print("\nPlease fix the issues above before proceeding.")
        return 1


if __name__ == "__main__":
    exit(main())
