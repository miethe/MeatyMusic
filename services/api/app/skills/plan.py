"""PLAN skill: Generate execution plan from Song Design Spec (SDS).

This skill transforms an SDS into a deterministic execution plan that guides
all downstream workflow nodes. It extracts section structure, calculates target
metrics, and produces ordered work objectives.

Contract: .claude/skills/workflow/plan/SKILL.md
"""

from typing import Any, Dict

import structlog

from app.workflows.skill import WorkflowContext, compute_hash, workflow_skill

logger = structlog.get_logger(__name__)


@workflow_skill(
    name="amcs.plan.generate",
    deterministic=True,
)
async def generate_plan(inputs: Dict[str, Any], context: WorkflowContext) -> Dict[str, Any]:
    """Generate execution plan from SDS.

    This is a purely deterministic function with no LLM calls. It:
    - Extracts section structure
    - Calculates target word counts
    - Defines evaluation targets from blueprint
    - Creates work objectives for downstream nodes

    Args:
        inputs: Dictionary containing:
            - sds: Complete Song Design Spec
        context: Workflow context with seed and run metadata

    Returns:
        Dictionary containing:
            - plan: Complete execution plan
    """
    sds = inputs["sds"]

    logger.info(
        "plan.generate.start",
        run_id=str(context.run_id),
        title=sds.get("title", "Untitled"),
    )

    # Extract core components
    lyrics_spec = sds["lyrics"]
    producer_spec = sds["producer_notes"]
    blueprint_ref = sds["blueprint_ref"]

    # Step 1: Extract section structure
    section_order = lyrics_spec["section_order"]

    # Validate at least one chorus exists
    chorus_count = sum(1 for s in section_order if "chorus" in s.lower())
    if chorus_count == 0:
        raise ValueError("Section order must include at least one 'Chorus' section")

    # Check hook strategy requirements
    hook_strategy = lyrics_spec.get("hook_strategy", "melodic")
    if hook_strategy in ["lyrical", "chant"] and chorus_count < 2:
        logger.warning(
            "plan.hook_strategy.warning",
            hook_strategy=hook_strategy,
            chorus_count=chorus_count,
            message="Hook strategy requires ≥2 chorus sections for optimal results",
        )

    # Step 2: Calculate target word counts
    max_lines = lyrics_spec["constraints"].get("max_lines", 120)
    section_requirements = lyrics_spec["constraints"].get("section_requirements", {})

    # Convert lines to word counts (avg 6 words/line)
    words_per_line = 6
    total_target_words = max_lines * words_per_line

    # Calculate per-section targets
    target_word_counts = {}
    for section in section_order:
        section_key = section

        # Get section requirements
        if section_key in section_requirements:
            req = section_requirements[section_key]
            min_lines = req.get("min_lines", 0)
            max_section_lines = req.get("max_lines", max_lines // len(section_order))

            # Use midpoint as target
            target_lines = (min_lines + max_section_lines) // 2
        else:
            # Default: distribute evenly
            target_lines = max_lines // len(section_order)

        target_word_counts[section_key] = target_lines * words_per_line

    # Validate total doesn't exceed max
    total_calculated = sum(target_word_counts.values())
    if total_calculated > total_target_words:
        # Proportionally reduce
        scale_factor = total_target_words / total_calculated
        target_word_counts = {
            k: int(v * scale_factor) for k, v in target_word_counts.items()
        }
        logger.info(
            "plan.word_counts.scaled",
            original_total=total_calculated,
            scaled_total=sum(target_word_counts.values()),
            scale_factor=scale_factor,
        )

    # Step 3: Define evaluation targets (mock blueprint values for MVP)
    # TODO: Load actual blueprint from docs/hit_song_blueprint/AI/
    evaluation_targets = {
        "hook_density": 0.7,
        "singability": 0.8,
        "rhyme_tightness": 0.75,
        "section_completeness": 0.9,
        "profanity_score": 0.0 if not lyrics_spec["constraints"].get("explicit", False) else 1.0,
        "total": 0.8,
    }

    # Step 4: Create work objectives
    work_objectives = [
        {
            "node": "STYLE",
            "objective": f"Generate {sds['style']['genre_detail']['primary']} style with tempo {sds['style']['tempo_bpm']}, key {sds['style']['key']['primary']}, mood {sds['style']['mood']}, enforcing blueprint tempo ranges and tag conflict matrix",
            "dependencies": [],
        },
        {
            "node": "LYRICS",
            "objective": f"Produce lyrics for {len(section_order)} sections, enforcing rhyme scheme {lyrics_spec.get('rhyme_scheme', 'AABB')}, meter {lyrics_spec.get('meter', '4/4')}, hook strategy {hook_strategy}",
            "dependencies": ["STYLE"],
        },
        {
            "node": "PRODUCER",
            "objective": f"Create production notes with {producer_spec.get('hooks', 2)} hooks, structure {'-'.join(section_order)}, section tags from plan",
            "dependencies": ["STYLE"],
        },
        {
            "node": "COMPOSE",
            "objective": f"Merge artifacts into render-ready prompt respecting {sds['render']['engine']} character limits",
            "dependencies": ["STYLE", "LYRICS", "PRODUCER"],
        },
    ]

    # Step 5: Assemble plan
    plan = {
        "section_order": section_order,
        "target_word_counts": target_word_counts,
        "evaluation_targets": evaluation_targets,
        "work_objectives": work_objectives,
        "_hash": "",  # Will be computed after assembly
    }

    # Compute hash for provenance
    plan["_hash"] = compute_hash(plan)

    logger.info(
        "plan.generate.complete",
        run_id=str(context.run_id),
        sections=len(section_order),
        total_target_words=sum(target_word_counts.values()),
        hash=plan["_hash"][:16],
    )

    return {"plan": plan}
