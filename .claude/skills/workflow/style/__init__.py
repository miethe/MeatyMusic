"""AMCS STYLE skill for style specification generation.

This module provides the STYLE workflow skill that generates validated
style specifications from Song Design Specs (SDS) with blueprint constraint
enforcement and tag conflict resolution.
"""

from .implementation import (
    check_tag_conflicts,
    enforce_instrumentation_limit,
    enforce_tempo_range,
    run_skill,
)

__all__ = [
    "run_skill",
    "check_tag_conflicts",
    "enforce_tempo_range",
    "enforce_instrumentation_limit",
]
