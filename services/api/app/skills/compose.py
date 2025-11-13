"""COMPOSE skill: Merge artifacts into render-ready composed prompt.

This skill assembles validated style specifications, lyrics, and production
notes into a single render-ready prompt that adheres to engine-specific
character limits, tag formatting, and policy constraints.

Contract: .claude/skills/workflow/compose/SKILL.md
"""

import re
from typing import Any, Dict, List, Set, Tuple

import structlog

from app.workflows.skill import WorkflowContext, compute_hash, workflow_skill

logger = structlog.get_logger(__name__)


# Mock living artist list (TODO: Load from comprehensive database)
LIVING_ARTISTS = {
    "drake",
    "taylor swift",
    "ed sheeran",
    "billie eilish",
    "ariana grande",
    "post malone",
    "the weeknd",
}

# Generic influence mapping
ARTIST_TO_GENRE = {
    "drake": "contemporary hip-hop",
    "taylor swift": "contemporary pop",
    "ed sheeran": "contemporary singer-songwriter",
    "billie eilish": "alternative pop",
    "ariana grande": "contemporary R&B pop",
    "post malone": "melodic hip-hop",
    "the weeknd": "contemporary R&B",
}


def _normalize_living_artists(text: str, policy_strict: bool = True) -> Tuple[str, List[str]]:
    """Normalize living artist references to generic influences.

    Args:
        text: Input text potentially containing artist names
        policy_strict: Whether to enforce strict policy (public release)

    Returns:
        Tuple of (normalized_text, list_of_replacements)
    """
    if not policy_strict:
        return text, []

    normalized = text
    replacements = []

    for artist in LIVING_ARTISTS:
        # Check for "style of <artist>" or similar patterns
        patterns = [
            f"style of {artist}",
            f"like {artist}",
            f"{artist}-style",
            f"{artist} style",
        ]

        for pattern in patterns:
            if pattern in normalized.lower():
                # Replace with generic genre
                generic = ARTIST_TO_GENRE.get(artist, "contemporary artist")
                normalized = re.sub(
                    re.escape(pattern),
                    generic,
                    normalized,
                    flags=re.IGNORECASE,
                )
                replacements.append(f"{artist} → {generic}")

    return normalized, replacements


def _resolve_tag_conflicts(
    all_tags: List[str],
) -> Tuple[List[str], List[Tuple[str, str]]]:
    """Resolve tag conflicts by removing conflicting pairs.

    Args:
        all_tags: List of all tags from style and sections

    Returns:
        Tuple of (resolved_tags, list_of_conflicts)
    """
    # Simple conflict detection (TODO: Use taxonomies/tag_conflict_matrix.json)
    conflicts = [
        ("whisper", "anthemic"),
        ("dry", "lush"),
        ("intimate", "anthemic"),
        ("minimal", "full instrumentation"),
    ]

    resolved_tags = all_tags.copy()
    detected_conflicts = []

    for tag1_pattern, tag2_pattern in conflicts:
        # Find matching tags
        matching_tag1 = None
        matching_tag2 = None

        for tag in resolved_tags:
            if tag1_pattern.lower() in tag.lower():
                matching_tag1 = tag
            if tag2_pattern.lower() in tag.lower():
                matching_tag2 = tag

        # If both present, drop the second one
        if matching_tag1 and matching_tag2:
            resolved_tags.remove(matching_tag2)
            detected_conflicts.append((matching_tag1, matching_tag2))
            logger.warning(
                "compose.tag_conflict",
                kept=matching_tag1,
                dropped=matching_tag2,
            )

    return resolved_tags, detected_conflicts


def _format_section_with_tags(
    section: str, lyrics: str, section_tags: List[str]
) -> str:
    """Format section with tags in the proper format.

    Args:
        section: Section name
        lyrics: Section lyrics
        section_tags: Tags for this section

    Returns:
        Formatted section string
    """
    if section_tags:
        tags_str = ", ".join(section_tags)
        header = f"[{section}: {tags_str}]"
    else:
        header = f"[{section}]"

    return f"{header}\n{lyrics}"


def _enforce_character_limits(
    prompt_text: str,
    style_section: str,
    style_max: int,
    prompt_max: int,
) -> Tuple[str, List[str]]:
    """Enforce character limits by trimming if necessary.

    Args:
        prompt_text: Complete prompt text
        style_section: Style/tags section text
        style_max: Maximum characters for style section
        prompt_max: Maximum characters for total prompt

    Returns:
        Tuple of (trimmed_prompt, list_of_issues)
    """
    issues = []

    # Check style section length
    if len(style_section) > style_max:
        exceeded = len(style_section) - style_max
        issues.append(f"Style section exceeded {style_max} chars by {exceeded}")
        logger.warning(
            "compose.style_limit_exceeded",
            actual=len(style_section),
            limit=style_max,
            exceeded=exceeded,
        )

    # Check total prompt length
    if len(prompt_text) > prompt_max:
        exceeded = len(prompt_text) - prompt_max
        issues.append(f"Total prompt exceeded {prompt_max} chars by {exceeded}")
        logger.warning(
            "compose.prompt_limit_exceeded",
            actual=len(prompt_text),
            limit=prompt_max,
            exceeded=exceeded,
        )

        # Truncate with ellipsis
        prompt_text = prompt_text[: prompt_max - 3] + "..."

    return prompt_text, issues


@workflow_skill(
    name="amcs.compose.generate",
    deterministic=True,
)
async def compose_prompt(
    inputs: Dict[str, Any], context: WorkflowContext
) -> Dict[str, Any]:
    """Compose final render-ready prompt from style, lyrics, and producer notes.

    Merges all artifacts, enforces character limits, resolves tag conflicts,
    normalizes living artist influences, and formats with section tags.

    Args:
        inputs: Dictionary containing:
            - style: Validated style specification
            - lyrics: Complete lyrics with section markers
            - producer_notes: Production arrangement and mix guidance
            - sds: Original SDS for limits and title
        context: Workflow context with seed and run metadata

    Returns:
        Dictionary containing:
            - composed_prompt: Complete render-ready prompt
            - issues: List of warnings or constraint violations
    """
    style = inputs["style"]
    lyrics = inputs["lyrics"]
    producer_notes = inputs["producer_notes"]
    sds = inputs.get("sds", {})

    logger.info(
        "compose.generate.start",
        run_id=str(context.run_id),
    )

    # Extract limits
    prompt_controls = sds.get("prompt_controls", {})
    style_max = prompt_controls.get("max_style_chars", 1000)
    prompt_max = prompt_controls.get("max_prompt_chars", 5000)
    policy_strict = True  # TODO: Get from feature flags

    issues = []

    # Step 1: Build meta header
    title = sds.get("title", "Untitled")
    genre = style["genre_detail"]["primary"]
    tempo = style["tempo_bpm"]
    mood_list = style["mood"][:2]  # First 2 moods

    meta_header = f"""Title: {title}
Genre/Style: {genre} | BPM: {tempo} | Mood: {', '.join(mood_list)}"""

    # Step 2: Assemble style tags
    style_tags = []

    # Add genre, subgenres, fusions
    style_tags.append(genre)
    style_tags.extend(style["genre_detail"].get("subgenres", []))
    style_tags.extend(style["genre_detail"].get("fusions", []))

    # Add energy
    if style.get("energy"):
        style_tags.append(style["energy"])

    # Add instrumentation (max 3)
    instrumentation = style.get("instrumentation", [])[:3]
    style_tags.extend(instrumentation)

    # Add other tags
    style_tags.extend(style.get("tags", []))

    # Add vocal profile
    if style.get("vocal_profile"):
        style_tags.append(style["vocal_profile"])

    # Resolve tag conflicts
    style_tags, conflicts = _resolve_tag_conflicts(style_tags)

    for conflict in conflicts:
        issues.append(f"Dropped '{conflict[1]}' due to conflict with '{conflict[0]}'")

    # Format influences section
    influences_text = f"Influences: {', '.join(style_tags)}"

    # Normalize living artists
    influences_text, artist_replacements = _normalize_living_artists(
        influences_text, policy_strict
    )

    for replacement in artist_replacements:
        issues.append(f"Normalized artist reference: {replacement}")

    # Step 3: Format structure and vocal
    structure_text = f"""Structure: {producer_notes['structure']}
Vocal: {style.get('vocal_profile', 'default')}
Hooks: {producer_notes['hooks']}"""

    # Step 4: Embed lyrics with section tags
    section_meta = producer_notes.get("section_meta", {})

    # Parse lyrics into sections
    lyrics_sections = lyrics.split("\n\n")
    formatted_lyrics_parts = []

    for section_text in lyrics_sections:
        # Extract section name from marker
        match = re.match(r"\[([^\]]+)\]", section_text)
        if match:
            section_name = match.group(1)
            section_lyrics = section_text[len(match.group(0)) :].strip()

            # Get section tags
            section_tags = section_meta.get(section_name, {}).get("tags", [])

            # Format with tags
            formatted_section = _format_section_with_tags(
                section_name, section_lyrics, section_tags
            )
            formatted_lyrics_parts.append(formatted_section)
        else:
            formatted_lyrics_parts.append(section_text)

    lyrics_block = f"Lyrics:\n" + "\n\n".join(formatted_lyrics_parts)

    # Step 5: Add production notes
    mix_params = producer_notes.get("mix", {})
    instrumentation_list = ", ".join(producer_notes.get("instrumentation", []))

    production_notes = f"""Production Notes:
- Arrangement: {instrumentation_list}
- Mix: {mix_params.get('space', 'normal')}, {mix_params.get('stereo_width', 'normal')} stereo
- Clean = TRUE; Language = en"""

    # Step 6: Assemble complete prompt
    complete_prompt = f"""{meta_header}

{influences_text}

{structure_text}

{lyrics_block}

{production_notes}"""

    # Step 7: Enforce character limits
    complete_prompt, limit_issues = _enforce_character_limits(
        complete_prompt, influences_text, style_max, prompt_max
    )
    issues.extend(limit_issues)

    # Step 8: Build composed prompt object
    composed_prompt = {
        "text": complete_prompt,
        "meta": {
            "title": title,
            "genre": genre,
            "tempo_bpm": tempo,
            "structure": producer_notes["structure"],
            "style_tags": style_tags,
            "negative_tags": style.get("negative_tags", []),
            "section_tags": {
                k: v.get("tags", [])
                for k, v in section_meta.items()
            },
            "model_limits": {
                "style_max": style_max,
                "prompt_max": prompt_max,
            },
        },
    }

    # Compute hash
    prompt_hash = compute_hash(complete_prompt)

    logger.info(
        "compose.generate.complete",
        run_id=str(context.run_id),
        total_chars=len(complete_prompt),
        style_chars=len(influences_text),
        issues_count=len(issues),
        hash=prompt_hash[:16],
    )

    return {
        "composed_prompt": composed_prompt,
        "issues": issues,
        "_hash": prompt_hash,
        "_char_counts": {
            "style": len(influences_text),
            "total": len(complete_prompt),
        },
    }
