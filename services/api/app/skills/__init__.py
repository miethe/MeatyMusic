"""AMCS workflow skills implementation.

This package contains the Python runtime implementation for the 7 core
workflow skills: PLAN, STYLE, LYRICS, PRODUCER, COMPOSE, VALIDATE, and FIX.

Each skill follows the contract defined in its corresponding SKILL.md file
in .claude/skills/workflow/ and is decorated with @workflow_skill for
common patterns like validation, telemetry, and determinism enforcement.
"""

from app.skills.plan import generate_plan
from app.skills.style import generate_style
from app.skills.lyrics import generate_lyrics
from app.skills.producer import generate_producer_notes
from app.skills.compose import compose_prompt
from app.skills.validate import evaluate_artifacts
from app.skills.fix import apply_fixes

__all__ = [
    "generate_plan",
    "generate_style",
    "generate_lyrics",
    "generate_producer_notes",
    "compose_prompt",
    "evaluate_artifacts",
    "apply_fixes",
]
