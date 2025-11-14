"""Determinism validation tests for MeatyMusic AMCS.

CRITICAL REQUIREMENT: All tests in this package must verify ≥99% reproducibility
to ensure deterministic behavior across the system.

Test coverage:
- Citation hash stability and collision resistance
- Source retrieval determinism with seed control
- Weight normalization determinism
- Complete workflow reproducibility
- Rhyme scheme validation determinism
"""
