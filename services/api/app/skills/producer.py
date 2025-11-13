"""PRODUCER skill: Generate production notes defining song structure and mix.

This skill creates comprehensive production notes that define arrangement
structure, hook placement, instrumentation details, per-section dynamics,
and mix parameters aligned with style specifications.

Contract: .claude/skills/workflow/producer/SKILL.md
"""

from typing import Any, Dict, List

import structlog

from app.workflows.skill import WorkflowContext, compute_hash, workflow_skill

logger = structlog.get_logger(__name__)


# Blueprint production guidelines (mock for MVP)
SECTION_PRODUCTION_GUIDELINES = {
    "Intro": ["instrumental", "low energy", "atmospheric"],
    "Verse": ["storytelling", "moderate energy"],
    "PreChorus": ["build-up", "rising energy", "add percussion"],
    "Pre-Chorus": ["build-up", "rising energy", "add percussion"],  # Alternate spelling
    "Chorus": ["anthemic", "full instrumentation", "hook-forward"],
    "Bridge": ["minimal", "dramatic shift", "breakdown"],
    "Outro": ["fade-out", "reflective"],
}


def _get_section_tags(section: str, style: Dict[str, Any]) -> List[str]:
    """Get recommended production tags for a section.

    Args:
        section: Section name
        style: Style specification

    Returns:
        List of production tags
    """
    # Get base tags from guidelines
    base_tags = SECTION_PRODUCTION_GUIDELINES.get(section, ["moderate energy"])

    # Add instrumentation hints for specific sections
    instrumentation = style.get("instrumentation", [])
    energy = style.get("energy", "medium")

    tags = base_tags.copy()

    # Customize based on section and style
    if section in ["Intro", "Outro"] and instrumentation:
        # Feature first instrument in intro/outro
        tags.append(f"{instrumentation[0]} feature")

    if section == "Chorus" and energy == "anthemic":
        tags.append("crowd-ready")

    return tags


def _calculate_section_durations(
    section_order: List[str],
    total_duration: int,
    section_meta: Dict[str, Any],
) -> Dict[str, int]:
    """Calculate target duration for each section.

    Args:
        section_order: List of sections
        total_duration: Total song duration in seconds
        section_meta: User-provided section metadata with durations

    Returns:
        Dictionary mapping section names to target durations
    """
    durations = {}

    # First, use any user-specified durations
    specified_total = 0
    for section in section_order:
        if section in section_meta and "target_duration_sec" in section_meta[section]:
            duration = section_meta[section]["target_duration_sec"]
            durations[section] = duration
            specified_total += duration

    # Distribute remaining time proportionally to unspecified sections
    unspecified_sections = [s for s in section_order if s not in durations]
    remaining_time = total_duration - specified_total

    if unspecified_sections and remaining_time > 0:
        # Default durations by section type
        section_weights = {
            "Intro": 0.05,  # 5% of song
            "Verse": 0.20,  # 20% per verse
            "PreChorus": 0.10,
            "Pre-Chorus": 0.10,
            "Chorus": 0.15,  # 15% per chorus
            "Bridge": 0.12,
            "Outro": 0.08,
        }

        # Calculate proportional distribution
        total_weight = sum(section_weights.get(s, 0.15) for s in unspecified_sections)

        for section in unspecified_sections:
            weight = section_weights.get(section, 0.15)
            proportion = weight / total_weight
            durations[section] = int(remaining_time * proportion)

    return durations


def _determine_mix_params(style: Dict[str, Any], sds_mix: Dict[str, Any]) -> Dict[str, Any]:
    """Determine mix parameters based on style and user preferences.

    Args:
        style: Style specification
        sds_mix: User-provided mix preferences

    Returns:
        Complete mix parameters
    """
    # LUFS target
    genre = style["genre_detail"]["primary"]
    default_lufs = -12.0  # Modern streaming standard

    # Adjust for genre
    if genre in ["Electronic", "Hip-Hop"]:
        default_lufs = -10.0  # Louder
    elif genre in ["Jazz", "Classical"]:
        default_lufs = -15.0  # More dynamic range

    lufs = sds_mix.get("lufs", default_lufs)

    # Space/reverb
    mood = style.get("mood", [])
    default_space = "normal"

    if "intimate" in mood:
        default_space = "dry"
    elif "epic" in mood or style.get("energy") == "anthemic":
        default_space = "lush"
    elif "vintage" in mood:
        default_space = "vintage tape"

    space = sds_mix.get("space", default_space)

    # Stereo width
    energy = style.get("energy", "medium")
    default_width = "normal"

    if energy == "anthemic":
        default_width = "wide"
    elif "intimate" in mood:
        default_width = "narrow"

    stereo_width = sds_mix.get("stereo_width", default_width)

    return {
        "lufs": lufs,
        "space": space,
        "stereo_width": stereo_width,
    }


@workflow_skill(
    name="amcs.producer.generate",
    deterministic=True,
    default_temperature=0.2,
)
async def generate_producer_notes(
    inputs: Dict[str, Any], context: WorkflowContext
) -> Dict[str, Any]:
    """Generate production notes from SDS producer entity, plan, and style.

    Creates arrangement structure, hook placement, instrumentation details,
    per-section dynamics, and mix parameters.

    Args:
        inputs: Dictionary containing:
            - sds_producer: Producer notes entity from SDS
            - plan: Execution plan with section structure
            - style: Musical style for alignment
        context: Workflow context with seed and run metadata

    Returns:
        Dictionary containing:
            - producer_notes: Complete production specification
    """
    sds_producer = inputs["sds_producer"]
    plan = inputs["plan"]
    style = inputs["style"]

    logger.info(
        "producer.generate.start",
        run_id=str(context.run_id),
        sections=len(plan["section_order"]),
    )

    # Step 1: Build structure string
    section_order = plan["section_order"]
    structure = "–".join(section_order)

    # Step 2: Determine hook count
    hooks = sds_producer.get("hooks", 1)

    # Calculate recommended hooks based on chorus count
    chorus_count = sum(1 for s in section_order if "chorus" in s.lower())
    recommended_hooks = max(1, int(chorus_count * 1.5))

    if hooks < recommended_hooks:
        logger.info(
            "producer.hooks.recommendation",
            user_hooks=hooks,
            recommended=recommended_hooks,
            chorus_count=chorus_count,
        )
        hooks = recommended_hooks

    # Warn if no hooks for hook-dependent genres
    if hooks < 1:
        genre = style["genre_detail"]["primary"]
        if genre in ["Pop", "Hip-Hop", "Christmas Pop"]:
            logger.warning(
                "producer.hooks.warning",
                genre=genre,
                hooks=hooks,
                message="Genre typically requires ≥1 hook for memorability",
            )

    # Step 3: Expand instrumentation
    instrumentation = style.get("instrumentation", []).copy()
    additional_instruments = sds_producer.get("instrumentation", [])

    # Merge and deduplicate
    for inst in additional_instruments:
        if inst not in instrumentation:
            instrumentation.append(inst)

    # Step 4: Generate per-section metadata
    section_meta = {}
    sds_section_meta = sds_producer.get("section_meta", {})

    # Calculate durations
    total_duration = 180  # Default 3 minutes (TODO: get from SDS constraints)
    section_durations = _calculate_section_durations(
        section_order, total_duration, sds_section_meta
    )

    for section in section_order:
        # Get production tags
        tags = _get_section_tags(section, style)

        # Merge with user-provided tags
        if section in sds_section_meta and "tags" in sds_section_meta[section]:
            user_tags = sds_section_meta[section]["tags"]
            for tag in user_tags:
                if tag not in tags:
                    tags.append(tag)

        # Get duration
        duration = section_durations.get(section, 20)

        section_meta[section] = {
            "tags": tags,
            "target_duration_sec": duration,
        }

    # Step 5: Define mix parameters
    sds_mix = sds_producer.get("mix", {})
    mix_params = _determine_mix_params(style, sds_mix)

    # Step 6: Assemble producer notes
    producer_notes = {
        "structure": structure,
        "hooks": hooks,
        "instrumentation": instrumentation,
        "section_meta": section_meta,
        "mix": mix_params,
        "_hash": "",  # Will be computed after assembly
        "_total_duration": sum(section_durations.values()),
    }

    # Validate total duration
    duration_diff = abs(producer_notes["_total_duration"] - total_duration)
    if duration_diff > 30:
        logger.warning(
            "producer.duration.mismatch",
            calculated=producer_notes["_total_duration"],
            target=total_duration,
            diff=duration_diff,
        )

    # Compute hash for provenance
    producer_notes["_hash"] = compute_hash(producer_notes)

    logger.info(
        "producer.generate.complete",
        run_id=str(context.run_id),
        structure=structure,
        hooks=hooks,
        total_duration=producer_notes["_total_duration"],
        hash=producer_notes["_hash"][:16],
    )

    return {"producer_notes": producer_notes}
