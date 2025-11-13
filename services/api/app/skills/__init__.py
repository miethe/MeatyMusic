"""AMCS workflow skills implementation.

This package contains the Python runtime implementation for the 5 core
workflow skills: PLAN, STYLE, LYRICS, PRODUCER, and COMPOSE.

Each skill follows the contract defined in its corresponding SKILL.md file
in .claude/skills/workflow/ and is decorated with @workflow_skill for
common patterns like validation, telemetry, and determinism enforcement.
"""

from app.skills.plan import generate_plan
from app.skills.style import generate_style
from app.skills.lyrics import generate_lyrics
from app.skills.producer import generate_producer_notes
from app.skills.compose import compose_prompt

__all__ = [
    "generate_plan",
    "generate_style",
    "generate_lyrics",
    "generate_producer_notes",
    "compose_prompt",
]
