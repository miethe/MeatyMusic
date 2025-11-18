"""AMCS PLAN Skill

Generate execution plan from Song Design Spec (SDS).

This skill is the first node in the AMCS workflow. It transforms the SDS into
a structured plan that guides all downstream nodes (STYLE, LYRICS, PRODUCER, COMPOSE).

Key Responsibilities:
- Extract and validate section structure
- Calculate target word counts per section
- Define evaluation targets from blueprint
- Create work objectives for downstream nodes
- Ensure deterministic, reproducible planning

Usage:
    from .claude.skills.workflow.plan import run_skill

    plan_output = await run_skill(
        inputs={"sds": sds_dict},
        context=workflow_context
    )
"""

from .implementation import run_skill

__all__ = ["run_skill"]
