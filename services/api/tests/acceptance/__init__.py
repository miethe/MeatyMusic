"""Acceptance tests for AMCS Phase 4.5.

This package contains comprehensive acceptance tests that validate:
1. Determinism: ≥99% identical outputs across 10 runs with same seed
2. Rubric Compliance: ≥95% pass rate on test suite
3. Performance: P95 latency ≤60s (excluding render)
4. Skills Registration: All workflow skills registered correctly
5. Fix Loop: Works correctly with max 3 iterations

Test Files:
- test_determinism.py: Tests reproducibility of all skills
- test_rubric_compliance.py: Tests blueprint validation pass rate
- test_performance.py: Tests workflow and skill latency
- test_acceptance.py: Combined acceptance suite with reporting

Usage:
    # Run all acceptance tests
    pytest services/api/tests/acceptance/ -v

    # Run specific test suite
    pytest services/api/tests/acceptance/test_determinism.py -v
    pytest services/api/tests/acceptance/test_rubric_compliance.py -v
    pytest services/api/tests/acceptance/test_performance.py -v

    # Generate acceptance report
    pytest services/api/tests/acceptance/test_acceptance.py::test_generate_acceptance_report -v -s
"""
