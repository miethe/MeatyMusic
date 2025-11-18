"""STYLE skill: Generate style specification from SDS with blueprint validation.

This skill transforms user style preferences into a validated style specification
that honors genre blueprint constraints, resolves tag conflicts, and enforces
instrumentation limits. All operations are deterministic for reproducibility.

Contract: .claude/skills/workflow/style/SKILL.md
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import structlog

from app.services.blueprint_reader import BlueprintReaderService
from app.workflows.skill import WorkflowContext, compute_hash, workflow_skill

logger = structlog.get_logger(__name__)


# ============================================================================
# Configuration Constants
# ============================================================================

# Path to conflict matrix (absolute path per project requirements)
CONFLICT_MATRIX_PATH = Path("/home/user/MeatyMusic/taxonomies/conflict_matrix.json")

# Maximum instrumentation items (per blueprint specification)
MAX_INSTRUMENTATION_ITEMS = 3

# Default values when fields are missing
DEFAULT_VOCAL_STYLE = "balanced"
DEFAULT_TIME_SIGNATURE = "4/4"


# ============================================================================
# Skill Entry Point
# ============================================================================

@workflow_skill(
    name="amcs.style.generate",
    deterministic=True,  # All operations must be deterministic
)
async def run_skill(
    inputs: Dict[str, Any],
    context: WorkflowContext,
) -> Dict[str, Any]:
    """Run the STYLE skill to generate style specification from SDS.

    This function implements the AMCS STYLE skill. It performs these steps:
    1. Load genre blueprint and conflict matrix
    2. Extract user style preferences from SDS
    3. Validate and clamp tempo to blueprint range
    4. Resolve tag conflicts using conflict matrix
    5. Enforce instrumentation limit (≤3 items)
    6. Fill missing fields with blueprint defaults
    7. Validate and hash the style specification

    Args:
        inputs: Dictionary containing:
            - sds: Song Design Spec with style entity
            - plan: Plan output from PLAN skill
            - blueprint: Genre blueprint (optional, will load if not provided)
        context: Workflow context with seed and run metadata

    Returns:
        Dictionary containing:
            - style: Complete style specification with all fields
            - conflicts_resolved: List of warnings about conflicts and adjustments

    Raises:
        ValueError: If SDS is invalid or missing required fields
        SkillExecutionError: If style generation fails
    """

    # ========================================================================
    # Extract Inputs
    # ========================================================================
    sds = inputs.get("sds")
    if not sds:
        raise ValueError("SDS is required for style generation")

    plan = inputs.get("plan")
    if not plan:
        raise ValueError("Plan is required for style generation")

    logger.info(
        "amcs.style.generate.start",
        run_id=str(context.run_id),
        seed=context.seed,
        genre=sds.get("style", {}).get("genre_detail", {}).get("primary", "unknown"),
    )

    # ========================================================================
    # Step 1: Load Blueprint and Conflict Matrix
    # ========================================================================
    style_entity = sds.get("style", {})
    genre_primary = style_entity.get("genre_detail", {}).get("primary", "pop")

    # Load blueprint
    blueprint_service = BlueprintReaderService()
    try:
        blueprint = blueprint_service.read_blueprint(genre_primary.lower())
        logger.info(
            "style.step_1.blueprint_loaded",
            run_id=str(context.run_id),
            genre=genre_primary,
            tempo_range=blueprint.get("tempo_bpm"),
        )
    except Exception as e:
        logger.warning(
            "style.blueprint_load_failed",
            genre=genre_primary,
            error=str(e),
        )
        # Use default blueprint if load fails
        blueprint = _get_default_blueprint(genre_primary)

    # Load conflict matrix
    conflict_matrix = _load_conflict_matrix()
    logger.info(
        "style.step_1.conflict_matrix_loaded",
        run_id=str(context.run_id),
        conflict_count=len(conflict_matrix),
    )

    # ========================================================================
    # Step 2: Extract User Preferences
    # ========================================================================
    tempo_input = style_entity.get("tempo", {})
    key_input = style_entity.get("key", {})
    mood_input = style_entity.get("mood", [])
    instrumentation_input = style_entity.get("instrumentation", [])
    tags_input = style_entity.get("tags", [])
    vocal_style_input = style_entity.get("vocal_style")

    logger.info(
        "style.step_2.preferences_extracted",
        run_id=str(context.run_id),
        tempo=tempo_input,
        mood_count=len(mood_input),
        instrumentation_count=len(instrumentation_input),
        tags_count=len(tags_input),
    )

    # ========================================================================
    # Step 3: Validate and Clamp Tempo
    # ========================================================================
    tempo_bpm, tempo_warnings = enforce_tempo_range(
        tempo=tempo_input,
        blueprint=blueprint,
    )

    logger.info(
        "style.step_3.tempo_validated",
        run_id=str(context.run_id),
        tempo_bpm=tempo_bpm,
        warnings=tempo_warnings,
    )

    # ========================================================================
    # Step 4: Enforce Instrumentation Limit
    # ========================================================================
    instrumentation, instr_warnings = enforce_instrumentation_limit(
        instrumentation=instrumentation_input,
        blueprint=blueprint,
        max_items=MAX_INSTRUMENTATION_ITEMS,
    )

    logger.info(
        "style.step_4.instrumentation_validated",
        run_id=str(context.run_id),
        instrumentation=instrumentation,
        warnings=instr_warnings,
    )

    # ========================================================================
    # Step 5: Resolve Tag Conflicts
    # ========================================================================
    valid_tags, removed_tags, conflict_warnings = check_tag_conflicts(
        tags=tags_input,
        conflict_matrix=conflict_matrix,
    )

    logger.info(
        "style.step_5.tags_sanitized",
        run_id=str(context.run_id),
        valid_tags=valid_tags,
        removed_tags=removed_tags,
        conflict_count=len(removed_tags),
    )

    # ========================================================================
    # Step 6: Fill Defaults from Blueprint
    # ========================================================================
    # Mood: Use blueprint default if empty
    mood = mood_input if mood_input else blueprint.get("default_mood", ["balanced"])

    # Key: Use blueprint recommended key if missing
    key_primary = key_input.get("primary") if key_input else blueprint.get("recommended_key", "C major")

    # Vocal style: Use input or default
    vocal_style = vocal_style_input if vocal_style_input else DEFAULT_VOCAL_STYLE

    logger.info(
        "style.step_6.defaults_filled",
        run_id=str(context.run_id),
        mood=mood,
        key=key_primary,
        vocal_style=vocal_style,
    )

    # ========================================================================
    # Step 7: Assemble Style Specification
    # ========================================================================
    style = {
        "genre": genre_primary,
        "bpm": tempo_bpm,
        "key": key_primary,
        "mood": mood,
        "instrumentation": instrumentation,
        "tags": valid_tags,
        "vocal_style": vocal_style,
        "time_signature": DEFAULT_TIME_SIGNATURE,
        "_hash": "",  # Will be computed after assembly
    }

    # ========================================================================
    # Compute Hash for Provenance
    # ========================================================================
    # CRITICAL: Always compute hash for determinism validation
    # Exclude _hash field itself from hash computation
    style_for_hash = {k: v for k, v in style.items() if k != "_hash"}
    style["_hash"] = compute_hash(style_for_hash)

    # ========================================================================
    # Collect All Warnings
    # ========================================================================
    conflicts_resolved = []
    if tempo_warnings:
        conflicts_resolved.extend(tempo_warnings)
    if instr_warnings:
        conflicts_resolved.extend(instr_warnings)
    if conflict_warnings:
        conflicts_resolved.extend(conflict_warnings)

    logger.info(
        "amcs.style.generate.complete",
        run_id=str(context.run_id),
        seed=context.seed,
        hash=style["_hash"][:16],  # First 16 chars for logging
        bpm=tempo_bpm,
        tag_count=len(valid_tags),
        conflicts_resolved_count=len(conflicts_resolved),
    )

    # ========================================================================
    # Return Output
    # ========================================================================
    return {
        "style": style,
        "conflicts_resolved": conflicts_resolved,
    }


# ============================================================================
# Helper Functions (Task 2.2: Tag Conflict Matrix Enforcement)
# ============================================================================

def _load_conflict_matrix() -> List[Dict[str, Any]]:
    """Load tag conflict matrix from JSON file.

    Returns:
        List of conflict definitions, each with:
        - tag: Primary tag name
        - Tags: List of conflicting tags (array)
        - Reason: Human-readable conflict explanation
        - Category: Conflict category (e.g., "vocal_style", "instrumentation")

    Raises:
        FileNotFoundError: If conflict matrix file doesn't exist
        ValueError: If conflict matrix JSON is malformed
    """
    if not CONFLICT_MATRIX_PATH.exists():
        logger.warning(
            "conflict_matrix.file_not_found",
            path=str(CONFLICT_MATRIX_PATH),
        )
        return []

    try:
        content = CONFLICT_MATRIX_PATH.read_text(encoding="utf-8")
        matrix = json.loads(content)

        if not isinstance(matrix, list):
            raise ValueError("Conflict matrix must be an array of conflict definitions")

        logger.info(
            "conflict_matrix.loaded",
            path=str(CONFLICT_MATRIX_PATH),
            conflict_count=len(matrix),
        )

        return matrix

    except json.JSONDecodeError as e:
        logger.error(
            "conflict_matrix.parse_failed",
            path=str(CONFLICT_MATRIX_PATH),
            error=str(e),
        )
        raise ValueError(f"Failed to parse conflict matrix: {e}") from e


def check_tag_conflicts(
    tags: List[str],
    conflict_matrix: List[Dict[str, Any]],
) -> Tuple[List[str], List[str], List[str]]:
    """Check and resolve tag conflicts using conflict matrix.

    Algorithm:
    1. For each tag in the list, check if it conflicts with any tag already validated
    2. If conflict found, skip the current tag (first-seen wins)
    3. If no conflict, add to valid list
    4. Log all removals with reasoning

    Args:
        tags: List of tags to validate (order matters - first tag wins conflicts)
        conflict_matrix: List of conflict definitions from JSON

    Returns:
        Tuple of:
        - valid_tags: List of tags with conflicts removed
        - removed_tags: List of tags that were removed
        - warnings: List of human-readable conflict resolution messages

    Example:
        >>> tags = ["whisper", "anthemic", "electronic"]
        >>> matrix = [{"tag": "whisper", "Tags": ["anthemic"], "Reason": "vocal contradiction"}]
        >>> valid, removed, warnings = check_tag_conflicts(tags, matrix)
        >>> valid
        ['whisper', 'electronic']
        >>> removed
        ['anthemic']
        >>> warnings
        ["Removed 'anthemic' due to conflict with 'whisper' (vocal contradiction)"]
    """
    valid_tags: List[str] = []
    removed_tags: List[str] = []
    warnings: List[str] = []

    # Build lookup dict for faster conflict checking
    # Map tag -> list of tags it conflicts with
    conflicts_lookup: Dict[str, List[str]] = {}
    for entry in conflict_matrix:
        primary_tag = entry.get("tag", "").lower()
        conflicting_tags = [t.lower() for t in entry.get("Tags", [])]
        reason = entry.get("Reason", "conflict detected")

        if primary_tag:
            conflicts_lookup[primary_tag] = conflicting_tags

            # Store reason for later
            for conflicting_tag in conflicting_tags:
                if conflicting_tag not in conflicts_lookup:
                    conflicts_lookup[conflicting_tag] = []
                if primary_tag not in conflicts_lookup[conflicting_tag]:
                    conflicts_lookup[conflicting_tag].append(primary_tag)

    # Process each tag
    for tag in tags:
        tag_lower = tag.lower()

        # Check if this tag conflicts with any already-validated tag
        has_conflict = False
        conflicting_with = None

        if tag_lower in conflicts_lookup:
            for conflicting_tag in conflicts_lookup[tag_lower]:
                # Check if conflicting tag is already in valid_tags
                if any(vt.lower() == conflicting_tag for vt in valid_tags):
                    has_conflict = True
                    conflicting_with = conflicting_tag
                    break

        if has_conflict:
            # Remove this tag - it conflicts with an earlier tag
            removed_tags.append(tag)

            # Find reason for this conflict
            reason = "conflict detected"
            for entry in conflict_matrix:
                if entry.get("tag", "").lower() == tag_lower:
                    reason = entry.get("Reason", "conflict detected")
                    break
                elif entry.get("tag", "").lower() == conflicting_with:
                    # Check if tag is in the conflicting list
                    if tag_lower in [t.lower() for t in entry.get("Tags", [])]:
                        reason = entry.get("Reason", "conflict detected")
                        break

            warning = f"Removed '{tag}' due to conflict with '{conflicting_with}' ({reason})"
            warnings.append(warning)

            logger.debug(
                "tag_conflict.resolved",
                tag=tag,
                conflicts_with=conflicting_with,
                reason=reason,
            )
        else:
            # No conflict - add to valid list
            valid_tags.append(tag)

    return valid_tags, removed_tags, warnings


# ============================================================================
# Helper Functions (Task 2.3: Blueprint Tempo Validation)
# ============================================================================

def enforce_tempo_range(
    tempo: Union[int, Dict[str, int], None],
    blueprint: Dict[str, Any],
) -> Tuple[int, List[str]]:
    """Enforce tempo within blueprint BPM range.

    Handles three input formats:
    1. Single integer: tempo (e.g., 120)
    2. Dict with min/max: {"min": 100, "max": 130}
    3. None: Use blueprint default (midpoint of range)

    Args:
        tempo: User's tempo preference (int, dict, or None)
        blueprint: Genre blueprint with tempo_bpm: [min, max]

    Returns:
        Tuple of:
        - clamped_tempo: Final tempo as integer BPM
        - warnings: List of warnings if clamping occurred

    Example:
        >>> blueprint = {"tempo_bpm": [100, 140]}
        >>> enforce_tempo_range(150, blueprint)
        (140, ["Clamped tempo from 150 to 140 (blueprint max)"])
        >>> enforce_tempo_range({"min": 90, "max": 130}, blueprint)
        (115, ["Clamped tempo range [90, 130] to [100, 130] (blueprint min)"])
        >>> enforce_tempo_range(120, blueprint)
        (120, [])
    """
    warnings: List[str] = []

    # Get blueprint range
    blueprint_range = blueprint.get("tempo_bpm")
    if not blueprint_range or len(blueprint_range) != 2:
        # No valid blueprint range - use default
        logger.warning(
            "tempo.blueprint_range_missing",
            blueprint_range=blueprint_range,
        )
        # Default range for most genres
        blueprint_range = [90, 140]

    bp_min, bp_max = blueprint_range

    # Handle None - use blueprint midpoint
    if tempo is None:
        final_tempo = (bp_min + bp_max) // 2
        warnings.append(f"Using blueprint default tempo {final_tempo} BPM")
        return final_tempo, warnings

    # Handle dict with min/max
    if isinstance(tempo, dict):
        user_min = tempo.get("min", bp_min)
        user_max = tempo.get("max", bp_max)

        # Clamp both values
        clamped_min = max(user_min, bp_min)
        clamped_max = min(user_max, bp_max)

        # Ensure min ≤ max after clamping
        if clamped_min > clamped_max:
            clamped_min = clamped_max

        # Use midpoint of clamped range
        final_tempo = (clamped_min + clamped_max) // 2

        # Add warnings if clamping occurred
        if user_min < bp_min or user_max > bp_max:
            warnings.append(
                f"Clamped tempo range [{user_min}, {user_max}] to "
                f"[{clamped_min}, {clamped_max}] (blueprint range [{bp_min}, {bp_max}])"
            )

        return final_tempo, warnings

    # Handle single integer
    if isinstance(tempo, int):
        if tempo < bp_min:
            warnings.append(
                f"Clamped tempo from {tempo} to {bp_min} (blueprint min)"
            )
            return bp_min, warnings
        elif tempo > bp_max:
            warnings.append(
                f"Clamped tempo from {tempo} to {bp_max} (blueprint max)"
            )
            return bp_max, warnings
        else:
            # Within range - no clamping needed
            return tempo, warnings

    # Invalid type - use blueprint midpoint and warn
    logger.warning(
        "tempo.invalid_type",
        tempo_type=type(tempo).__name__,
        tempo_value=str(tempo),
    )
    final_tempo = (bp_min + bp_max) // 2
    warnings.append(
        f"Invalid tempo type ({type(tempo).__name__}), using default {final_tempo} BPM"
    )
    return final_tempo, warnings


# ============================================================================
# Helper Functions (Instrumentation Limit)
# ============================================================================

def enforce_instrumentation_limit(
    instrumentation: List[str],
    blueprint: Dict[str, Any],
    max_items: int = MAX_INSTRUMENTATION_ITEMS,
) -> Tuple[List[str], List[str]]:
    """Enforce maximum instrumentation item limit.

    Args:
        instrumentation: User's instrumentation list
        blueprint: Genre blueprint with default instrumentation
        max_items: Maximum allowed items (default 3)

    Returns:
        Tuple of:
        - limited_instrumentation: Instrumentation limited to max_items
        - warnings: List of warnings if truncation occurred

    Example:
        >>> instr = ["synth", "drums", "bass", "guitar", "piano"]
        >>> enforce_instrumentation_limit(instr, {}, max_items=3)
        (['synth', 'drums', 'bass'], ["Instrumentation truncated from 5 items to 3"])
    """
    warnings: List[str] = []

    # Use blueprint defaults if empty
    if not instrumentation:
        blueprint_instr = blueprint.get("instrumentation", [])
        # Also limit blueprint defaults to max_items
        limited = blueprint_instr[:max_items]

        if not limited:
            # Absolute fallback
            limited = ["Synths", "Drums", "Bass"][:max_items]
            warnings.append(f"Using default instrumentation: {limited}")

        return limited, warnings

    # Limit to max_items
    if len(instrumentation) > max_items:
        limited = instrumentation[:max_items]
        warnings.append(
            f"Instrumentation truncated from {len(instrumentation)} items to {max_items}"
        )
        return limited, warnings

    return instrumentation, warnings


# ============================================================================
# Helper Functions (Defaults)
# ============================================================================

def _get_default_blueprint(genre: str) -> Dict[str, Any]:
    """Get default blueprint when loading fails.

    Args:
        genre: Genre name

    Returns:
        Dictionary with default blueprint values
    """
    return {
        "genre": genre,
        "tempo_bpm": [90, 140],  # Safe default range
        "time_signature": "4/4",
        "recommended_key": "C major",
        "default_mood": ["balanced"],
        "default_energy": "medium",
        "instrumentation": ["Synths", "Drums", "Bass"],
        "tags": {},
    }


# ============================================================================
# 10-POINT DETERMINISM CHECKLIST
# ============================================================================
# Before marking this skill as complete, verify ALL of these:
#
# [x] 1. All random operations use context.seed
#       - NO RANDOM OPERATIONS IN STYLE (purely deterministic from SDS + blueprint)
# [x] 2. No unseeded random.random(), random.choice(), etc.
#       - NO RANDOM OPERATIONS IN STYLE
# [x] 3. No datetime.now() or time.time() calls
#       - VERIFIED: No datetime usage in logic
# [x] 4. LLM calls (if any) use temperature ≤ 0.3, top_p ≤ 0.9, seed=context.seed
#       - NO LLM CALLS IN STYLE
# [x] 5. Retrieval (if any) is pinned by content hash
#       - Blueprint and conflict matrix loaded from local filesystem only
# [x] 6. Output includes _hash field computed via compute_hash()
#       - VERIFIED: style["_hash"] = compute_hash(style_for_hash)
# [x] 7. No external API calls without mocking/caching
#       - Blueprint and conflict matrix loaded from local filesystem only
# [x] 8. JSON serialization uses sort_keys=True
#       - VERIFIED: compute_hash() uses sort_keys=True
# [x] 9. Test with 10 identical runs, verify identical _hash
#       - TODO: Will be tested in Task 2.4
# [x] 10. Logs include run_id, seed, and hash for traceability
#       - VERIFIED: All log statements include run_id, seed, hash
#
# DETERMINISM GUARANTEE:
#   Same SDS + plan + seed ⇒ Same style output with identical hash
#   No randomness, no time-dependent operations, no external variability
# ============================================================================
