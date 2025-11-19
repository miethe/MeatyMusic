"""
Determinism Validation Framework for MeatyMusic AMCS

This package provides comprehensive determinism testing infrastructure to validate
the ≥99% reproducibility requirement for the Agentic Music Creation System.

Test Suites:
- test_reproducibility.py: Run SDSs multiple times to verify identical outputs
- test_seed_propagation.py: Verify seed propagation through workflow nodes
- test_decoder_settings.py: Validate LLM decoder parameters for determinism
- test_pinned_retrieval.py: Verify deterministic source retrieval

Test Harness:
- test_runner.py: Core execution engine for deterministic workflow simulation

Fixtures:
- fixtures/: 50 diverse SDS JSON files covering multiple genres and edge cases

Usage:
    # Run all determinism tests
    pytest tests/determinism/

    # Run only reproducibility tests
    pytest tests/determinism/test_reproducibility.py

    # Run with verbose output
    pytest tests/determinism/ -v

    # Generate JSON report
    pytest tests/determinism/ --json-report --json-report-file=determinism_report.json

Metrics Tracked:
- Reproducibility rate (target: ≥99%)
- Per-artifact reproducibility (style, lyrics, producer_notes, composed_prompt)
- Seed propagation correctness
- Decoder settings compliance
- Retrieval determinism

Author: AMCS Development Team
Last Updated: 2025-11-19
"""

__version__ = "1.0.0"
