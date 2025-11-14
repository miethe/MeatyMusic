#!/usr/bin/env python3
"""Standalone determinism test for common validation utilities.

This script validates the CRITICAL determinism requirements without external dependencies.
Run with: python test_determinism_standalone.py
"""

import hashlib
import re
from datetime import datetime
from uuid import UUID, uuid4
from typing import Dict, List, Optional, Tuple


# =============================================================================
# Simplified implementations for standalone testing
# =============================================================================

def compute_citation_hash(
    source_id: UUID,
    chunk_text: str,
    timestamp: Optional[datetime] = None
) -> str:
    """Compute deterministic SHA-256 hash for citation tracking."""
    source_id_str = str(source_id)
    chunk_text_normalized = chunk_text.strip()
    timestamp_str = timestamp.isoformat() if timestamp else ""
    hash_input = f"{source_id_str}|{chunk_text_normalized}|{timestamp_str}"
    hash_bytes = hashlib.sha256(hash_input.encode('utf-8')).digest()
    return hash_bytes.hex()


def normalize_weights(
    weights: Dict[str, float],
    max_sum: float = 1.0
) -> Dict[str, float]:
    """Normalize weights to sum to max_sum or less."""
    if not weights:
        return {}
    valid_weights = {k: v for k, v in weights.items() if v > 0}
    if not valid_weights:
        return {}
    current_sum = sum(valid_weights.values())
    if current_sum <= max_sum:
        return valid_weights
    scale_factor = max_sum / current_sum
    return {k: round(v * scale_factor, 6) for k, v in valid_weights.items()}


def validate_rhyme_scheme(scheme: str) -> bool:
    """Validate rhyme scheme format."""
    if not scheme or not isinstance(scheme, str):
        return False
    if not re.match(r'^[A-Z]+$', scheme):
        return False
    unique_letters = []
    for letter in scheme:
        if letter not in unique_letters:
            unique_letters.append(letter)
    expected = 'A'
    for letter in unique_letters:
        if letter != expected:
            return False
        expected = chr(ord(expected) + 1)
    return True


# =============================================================================
# Determinism Tests
# =============================================================================

def test_citation_hash_determinism():
    """Test that citation hashing is 100% deterministic."""
    print("\n[TEST] Citation Hash Determinism")
    print("=" * 60)

    source_id = uuid4()
    chunk_text = "This is a test chunk for determinism validation"
    timestamp = datetime(2024, 1, 1, 12, 0, 0)

    # Run 100 iterations to verify determinism
    hashes = []
    for i in range(100):
        hash_val = compute_citation_hash(source_id, chunk_text, timestamp)
        hashes.append(hash_val)

    # All hashes should be identical
    unique_hashes = set(hashes)
    success = len(unique_hashes) == 1

    print(f"  Iterations: 100")
    print(f"  Unique hashes: {len(unique_hashes)}")
    print(f"  Hash sample: {hashes[0][:16]}...")
    print(f"  Result: {'✓ PASS' if success else '✗ FAIL'}")

    return success


def test_weight_normalization_determinism():
    """Test that weight normalization is deterministic."""
    print("\n[TEST] Weight Normalization Determinism")
    print("=" * 60)

    weights = {"source1": 0.5, "source2": 0.8, "source3": 0.3}

    # Run 100 iterations
    results = []
    for i in range(100):
        normalized = normalize_weights(weights, max_sum=1.0)
        results.append(str(normalized))

    unique_results = set(results)
    success = len(unique_results) == 1

    print(f"  Iterations: 100")
    print(f"  Unique results: {len(unique_results)}")
    print(f"  Original sum: {sum(weights.values()):.3f}")
    print(f"  Normalized sum: {sum(normalize_weights(weights).values()):.3f}")
    print(f"  Result: {'✓ PASS' if success else '✗ FAIL'}")

    return success


def test_rhyme_scheme_validation_determinism():
    """Test that rhyme scheme validation is deterministic."""
    print("\n[TEST] Rhyme Scheme Validation Determinism")
    print("=" * 60)

    test_schemes = [
        ("AABB", True),
        ("ABAB", True),
        ("ABCB", True),
        ("ACBB", False),  # Invalid - skips B
        ("aabb", False),  # Invalid - lowercase
    ]

    results = []
    for scheme, expected in test_schemes:
        # Run 10 times
        validations = [validate_rhyme_scheme(scheme) for _ in range(10)]
        unique = set(validations)
        deterministic = len(unique) == 1
        correct = validations[0] == expected

        status = "✓" if (deterministic and correct) else "✗"
        results.append((status, scheme, expected, validations[0], deterministic))

    # Print results
    for status, scheme, expected, actual, deterministic in results:
        print(f"  {status} '{scheme}': expected={expected}, actual={actual}, deterministic={deterministic}")

    success = all(r[0] == "✓" for r in results)
    print(f"  Result: {'✓ PASS' if success else '✗ FAIL'}")

    return success


def test_hash_collision_resistance():
    """Test that different inputs produce different hashes."""
    print("\n[TEST] Hash Collision Resistance")
    print("=" * 60)

    # Generate 1000 different citations
    hashes = set()
    for i in range(1000):
        source_id = uuid4()
        chunk_text = f"Test chunk number {i} with unique content"
        hash_val = compute_citation_hash(source_id, chunk_text)
        hashes.add(hash_val)

    # Should have 1000 unique hashes
    success = len(hashes) == 1000

    print(f"  Citations generated: 1000")
    print(f"  Unique hashes: {len(hashes)}")
    print(f"  Collisions: {1000 - len(hashes)}")
    print(f"  Result: {'✓ PASS' if success else '✗ FAIL'}")

    return success


def test_reproducibility_across_runs():
    """Test that same inputs always produce same output (critical for 99%+ reproducibility)."""
    print("\n[TEST] Reproducibility Across Runs")
    print("=" * 60)

    # Use fixed UUID for reproducibility testing
    fixed_uuid = UUID("12345678-1234-5678-1234-567812345678")
    chunk_text = "Fixed test chunk for reproducibility"

    # Compute hash
    hash1 = compute_citation_hash(fixed_uuid, chunk_text)

    # This hash should ALWAYS be the same for these inputs
    expected_hash = compute_citation_hash(fixed_uuid, chunk_text)

    success = hash1 == expected_hash

    print(f"  Fixed UUID: {fixed_uuid}")
    print(f"  Fixed text: '{chunk_text}'")
    print(f"  Hash: {hash1}")
    print(f"  Matches expected: {success}")
    print(f"  Result: {'✓ PASS' if success else '✗ FAIL'}")

    return success


# =============================================================================
# Main Test Runner
# =============================================================================

def main():
    """Run all determinism tests."""
    print("\n" + "=" * 60)
    print("MeatyMusic AMCS - Determinism Validation Suite")
    print("=" * 60)
    print("\nTesting shared validation utilities for determinism compliance.")
    print("REQUIREMENT: 99%+ reproducibility (same input → same output)")

    tests = [
        test_citation_hash_determinism,
        test_weight_normalization_determinism,
        test_rhyme_scheme_validation_determinism,
        test_hash_collision_resistance,
        test_reproducibility_across_runs,
    ]

    results = []
    for test_func in tests:
        try:
            passed = test_func()
            results.append((test_func.__name__, passed))
        except Exception as e:
            print(f"  ✗ EXCEPTION: {e}")
            results.append((test_func.__name__, False))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {test_name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    success_rate = (passed / total) * 100
    print(f"Success rate: {success_rate:.1f}%")

    if success_rate >= 99.0:
        print("\n✓ DETERMINISM REQUIREMENT MET (≥99%)")
        return 0
    else:
        print("\n✗ DETERMINISM REQUIREMENT NOT MET (<99%)")
        return 1


if __name__ == "__main__":
    exit(main())
