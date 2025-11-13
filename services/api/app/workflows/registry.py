"""Skill registry for workflow orchestrator.

This module registers all workflow skills with the orchestrator,
making them available for execution in workflow graphs.
"""

from app.workflows.orchestrator import WorkflowOrchestrator
from app.skills import (
    generate_plan,
    generate_style,
    generate_lyrics,
    generate_producer_notes,
    compose_prompt,
)


def register_all_skills(orchestrator: WorkflowOrchestrator) -> None:
    """Register all workflow skills with the orchestrator.

    Args:
        orchestrator: WorkflowOrchestrator instance to register skills with
    """
    # Register core workflow skills
    orchestrator.register_skill("PLAN", generate_plan)
    orchestrator.register_skill("STYLE", generate_style)
    orchestrator.register_skill("LYRICS", generate_lyrics)
    orchestrator.register_skill("PRODUCER", generate_producer_notes)
    orchestrator.register_skill("COMPOSE", compose_prompt)

    # TODO: Register additional skills when implemented:
    # - VALIDATE: validation and scoring
    # - FIX: targeted artifact fixes
    # - RENDER: submit to render engines
    # - REVIEW: finalize and emit events
