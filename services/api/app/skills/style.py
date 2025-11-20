"""STYLE skill: Generate detailed style specification from SDS.

This skill creates a complete musical style specification that defines genre,
tempo, key, mood, energy, instrumentation, and tags while enforcing blueprint
constraints and resolving tag conflicts.

Contract: .claude/skills/workflow/style/SKILL.md
"""

from typing import Any, Dict, List, Tuple
from uuid import UUID

import structlog

from app.workflows.skill import WorkflowContext, compute_hash, workflow_skill
from app.repositories.blueprint_repo import BlueprintRepository
from app.core.security import SecurityContext

logger = structlog.get_logger(__name__)

# System UUID for accessing system-level blueprints
SYSTEM_UUID = UUID('00000000-0000-0000-0000-000000000000')


# Fallback tempo ranges if blueprint not found
DEFAULT_TEMPO_RANGES = {
    "Pop": (100, 140),
    "Christmas Pop": (100, 140),
    "Hip-Hop": (60, 100),
    "Rock": (110, 160),
    "Electronic": (120, 140),
    "Country": (80, 130),
    "R&B": (60, 90),
    "Jazz": (80, 180),
}

# Fallback tag conflict matrix (TODO: Load from blueprints or taxonomies)
DEFAULT_TAG_CONFLICTS = {
    ("whisper", "anthemic"),
    ("dry mix", "lush reverb"),
    ("1970s", "2020s modern production"),
    ("intimate", "anthemic"),
    ("minimal", "full instrumentation"),
}


def _load_blueprint(genre: str, context: WorkflowContext):
    """Load blueprint from database for the specified genre.

    Args:
        genre: Genre name (e.g., "pop", "hip-hop")
        context: Workflow context with database session

    Returns:
        Blueprint entity or None if not found
    """
    try:
        # Get database session from context
        db_session = context.get_db_session()

        if not db_session:
            logger.warning("style.no_db_session", genre=genre)
            return None

        # Create repository with system security context to access system blueprints
        security_context = SecurityContext(user_id=SYSTEM_UUID, tenant_id=SYSTEM_UUID)
        blueprint_repo = BlueprintRepository(
            db=db_session,
            security_context=security_context
        )

        # Get blueprints for genre
        blueprints = blueprint_repo.get_by_genre(genre)

        if not blueprints:
            logger.warning("style.blueprint_not_found", genre=genre)
            return None

        # Return latest version (first in list)
        return blueprints[0]

    except Exception as e:
        logger.error(
            "style.blueprint_load_failed",
            genre=genre,
            error=str(e),
            exc_info=True
        )
        return None


def _check_tag_conflicts(tags: List[str], conflict_matrix: Dict = None) -> List[Tuple[str, str]]:
    """Check for conflicting tags using blueprint conflict matrix.

    Args:
        tags: List of tags to check
        conflict_matrix: Conflict matrix from blueprint (optional)

    Returns:
        List of conflicting tag pairs
    """
    # Use provided conflict matrix or fallback to defaults
    if not conflict_matrix:
        conflict_set = DEFAULT_TAG_CONFLICTS
        conflicts = []
        for i, tag1 in enumerate(tags):
            for tag2 in tags[i + 1 :]:
                # Normalize for comparison
                t1_norm = tag1.lower()
                t2_norm = tag2.lower()

                # Check exact matches
                if (t1_norm, t2_norm) in conflict_set or (t2_norm, t1_norm) in conflict_set:
                    conflicts.append((tag1, tag2))

                # Check substring matches
                for conflict_pair in conflict_set:
                    if (conflict_pair[0] in t1_norm and conflict_pair[1] in t2_norm) or (
                        conflict_pair[1] in t1_norm and conflict_pair[0] in t2_norm
                    ):
                        conflicts.append((tag1, tag2))

        return conflicts

    # Use blueprint conflict matrix (dict format: {tag: [conflicting_tags]})
    conflicts = []
    for i, tag1 in enumerate(tags):
        for tag2 in tags[i + 1:]:
            t1_lower = tag1.lower()
            t2_lower = tag2.lower()

            # Check if tag1 has tag2 in its conflicts
            if t1_lower in conflict_matrix:
                conflicting = [c.lower() for c in conflict_matrix[t1_lower]]
                if t2_lower in conflicting:
                    conflicts.append((tag1, tag2))
                    continue

            # Check if tag2 has tag1 in its conflicts
            if t2_lower in conflict_matrix:
                conflicting = [c.lower() for c in conflict_matrix[t2_lower]]
                if t1_lower in conflicting:
                    conflicts.append((tag1, tag2))

    return conflicts


def _validate_tempo_range(
    tempo_bpm: Any, blueprint_range: Tuple[int, int], energy: str
) -> Any:
    """Validate and clamp tempo to blueprint range."""
    bp_min, bp_max = blueprint_range

    if isinstance(tempo_bpm, int):
        # Single BPM value
        if tempo_bpm < bp_min:
            logger.warning(
                "tempo.clamped",
                original=tempo_bpm,
                clamped=bp_min,
                reason="below blueprint minimum",
            )
            return bp_min
        elif tempo_bpm > bp_max:
            logger.warning(
                "tempo.clamped",
                original=tempo_bpm,
                clamped=bp_max,
                reason="above blueprint maximum",
            )
            return bp_max
        else:
            return tempo_bpm
    else:
        # BPM range [min, max]
        min_bpm, max_bpm = tempo_bpm
        clamped_min = max(min_bpm, bp_min)
        clamped_max = min(max_bpm, bp_max)

        if clamped_min != min_bpm or clamped_max != max_bpm:
            logger.warning(
                "tempo.range_clamped",
                original=[min_bpm, max_bpm],
                clamped=[clamped_min, clamped_max],
            )

        return [clamped_min, clamped_max]


def _validate_energy_tempo_alignment(energy: str, tempo_bpm: Any) -> List[str]:
    """Check energy level matches tempo."""
    issues = []

    # Get effective tempo
    if isinstance(tempo_bpm, int):
        effective_tempo = tempo_bpm
    else:
        # Use midpoint of range
        effective_tempo = sum(tempo_bpm) // 2

    # Energy constraints
    if energy == "anthemic" and effective_tempo < 100:
        issues.append(f"Energy 'anthemic' requires ≥100 BPM, got {effective_tempo}")
    elif energy == "low" and effective_tempo > 90:
        issues.append(f"Energy 'low' requires ≤90 BPM, got {effective_tempo}")

    return issues


@workflow_skill(
    name="amcs.style.generate",
    deterministic=True,
    default_temperature=0.2,
)
async def generate_style(
    inputs: Dict[str, Any], context: WorkflowContext
) -> Dict[str, Any]:
    """Generate style specification from SDS style entity and plan.

    Enforces blueprint tempo ranges, resolves tag conflicts, and maximizes
    information density with minimal tags.

    Args:
        inputs: Dictionary containing:
            - sds_style: Style entity from SDS
            - plan: Execution plan with section structure
        context: Workflow context with seed and run metadata

    Returns:
        Dictionary containing:
            - style: Complete style specification
    """
    sds_style = inputs["sds_style"]
    plan = inputs.get("plan", {})

    # Step 1: Validate and normalize genre
    primary_genre = sds_style["genre_detail"]["primary"]
    subgenres = sds_style["genre_detail"].get("subgenres", [])
    fusions = sds_style["genre_detail"].get("fusions", [])

    logger.info(
        "style.generate.start",
        run_id=str(context.run_id),
        genre=primary_genre,
    )

    # Step 2: Load blueprint from database
    blueprint = _load_blueprint(primary_genre, context)

    # Extract tempo range from blueprint
    if blueprint and blueprint.rules.get("tempo_bpm"):
        tempo_range = blueprint.rules["tempo_bpm"]
        blueprint_range = tuple(tempo_range)
        logger.info(
            "style.blueprint_tempo_loaded",
            genre=primary_genre,
            tempo_range=blueprint_range
        )
    else:
        # Fallback to default tempo ranges
        blueprint_range = DEFAULT_TEMPO_RANGES.get(primary_genre, (60, 180))
        logger.warning(
            "style.using_default_tempo",
            genre=primary_genre,
            tempo_range=blueprint_range
        )

    # Step 3: Enforce tempo range
    tempo_bpm = _validate_tempo_range(
        sds_style["tempo_bpm"], blueprint_range, sds_style.get("energy", "medium")
    )

    # Step 4: Validate energy-tempo alignment
    energy_issues = _validate_energy_tempo_alignment(
        sds_style.get("energy", "medium"), tempo_bpm
    )
    if energy_issues:
        for issue in energy_issues:
            logger.warning("style.energy_mismatch", issue=issue)

    # Step 5: Select and validate tags
    tags = sds_style.get("tags", [])

    # Limit instrumentation to 3
    instrumentation = sds_style.get("instrumentation", [])
    dropped_instruments = []
    if len(instrumentation) > 3:
        dropped_instruments = instrumentation[3:]
        instrumentation = instrumentation[:3]
        logger.warning(
            "style.instrumentation_limited",
            dropped=dropped_instruments,
            kept=instrumentation,
        )

    # Step 6: Resolve tag conflicts using blueprint conflict matrix
    all_tags = tags + [f"Instr:{inst}" for inst in instrumentation]

    # Get conflict matrix from blueprint
    conflict_matrix = None
    if blueprint and blueprint.conflict_matrix:
        conflict_matrix = blueprint.conflict_matrix

    conflicts = _check_tag_conflicts(all_tags, conflict_matrix)
    dropped_tags = []

    if conflicts:
        # Simple resolution: keep first tag, drop second
        for tag1, tag2 in conflicts:
            if tag2 in all_tags:
                all_tags.remove(tag2)
                dropped_tags.append({"tag": tag2, "reason": f"conflicts with {tag1}"})
                logger.warning("style.tag_conflict", dropped=tag2, conflicted_with=tag1)

    # Filter instrumentation tags back out
    final_tags = [t for t in all_tags if not t.startswith("Instr:")]

    # Step 7: Assemble complete style
    style = {
        "genre_detail": {
            "primary": primary_genre,
            "subgenres": subgenres,
            "fusions": fusions,
        },
        "tempo_bpm": tempo_bpm,
        "time_signature": sds_style.get("time_signature", "4/4"),
        "key": sds_style["key"],
        "mood": sds_style["mood"],
        "energy": sds_style.get("energy", "medium"),
        "instrumentation": instrumentation,
        "vocal_profile": sds_style.get("vocal_profile", ""),
        "tags": final_tags,
        "negative_tags": sds_style.get("negative_tags", []),
        "_hash": "",  # Will be computed after assembly
        "_dropped_tags": dropped_tags,
        "_dropped_instruments": [
            {"instrument": inst, "reason": "exceeds 3 instrument limit"}
            for inst in dropped_instruments
        ],
    }

    # Compute hash for provenance
    style["_hash"] = compute_hash(style)

    logger.info(
        "style.generate.complete",
        run_id=str(context.run_id),
        genre=primary_genre,
        tempo=tempo_bpm,
        tag_count=len(final_tags),
        dropped_tags=len(dropped_tags),
        hash=style["_hash"][:16],
    )

    return {"style": style}
